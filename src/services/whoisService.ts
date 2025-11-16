import { extractDomain } from './apiUtils';
import { getAPIKey } from './apiKeyService';
import { fetchWithBypass, fetchJSONWithBypass } from './corsProxy'; // Import fetchJSONWithBypass
import { RequestManager } from './requestManager'; // Import RequestManager

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
    email?: string;
  };
  dnssec?: string;
  // Added from SecurityTrails
  whoisRaw?: string;
}

export const performWhoisLookup = async (target: string, requestManager: RequestManager): Promise<WhoisResult> => {
  try {
    const domain = extractDomain(target);
    console.log(`[WHOIS] Starting lookup for ${domain}`);

    const result: WhoisResult = {
      domain,
      nameservers: [],
    };

    // --- Try SecurityTrails API first if key is available ---
    const securitytrailsKey = getAPIKey('securitytrails');
    if (securitytrailsKey) {
      try {
        console.log('[WHOIS] Attempting SecurityTrails API lookup...');
        const apiUrl = `https://api.securitytrails.com/v1/domain/${domain}/whois`;
        // Use fetchJSONWithBypass for SecurityTrails API, passing requestManager's signal
        const { data, metadata } = await fetchJSONWithBypass(apiUrl, {
          headers: { 'APIKEY': securitytrailsKey },
          timeout: 15000,
          signal: requestManager.scanController?.signal,
        });

        if (data.registrar) { // Check for a key indicator of success
          result.registrar = data.registrar;
          result.created = data.created_date;
          result.expires = data.expires_date;
          result.updated = data.updated_date;
          result.status = data.status;
          result.nameservers = data.name_servers || [];
          result.dnssec = data.dnssec;
          result.whoisRaw = data.whois_text;

          if (data.registrant) {
            result.registrant = {
              organization: data.registrant.organization,
              country: data.registrant.country,
              email: data.registrant.email,
            };
          }
          console.log('[WHOIS] ✓ Data from SecurityTrails API');
          return result; // If SecurityTrails provides comprehensive data, return early
        } else if (data.message) {
          console.warn(`[WHOIS] SecurityTrails API returned error: ${data.message}, falling back...`);
        } else {
          console.warn(`[WHOIS] SecurityTrails API returned unexpected data, falling back...`);
        }
      } catch (stError: any) {
        console.warn('[WHOIS] SecurityTrails API lookup failed:', stError.message);
      }
    }

    // --- Fallback to DNS Google and RDAP if SecurityTrails fails or no key ---

    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=NS`;
    
    try {
      const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000 }); // Use requestManager
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
      console.warn('[WHOIS] DNS lookup failed:', dnsError.message);
    }

    const rdapUrl = `https://rdap.org/domain/${domain}`;
    
    try {
      // Use fetchJSONWithBypass for RDAP, passing requestManager's signal
      const { data: rdapData, metadata: rdapCorsMetadata } = await fetchJSONWithBypass(rdapUrl, { timeout: 15000, signal: requestManager.scanController?.signal });
      
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
    } catch (rdapError: any) {
      console.warn('[WHOIS] RDAP lookup failed:', rdapError.message);
    }

    console.log(`[WHOIS] Lookup complete for ${domain}`);
    
    return result;
  } catch (error: any) {
    console.error('[WHOIS] Critical error:', error);
    throw error;
  }
};