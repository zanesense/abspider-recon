import { normalizeUrl } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata } from './corsProxy';
import { RequestManager } from './requestManager';

export interface DDoSFirewallResult {
  tested: boolean;
  firewallDetected: boolean;
  indicators: string[];
  responseSummary: Array<{
    status: number;
    count: number;
    avgResponseTime: number;
  }>;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  wafDetected?: string; // e.g., Cloudflare, Akamai, Sucuri, Google Front End
  evidence?: string[]; // Snippets of headers/body indicating WAF
  corsMetadata?: CORSBypassMetadata;
}

const DDoS_WAF_INDICATORS = {
  HEADERS: {
    'server': ['cloudflare', 'sucuri', 'akamai', 'incapsula', 'barracuda', 'mod_security', 'gws', 'google front end'], // Added 'gws', 'google front end'
    'x-waf-rule': [],
    'x-sucuri-id': [],
    'x-cdn': ['cloudflare', 'akamai', 'sucuri', 'google'], // Added 'google'
    'cf-ray': ['cloudflare'],
    'cf-cache-status': ['cloudflare'],
    'x-protected-by': ['sucuri'],
    'x-cache': ['cloudflare', 'akamai', 'google'], // Generic CDN cache header
    'x-served-by': ['cloudflare', 'akamai', 'google'], // Generic CDN server header
    'via': ['cloudflare', 'akamai', 'google'], // Proxy/CDN indicator
    'age': [], // Cache age, indicates caching layer
    'alt-svc': ['google'], // Often seen on Google services
    'x-goog-generation': ['google'], // Google Cloud Storage related, indicates Google infra
    'x-goog-hash': ['google'],
    'x-goog-meta-': ['google'],
    'x-goog-stored-content-length': ['google'],
    'x-goog-stored-content-encoding': ['google'],
  },
  STATUS_CODES: [403, 429, 503, 504],
  BODY_PATTERNS: [
    /access denied/i,
    /rate limit exceeded/i,
    /captcha/i,
    /checking your browser/i, // Cloudflare
    /ddos protection by/i,
    /bot management/i,
    /google/i, // General Google presence in body
  ],
};

export const performDDoSFirewallTest = async (
  target: string,
  numRequests: number = 20,
  intervalMs: number = 100, // Interval between requests
  requestManager?: RequestManager
): Promise<DDoSFirewallResult> => {
  console.log(`[DDoS Firewall Test] Starting for ${target} with ${numRequests} requests`);

  const result: DDoSFirewallResult = {
    tested: true,
    firewallDetected: false,
    indicators: [],
    responseSummary: [],
    totalRequests: numRequests,
    successfulRequests: 0,
    failedRequests: 0,
  };

  try {
    const url = normalizeUrl(target);
    const responses: { status: number; duration: number; headers: Headers; text: string }[] = [];
    const statusCounts: { [key: number]: { count: number; totalDuration: number } } = {};
    const detectedWafs = new Set<string>();
    const evidenceSnippets = new Set<string>();

    for (let i = 0; i < numRequests; i++) {
      if (requestManager?.scanController?.signal.aborted) {
        throw new Error('Scan aborted by user');
      }

      const startTime = Date.now();
      try {
        let response: Response;
        let metadata: CORSBypassMetadata | undefined;

        if (requestManager) {
          response = await requestManager.fetch(url, { timeout: 5000 });
        } else {
          const fetchResult = await fetchWithBypass(url, { timeout: 5000 });
          response = fetchResult.response;
          metadata = fetchResult.metadata;
          if (!result.corsMetadata) result.corsMetadata = metadata;
        }

        const duration = Date.now() - startTime;
        const text = await response.text();

        responses.push({ status: response.status, duration, headers: response.headers, text });
        result.successfulRequests++;

        if (!statusCounts[response.status]) {
          statusCounts[response.status] = { count: 0, totalDuration: 0 };
        }
        statusCounts[response.status].count++;
        statusCounts[response.status].totalDuration += duration;

        // Check for WAF/DDoS indicators in headers
        for (const headerName in DDoS_WAF_INDICATORS.HEADERS) {
          const headerValue = response.headers.get(headerName);
          if (headerValue) {
            const patterns = (DDoS_WAF_INDICATORS.HEADERS as any)[headerName];
            
            // Check if header value contains any of the patterns, or if patterns list is empty (just presence is enough)
            if (patterns.length === 0 || patterns.some((p: string) => headerValue.toLowerCase().includes(p))) {
              result.firewallDetected = true;
              const indicatorText = `Header '${headerName}': ${headerValue}`;
              if (!result.indicators.includes(indicatorText)) {
                result.indicators.push(indicatorText);
                evidenceSnippets.add(indicatorText);
              }
              patterns.forEach((p: string) => {
                if (p.toLowerCase() === 'gws' || p.toLowerCase() === 'google front end') {
                  detectedWafs.add('Google Front End');
                } else if (p.toLowerCase() === 'cloudflare') {
                  detectedWafs.add('Cloudflare');
                } else if (p.toLowerCase() === 'sucuri') {
                  detectedWafs.add('Sucuri');
                } else if (p.toLowerCase() === 'akamai') {
                  detectedWafs.add('Akamai');
                } else if (p.toLowerCase() === 'google') {
                  detectedWafs.add('Google CDN/WAF');
                } else if (p.toLowerCase() === 'incapsula') {
                  detectedWafs.add('Incapsula');
                } else if (p.toLowerCase() === 'barracuda') {
                  detectedWafs.add('Barracuda WAF');
                } else if (p.toLowerCase() === 'mod_security') {
                  detectedWafs.add('ModSecurity WAF');
                }
              });
            }
          }
        }

        // Check for WAF/DDoS indicators in body
        for (const pattern of DDoS_WAF_INDICATORS.BODY_PATTERNS) {
          if (pattern.test(text)) {
            result.firewallDetected = true;
            const indicatorText = `Body pattern matched: '${pattern.source}'`;
            if (!result.indicators.includes(indicatorText)) {
              result.indicators.push(indicatorText);
              evidenceSnippets.add(`Body snippet: ${text.match(pattern)?.[0].substring(0, 100)}...`);
            }
            if (pattern.source.includes('google')) {
              detectedWafs.add('Google Front End');
            }
          }
        }

      } catch (error: any) {
        if (error.message === 'Request aborted') {
          throw error;
        }
        result.failedRequests++;
        console.warn(`[DDoS Firewall Test] Request failed: ${error.message}`);
        evidenceSnippets.add(`Request failed: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    // Summarize responses
    for (const status in statusCounts) {
      result.responseSummary.push({
        status: parseInt(status),
        count: statusCounts[status].count,
        avgResponseTime: statusCounts[status].totalDuration / statusCounts[status].count,
      });
      if (DDoS_WAF_INDICATORS.STATUS_CODES.includes(parseInt(status))) {
        result.firewallDetected = true;
        const indicatorText = `HTTP Status Code ${status} detected`;
        if (!result.indicators.includes(indicatorText)) {
          result.indicators.push(indicatorText);
        }
      }
    }

    if (detectedWafs.size > 0) {
      result.wafDetected = Array.from(detectedWafs).join(', ');
    } else if (result.firewallDetected && !result.wafDetected) {
      result.wafDetected = 'Generic WAF/CDN'; // Fallback if specific WAF not identified but firewall detected
    }
    result.evidence = Array.from(evidenceSnippets);

    console.log(`[DDoS Firewall Test] Complete. Firewall detected: ${result.firewallDetected}`);
    return result;
  } catch (error: any) {
    if (error.message === 'Request aborted') {
      throw error;
    }
    console.error('[DDoS Firewall Test] Critical error:', error);
    return {
      ...result,
      tested: false,
      firewallDetected: false,
      indicators: [...result.indicators, `Error: ${error.message}`],
    };
  }
};

export const performDeepDDoSFirewallTest = async (
  target: string,
  requestManager?: RequestManager
): Promise<DDoSFirewallResult> => {
  console.log(`[Deep DDoS Firewall Test] Starting for ${target}`);
  // Perform 100 requests with a 50ms interval for a fast but deep test
  return performDDoSFirewallTest(target, 100, 50, requestManager);
};