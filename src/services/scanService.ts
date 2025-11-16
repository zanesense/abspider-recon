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
import { performDDoSFirewallTest, DDoSFirewallResult } from './ddosFirewallService'; // New import
import { getSettings, saveSettings } from './settingsService';
import { setProxyList } from './apiUtils';
import { sendDiscordWebhook } from './webhookService';
import { createRequestManager, RequestManager } from './requestManager';

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
  ddosFirewall: boolean; // New config option
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
  ddosFirewall?: DDoSFirewallResult; // New result type
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

// Modified updateScan to accept a full Scan object
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
  let newScan: Scan = { // Use let to allow reassigning the entire object
    id,
    target: config.target,
    timestamp: Date.now(),
    status: 'running',
    progress: { current: 0, total: 0, stage: 'Initializing' },
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
  const modulesToRun = Object.keys(config).filter(key => (config as any)[key] === true && key !== 'target' && key !== 'useProxy' && key !== 'threads');
  const totalStages = modulesToRun.length;
  let completedStages = 0;

  const settings = getSettings();
  setProxyList(config.useProxy ? settings.proxyList.split('\n').map(p => p.trim()).filter(Boolean) : []);
  requestManager.setMinRequestInterval(1000 / config.threads); // Adjust interval based on threads

  // Get the initial scan object from cache. This will be the mutable object for this run.
  let currentScan = getScanById(scanId)!; 

  try {
    for (const moduleName of modulesToRun) {
      if (scanController.signal.aborted) {
        throw new Error('Scan aborted by user');
      }

      completedStages++;
      // Update progress and persist the currentScan object
      currentScan = {
        ...currentScan,
        progress: {
          current: completedStages,
          total: totalStages,
          stage: `Running ${moduleName} scan`,
        },
      };
      updateScan(currentScan); // Persist the updated currentScan

      console.log(`[ScanService] Running module: ${moduleName}`);

      try {
        let moduleResult: any;
        switch (moduleName) {
          case 'siteInfo':
            moduleResult = await performSiteInfoScan(config.target);
            currentScan.results.siteInfo = moduleResult;
            break;
          case 'headers':
            moduleResult = await performFullHeaderAnalysis(config.target, config.useProxy);
            currentScan.results.headers = moduleResult;
            break;
          case 'whois':
            moduleResult = await performWhoisLookup(config.target);
            currentScan.results.whois = moduleResult;
            break;
          case 'geoip':
            moduleResult = await performGeoIPLookup(config.target);
            currentScan.results.geoip = moduleResult;
            break;
          case 'dns':
            moduleResult = await performDNSLookup(config.target);
            currentScan.results.dns = moduleResult;
            break;
          case 'mx':
            moduleResult = await performMXLookup(config.target);
            currentScan.results.mx = moduleResult;
            break;
          case 'subnet':
            const ipForSubnet = currentScan.results.siteInfo?.ip || 
                                  currentScan.results.geoip?.ip || 
                                  currentScan.results.dns?.records.A[0]?.value;
            if (ipForSubnet) {
              moduleResult = calculateSubnet(ipForSubnet, 24); // Default to /24
              currentScan.results.subnet = moduleResult;
            } else {
              currentScan.errors.push('Subnet scan skipped: IP address not available from SiteInfo, GeoIP, or DNS.');
            }
            break;
          case 'ports':
            moduleResult = await scanCommonPorts(config.target, config.threads);
            currentScan.results.ports = moduleResult;
            break;
          case 'subdomains':
            moduleResult = await enumerateSubdomains(config.target, config.threads, scanController);
            currentScan.results.subdomains = moduleResult;
            break;
          case 'reverseip':
            moduleResult = await performReverseIPLookup(config.target);
            currentScan.results.reverseip = moduleResult;
            break;
          case 'sqlinjection':
            moduleResult = await performSQLScan(config.target);
            currentScan.results.sqlinjection = moduleResult;
            break;
            case 'xss':
              moduleResult = await performXSSScan(config.target);
              currentScan.results.xss = moduleResult;
              break;
            case 'lfi':
              moduleResult = await performLFIScan(config.target, requestManager);
              currentScan.results.lfi = moduleResult;
              break;
            case 'wordpress':
              moduleResult = await performWordPressScan(config.target);
              currentScan.results.wordpress = moduleResult;
              break;
            case 'seo':
              moduleResult = await performSEOAnalysis(config.target);
              currentScan.results.seo = moduleResult;
              break;
            case 'ddosFirewall': // New module case
              moduleResult = await performDDoSFirewallTest(config.target, 20, 100, requestManager);
              currentScan.results.ddosFirewall = moduleResult;
              break;
            default:
              console.warn(`[ScanService] Unknown module: ${moduleName}`);
          }
          // After successfully running a module, persist the updated currentScan object
          updateScan(currentScan);

        } catch (moduleError: any) {
          console.error(`[ScanService] Error in ${moduleName} module:`, moduleError);
          currentScan.errors.push(`${moduleName}: ${moduleError.message}`);
          updateScan(currentScan); // Persist errors
        }
      }

      currentScan = {
        ...currentScan,
        status: 'completed',
        progress: { current: totalStages, total: totalStages, stage: 'Scan Completed' },
        elapsedMs: Date.now() - startTime,
        completedAt: Date.now(),
      };
      updateScan(currentScan);
      console.log(`[ScanService] Scan ${scanId} completed successfully.`);

      // Removed: Automatic Discord webhook notification
      // try {
      //   await sendDiscordWebhook(currentScan);
      // } catch (webhookError) {
      //   console.error('[ScanService] Failed to send Discord webhook:', webhookError);
      //   currentScan.errors.push(`Discord Webhook: ${ (webhookError as Error).message}`);
      //   updateScan(currentScan);
      // }

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
    scanEntry.controller.abort(); // Abort current fetch operations
    // Mark scan as paused in cache
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

  // Create a new controller and restart the scan logic
  const newController = new AbortController();
  const requestManager = createRequestManager(newController);
  activeScans.set(id, { controller: newController, promise: Promise.resolve(), requestManager });

  scansCache = scansCache.map(s =>
    s.id === id ? { ...s, status: 'running', progress: { ...s.progress!, stage: 'Resuming' } } : s
  );
  saveScansToStorage(scansCache);

  console.log(`[ScanService] Resuming scan ${id}.`);
  // Re-run the scan from scratch or implement more complex state-based resumption
  // For simplicity, we'll re-run the entire scan. A more advanced implementation
  // would save and restore the exact state of the scan.
  await startScan(scan.config);
};

export const stopScan = (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort(); // Abort all ongoing requests
    scanEntry.requestManager.abortAll(); // Abort requests managed by the request manager
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