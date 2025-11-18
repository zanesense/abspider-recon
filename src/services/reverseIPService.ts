import { extractDomain, normalizeUrl } from './apiUtils';
import { RequestManager } from './requestManager';
import { APIKeys } from './apiKeyService';
import { fetchJSONWithBypass, fetchWithBypass } from './corsProxy';

export interface DiscoveredDomain {
  domain: string;
  cms?: string;
  httpStatus?: number;
  title?: string;
  webServer?: string;
  cloudflare?: boolean;
  technologies?: string[];
}

export interface ReverseIPResult {
  ip: string;
  domains: DiscoveredDomain[];
  totalDomains: number;
}

// Helper function to fetch basic details for a discovered domain
const fetchDomainDetails = async (domain: string, requestManager: RequestManager): Promise<Partial<DiscoveredDomain>> => {
  const details: Partial<DiscoveredDomain> = { domain };
  try {
    const url = normalizeUrl(`https://${domain}`); // Always try HTTPS first
    const startTime = Date.now();
    const { response } = await fetchWithBypass(url, { timeout: 5000, signal: requestManager.scanController?.signal });
    // const responseTime = Date.now() - startTime; // Not used in details object, but could be added

    details.httpStatus = response.status;

    // Check for Cloudflare
    const cfRay = response.headers.get('cf-ray');
    const cfCache = response.headers.get('cf-cache-status');
    if (cfRay || cfCache) { // Check headers first
      details.cloudflare = true;
    } else { // Fallback to body check if headers don't indicate Cloudflare
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      if (text.includes('cloudflare')) {
        details.cloudflare = true;
      }
    }

    // Get headers for web server and technologies
    const server = response.headers.get('server');
    if (server) {
      details.webServer = server;
      details.technologies = details.technologies || [];
      details.technologies.push(server);
    }
    const poweredBy = response.headers.get('x-powered-by');
    if (poweredBy) {
      details.technologies = details.technologies || [];
      details.technologies.push(poweredBy);
    }

    // Fetch HTML for title and CMS detection if response is HTML
    if (response.headers.get('content-type')?.includes('text/html')) {
      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        details.title = titleMatch[1].trim();
      }

      // Detect CMS (simplified from wordpressService for quick check)
      if (lowerHtml.includes('wp-content') || lowerHtml.includes('wordpress')) {
        details.cms = 'WordPress';
        details.technologies = details.technologies || [];
        details.technologies.push('WordPress');
      } else if (lowerHtml.includes('joomla')) {
        details.cms = 'Joomla';
        details.technologies = details.technologies || [];
        details.technologies.push('Joomla');
      } else if (lowerHtml.includes('drupal')) {
        details.cms = 'Drupal';
        details.technologies = details.technologies || [];
        details.technologies.push('Drupal');
      }
    }

  } catch (error) {
    // Log error but don't fail the whole scan for one domain's details
    console.warn(`[Reverse IP] Failed to fetch details for ${domain}:`, (error as Error).message);
    details.httpStatus = 0; // Indicate failure
  }
  return details;
};

export const performReverseIPLookup = async (target: string, requestManager: RequestManager, apiKeys: APIKeys): Promise<ReverseIPResult> => {
  const domain = extractDomain(target);
  console.log(`[Reverse IP] Starting lookup for ${domain}`);

  const result: ReverseIPResult = {
    ip: 'N/A',
    domains: [],
    totalDomains: 0,
  };

  const effectiveApiKeys = apiKeys ?? {};

  try {
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
    const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000 });
    const dnsData = await dnsResponse.json();

    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      throw new Error('Could not resolve domain to IP address');
    }
    result.ip = dnsData.Answer[0].data;
    console.log(`[Reverse IP] Resolved to IP: ${result.ip}`);

    let rawDiscoveredDomains: string[] = [];

    const securitytrailsKey = effectiveApiKeys.securitytrails;
    if (securitytrailsKey) {
      try {
        console.log('[Reverse IP] Attempting SecurityTrails API lookup...');
        const apiUrl = `https://api.securitytrails.com/v1/ips/${result.ip}/domains`;
        const { data: stData } = await fetchJSONWithBypass(apiUrl, {
          headers: { 'APIKEY': securitytrailsKey },
          timeout: 15000,
          signal: requestManager.scanController?.signal,
        });

        if (stData.records && stData.records.length > 0) {
          rawDiscoveredDomains = stData.records.map((record: any) => record.hostname);
          console.log(`[Reverse IP] ✓ Data from SecurityTrails API: ${rawDiscoveredDomains.length} domains`);
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
    if (rawDiscoveredDomains.length === 0) {
      const ptrUrl = `https://dns.google/resolve?name=${result.ip.split('.').reverse().join('.')}.in-addr.arpa&type=PTR`;
      const ptrResponse = await requestManager.fetch(ptrUrl, { timeout: 10000 });
      const ptrData = await ptrResponse.json();

      if (ptrData.Answer) {
        rawDiscoveredDomains = ptrData.Answer.map((record: any) => record.data.replace(/\.$/, ''));
      }
    }

    // Fetch detailed information for each discovered domain concurrently
    const uniqueDomains = Array.from(new Set(rawDiscoveredDomains)); // Deduplicate
    const detailedDomainPromises = uniqueDomains.map(d => fetchDomainDetails(d, requestManager));
    const detailedDomainResults = await Promise.allSettled(detailedDomainPromises);

    result.domains = detailedDomainResults
      .filter(res => res.status === 'fulfilled' && res.value.domain)
      .map(res => (res as PromiseFulfilledResult<Partial<DiscoveredDomain>>).value as DiscoveredDomain);

    result.totalDomains = result.domains.length;
    console.log(`[Reverse IP] Complete: ${result.totalDomains} domains found with details`);
    
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