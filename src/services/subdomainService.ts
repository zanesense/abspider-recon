import { extractDomain } from './apiUtils';
import { fetchWithBypass } from './corsProxy'; // Import fetchWithBypass
import { createRequestManager, RequestManager } from './requestManager'; // Import RequestManager
import { APIKeys } from './apiKeyService'; // Import APIKeys interface

export interface SubdomainResult {
  subdomains: string[];
  sources: Record<string, number>;
}

const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'webmail', 'smtp', 'pop', 'ns1', 'ns2', 'cpanel', 'whm',
  'autodiscover', 'autoconfig', 'm', 'imap', 'test', 'blog', 'pop3', 'dev',
  'www2', 'admin', 'forum', 'news', 'vpn', 'ns3', 'mail2', 'mysql', 'old',
  'lists', 'support', 'mobile', 'mx', 'static', 'docs', 'beta', 'shop',
  'secure', 'demo', 'calendar', 'wiki', 'web', 'media', 'email', 'images',
  'img', 'www1', 'portal', 'video', 'dns2', 'api', 'cdn', 'stats', 'dns1',
  'staging', 'dev', 'test', 'qa', 'prod', 'uat', 'int', 'external', 'internal',
  'app', 'dashboard', 'panel', 'login', 'auth', 'sso', 'id', 'account', 'user',
  'client', 'partner', 'reseller', 'store', 'shop', 'ecom', 'checkout', 'pay',
  'billing', 'invoice', 'order', 'status', 'track', 'delivery', 'support',
  'help', 'faq', 'knowledge', 'kb', 'wiki', 'docs', 'manual', 'guide', 'learn',
  'academy', 'edu', 'training', 'course', 'event', 'webinar', 'conference',
  'meet', 'talk', 'chat', 'message', 'forum', 'community', 'group', 'social',
  'connect', 'link', 'share', 'feed', 'stream', 'live', 'broadcast', 'radio',
  'tv', 'video', 'media', 'gallery', 'photo', 'image', 'pic', 'album', 'art',
  'design', 'creative', 'studio', 'lab', 'research', 'data', 'analytics',
  'report', 'metrics', 'monitor', 'status', 'health', 'uptime', 'alert',
  'notify', 'log', 'audit', 'security', 'safe', 'protect', 'guard', 'shield',
  'defense', 'threat', 'vulnerability', 'scan', 'recon', 'exploit', 'bug',
  'patch', 'update', 'release', 'version', 'build', 'ci', 'cd', 'deploy',
  'git', 'repo', 'code', 'devops', 'ops', 'infra', 'server', 'host', 'cloud',
  'aws', 'azure', 'gcp', 'digitalocean', 'linode', 'vps', 'dedicated', 'colo',
  'datacenter', 'network', 'net', 'router', 'switch', 'firewall', 'vpn',
  'proxy', 'gateway', 'loadbalancer', 'lb', 'cdn', 'cache', 'storage', 's3',
  'blob', 'file', 'drive', 'backup', 'archive', 'vault', 'db', 'sql', 'mongo',
  'redis', 'elastic', 'search', 'queue', 'mq', 'kafka', 'stream', 'event',
  'api', 'rest', 'graphql', 'rpc', 'soap', 'xml', 'json', 'webhook', 'bot',
  'agent', 'worker', 'task', 'job', 'cron', 'scheduler', 'daemon', 'service',
  'microservice', 'container', 'docker', 'k8s', 'kubernetes', 'vm', 'virtual',
  'testbed', 'sandbox', 'playground', 'staging', 'preprod', 'production',
  'prod', 'live', 'public', 'private', 'internal', 'external', 'partner',
  'vendor', 'supplier', 'customer', 'client', 'user', 'admin', 'root', 'super',
  'master', 'slave', 'primary', 'secondary', 'replica', 'backup', 'dr', 'bcp',
  'recovery', 'failover', 'cluster', 'node', 'edge', 'pop', 'zone', 'region',
  'country', 'city', 'location', 'geo', 'map', 'gps', 'track', 'telemetry',
  'iot', 'device', 'sensor', 'gateway', 'hub', 'controller', 'robot', 'ai',
  'ml', 'data', 'science', 'research', 'lab', 'experiment', 'prototype', 'poc',
  'mvp', 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma',
  'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const enumerateSubdomainsDNS = async (
  domain: string,
  threads: number = 5,
  requestManager: RequestManager
): Promise<string[]> => {
  console.log(`[Subdomain DNS] Starting enumeration for ${domain} with ${threads} threads`);
  
  const found: Set<string> = new Set();
  const promises: Promise<void>[] = [];

  for (const subdomain of COMMON_SUBDOMAINS) {
    const fullDomain = `${subdomain}.${domain}`;
    promises.push((async () => {
      try {
        const dnsUrl = `https://dns.google/resolve?name=${fullDomain}&type=A`;
        
        // Use requestManager.fetch for controlled concurrency and retries
        const response = await requestManager.fetch(dnsUrl, { timeout: 5000 });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.Answer && data.Answer.length > 0) {
          console.log(`[Subdomain DNS] Found: ${fullDomain}`);
          found.add(fullDomain);
        }
      } catch (error: any) {
        if (error.message !== 'Request aborted') {
          // console.warn(`[Subdomain DNS] Failed to check ${fullDomain}: ${error.message}`);
        }
      }
    })());

    // Limit concurrent promises
    if (promises.length >= threads) {
      await Promise.race(promises);
      // Remove completed promises
      const completedIndex = await Promise.race(promises.map((p, i) => p.then(() => i)));
      if (completedIndex !== undefined) {
        promises.splice(completedIndex, 1);
      }
    }
  }

  await Promise.allSettled(promises); // Wait for all remaining promises

  console.log(`[Subdomain DNS] Found ${found.size} subdomains via DNS`);
  return Array.from(found);
};

export const enumerateSubdomainsCrtSh = async (domain: string, requestManager: RequestManager): Promise<string[]> => {
  console.log(`[Subdomain crt.sh] Querying certificate transparency logs for ${domain}`);
  
  try {
    const crtShUrl = `https://crt.sh/?q=%.${domain}&output=json`;
    
    // Use fetchWithBypass for crt.sh to handle CORS, passing requestManager's signal
    const { response } = await fetchWithBypass(crtShUrl, { timeout: 20000, signal: requestManager.scanController?.signal });
    
    if (!response.ok) {
      console.warn(`[Subdomain crt.sh] Failed with status ${response.status}`);
      return [];
    }

    const text = await response.text();
    
    // Robust JSON parsing
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn(`[Subdomain crt.sh] Invalid JSON response: ${text.substring(0, 100)}...`);
      return [];
    }

    const subdomains = new Set<string>();
    
    if (Array.isArray(data)) {
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
    }
    
    console.log(`[Subdomain crt.sh] Found ${subdomains.size} subdomains from CT logs`);
    return Array.from(subdomains);
  } catch (error: any) {
    console.error('[Subdomain crt.sh] Error:', error.message);
    return [];
  }
};

export const enumerateSubdomainsSecurityTrails = async (domain: string, requestManager: RequestManager, apiKeys: APIKeys): Promise<string[]> => {
  // Ensure apiKeys is an object, even if it somehow comes in as null/undefined
  const effectiveApiKeys = apiKeys ?? {};
  const securitytrailsKey = effectiveApiKeys.securitytrails;

  if (!securitytrailsKey) {
    console.log('[Subdomain SecurityTrails] API key not configured, skipping.');
    return [];
  }

  console.log(`[Subdomain SecurityTrails] Querying SecurityTrails for ${domain}`);
  try {
    const apiUrl = `https://api.securitytrails.com/v1/domain/${domain}/subdomains`;
    
    // Use fetchWithBypass for SecurityTrails to handle CORS, passing requestManager's signal
    const { response } = await fetchWithBypass(apiUrl, {
      headers: { 'APIKEY': securitytrailsKey },
      timeout: 15000,
      signal: requestManager.scanController?.signal,
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
  threads: number = 5,
  scanController?: AbortController, // Pass the main scan controller
  requestManager?: RequestManager, // Accept requestManager
  apiKeys?: APIKeys // Accept apiKeys
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
    // Ensure requestManager is available, create if not provided (though it should be from scanService)
    const currentRequestManager = requestManager || createRequestManager(scanController);
    const currentApiKeys = apiKeys ?? {}; // Ensure apiKeys is an object, even if it somehow comes in as null/undefined

    // Run all methods in parallel
    const [dnsResults, crtResults, securitytrailsResults] = await Promise.allSettled([
      enumerateSubdomainsDNS(domain, threads, currentRequestManager),
      enumerateSubdomainsCrtSh(domain, currentRequestManager),
      enumerateSubdomainsSecurityTrails(domain, currentRequestManager, currentApiKeys),
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