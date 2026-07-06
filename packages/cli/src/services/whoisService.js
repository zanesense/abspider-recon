import { extractDomain } from './apiUtils.js';
import { httpFetchWithRetry } from './proxyFetch.js';

export async function performWhoisLookup(target, options = {}) {
  const domain = extractDomain(target);
  const timeout = options.timeout || 15000;

  const result = {
    domain,
    nameservers: [],
  };

  const securitytrailsKey = options.securitytrailsKey;
  if (securitytrailsKey) {
    try {
      const apiUrl = `https://api.securitytrails.com/v1/domain/${domain}/whois`;
      const res = await httpFetchWithRetry(apiUrl, {
        headers: { APIKEY: securitytrailsKey },
        timeout,
        retries: 1,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.registrar) {
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
          result.found = true;
          result.source = 'securitytrails';
          return result;
        }
      }
    } catch (stError) {
      console.warn('[WHOIS] SecurityTrails failed:', stError.message);
    }
  }

  try {
    const rdapUrl = `https://rdap.org/domain/${domain}`;
    const res = await httpFetchWithRetry(rdapUrl, { timeout, retries: 2 });
    if (res.ok) {
      const data = await res.json();
      if (data.entities && data.entities.length > 0) {
        const entity = data.entities[0];
        if (entity.vcardArray && entity.vcardArray.length > 1 && entity.vcardArray[1]) {
          for (const field of entity.vcardArray[1]) {
            if (field[0] === 'fn') {
              result.registrar = field[3];
            }
          }
        }
      }
      if (data.events) {
        for (const event of data.events) {
          if (event.eventAction === 'registration') result.created = new Date(event.eventDate).toISOString().split('T')[0];
          if (event.eventAction === 'expiration') result.expires = new Date(event.eventDate).toISOString().split('T')[0];
          if (event.eventAction === 'last changed') result.updated = new Date(event.eventDate).toISOString().split('T')[0];
        }
      }
      if (data.status && data.status.length > 0) result.status = data.status[0];
      result.found = true;
      result.source = 'rdap.org';
    }
  } catch (rdapError) {
    console.warn('[WHOIS] RDAP lookup failed:', rdapError.message);
  }

  try {
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=NS`;
    const dnsRes = await httpFetchWithRetry(dnsUrl, { timeout: 10000, retries: 1 });
    if (dnsRes.ok) {
      const dnsData = await dnsRes.json();
      if (dnsData.Answer) {
        for (const answer of dnsData.Answer) {
          if (answer.type === 2) result.nameservers.push(answer.data);
        }
      }
    }
  } catch (dnsError) {
    console.warn('[WHOIS] DNS NS lookup failed:', dnsError.message);
  }

  return result;
}
