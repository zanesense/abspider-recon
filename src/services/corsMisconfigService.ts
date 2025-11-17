import { normalizeUrl, extractDomain } from './apiUtils';
import { fetchWithBypass } from './corsProxy';
import { RequestManager } => './requestManager';

export interface CorsMisconfigVulnerability {
  type: 'wildcard_origin' | 'dynamic_origin_reflection' | 'null_origin_allowed' | 'trusted_domain_bypass';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  evidence: string;
  originTested?: string;
}

export interface CorsMisconfigResult {
  tested: boolean;
  vulnerable: boolean;
  vulnerabilities: CorsMisconfigVulnerability[];
  corsMetadata?: any; // From fetchWithBypass
}

const TEST_ORIGINS = [
  'https://evil.com',
  'http://null.evil.com', // For null origin reflection test
  'https://example.com.evil.com', // Subdomain bypass
  'https://evil.com.example.com', // Subdomain bypass
  'null', // Literal null origin
];

export const performCorsMisconfigScan = async (target: string, requestManager: RequestManager): Promise<CorsMisconfigResult> => {
  console.log(`[CORS Misconfig] Starting scan for ${target}`);

  const result: CorsMisconfigResult = {
    tested: true,
    vulnerable: false,
    vulnerabilities: [],
  };

  const url = normalizeUrl(target);
  const targetDomain = extractDomain(target);
  let corsMetadata: any;

  try {
    // 1. Check for wildcard origin (Access-Control-Allow-Origin: *)
    try {
      const { response, metadata } = await fetchWithBypass(url, {
        headers: { 'Origin': 'https://arbitrary.com' },
        timeout: 10000,
        signal: requestManager.scanController?.signal,
      });
      corsMetadata = metadata;

      const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
      if (allowOrigin === '*') {
        result.vulnerable = true;
        result.vulnerabilities.push({
          type: 'wildcard_origin',
          severity: 'high',
          description: 'CORS policy allows all origins (`Access-Control-Allow-Origin: *`), potentially exposing sensitive data to any domain.',
          evidence: `Access-Control-Allow-Origin: *`,
          originTested: 'https://arbitrary.com',
        });
        console.warn('[CORS Misconfig] Wildcard origin detected.');
      }
    } catch (e: any) {
      console.warn(`[CORS Misconfig] Error checking wildcard origin: ${e.message}`);
    }

    // 2. Test for dynamic origin reflection and null origin
    for (const origin of TEST_ORIGINS) {
      if (requestManager.scanController?.signal.aborted) throw new Error('Scan aborted');
      try {
        const { response, metadata } = await fetchWithBypass(url, {
          headers: { 'Origin': origin },
          timeout: 10000,
          signal: requestManager.scanController?.signal,
        });
        corsMetadata = metadata;

        const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
        if (allowOrigin && allowOrigin.toLowerCase() === origin.toLowerCase()) {
          result.vulnerable = true;
          let vulnType: CorsMisconfigVulnerability['type'] = 'dynamic_origin_reflection';
          let severity: CorsMisconfigVulnerability['severity'] = 'high';
          let description = `CORS policy reflects the 'Origin' header, allowing arbitrary origins to bypass the Same-Origin Policy.`;

          if (origin === 'null') {
            vulnType = 'null_origin_allowed';
            severity = 'critical';
            description = `CORS policy explicitly allows the 'null' origin, which can be exploited by sandboxed iframes or local files.`;
          } else if (origin.includes('.evil.com') || origin.includes('evil.com.')) {
            vulnType = 'trusted_domain_bypass';
            severity = 'critical';
            description = `CORS policy allows origins that can be manipulated to appear as trusted subdomains (e.g., ${origin}).`;
          }

          result.vulnerabilities.push({
            type: vulnType,
            severity,
            description,
            evidence: `Origin: ${origin}, Access-Control-Allow-Origin: ${allowOrigin}`,
            originTested: origin,
          });
          console.warn(`[CORS Misconfig] ${vulnType} detected with origin: ${origin}`);
        }
      } catch (e: any) {
        console.warn(`[CORS Misconfig] Error testing origin ${origin}: ${e.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
    }

    console.log(`[CORS Misconfig] Scan complete. Vulnerable: ${result.vulnerable}`);
    result.corsMetadata = corsMetadata;
    return result;

  } catch (error: any) {
    if (error.message === 'Scan aborted') {
      throw error;
    }
    console.error('[CORS Misconfig] Critical error during scan:', error);
    result.errors?.push(`Critical error: ${error.message}`);
    result.tested = false;
    return result;
  }
};