import { extractDomain } from './apiUtils';

export interface WhoisResult {
  domain: string;
  registrar?: string;
  created?: string;
  expires?: string;
  updated?: string;
  nameservers: string[];
  status?: string;
  registrant?: {
    organization?: string;
    country?: string;
  };
  dnssec?: string;
}

export const performWhoisLookup = async (target: string): Promise<WhoisResult> => {
  try {
    const domain = extractDomain(target);
    console.log(`[WHOIS] Starting lookup for ${domain}`);

    const result: WhoisResult = {
      domain,
      nameservers: [],
    };

    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=NS`;
    
    const dnsController = new AbortController();
    const dnsTimeoutId = setTimeout(() => {
      console.log('[WHOIS] DNS request timeout, aborting...');
      dnsController.abort();
    }, 10000);
    
    try {
      const dnsResponse = await fetch(dnsUrl, { signal: dnsController.signal });
      clearTimeout(dnsTimeoutId);
      
      const dnsData = await dnsResponse.json();
      
      if (dnsData.Answer) {
        for (const answer of dnsData.Answer) {
          if (answer.type === 2) {
            result.nameservers.push(answer.data);
          }
        }
      }

      console.log(`[WHOIS] Found ${result.nameservers.length} nameservers`);
    } catch (dnsError: any) {
      clearTimeout(dnsTimeoutId);
      console.warn('[WHOIS] DNS lookup failed:', dnsError.message);
    }

    const rdapUrl = `https://rdap.org/domain/${domain}`;
    
    const rdapController = new AbortController();
    const rdapTimeoutId = setTimeout(() => {
      console.log('[WHOIS] RDAP request timeout, aborting...');
      rdapController.abort();
    }, 15000);
    
    try {
      const rdapResponse = await fetch(rdapUrl, { signal: rdapController.signal });
      clearTimeout(rdapTimeoutId);
      
      if (rdapResponse.ok) {
        const rdapData = await rdapResponse.json();
        
        if (rdapData.entities && rdapData.entities.length > 0) {
          const entity = rdapData.entities[0];
          if (entity.vcardArray && entity.vcardArray[1]) {
            for (const field of entity.vcardArray[1]) {
              if (field[0] === 'fn') {
                result.registrar = field[3];
              }
            }
          }
        }

        if (rdapData.events) {
          for (const event of rdapData.events) {
            if (event.eventAction === 'registration') {
              result.created = new Date(event.eventDate).toISOString().split('T')[0];
            }
            if (event.eventAction === 'expiration') {
              result.expires = new Date(event.eventDate).toISOString().split('T')[0];
            }
            if (event.eventAction === 'last changed') {
              result.updated = new Date(event.eventDate).toISOString().split('T')[0];
            }
          }
        }

        if (rdapData.status && rdapData.status.length > 0) {
          result.status = rdapData.status[0];
        }
      } else {
        console.warn(`[WHOIS] RDAP lookup returned status ${rdapResponse.status}`);
      }
    } catch (rdapError: any) {
      clearTimeout(rdapTimeoutId);
      console.warn('[WHOIS] RDAP lookup failed:', rdapError.message);
    }

    console.log(`[WHOIS] Lookup complete for ${domain}`);
    
    return result;
  } catch (error: any) {
    console.error('[WHOIS] Critical error:', error);
    throw error;
  }
};