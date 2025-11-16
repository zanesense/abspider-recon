import { v4 as uuidv4 } from 'uuid';
import { performSiteInfoScan, SiteInfo } from './siteInfoService';
import { performFullHeaderAnalysis, HeaderAnalysisResult } from './headerService';
import { performWhoisLookup, WhoisResult } from './whoisService';
import { performGeoIPLookup, GeoIPResult } from './geoipService';
import { performDNSLookup, DNSLookupResult } from './dnsService';
import { performMXLookup, MXLookupResult } from './mxService';
import { calculateSubnet, SubnetInfo } from './subnetService';
import { scanCommonPorts, PortResult } from './portService';
import { enumerateSubdomains, SubdomainResult } from './subdomainService';
import { performReverseIPLookup, ReverseIPResult } from './reverseIPService';
import { performSQLScan, SQLScanResult } from './sqlScanService';
import { performXSSScan, XSSScanResult } from './xssScanService';
import { performLFIScan, LFIScanResult } from './lfiScanService';
import { performWordPressScan, WordPressScanResult } from './wordpressService';
import { performSEOAnalysis, SEOAnalysis } from './seoService';
import { performDDoSFirewallTest, DDoSFirewallResult } from './ddosFirewallService';
import { getSettings, saveSettings } from './settingsService';
import { setProxyList } from './apiUtils';
import { sendDiscordWebhook } from './webhookService';
import { createRequestManager, RequestManager } from './requestManager';
import { getAPIKeys, APIKeys } from './apiKeyService';
import { calculateSecurityGrade } from './securityGradingService'; // Import the new service

export interface ScanConfig {
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
  ddosFirewall: boolean;
  xssPayloads: number;
  sqliPayloads: number;
  lfiPayloads: number;
  ddosRequests: number;
  useProxy: boolean;
  threads: number;
}

export interface ScanResults {
  siteInfo?: SiteInfo;
  headers?: HeaderAnalysisResult;
  whois?: WhoisResult;
  geoip?: GeoIPResult;
  dns?: DNSLookupResult;
  mx?: MXLookupResult;
  subnet?: SubnetInfo;
  ports?: PortResult[];
  subdomains?: SubdomainResult;
  reverseip?: ReverseIPResult;
  sqlinjection?: SQLScanResult;
  xss?: XSSScanResult;
  lfi?: LFIScanResult;
  wordpress?: WordPressScanResult;
  seo?: SEOAnalysis;
  ddosFirewall?: DDoSFirewallResult;
}

export interface Scan {
  id: string;
  target: string;
  timestamp: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
  config: ScanConfig;
  results: ScanResults;
  errors: string[];
  elapsedMs?: number;
  completedAt?: number;
  securityGrade?: number; // New field for security grade
}

const SCAN_STORAGE_KEY = 'abspider-scan-history';
let scansCache: Scan[] = loadScansFromStorage();
const activeScans = new Map<string, { controller: AbortController; promise: Promise<void>; requestManager: RequestManager }>();

function loadScansFromStorage(): Scan[] {
  try {
    const stored = localStorage.getItem(SCAN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load scans from storage:', error);
    return [];
  }
}

function saveScansToStorage(scans: Scan[]) {
  try {
    localStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(scans));
  } catch (error) {
    console.error('Failed to save scans to localStorage:', error);
    throw new Error('Failed to save scan data. Local storage might be full or inaccessible.');
  }
}

function updateScan(scanToUpdate: Scan) {
  try {
    scansCache = scansCache.map(scan =>
      scan.id === scanToUpdate.id ? scanToUpdate : scan
    );
    saveScansToStorage(scansCache);
  } catch (error) {
    console.error('Failed to save scans to storage:', error);
  }
}

export const getScanHistory = (): Scan[] => {
  return scansCache;
};

export const getScanById = (id: string): Scan | undefined => {
  return scansCache.find(scan => scan.id === id);
};

export const startScan = async (config: ScanConfig): Promise<string> => {
  const id = uuidv4();
  let newScan: Scan = {
    id,
    target: config.target,
    timestamp: Date.now(),
    status: 'running',
    progress: {
      current: 0,
      total: Object.keys(config).filter(key => (config as any)[key] === true && 
        !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests'].includes(key)).length
    , stage: 'Initializing' },
    config,
    results: {},
    errors: [],
  };

  try {
    scansCache = [newScan, ...scansCache];
    saveScansToStorage(scansCache);
  } catch (error: any) {
    throw new Error(`Failed to initialize scan: ${error.message}`);
  }

  const scanController = new AbortController();
  const requestManager = createRequestManager(scanController);
  
  const scanPromise = runScan(id, config, scanController, requestManager);
  activeScans.set(id, { controller: scanController, promise: scanPromise, requestManager });

  return id;
};

const runScan = async (
  scanId: string,
  config: ScanConfig,
  scanController: AbortController,
  requestManager: RequestManager
) => {
  const startTime = Date.now();
  const modulesToRun = Object.keys(config).filter(key => (config as any)[key] === true && 
    !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests'].includes(key));
  const totalStages = modulesToRun.length;
  let completedStages = 0;

  const settings = getSettings();
  setProxyList(config.useProxy ? settings.proxyList.split('\n').map(p => p.trim()).filter(Boolean) : []);
  requestManager.setMinRequestInterval(Math.max(20, 1000 / config.threads)); 

  let currentScan = getScanById(scanId)!; 

  let apiKeys: APIKeys = {};
  try {
    apiKeys = await getAPIKeys();
    console.log('[ScanService] API keys loaded for scan:', Object.keys(apiKeys).filter(k => (apiKeys as any)[k]).join(', '));
  } catch (error) {
    console.error('[ScanService] Failed to load API keys for scan:', error);
    currentScan.errors.push(`Failed to load API keys: ${(error as Error).message}`);
    updateScan(currentScan);
  }

  try {
    for (const moduleName of modulesToRun) {
      if (scanController.signal.aborted) {
        throw new Error('Scan aborted by user');
      }

      completedStages++;
      currentScan = {
        ...currentScan,
        progress: {
          current: completedStages,
          total: totalStages,
          stage: `Running ${moduleName} scan`,
        },
      };
      updateScan(currentScan);

      console.log(`[ScanService] Running module: ${moduleName}`);

      try {
        let moduleResult: any;
        switch (moduleName) {
          case 'siteInfo':
            moduleResult = await performSiteInfoScan(config.target, requestManager, apiKeys);
            currentScan.results.siteInfo = moduleResult;
            break;
          case 'headers':
            moduleResult = await performFullHeaderAnalysis(config.target, requestManager);
            currentScan.results.headers = moduleResult;
            break;
          case 'whois':
            moduleResult = await performWhoisLookup(config.target, requestManager, apiKeys);
            currentScan.results.whois = moduleResult;
            break;
          case 'geoip':
            moduleResult = await performGeoIPLookup(config.target, requestManager, apiKeys);
            currentScan.results.geoip = moduleResult;
            break;
          case 'dns':
            moduleResult = await performDNSLookup(config.target, requestManager);
            currentScan.results.dns = moduleResult;
            break;
          case 'mx':
            moduleResult = await performMXLookup(config.target, requestManager);
            currentScan.results.mx = moduleResult;
            break;
          case 'subnet':
            const ipForSubnet = currentScan.results.siteInfo?.ip || 
                                  currentScan.results.geoip?.ip || 
                                  currentScan.results.dns?.records.A[0]?.value;
            if (ipForSubnet) {
              moduleResult = calculateSubnet(ipForSubnet, 24);
              currentScan.results.subnet = moduleResult;
            } else {
              currentScan.errors.push('Subnet scan skipped: IP address not available from SiteInfo, GeoIP, or DNS.');
            }
            break;
          case 'ports':
            moduleResult = await scanCommonPorts(config.target, config.threads, requestManager, apiKeys);
            currentScan.results.ports = moduleResult;
            break;
          case 'subdomains':
            moduleResult = await enumerateSubdomains(config.target, config.threads, scanController, requestManager, apiKeys);
            currentScan.results.subdomains = moduleResult;
            break;
          case 'reverseip':
            moduleResult = await performReverseIPLookup(config.target, requestManager);
            currentScan.results.reverseip = moduleResult;
            break;
          case 'sqlinjection':
            moduleResult = await performSQLScan(config.target, requestManager, config.sqliPayloads);
            currentScan.results.sqlinjection = moduleResult;
            break;
            case 'xss':
              moduleResult = await performXSSScan(config.target, requestManager, config.xssPayloads);
              currentScan.results.xss = moduleResult;
              break;
            case 'lfi':
              moduleResult = await performLFIScan(config.target, requestManager, config.lfiPayloads);
              currentScan.results.lfi = moduleResult;
              break;
            case 'wordpress':
              moduleResult = await performWordPressScan(config.target, requestManager);
              currentScan.results.wordpress = moduleResult;
              break;
            case 'seo':
              moduleResult = await performSEOAnalysis(config.target, requestManager);
              currentScan.results.seo = moduleResult;
              break;
            case 'ddosFirewall':
              moduleResult = await performDDoSFirewallTest(config.target, config.ddosRequests, 100, requestManager);
              currentScan.results.ddosFirewall = moduleResult;
              break;
            default:
              console.warn(`[ScanService] Unknown module: ${moduleName}`);
          }
          updateScan(currentScan);

        } catch (moduleError: any) {
          console.error(`[ScanService] Error in ${moduleName} module:`, moduleError);
          currentScan.errors.push(`${moduleName}: ${moduleError.message}`);
          updateScan(currentScan);
        }
      }

      // Calculate security grade after all modules have run
      currentScan.securityGrade = calculateSecurityGrade(currentScan);

      currentScan = {
        ...currentScan,
        status: 'completed',
        progress: { current: totalStages, total: totalStages, stage: 'Scan Completed' },
        elapsedMs: Date.now() - startTime,
        completedAt: Date.now(),
      };
      updateScan(currentScan);
      console.log(`[ScanService] Scan ${scanId} completed successfully. Security Grade: ${currentScan.securityGrade}`);

    } catch (error: any) {
      console.error(`[ScanService] Scan ${scanId} failed:`, error);
      currentScan = {
        ...currentScan,
        status: 'failed',
        errors: [...currentScan.errors, error.message],
        elapsedMs: Date.now() - startTime,
        completedAt: Date.now(),
      };
      updateScan(currentScan);
    } finally {
      activeScans.delete(scanId);
    }
  };

export const pauseScan = (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort();
    scansCache = scansCache.map(scan =>
      scan.id === id ? { ...scan, status: 'paused', progress: { ...scan.progress!, stage: 'Paused' } } : scan
    );
    saveScansToStorage(scansCache);
    console.log(`[ScanService] Scan ${id} paused.`);
  }
};

export const resumeScan = async (id: string) => {
  const scan = getScanById(id);
  if (!scan || scan.status !== 'paused') {
    console.warn(`[ScanService] Cannot resume scan ${id}: not found or not paused.`);
    return;
  }

  const newController = new AbortController();
  const requestManager = createRequestManager(newController);
  activeScans.set(id, { controller: newController, promise: Promise.resolve(), requestManager });

  scansCache = scansCache.map(s =>
    s.id === id ? { ...s, status: 'running', progress: { ...s.progress!, stage: 'Resuming' } } : s
  );
  saveScansToStorage(scansCache);

  console.log(`[ScanService] Resuming scan ${id}.`);
  await startScan(scan.config);
};

export const stopScan = (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort();
    scanEntry.requestManager.abortAll();
    activeScans.delete(id);
    scansCache = scansCache.map(scan =>
      scan.id === id ? { ...scan, status: 'failed', errors: [...scan.errors, 'Scan stopped by user'], elapsedMs: Date.now() - scan.timestamp, completedAt: Date.now() } : scan
    );
    saveScansToStorage(scansCache);
    console.log(`[ScanService] Scan ${id} stopped.`);
  }
};

export const deleteScan = async (id: string): Promise<void> => {
  console.log(`[Delete Scan] Deleting scan ${id}`);
  const index = scansCache.findIndex(s => s.id === id);
  if (index !== -1) {
    scansCache.splice(index, 1);
    saveScansToStorage(scansCache);
  } else {
    throw new Error('Scan not found');
  }
};