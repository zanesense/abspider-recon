import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager'; // Import RequestManager

export interface ReverseIPResult {
  ip: string;
  domains: Array<{
    domain: string;
    cms?: string;
  }>;
  totalDomains: number;
}

const detectCMS = async (domain: string, requestManager: RequestManager): Promise<string | undefined> => {
  try {
    const url = `https://${domain}`;
    const response = await requestManager.fetch(url, { // Use requestManager
      method: 'HEAD',
      timeout: 5000,
    });

    const poweredBy = response.headers.get('x-powered-by');
    if (poweredBy?.toLowerCase().includes('wordpress')) return 'WordPress';
    if (poweredBy?.toLowerCase().includes('drupal')) return 'Drupal';
    if (poweredBy?.toLowerCase().includes('joomla')) return 'Joomla';

    return undefined;
  } catch (error) {
    // If CMS detection fails or is aborted, just return undefined
    return undefined;
  }
};

export const performReverseIPLookup = async (target: string, requestManager: RequestManager): Promise<ReverseIPResult> => {
  const domain = extractDomain(target);
  console.log(`[Reverse IP] Starting lookup for ${domain}`);

  const result: ReverseIPResult = {
    ip: 'N/A', // Default to N/A if IP resolution fails
    domains: [],
    totalDomains: 0,
  };

  try {
    // DNS lookup for IP
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
    const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000 });
    const dnsData = await dnsResponse.json();

    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      throw new Error('Could not resolve domain to IP address');
    }
    result.ip = dnsData.Answer[0].data;
    console.log(`[Reverse IP] Resolved to IP: ${result.ip}`);

    // PTR lookup for reverse IP
    const ptrUrl = `https://dns.google/resolve?name=${result.ip.split('.').reverse().join('.')}.in-addr.arpa&type=PTR`;
    const ptrResponse = await requestManager.fetch(ptrUrl, { timeout: 10000 });
    const ptrData = await ptrResponse.json();

    if (ptrData.Answer) {
      for (const record of ptrData.Answer) {
        // Check for abort signal before making potentially many CMS detection requests
        if (requestManager.scanController?.signal.aborted) {
          console.warn('[Reverse IP] Scan aborted by user or controller during CMS detection.');
          // Break the loop and return partial results
          break; 
        }

        const reverseDomain = record.data.replace(/\.$/, '');
        const cmsDetection = await detectCMS(reverseDomain, requestManager);
        
        result.domains.push({
          domain: reverseDomain,
          cms: cmsDetection,
        });
        
        console.log(`[Reverse IP] Found domain: ${reverseDomain}${cmsDetection ? ` (${cmsDetection})` : ''}`);
      }
    }

    result.totalDomains = result.domains.length;
    console.log(`[Reverse IP] Complete: ${result.totalDomains} domains found`);
    
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Request aborted') {
      console.warn('[Reverse IP] Scan aborted by user or controller. Returning partial results.');
      // Return the partial result collected so far
      return result; 
    }
    console.error('[Reverse IP] Error during lookup:', error);
    throw new Error(`Reverse IP lookup failed: ${error.message}`);
  }
};