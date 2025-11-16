import { extractDomain } from './apiUtils';
import { getAPIKey } from './apiKeyService';

export interface SubdomainResult {
  subdomains: string[];
  sources: Record<string, number>;
}

const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'webmail', 'smtp', 'pop', 'ns1', 'ns2',
  'cpanel', 'whm', 'autodiscover', 'autoconfig', 'm', 'imap', 'test',
  'blog', 'pop3', 'dev', 'www2', 'admin', 'forum', 'news', 'vpn',
  'ns3', 'mail2', 'mysql', 'old', 'lists', 'support', 'mobile', 'mx',
  'static', 'docs', 'beta', 'shop', 'secure', 'demo', 'calendar',
  'wiki', 'web', 'media', 'email', 'images', 'img', 'www1',
  'portal', 'video', 'dns2', 'api', 'cdn', 'stats', 'dns1', 'staging',
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const enumerateSubdomainsDNS = async (
  domain: string,
  threads: number = 5
): Promise<string[]> => {
  console.log(`[Subdomain DNS] Starting enumeration for ${domain} with ${threads} threads`);
  
  const found: Set<string> = new Set();
  const chunks: string[][] = [];
  
  for (let i = 0; i < COMMON_SUBDOMAINS.length; i += threads) {
    chunks.push(COMMON_SUBDOMAINS.slice(i, i + threads));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (subdomain) => {
      try {
        const fullDomain = `${subdomain}.${domain}`;
        const dnsUrl = `https://dns.google/resolve?name=${fullDomain}&type=A`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(dnsUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.Answer && data.Answer.length > 0) {
          console.log(`[Subdomain DNS] Found: ${fullDomain}`);
          found.add(fullDomain);
        }
      } catch (error) {
        // Silently skip failed checks
      }
    });

    await Promise.allSettled(promises);
    await sleep(100);
  }

  console.log(`[Subdomain DNS] Found ${found.size} subdomains via DNS`);
  return Array.from(found);
};

export const enumerateSubdomainsCrtSh = async (domain: string): Promise<string[]> => {
  console.log(`[Subdomain crt.sh] Querying certificate transparency logs for ${domain}`);
  
  try {
    const crtShUrl = `https://crt.sh/?q=%.${domain}&output=json`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(crtShUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[Subdomain crt.sh] Failed with status ${response.status}`);
      return [];
    }

    const text = await response.text();
    
    if (!text.trim().startsWith('[')) {
      console.warn(`[Subdomain crt.sh] Invalid response format`);
      return [];
    }

    const data = JSON.parse(text);
    const subdomains = new Set<string>();
    
    for (const cert of data) {
      if (cert.name_value) {
        const names = cert.name_value.split('\n');
        for (const name of names) {
          const cleanName = name.trim().toLowerCase().replace(/^\*\./, '');
          if (cleanName.endsWith(domain) && !cleanName.includes('*') && cleanName !== domain) {
            subdomains.add(cleanName);
          }
        }
      }
    }
    
    console.log(`[Subdomain crt.sh] Found ${subdomains.size} subdomains from CT logs`);
    return Array.from(subdomains);
  } catch (error: any) {
    console.error('[Subdomain crt.sh] Error:', error.message);
    return [];
  }
};

export const enumerateSubdomainsSecurityTrails = async (domain: string): Promise<string[]> => {
  const securitytrailsKey = getAPIKey('securitytrails');
  if (!securitytrailsKey) {
    console.log('[Subdomain SecurityTrails] API key not configured, skipping.');
    return [];
  }

  console.log(`[Subdomain SecurityTrails] Querying SecurityTrails for ${domain}`);
  try {
    const apiUrl = `https://api.securitytrails.com/v1/domain/${domain}/subdomains`;
    const response = await fetch(apiUrl, {
      headers: {
        'APIKEY': securitytrailsKey,
      },
    });

    if (!response.ok) {
      console.warn(`[Subdomain SecurityTrails] API failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (data.subdomains) {
      const subdomains = data.subdomains.map((sub: string) => `${sub}.${domain}`);
      console.log(`[Subdomain SecurityTrails] Found ${subdomains.length} subdomains from SecurityTrails`);
      return subdomains;
    }
    return [];
  } catch (error: any) {
    console.error('[Subdomain SecurityTrails] Error:', error.message);
    return [];
  }
};


export const enumerateSubdomains = async (
  target: string,
  threads: number = 5
): Promise<SubdomainResult> => {
  try {
    const domain = extractDomain(target);
    console.log(`[Subdomain Enumeration] Starting for ${domain}`);
    
    const sources: Record<string, number> = {
      dns: 0,
      crtsh: 0,
      securitytrails: 0,
    };

    const allSubdomains = new Set<string>();

    // Run all methods in parallel
    const [dnsResults, crtResults, securitytrailsResults] = await Promise.allSettled([
      enumerateSubdomainsDNS(domain, threads),
      enumerateSubdomainsCrtSh(domain),
      enumerateSubdomainsSecurityTrails(domain),
    ]);

    if (dnsResults.status === 'fulfilled') {
      dnsResults.value.forEach(sub => allSubdomains.add(sub));
      sources.dns = dnsResults.value.length;
    } else {
      console.error('[Subdomain DNS] Failed:', dnsResults.reason);
    }

    if (crtResults.status === 'fulfilled') {
      crtResults.value.forEach(sub => allSubdomains.add(sub));
      sources.crtsh = crtResults.value.length;
    } else {
      console.error('[Subdomain crt.sh] Failed:', crtResults.reason);
    }

    if (securitytrailsResults.status === 'fulfilled') {
      securitytrailsResults.value.forEach(sub => allSubdomains.add(sub));
      sources.securitytrails = securitytrailsResults.value.length;
    } else {
      console.error('[Subdomain SecurityTrails] Failed:', securitytrailsResults.reason);
    }

    const sortedSubdomains = Array.from(allSubdomains).sort();
    
    console.log(`[Subdomain Enumeration] Complete: ${sortedSubdomains.length} unique subdomains found`);
    console.log(`[Subdomain Enumeration] Sources - DNS: ${sources.dns}, crt.sh: ${sources.crtsh}, SecurityTrails: ${sources.securitytrails}`);
    
    return {
      subdomains: sortedSubdomains,
      sources,
    };
  } catch (error: any) {
    console.error('[Subdomain Enumeration] Critical error:', error);
    return {
      subdomains: [],
      sources: { dns: 0, crtsh: 0, securitytrails: 0 },
    };
  }
};