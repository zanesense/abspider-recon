import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager'; // Corrected from '=>' to 'from'
import { APIKeys } from './apiKeyService'; // Import APIKeys interface
import { fetchJSONWithBypass } from './corsProxy'; // Import fetchJSONWithBypass

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
    const response = await requestManager.fetch(url, {
      method: 'GET', // Use GET to get body for more indicators
      timeout: 5000,
    });

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Header-based detection
    const poweredBy = response.headers.get('x-powered-by');
    if (poweredBy?.toLowerCase().includes('wordpress')) return 'WordPress';
    if (poweredBy?.toLowerCase().includes('drupal')) return 'Drupal';
    if (poweredBy?.toLowerCase().includes('joomla')) return 'Joomla';
    if (poweredBy?.toLowerCase().includes('shopify')) return 'Shopify';
    if (poweredBy?.toLowerCase().includes('next.js')) return 'Next.js';
    if (poweredBy?.toLowerCase().includes('express')) return 'Express.js';

    // HTML body/meta tag detection
    if (lowerHtml.includes('wp-content') || lowerHtml.includes('wordpress')) return 'WordPress';
    if (lowerHtml.includes('joomla')) return 'Joomla';
    if (lowerHtml.includes('drupal')) return 'Drupal';
    if (lowerHtml.includes('shopify')) return 'Shopify';
    if (lowerHtml.includes('wix.com')) return 'Wix';
    if (lowerHtml.includes('squarespace')) return 'Squarespace';
    if (lowerHtml.includes('<meta name="generator" content="wordpress')) return 'WordPress';
    if (lowerHtml.includes('<meta name="generator" content="joomla')) return 'Joomla';
    if (lowerHtml.includes('<meta name="generator" content="drupal')) return 'Drupal';
    if (lowerHtml.includes('react-root') || lowerHtml.includes('__react_root')) return 'React';
    if (lowerHtml.includes('vue-app') || lowerHtml.includes('__vue_app__')) return 'Vue.js';
    if (lowerHtml.includes('ng-app') || lowerHtml.includes('angular')) return 'Angular';
    if (lowerHtml.includes('data-next-js')) return 'Next.js';


    return undefined;
  } catch (error) {
    // If CMS detection fails or is aborted, just return undefined
    return undefined;
  }
};

export const performReverseIPLookup = async (target: string, requestManager: RequestManager, apiKeys: APIKeys): Promise<ReverseIPResult> => {
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

    const securitytrailsKey = apiKeys.securitytrails;

    if (securitytrailsKey) {
      // Use SecurityTrails API for more comprehensive reverse IP lookup
      try {
        console.log('[Reverse IP] Attempting SecurityTrails API lookup...');
        const apiUrl = `https://api.securitytrails.com/v1/ips/${result.ip}/domains`;
        const { data: stData } = await fetchJSONWithBypass(apiUrl, {
          headers: { 'APIKEY': securitytrailsKey },
          timeout: 15000,
          signal: requestManager.scanController?.signal,
        });

        if (stData.records && stData.records.length > 0) {
          const domainPromises = stData.records.map(async (record: any) => {
            if (requestManager.scanController?.signal.aborted) {
              throw new Error('Scan aborted');
            }
            const cmsDetection = await detectCMS(record.hostname, requestManager);
            return {
              domain: record.hostname,
              cms: cmsDetection,
            };
          });
          result.domains = await Promise.all(domainPromises);
          result.totalDomains = result.domains.length;
          console.log(`[Reverse IP] ✓ Data from SecurityTrails API: ${result.totalDomains} domains`);
          return result; // Return early if SecurityTrails provides data
        } else if (stData.message) {
          console.warn(`[Reverse IP] SecurityTrails API returned error: ${stData.message}, falling back to PTR...`);
        } else {
          console.warn(`[Reverse IP] SecurityTrails API returned no domains, falling back to PTR...`);
        }
      } catch (stError: any) {
        if (stError.message === 'Scan aborted') throw stError;
        console.warn('[Reverse IP] SecurityTrails API lookup failed:', stError.message, ', falling back to PTR...');
      }
    }

    // Fallback to PTR lookup if SecurityTrails is not used or fails
    const ptrUrl = `https://dns.google/resolve?name=${result.ip.split('.').reverse().join('.')}.in-addr.arpa&type=PTR`;
    const ptrResponse = await requestManager.fetch(ptrUrl, { timeout: 10000 });
    const ptrData = await ptrResponse.json();

    if (ptrData.Answer) {
      const domainPromises = ptrData.Answer.map(async (record: any) => {
        if (requestManager.scanController?.signal.aborted) {
          throw new Error('Scan aborted');
        }
        const reverseDomain = record.data.replace(/\.$/, '');
        const cmsDetection = await detectCMS(reverseDomain, requestManager);
        return {
          domain: reverseDomain,
          cms: cmsDetection,
        };
      });
      result.domains = await Promise.all(domainPromises);
    }

    result.totalDomains = result.domains.length;
    console.log(`[Reverse IP] Complete: ${result.totalDomains} domains found`);
    
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError' || (typeof error.message === 'string' && error.message.includes('aborted by scan controller'))) {
      console.warn('[Reverse IP] Scan aborted by user or controller. Returning partial results.');
      return result; 
    }
    console.error('[Reverse IP] Error during lookup:', error);
    throw new Error(`Reverse IP lookup failed: ${error.message}`);
  }
};