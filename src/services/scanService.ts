import { performFullHeaderAnalysis } from './headerService';
import { performWhoisLookup } from './whoisService';
import { enumerateSubdomains } from './subdomainService';
import { scanCommonPorts } from './portService';
import { performGeoIPLookup } from './geoipService';
import { performSQLScan } from './sqlScanService';
import { performXSSScan } from './xssScanService';
import { performLFIScan } from './lfiScanService';
import { performSiteInfoScan } from './siteInfoService';
import { performDNSLookup } from './dnsService';
import { performMXLookup } from './mxService';
import { performReverseIPLookup } from './reverseIPService';
import { performWordPressScan } from './wordpressService';
import { performSEOAnalysis } from './seoService';
import { calculateSubnet } from './subnetService';
import { setProxyList } from './apiUtils';
import { getSettings } from './settingsService';
import { createRequestManager, RequestManager } from './requestManager';

interface ScanConfig {
  target: string;
  siteInfo: boolean;
  headers: boolean;
  whois: boolean;
  geoip: boolean;
  dns: boolean;
  mx: boolean;
  subnet: boolean;
  ports: boolean;
  subdomains: boolean;
  reverseip: boolean;
  sqlinjection: boolean;
  xss: boolean;
  lfi: boolean;
  wordpress: boolean;
  seo: boolean;
  useProxy: boolean;
  threads: number;
}

export interface Scan {
  id: string;
  target: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'stopped';
  timestamp: string;
  startedAt?: string;
  completedAt?: string;
  elapsedMs?: number;
  config: ScanConfig;
  results: {
    siteInfo?: any;
    headers?: any;
    whois?: any;
    geoip?: any;
    dns?: any;
    mx?: any;
    subnet?: any;
    ports?: any[];
    subdomains?: string[];
    reverseip?: any;
    sqlinjection?: any;
    xss?: any;
    lfi?: any;
    wordpress?: any;
    seo?: any;
  };
  errors?: string[];
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
}

const STORAGE_KEY = 'abspider-scans';
const scanControllers = new Map<string, { 
  paused: boolean; 
  stopped: boolean;
  abortController?: AbortController;
  requestManager?: RequestManager;
  elapsedInterval?: NodeJS.Timeout;
}>();

const loadScansFromStorage = (): Scan[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Storage] Failed to load scans:', error);
    return [];
  }
};

const saveScansToStorage = (scans: Scan[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  } catch (error) {
    console.error('[Storage] Failed to save:', error);
  }
};

let scansCache: Scan[] = loadScansFromStorage();

export const getScanHistory = async (): Promise<Scan[]> => {
  console.log('[Scan History] Loading from storage');
  return [...scansCache].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const getScanById = async (id: string): Promise<Scan | null> => {
  console.log(`[Get Scan] Loading scan ${id}. Cache size: ${scansCache.length}`);
  const foundScan = scansCache.find(s => s.id === id);
  if (!foundScan) {
    console.log(`[Get Scan] Scan ${id} NOT found in cache.`);
  } else {
    console.log(`[Get Scan] Scan ${id} found:`, foundScan);
  }
  return foundScan || null;
};

const updateScan = (scan: Scan): Scan => {
  const index = scansCache.findIndex(s => s.id === scan.id);
  if (index !== -1) {
    scansCache[index] = { ...scan };
  } else {
    scansCache.unshift(scan);
  }
  saveScansToStorage(scansCache);
  return scansCache[index !== -1 ? index : 0];
};

export const pauseScan = (id: string) => {
  console.log(`[Scan Control] Pausing scan ${id}`);
  const controller = scanControllers.get(id);
  if (controller) {
    controller.paused = true;
  }
  
  const scan = scansCache.find(s => s.id === id);
  if (scan && scan.status === 'running') {
    scan.status = 'paused';
    updateScan(scan);
  }
};

export const resumeScan = (id: string) => {
  console.log(`[Scan Control] Resuming scan ${id}`);
  const controller = scanControllers.get(id);
  if (controller) {
    controller.paused = false;
  }
  
  const scan = scansCache.find(s => s.id === id);
  if (scan && scan.status === 'paused') {
    scan.status = 'running';
    updateScan(scan);
  }
};

export const stopScan = (id: string) => {
  console.log(`[Scan Control] Stopping scan ${id}`);
  const controller = scanControllers.get(id);
  if (controller) {
    controller.stopped = true;
    controller.abortController?.abort();
    controller.requestManager?.abortAll();
    if (controller.elapsedInterval) {
      clearInterval(controller.elapsedInterval);
    }
  }
  
  const scan = scansCache.find(s => s.id === id);
  if (scan && (scan.status === 'running' || scan.status === 'paused')) {
    scan.status = 'stopped';
    scan.completedAt = new Date().toISOString();
    if (scan.startedAt) {
      scan.elapsedMs = Date.now() - new Date(scan.startedAt).getTime();
    }
    updateScan(scan);
  }
};

export const stopAllScans = () => {
  console.log('[Scan Control] Stopping all scans');
  scanControllers.forEach((controller) => {
    controller.stopped = true;
    controller.abortController?.abort();
    controller.requestManager?.abortAll();
    if (controller.elapsedInterval) {
      clearInterval(controller.elapsedInterval);
    }
  });
  
  scansCache.forEach(scan => {
    if (scan.status === 'running' || scan.status === 'paused') {
      scan.status = 'stopped';
      scan.completedAt = new Date().toISOString();
      if (scan.startedAt) {
        scan.elapsedMs = Date.now() - new Date(scan.startedAt).getTime();
      }
      updateScan(scan);
    }
  });
};

export const startScan = async (config: ScanConfig): Promise<string> => {
  console.log('[Start Scan] Initiating comprehensive scan', config);
  
  const now = new Date().toISOString();
  const newScan: Scan = {
    id: `scan-${Date.now()}`,
    target: config.target,
    status: 'running',
    timestamp: now,
    startedAt: now,
    elapsedMs: 0,
    config,
    results: {},
    errors: [],
    progress: {
      current: 0,
      total: 0,
      stage: 'Initializing',
    },
  };

  const abortController = new AbortController();
  const requestManager = createRequestManager(abortController);

  const elapsedInterval = setInterval(() => {
    const scan = scansCache.find(s => s.id === newScan.id);
    if (scan && scan.status === 'running' && scan.startedAt) {
      scan.elapsedMs = Date.now() - new Date(scan.startedAt).getTime();
      updateScan(scan);
    }
  }, 1000);

  scanControllers.set(newScan.id, { 
    paused: false, 
    stopped: false,
    abortController,
    requestManager,
    elapsedInterval,
  });

  const settings = getSettings();
  if (config.useProxy && settings.proxyList) {
    const proxies = settings.proxyList.split('\n').filter(p => p.trim());
    setProxyList(proxies);
    console.log(`[Start Scan] Loaded ${proxies.length} proxies`);
  }

  updateScan(newScan);

  performScan(newScan).catch((error) => {
    console.error(`[Scan Failed] Scan ${newScan.id} encountered critical error:`, error);
    newScan.status = 'completed';
    newScan.completedAt = new Date().toISOString();
    if (newScan.startedAt) {
      newScan.elapsedMs = Date.now() - new Date(newScan.startedAt).getTime();
    }
    newScan.errors?.push(`Critical error: ${error.message}`);
    updateScan(newScan);
  }).finally(() => {
    const controller = scanControllers.get(newScan.id);
    if (controller?.elapsedInterval) {
      clearInterval(controller.elapsedInterval);
    }
    scanControllers.delete(newScan.id);
  });

  return newScan.id;
};

const checkScanControl = async (scanId: string): Promise<boolean> => {
  const controller = scanControllers.get(scanId);
  if (!controller) return false;

  if (controller.stopped) {
    console.log(`[Scan Control] Scan ${scanId} stopped by user`);
    return true;
  }

  while (controller.paused) {
    console.log(`[Scan Control] Scan ${scanId} paused, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (controller.stopped) {
      console.log(`[Scan Control] Scan ${scanId} stopped while paused`);
      return true;
    }
  }

  return false;
};

const performScan = async (scan: Scan) => {
  const { config } = scan;
  const tasks: string[] = [];
  
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
  if (config.lfi) tasks.push('lfi');
  if (config.wordpress) tasks.push('wordpress');
  if (config.seo) tasks.push('seo');

  const controller = scanControllers.get(scan.id);
  const requestManager = controller?.requestManager;

  scan.progress = {
    current: 0,
    total: tasks.length,
    stage: 'Starting comprehensive scan',
  };
  updateScan(scan);

  let completed = 0;

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
      scan.errors?.push(`Site Info: ${error.message || 'Scan failed'}`);
      scan.results.siteInfo = { cloudflare: false, technologies: [] };
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.headers) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Analyzing HTTP headers';
      updateScan(scan);
      const result = await performFullHeaderAnalysis(config.target, config.useProxy);
      scan.results.headers = result.headers;
      scan.results.headers._analysis = {
        statusCode: result.statusCode,
        securityHeaders: result.securityHeaders,
        technologies: result.technologies,
        cookies: result.cookies,
        cacheControl: result.cacheControl,
        cors: result.cors,
      };
      console.log('[Headers] ✓ Success');
    } catch (error: any) {
      console.error('[Headers] ✗ Error:', error);
      scan.errors?.push(`Headers: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

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
      scan.errors?.push(`WHOIS: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

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
      scan.errors?.push(`GeoIP: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

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
      scan.errors?.push(`DNS: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

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
      scan.errors?.push(`MX: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.subnet && scan.results.geoip?.ip) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Calculating subnet information';
      updateScan(scan);
      const result = calculateSubnet(scan.results.geoip.ip, 24);
      scan.results.subnet = result;
      console.log('[Subnet] ✓ Success');
    } catch (error: any) {
      console.error('[Subnet] ✗ Error:', error);
      scan.errors?.push(`Subnet: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.ports) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Scanning ports';
      updateScan(scan);
      const result = await scanCommonPorts(config.target, config.threads);
      scan.results.ports = result;
      console.log('[Ports] ✓ Success');
    } catch (error: any) {
      console.error('[Ports] ✗ Error:', error);
      scan.errors?.push(`Ports: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.subdomains) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Enumerating subdomains';
      updateScan(scan);
      const result = await enumerateSubdomains(config.target, config.threads);
      scan.results.subdomains = Array.isArray(result) ? result : (result?.subdomains || []);
      console.log('[Subdomains] ✓ Success');
    } catch (error: any) {
      console.error('[Subdomains] ✗ Error:', error);
      scan.errors?.push(`Subdomains: ${error.message || 'Enumeration failed'}`);
      scan.results.subdomains = [];
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

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
      scan.errors?.push(`Reverse IP: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.sqlinjection) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Testing SQL injection';
      updateScan(scan);
      const result = await performSQLScan(config.target);
      scan.results.sqlinjection = result;
      console.log('[SQL Injection] ✓ Success');
    } catch (error: any) {
      console.error('[SQL Injection] ✗ Error:', error);
      scan.errors?.push(`SQL Injection: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.xss) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Testing XSS vulnerabilities';
      updateScan(scan);
      const result = await performXSSScan(config.target);
      scan.results.xss = result;
      console.log('[XSS] ✓ Success');
    } catch (error: any) {
      console.error('[XSS] ✗ Error:', error);
      scan.errors?.push(`XSS: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  if (config.lfi) {
    if (await checkScanControl(scan.id)) return;
    try {
      scan.progress.stage = 'Testing Local File Inclusion';
      updateScan(scan);
      const result = await performLFIScan(config.target, requestManager);
      scan.results.lfi = result;
      console.log('[LFI] ✓ Success');
    } catch (error: any) {
      console.error('[LFI] ✗ Error:', error);
      scan.errors?.push(`LFI: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

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
      scan.errors?.push(`WordPress: ${error.message}`);
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
      scan.errors?.push(`SEO: ${error.message}`);
    } finally {
      completed++;
      scan.progress.current = completed;
      updateScan(scan);
    }
  }

  const finalController = scanControllers.get(scan.id);
  if (finalController?.stopped) {
    scan.status = 'stopped';
  } else {
    scan.status = 'completed';
  }
  
  scan.completedAt = new Date().toISOString();
  if (scan.startedAt) {
    scan.elapsedMs = Date.now() - new Date(scan.startedAt).getTime();
  }
  scan.progress.stage = scan.status === 'stopped' ? 'Scan stopped' : 'Scan complete';
  updateScan(scan);
  
  const successCount = tasks.length - (scan.errors?.length || 0);
  console.log(`[Scan ${scan.id}] ${scan.status}: ${successCount}/${tasks.length} modules successful`);
};

export const deleteScan = (id: string) => {
  console.log(`[Delete Scan] Removing scan ${id}`);
  scansCache = scansCache.filter(s => s.id !== id);
  saveScansToStorage(scansCache);
  scanControllers.delete(id);
};