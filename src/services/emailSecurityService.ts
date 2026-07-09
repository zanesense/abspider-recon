import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'default', 'dkim', 'mail', 'zoho', 'protonmail', 'migadu', 'mxroute'];

export interface SPFRecord {
  exists: boolean;
  raw: string;
  valid: boolean;
  allMechanism?: string;
  issues: string[];
}

export interface DKIMRecord {
  exists: boolean;
  selector: string;
  raw: string;
  valid: boolean;
}

export interface DMARCRecord {
  exists: boolean;
  raw: string;
  valid: boolean;
  policy?: string;
  pct?: number;
  rua?: string;
  ruf?: string;
  issues: string[];
}

export interface EmailSecurityResult {
  domain: string;
  spf: SPFRecord;
  dkim: DKIMRecord[];
  dmarc: DMARCRecord;
  overallScore: number;
}

const queryTXTRecord = async (domain: string, requestManager: RequestManager): Promise<string[]> => {
  try {
    const url = `https://dns.google/resolve?name=${domain}&type=TXT`;
    const response = await requestManager.fetch(url, { timeout: 10000, skipProxy: true });
    const data = await response.json();
    if (data.Answer) {
      return data.Answer.map((r: any) => r.data.replace(/^"|"$/g, ''));
    }
    return [];
  } catch (error) {
    console.warn(`[EmailSecurity] Failed to query TXT for ${domain}:`, error);
    return [];
  }
};

const parseSPF = (records: string[]): SPFRecord => {
  const spfRecord = records.find(r => r.startsWith('v=spf1'));
  if (!spfRecord) {
    return { exists: false, raw: '', valid: false, issues: ['No SPF record found'] };
  }

  const issues: string[] = [];
  let allMechanism: string | undefined;

  if (spfRecord.includes('~all')) allMechanism = 'softfail';
  else if (spfRecord.includes('-all')) allMechanism = 'hardfail';
  else if (spfRecord.includes('?all')) allMechanism = 'neutral';
  else if (spfRecord.includes('+all')) allMechanism = 'pass';
  else issues.push('No "all" mechanism defined; anyone can send email as this domain');

  const parts = spfRecord.split(' ');
  const dnsLookups = parts.filter(p => p.startsWith('include:') || p.startsWith('a') || p.startsWith('mx') || p.startsWith('ptr')).length;
  if (dnsLookups > 10) issues.push(`Excessive DNS lookups (${dnsLookups}); SPF spec allows max 10`);

  return {
    exists: true,
    raw: spfRecord,
    valid: issues.length === 0,
    allMechanism,
    issues,
  };
};

const parseDMARC = (record: string): DMARCRecord => {
  const issues: string[] = [];
  const tags: Record<string, string> = {};
  record.split(';').forEach(tag => {
    const [key, ...vals] = tag.trim().split('=');
    if (key && vals.length > 0) tags[key.trim().toLowerCase()] = vals.join('=').trim();
  });

  const policy = tags['p'];
  if (!policy) issues.push('No policy tag (p=) defined');
  else if (!['none', 'quarantine', 'reject'].includes(policy)) issues.push(`Unknown policy: ${policy}`);

  const pct = tags['pct'] ? parseInt(tags['pct'], 10) : undefined;
  if (pct !== undefined && (pct < 0 || pct > 100)) issues.push(`Invalid pct value: ${pct}`);

  if (!tags['rua'] && !tags['ruf']) issues.push('No reporting addresses (rua/ruf) configured');

  return {
    exists: true,
    raw: record,
    valid: issues.length === 0,
    policy,
    pct,
    rua: tags['rua'],
    ruf: tags['ruf'],
    issues,
  };
};

export const performEmailSecurityCheck = async (target: string, requestManager: RequestManager): Promise<EmailSecurityResult> => {
  const domain = extractDomain(target);
  console.log(`[Email Security] Starting for ${domain}`);

  // SPF check
  const txtRecords = await queryTXTRecord(domain, requestManager);
  const spf = parseSPF(txtRecords);

  // DKIM check - try common selectors
  const dkimResults: DKIMRecord[] = [];
  for (const selector of DKIM_SELECTORS) {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const dkimRecords = await queryTXTRecord(dkimDomain, requestManager);
    if (dkimRecords.length > 0) {
      dkimResults.push({
        exists: true,
        selector,
        raw: dkimRecords[0].substring(0, 200),
        valid: dkimRecords.some(r => r.includes('v=DKIM1') || r.includes('k=rsa')),
      });
    }
  }

  // DMARC check
  const dmarcDomain = `_dmarc.${domain}`;
  const dmarcRecords = await queryTXTRecord(dmarcDomain, requestManager);
  let dmarc: DMARCRecord;
  if (dmarcRecords.length > 0) {
    const dmarcRecord = dmarcRecords.find(r => r.startsWith('v=DMARC1')) || dmarcRecords[0];
    dmarc = parseDMARC(dmarcRecord);
  } else {
    dmarc = { exists: false, raw: '', valid: false, issues: ['No DMARC record found'] };
  }

  // Calculate overall score (0-10)
  let score = 5;
  if (spf.exists) score += 1.5;
  if (spf.allMechanism === 'hardfail') score += 0.5;
  if (dmarc.exists) score += 1.5;
  if (dmarc.policy === 'reject') score += 1;
  if (dmarc.policy === 'quarantine') score += 0.5;
  if (dkimResults.length > 0) score += 1;
  if (spf.valid && dmarc.valid && dkimResults.some(d => d.valid)) score += 0.5;

  return {
    domain,
    spf,
    dkim: dkimResults,
    dmarc,
    overallScore: Math.round(score * 10) / 10,
  };
};
