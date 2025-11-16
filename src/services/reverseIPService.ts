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
    return undefined;
  }
};

export const performReverseIPLookup = async (target: string, requestManager: RequestManager): Promise<ReverseIPResult> => {
  const domain = extractDomain(target);
  console.log(`[Reverse IP] Starting lookup for ${domain}`);

  const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
  const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000 }); // Use requestManager
  const dnsData = await dnsResponse.json();

  if (!dnsData.Answer || dnsData.Answer.length === 0) {
    throw new Error('Could not resolve domain to IP');
  }

  const ip = dnsData.Answer[0].data;
  console.log(`[Reverse IP] Resolved to IP: ${ip}`);

  const result: ReverseIPResult = {
    ip,
    domains: [],
    totalDomains: 0,
  };

  const ptrUrl = `https://dns.google/resolve?name=${ip.split('.').reverse().join('.')}.in-addr.arpa&type=PTR`;
  const ptrResponse = await requestManager.fetch(ptrUrl, { timeout: 10000 }); // Use requestManager
  const ptrData = await ptrResponse.json();

  if (ptrData.Answer) {
    for (const record of ptrData.Answer) {
      const reverseDomain = record.data.replace(/\.$/, '');
      
      const cmsDetection = await detectCMS(reverseDomain, requestManager); // Pass requestManager
      
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
};