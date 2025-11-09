import { performSiteInfoScan } from './siteInfoService';
import { performFullHeaderAnalysis } from './headerService';
import { performWhoisLookup } from './whoisService';
import { performGeoIPLookup } from './geoipService';
import { performDNSLookup } from './dnsService';
import { performMXLookup } from './mxService';
import { calculateSubnet } from './subnetService';
import { scanCommonPorts } from './portService';
import { enumerateSubdomains } from './subdomainService';
import { performReverseIPLookup } from './reverseIPService';
import { performSQLScan } from './sqlScanService';
import { performXSSScan } from './xssScanService';
import { performWordPressScan } from './wordpressService';
import { performSEOAnalysis } from './seoService';

export interface ScanConfig {
  target: string;
  siteInfo?: boolean;
  headers?: boolean;
  whois?: boolean;
  geoip?: boolean;
  dns?: boolean;
  mx?: boolean;
  subnet?: boolean;
  ports?: boolean;
  subdomains?: boolean;
  reverseip?: boolean;
  sqlinjection?: boolean;
  xss?: boolean;
  wordpress?: boolean;
  seo?: boolean;
  useProxy?: boolean;
  threads?: number;
}

export interface ScanProgress {
  current: number;
  total: number;
  stage: string;
}

export interface Scan {
  id: string;
  target: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'stopped' | 'failed';
  timestamp: string;
  completedAt?: string;
  config: ScanConfig;
  progress: ScanProgress;
  results: any;
  errors?: string[];
}

interface ScanController {
  paused: boolean;
  stopped: boolean;
}

const scans: Map<string, Scan> = new Map();
const scanControllers: Map<string, ScanController> = new Map();

const updateScan = (scan: Scan) => {
  scans.set(scan.id, { ...scan });
};

const checkScanControl = async (scanId: string): Promise<boolean> => {
  const controller = scanControllers.get(scanId);
  if (!controller) return false;
  
  if (controller.stopped) {
    return true;
  }
  
  while (controller.paused) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (controller.stopped) return true;
  }
  
  return false;
};

const performScan = async (scan: Scan) => {
  const { config } = scan;
  const tasks: string[] = [];
  
  // Count enabled modules
  if (config.siteInfo) tasks.push('siteInfo');
  if (config.headers) tasks.push('headers');
  if (config.whois) tasks.push('whois');
  if (config.geoip) tasks.push('geoip');
  if (config.dns) tasks.push('dns');
  if (config.mx) tasks.push('mx');
  if (config.subnet) tasks.push('subnet');
  if (config.ports) tasks.push('ports');
  if (config.subdomains) tasks.push('subdomains');
  if (config.reverseip) tasks.push('reverseip');
  if (config.sqlinjection) tasks.push('sqlinjection');
  if (config.xss) tasks.push('xss');
  if (config.wordpress) tasks.push('wordpress');
  if (config.seo) tasks.push('seo');

  scan.progress = {
    current: 0,
    total: tasks.length,
    stage: 'Starting comprehensive scan',
  };
  updateScan(scan);

  let completed = 0;

  // Site Info Scan
  if (config.siteInfo) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Scanning site information';
      updateScan(scan);
      const result = await performSiteInfoScan(config.target);
      scan.results.siteInfo = result;
      console.log('[Site Info] ✓ Success');
    } catch (error: any) {
      console.error('[Site Info] ✗ Error:', error);
      scan.errors?.push(`Site Info: ${error.message || 'Scan failed - site may be blocking requests'}`);
      scan.results.siteInfo = {
        cloudflare: false,
        technologies: [],
      };
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // Headers Scan
  if (config.headers) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Analyzing HTTP headers';
      updateScan(scan);
      const result = await performFullHeaderAnalysis(config.target);
      scan.results.headers = result;
      console.log('[Headers] ✓ Success');
    } catch (error: any) {
      console.error('[Headers] ✗ Error:', error);
      scan.errors?.push(`Headers: ${error.message || 'Failed to fetch headers'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // WHOIS Lookup
  if (config.whois) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Performing WHOIS lookup';
      updateScan(scan);
      const result = await performWhoisLookup(config.target);
      scan.results.whois = result;
      console.log('[WHOIS] ✓ Success');
    } catch (error: any) {
      console.error('[WHOIS] ✗ Error:', error);
      scan.errors?.push(`WHOIS: ${error.message || 'Lookup failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // GeoIP Lookup
  if (config.geoip) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Performing GeoIP lookup';
      updateScan(scan);
      const result = await performGeoIPLookup(config.target);
      scan.results.geoip = result;
      console.log('[GeoIP] ✓ Success');
    } catch (error: any) {
      console.error('[GeoIP] ✗ Error:', error);
      scan.errors?.push(`GeoIP: ${error.message || 'Lookup failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // DNS Lookup
  if (config.dns) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Performing DNS lookup';
      updateScan(scan);
      const result = await performDNSLookup(config.target);
      scan.results.dns = result;
      console.log('[DNS] ✓ Success');
    } catch (error: any) {
      console.error('[DNS] ✗ Error:', error);
      scan.errors?.push(`DNS: ${error.message || 'Lookup failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // MX Lookup
  if (config.mx) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Performing MX lookup';
      updateScan(scan);
      const result = await performMXLookup(config.target);
      scan.results.mx = result;
      console.log('[MX] ✓ Success');
    } catch (error: any) {
      console.error('[MX] ✗ Error:', error);
      scan.errors?.push(`MX: ${error.message || 'Lookup failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // Subnet Calculation
  if (config.subnet) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Calculating subnet information';
      updateScan(scan);
      // Get IP from geoip results or resolve target
      let ip = scan.results.geoip?.ip;
      if (!ip) {
        // Fallback: try to resolve domain to IP
        const geoip = await performGeoIPLookup(config.target);
        ip = geoip.ip;
      }
      const result = calculateSubnet(ip, 24); // Default to /24 subnet
      scan.results.subnet = result;
      console.log('[Subnet] ✓ Success');
    } catch (error: any) {
      console.error('[Subnet] ✗ Error:', error);
      scan.errors?.push(`Subnet: ${error.message || 'Calculation failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // Port Scan
  if (config.ports) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Scanning ports';
      updateScan(scan);
      const result = await scanCommonPorts(config.target);
      scan.results.ports = result;
      console.log('[Ports] ✓ Success');
    } catch (error: any) {
      console.error('[Ports] ✗ Error:', error);
      scan.errors?.push(`Ports: ${error.message || 'Scan failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // Subdomain Enumeration
  if (config.subdomains) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Enumerating subdomains';
      updateScan(scan);
      const result = await enumerateSubdomains(config.target);
      scan.results.subdomains = result;
      console.log('[Subdomains] ✓ Success');
    } catch (error: any) {
      console.error('[Subdomains] ✗ Error:', error);
      scan.errors?.push(`Subdomains: ${error.message || 'Enumeration failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // Reverse IP Lookup
  if (config.reverseip) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Performing reverse IP lookup';
      updateScan(scan);
      const result = await performReverseIPLookup(config.target);
      scan.results.reverseip = result;
      console.log('[Reverse IP] ✓ Success');
    } catch (error: any) {
      console.error('[Reverse IP] ✗ Error:', error);
      scan.errors?.push(`Reverse IP: ${error.message || 'Lookup failed'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // SQL Injection Scan
  if (config.sqlinjection) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Testing for SQL injection';
      updateScan(scan);
      const result = await performSQLScan(config.target);
      scan.results.sqlinjection = result;
      console.log('[SQL Injection] ✓ Success');
    } catch (error: any) {
      console.error('[SQL Injection] ✗ Error:', error);
      scan.errors?.push(`SQL Injection: ${error.message || 'Scan failed - CORS restrictions may apply'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // XSS Scan
  if (config.xss) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Testing for XSS vulnerabilities';
      updateScan(scan);
      const result = await performXSSScan(config.target);
      scan.results.xss = result;
      console.log('[XSS] ✓ Success');
    } catch (error: any) {
      console.error('[XSS] ✗ Error:', error);
      scan.errors?.push(`XSS: ${error.message || 'Scan failed - CORS restrictions may apply'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // WordPress Scan
  if (config.wordpress) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Scanning WordPress';
      updateScan(scan);
      const result = await performWordPressScan(config.target);
      scan.results.wordpress = result;
      console.log('[WordPress] ✓ Success');
    } catch (error: any) {
      console.error('[WordPress] ✗ Error:', error);
      scan.errors?.push(`WordPress: ${error.message || 'Scan failed - CORS restrictions may apply'}`);
      scan.results.wordpress = {
        isWordPress: false,
        vulnerabilities: [],
        sensitiveFiles: [],
        plugins: [],
        themes: [],
      };
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  // SEO Analysis
  if (config.seo) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Performing SEO analysis';
      updateScan(scan);
      const result = await performSEOAnalysis(config.target);
      scan.results.seo = result;
      console.log('[SEO] ✓ Success');
    } catch (error: any) {
      console.error('[SEO] ✗ Error:', error);
      scan.errors?.push(`SEO: ${error.message || 'Analysis failed - CORS restrictions may apply'}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  const controller = scanControllers.get(scan.id);
  if (controller?.stopped) {
    scan.status = 'stopped';
  } else {
    scan.status = 'completed';
  }
  
  scan.completedAt = new Date().toISOString();
  scan.progress.stage = scan.status === 'stopped' ? 'Scan stopped' : 'Scan complete';
  updateScan(scan);
  
  const successCount = tasks.length - (scan.errors?.length || 0);
  console.log(`[Scan ${scan.id}] ${scan.status}: ${successCount}/${tasks.length} modules successful`);
};

export const startScan = async (config: ScanConfig): Promise<Scan> => {
  const scan: Scan = {
    id: Date.now().toString(),
    target: config.target,
    status: 'running',
    timestamp: new Date().toISOString(),
    config,
    progress: {
      current: 0,
      total: 0,
      stage: 'Initializing scan',
    },
    results: {},
    errors: [],
  };

  scans.set(scan.id, scan);
  scanControllers.set(scan.id, { paused: false, stopped: false });
  
  console.log('[Scan Service] Starting comprehensive scan:', scan.id, config);
  
  performScan(scan).catch((error) => {
    console.error('[Scan Service] Fatal error:', error);
    scan.status = 'failed';
    scan.errors?.push(`Fatal error: ${error.message}`);
    updateScan(scan);
  });

  return scan;
};

export const getScanById = (id: string): Scan | undefined => {
  return scans.get(id);
};

export const getScanHistory = (): Scan[] => {
  return Array.from(scans.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const pauseScan = (id: string): void => {
  const controller = scanControllers.get(id);
  if (controller) {
    controller.paused = true;
    const scan = scans.get(id);
    if (scan) {
      scan.status = 'paused';
      updateScan(scan);
    }
  }
};

export const resumeScan = (id: string): void => {
  const controller = scanControllers.get(id);
  if (controller) {
    controller.paused = false;
    const scan = scans.get(id);
    if (scan) {
      scan.status = 'running';
      updateScan(scan);
    }
  }
};

export const stopScan = (id: string): void => {
  const controller = scanControllers.get(id);
  if (controller) {
    controller.stopped = true;
    controller.paused = false;
    const scan = scans.get(id);
    if (scan) {
      scan.status = 'stopped';
      scan.completedAt = new Date().toISOString();
      updateScan(scan);
    }
  }
};

export const stopAllScans = (): void => {
  scanControllers.forEach((controller, id) => {
    controller.stopped = true;
    controller.paused = false;
    const scan = scans.get(id);
    if (scan && (scan.status === 'running' || scan.status === 'paused')) {
      scan.status = 'stopped';
      scan.completedAt = new Date().toISOString();
      updateScan(scan);
    }
  });
};
