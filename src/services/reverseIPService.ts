import { extractDomain } from './apiUtils';

export interface ReverseIPResult {
  ip: string;
  domains: Array<{
    domain: string;
    cms?: string;
  }>;
  totalDomains: number;
}

export const performReverseIPLookup = async (target: string): Promise<ReverseIPResult> => {
  const domain = extractDomain(target);
  console.log(`[Reverse IP] Starting lookup for ${domain}`);

  const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
  const dnsResponse = await fetch(dnsUrl);
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
  const ptrResponse = await fetch(ptrUrl);
  const ptrData = await ptrResponse.json();

  if (ptrData.Answer) {
    for (const record of ptrData.Answer) {
      const reverseDomain = record.data.replace(/\.$/, '');
      
      const cmsDetection = await detectCMS(reverseDomain);
      
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

const detectCMS = async (domain: string): Promise<string | undefined> => {
  try {
    const url = `https://${domain}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const poweredBy = response.headers.get('x-powered-by');
    if (poweredBy?.toLowerCase().includes('wordpress')) return 'WordPress';
    if (poweredBy?.toLowerCase().includes('drupal')) return 'Drupal';
    if (poweredBy?.toLowerCase().includes('joomla')) return 'Joomla';

    return undefined;
  } catch (error) {
    return undefined;
  }
};