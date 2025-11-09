import { extractDomain } from './apiUtils';

export interface DNSRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface DNSLookupResult {
  domain: string;
  records: {
    A: DNSRecord[];
    AAAA: DNSRecord[];
    MX: DNSRecord[];
    NS: DNSRecord[];
    TXT: DNSRecord[];
    CNAME: DNSRecord[];
    SOA: DNSRecord[];
  };
}

const queryDNS = async (domain: string, type: string): Promise<DNSRecord[]> => {
  try {
    const url = `https://dns.google/resolve?name=${domain}&type=${type}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Answer) {
      return data.Answer.map((record: any) => ({
        type: type,
        value: record.data,
        ttl: record.TTL,
      }));
    }
    
    return [];
  } catch (error) {
    console.warn(`[DNS] Failed to query ${type} records:`, error);
    return [];
  }
};

export const performDNSLookup = async (target: string): Promise<DNSLookupResult> => {
  const domain = extractDomain(target);
  console.log(`[DNS Lookup] Starting for ${domain}`);

  const result: DNSLookupResult = {
    domain,
    records: {
      A: [],
      AAAA: [],
      MX: [],
      NS: [],
      TXT: [],
      CNAME: [],
      SOA: [],
    },
  };

  const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
  
  const promises = recordTypes.map(async (type) => {
    const records = await queryDNS(domain, type);
    result.records[type as keyof typeof result.records] = records;
    console.log(`[DNS Lookup] ${type}: ${records.length} records found`);
  });

  await Promise.allSettled(promises);

  console.log(`[DNS Lookup] Complete for ${domain}`);
  return result;
};