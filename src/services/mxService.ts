import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager'; // Import RequestManager

export interface MXRecord {
  priority: number;
  exchange: string;
  ip?: string;
}

export interface MXLookupResult {
  domain: string;
  mxRecords: MXRecord[];
  spfRecord?: string;
  dmarcRecord?: string;
}

const queryDNS = async (name: string, type: string, requestManager: RequestManager): Promise<any> => {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const response = await requestManager.fetch(url, {
    timeout: 10000,
    headers: { Accept: 'application/dns-json' },
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`DNS provider returned non-JSON content for ${type} ${name}`, { cause: error });
  }
};

export const performMXLookup = async (target: string, requestManager: RequestManager): Promise<MXLookupResult> => {
  const domain = extractDomain(target);
  console.log(`[MX Lookup] Starting for ${domain}`);

  const result: MXLookupResult = {
    domain,
    mxRecords: [],
  };

  const mxData = await queryDNS(domain, 'MX', requestManager);

  if (mxData.Answer) {
    for (const record of mxData.Answer) {
      const parts = record.data.split(' ');
      const priority = parseInt(parts[0]);
      const exchange = parts[1].replace(/\.$/, '');

      const ipData = await queryDNS(exchange, 'A', requestManager);
      
      let ip: string | undefined;
      if (ipData.Answer && ipData.Answer.length > 0) {
        ip = ipData.Answer[0].data;
      }

      result.mxRecords.push({ priority, exchange, ip });
      console.log(`[MX Lookup] Found: ${exchange} (priority: ${priority})`);
    }
  }

  const txtData = await queryDNS(domain, 'TXT', requestManager);

  if (txtData.Answer) {
    for (const record of txtData.Answer) {
      const value = record.data.replace(/"/g, '');
      if (value.startsWith('v=spf1')) {
        result.spfRecord = value;
        console.log(`[MX Lookup] SPF record found`);
      }
    }
  }

  const dmarcData = await queryDNS(`_dmarc.${domain}`, 'TXT', requestManager);

  if (dmarcData.Answer && dmarcData.Answer.length > 0) {
    result.dmarcRecord = dmarcData.Answer[0].data.replace(/"/g, '');
    console.log(`[MX Lookup] DMARC record found`);
  }

  console.log(`[MX Lookup] Complete: ${result.mxRecords.length} MX records found`);
  return result;
};
