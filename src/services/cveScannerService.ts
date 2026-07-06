import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

interface CVERecord {
  id: string;
  technology: string;
  versionRange: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
}

let CVE_DATABASE: CVERecord[] = [
  // WordPress
  { id: 'CVE-2024-44000', technology: 'WordPress', versionRange: '<6.6', severity: 'Critical', description: 'Unauthenticated RCE via template injection' },
  { id: 'CVE-2024-31245', technology: 'WordPress', versionRange: '<6.5.2', severity: 'High', description: 'Stored XSS in block editor' },
  { id: 'CVE-2023-45179', technology: 'WordPress', versionRange: '<6.3.2', severity: 'High', description: 'SQL injection via shortcode attributes' },
  { id: 'CVE-2023-23488', technology: 'WordPress', versionRange: '<6.1.2', severity: 'Medium', description: 'CSRF in XML-RPC' },
  // Apache
  { id: 'CVE-2024-39573', technology: 'Apache HTTP Server', versionRange: '<2.4.60', severity: 'High', description: 'HTTP/2 memory corruption' },
  { id: 'CVE-2024-24795', technology: 'Apache HTTP Server', versionRange: '<2.4.59', severity: 'Medium', description: 'HTTP response splitting' },
  { id: 'CVE-2023-45802', technology: 'Apache HTTP Server', versionRange: '<2.4.58', severity: 'Medium', description: 'HTTP/2 stream memory leak' },
  // Nginx
  { id: 'CVE-2024-24989', technology: 'Nginx', versionRange: '<1.24.1', severity: 'High', description: 'HTTP/3 QUIC memory corruption' },
  { id: 'CVE-2023-44487', technology: 'Nginx', versionRange: '<1.25.3', severity: 'Medium', description: 'HTTP/2 Rapid Reset attack' },
  // PHP
  { id: 'CVE-2024-4577', technology: 'PHP', versionRange: '<8.3.8', severity: 'Critical', description: 'Argument injection in CGI mode' },
  { id: 'CVE-2024-1874', technology: 'PHP', versionRange: '<8.2.17', severity: 'High', description: 'PHAR deserialization bypass' },
  { id: 'CVE-2023-3823', technology: 'PHP', versionRange: '<8.1.22', severity: 'High', description: 'File upload bypass' },
  // Node.js
  { id: 'CVE-2024-27982', technology: 'Node.js', versionRange: '<20.11.1', severity: 'High', description: 'HTTP request smuggling' },
  { id: 'CVE-2024-22019', technology: 'Node.js', versionRange: '<18.19.1', severity: 'High', description: 'Denial of Service via HTTP/2' },
  // jQuery
  { id: 'CVE-2020-11023', technology: 'jQuery', versionRange: '<3.5.0', severity: 'Medium', description: 'XSS via HTML parsing' },
  { id: 'CVE-2020-11022', technology: 'jQuery', versionRange: '<3.5.0', severity: 'Medium', description: 'XSS via HTML injection in $.htmlPrefilter' },
  // React
  { id: 'CVE-2024-30016', technology: 'React', versionRange: '<18.2.0', severity: 'Medium', description: 'Server-side rendering XSS' },
  // Angular
  { id: 'CVE-2024-32792', technology: 'Angular', versionRange: '<17.0.8', severity: 'High', description: 'Prototype pollution in SSR' },
  // Express
  { id: 'CVE-2024-29041', technology: 'Express', versionRange: '<4.19.2', severity: 'High', description: 'Open redirect via malformed URL' },
  // Django
  { id: 'CVE-2024-38875', technology: 'Django', versionRange: '<5.0.4', severity: 'High', description: 'SQL injection in filter expressions' },
  { id: 'CVE-2024-27351', technology: 'Django', versionRange: '<5.0.3', severity: 'Medium', description: 'Potential XSS in urlize template filter' },
  // Laravel
  { id: 'CVE-2024-29297', technology: 'Laravel', versionRange: '<10.48.0', severity: 'High', description: 'Mass assignment vulnerability' },
  // Cloudflare
  { id: 'CVE-2024-31238', technology: 'Cloudflare', versionRange: '<2024.3', severity: 'Medium', description: 'HTTP/2 rapid reset bypass' },
];

const parseVersion = (v: string): number[] => v.replace(/-.*$/, '').split('.').map(n => parseInt(n, 10) || 0);

const versionInRange = (current: string, range: string): boolean => {
  const op = range[0];
  const ver = range.substring(1);
  const curParts = parseVersion(current);
  const rangeParts = parseVersion(ver);

  for (let i = 0; i < Math.max(curParts.length, rangeParts.length); i++) {
    const c = curParts[i] || 0;
    const r = rangeParts[i] || 0;
    if (op === '<') { if (c !== r) return c < r; }
    else if (op === '>') { if (c !== r) return c > r; }
    else if (op === '=') { if (c !== r) return false; }
    else if (op === '~') return c <= r && (curParts[0] === rangeParts[0]);
  }
  return true;
};

export interface CVEMatch {
  cveId: string;
  technology: string;
  version?: string;
  severity: string;
  description: string;
}

export interface CVEScannerResult {
  matches: CVEMatch[];
  totalFound: number;
  techStackChecked: string[];
  techStackFound: boolean;
}

export const performCVEScan = async (target: string, requestManager: RequestManager): Promise<CVEScannerResult> => {
  const domain = extractDomain(target);
  console.log(`[CVE Scanner] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const matches: CVEMatch[] = [];
  const techStackChecked: string[] = [];

  // Quick tech detection from headers and HTML
  const techMap: Record<string, string> = {};

  try {
    const response = await requestManager.fetch(baseUrl, { timeout: 15000 });
    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    const html = await response.text();

    const server = headers['server'] || '';
    const poweredBy = headers['x-powered-by'] || '';
    const generator = (html.match(/<meta[^>]*name="generator"[^>]*content="([^"]+)"/i) || [])[1] || '';

    if (server.includes('Apache')) {
      const v = server.match(/Apache\/([\d.]+)/i);
      techMap['Apache HTTP Server'] = v ? v[1] : 'detected';
    }
    if (server.includes('nginx')) {
      const v = server.match(/nginx\/([\d.]+)/i);
      techMap['Nginx'] = v ? v[1] : 'detected';
    }
    if (generator.includes('WordPress')) {
      const v = generator.match(/WordPress\s*([\d.]+)/i);
      techMap['WordPress'] = v ? v[1] : 'detected';
    }
    if (poweredBy.includes('PHP')) {
      const v = poweredBy.match(/PHP\/([\d.]+)/i);
      techMap['PHP'] = v ? v[1] : 'detected';
    }
    if (html.includes('wp-content')) techMap['WordPress'] = techMap['WordPress'] || 'detected';
    if (html.includes('jquery')) {
      const v = html.match(/jquery[\/-]([\d.]+)/i);
      techMap['jQuery'] = v ? v[1] : 'detected';
    }
    if (html.includes('react')) {
      const v = html.match(/react[\/-]([\d.]+)/i);
      techMap['React'] = v ? v[1] : 'detected';
    }
    if (html.includes('angular')) {
      const v = html.match(/angular[\/-]([\d.]+)/i);
      techMap['Angular'] = v ? v[1] : 'detected';
    }
    if (headers['x-powered-by']?.includes('Express')) {
      techMap['Express'] = 'detected';
    }
    if (generator.includes('Drupal')) techMap['Drupal'] = 'detected';
    if (generator.includes('Joomla')) techMap['Joomla'] = 'detected';
    if (generator.includes('Laravel')) techMap['Laravel'] = 'detected';
    if (generator.includes('Django')) techMap['Django'] = 'detected';
  } catch { /* ignore */ }

  Object.entries(techMap).forEach(([tech, version]) => {
    techStackChecked.push(`${tech}${version !== 'detected' ? ` ${version}` : ''}`);
  });

  // Cross-reference with CVE database
  for (const cve of CVE_DATABASE) {
    const techVersion = techMap[cve.technology];
    if (techVersion) {
      if (techVersion !== 'detected' && cve.versionRange && versionInRange(techVersion, cve.versionRange)) {
        matches.push({
          cveId: cve.id,
          technology: cve.technology,
          version: techVersion !== 'detected' ? techVersion : undefined,
          severity: cve.severity,
          description: cve.description,
        });
      }
    }
  }

  return { matches, totalFound: matches.length, techStackChecked, techStackFound: techStackChecked.length > 0 };
};

let _cveLastRefreshed = Date.now();

export function getCVELastRefreshed(): number {
  return _cveLastRefreshed;
}

export async function refreshCVEDatabase(url?: string): Promise<void> {
  const source = url || (typeof process !== 'undefined' && (process as any).env?.CVE_DATABASE_URL);
  if (!source) return;
  try {
    const resp = await fetch(source);
    if (!resp.ok) return;
    const data: CVERecord[] = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      CVE_DATABASE = data;
      _cveLastRefreshed = Date.now();
    }
  } catch {
    // remote refresh failed, keep existing database
  }
}

// Attempt one-time refresh from env var at import time (non-blocking)
if (typeof process !== 'undefined' && (process as any).env?.CVE_DATABASE_URL) {
  refreshCVEDatabase();
}
