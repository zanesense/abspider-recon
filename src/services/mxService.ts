import { extractDomain } from './apiUtils';

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

export const performMXLookup = async (target: string): Promise<MXLookupResult> => {
  const domain = extractDomain(target);
  console.log(`[MX Lookup] Starting for ${domain}`);

  const result: MXLookupResult = {
    domain,
    mxRecords: [],
  };

  const mxUrl = `https://dns.google/resolve?name=${domain}&type=MX`;
  const mxResponse = await fetch(mxUrl);
  const mxData = await mxResponse.json();

  if (mxData.Answer) {
    for (const record of mxData.Answer) {
      const parts = record.data.split(' ');
      const priority = parseInt(parts[0]);
      const exchange = parts[1].replace(/\.$/, '');

      const ipUrl = `https://dns.google/resolve?name=${exchange}&type=A`;
      const ipResponse = await fetch(ipUrl);
      const ipData = await ipResponse.json();
      
      let ip: string | undefined;
      if (ipData.Answer && ipData.Answer.length > 0) {
        ip = ipData.Answer[0].data;
      }

      result.mxRecords.push({ priority, exchange, ip });
      console.log(`[MX Lookup] Found: ${exchange} (priority: ${priority})`);
    }
  }

  const txtUrl = `https://dns.google/resolve?name=${domain}&type=TXT`;
  const txtResponse = await fetch(txtUrl);
  const txtData = await txtResponse.json();

  if (txtData.Answer) {
    for (const record of txtData.Answer) {
      const value = record.data.replace(/"/g, '');
      if (value.startsWith('v=spf1')) {
        result.spfRecord = value;
        console.log(`[MX Lookup] SPF record found`);
      }
    }
  }

  const dmarcUrl = `https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`;
  const dmarcResponse = await fetch(dmarcUrl);
  const dmarcData = await dmarcResponse.json();

  if (dmarcData.Answer && dmarcData.Answer.length > 0) {
    result.dmarcRecord = dmarcData.Answer[0].data.replace(/"/g, '');
    console.log(`[MX Lookup] DMARC record found`);
  }

  console.log(`[MX Lookup] Complete: ${result.mxRecords.length} MX records found`);
  return result;
};