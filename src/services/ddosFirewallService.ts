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
  wafDetected?: string; // e.g., Cloudflare, Akamai, Sucuri
  evidence?: string[]; // Snippets of headers/body indicating WAF
  corsMetadata?: CORSBypassMetadata;
}

const DDoS_WAF_INDICATORS = {
  HEADERS: {
    'server': ['cloudflare', 'sucuri', 'akamai', 'incapsula', 'barracuda', 'mod_security'],
    'x-waf-rule': [],
    'x-sucuri-id': [],
    'x-cdn': ['cloudflare', 'akamai', 'sucuri'],
    'cf-ray': ['cloudflare'],
    'cf-cache-status': ['cloudflare'],
    'x-protected-by': ['sucuri'],
  },
  STATUS_CODES: [403, 429, 503, 504],
  BODY_PATTERNS: [
    /access denied/i,
    /rate limit exceeded/i,
    /captcha/i,
    /checking your browser/i, // Cloudflare
    /ddos protection by/i,
    /bot management/i,
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
            if (patterns.length === 0 || patterns.some((p: string) => headerValue.toLowerCase().includes(p))) {
              result.firewallDetected = true;
              result.indicators.push(`Header '${headerName}': ${headerValue}`);
              evidenceSnippets.add(`Header '${headerName}': ${headerValue}`);
              patterns.forEach((p: string) => detectedWafs.add(p));
            }
          }
        }

        // Check for WAF/DDoS indicators in body
        for (const pattern of DDoS_WAF_INDICATORS.BODY_PATTERNS) {
          if (pattern.test(text)) {
            result.firewallDetected = true;
            result.indicators.push(`Body pattern matched: '${pattern.source}'`);
            evidenceSnippets.add(`Body snippet: ${text.match(pattern)?.[0].substring(0, 100)}...`);
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
        result.indicators.push(`HTTP Status Code ${status} detected`);
      }
    }

    if (detectedWafs.size > 0) {
      result.wafDetected = Array.from(detectedWafs).join(', ');
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