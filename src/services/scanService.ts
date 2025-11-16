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
  const newScan: Scan = {
    id,
    target: config.target,
    timestamp: Date.now(),
    status: 'running',
    progress: { current: 0, total: 0, stage: 'Initializing' },
    config,
    results: {},
    errors: [],
  };

  scansCache = [newScan, ...scansCache];
  saveScansToStorage(scansCache);

  const scanController = new AbortController();
  const requestManager = createRequestManager(scanController);
  activeScans.set(id, { controller: scanController, promise: Promise.resolve(), requestManager });

  const updateScan = (updates: Partial<Scan>) => {
    scansCache = scansCache.map(scan =>
      scan.id === id ? { ...scan, ...updates } : scan
    );
    saveScansToStorage(scansCache);
  };

  const runScan = async () => {
    const startTime = Date.now();
    const modulesToRun = Object.keys(config).filter(key => (config as any)[key] === true && key !== 'target' && key !== 'useProxy' && key !== 'threads');
    const totalStages = modulesToRun.length;
    let completedStages = 0;

    const settings = getSettings();
    setProxyList(config.useProxy ? settings.proxyList.split('\n').map(p => p.trim()).filter(Boolean) : []);
    requestManager.setMinRequestInterval(1000 / config.threads); // Adjust interval based on threads

    try {
      for (const moduleName of modulesToRun) {
        if (scanController.signal.aborted) {
          throw new Error('Scan aborted by user');
        }

        completedStages++;
        updateScan({
          progress: {
            current: completedStages,
            total: totalStages,
            stage: `Running ${moduleName} scan`,
          },
        });

        console.log(`[ScanService] Running module: ${moduleName}`);

        try {
          let moduleResult: any;
          switch (moduleName) {
            case 'siteInfo':
              moduleResult = await performSiteInfoScan(config.target);
              updateScan({ results: { ...newScan.results, siteInfo: moduleResult } });
              break;
            case 'headers':
              moduleResult = await performFullHeaderAnalysis(config.target, config.useProxy);
              updateScan({ results: { ...newScan.results, headers: moduleResult } });
              break;
            case 'whois':
              moduleResult = await performWhoisLookup(config.target);
              updateScan({ results: { ...newScan.results, whois: moduleResult } });
              break;
            case 'geoip':
              moduleResult = await performGeoIPLookup(config.target);
              updateScan({ results: { ...newScan.results, geoip: moduleResult } });
              break;
            case 'dns':
              moduleResult = await performDNSLookup(config.target);
              updateScan({ results: { ...newScan.results, dns: moduleResult } });
              break;
            case 'mx':
              moduleResult = await performMXLookup(config.target);
              updateScan({ results: { ...newScan.results, mx: moduleResult } });
              break;
            case 'subnet':
              // Subnet scan requires an IP, which might come from GeoIP or DNS
              if (newScan.results.geoip?.ip) {
                moduleResult = calculateSubnet(newScan.results.geoip.ip, 24); // Default to /24
                updateScan({ results: { ...newScan.results, subnet: moduleResult } });
              } else {
                newScan.errors.push('Subnet scan skipped: IP address not available from GeoIP/DNS.');
              }
              break;
            case 'ports':
              moduleResult = await scanCommonPorts(config.target, config.threads);
              updateScan({ results: { ...newScan.results, ports: moduleResult } });
              break;
            case 'subdomains':
              moduleResult = await enumerateSubdomains(config.target, config.threads, scanController);
              updateScan({ results: { ...newScan.results, subdomains: moduleResult } });
              break;
            case 'reverseip':
              moduleResult = await performReverseIPLookup(config.target);
              updateScan({ results: { ...newScan.results, reverseip: moduleResult } });
              break;
            case 'sqlinjection':
              moduleResult = await performSQLScan(config.target);
              updateScan({ results: { ...newScan.results, sqlinjection: moduleResult } });
              break;
            case 'xss':
              moduleResult = await performXSSScan(config.target);
              updateScan({ results: { ...newScan.results, xss: moduleResult } });
              break;
            case 'lfi':
              moduleResult = await performLFIScan(config.target, requestManager);
              updateScan({ results: { ...newScan.results, lfi: moduleResult } });
              break;
            case 'wordpress':
              moduleResult = await performWordPressScan(config.target);
              updateScan({ results: { ...newScan.results, wordpress: moduleResult } });
              break;
            case 'seo':
              moduleResult = await performSEOAnalysis(config.target);
              updateScan({ results: { ...newScan.results, seo: moduleResult } });
              break;
            default:
              console.warn(`[ScanService] Unknown module: ${moduleName}`);
          }
        } catch (moduleError: any) {
          console.error(`[ScanService] Error in ${moduleName} module:`, moduleError);
          updateScan({ errors: [...newScan.errors, `${moduleName}: ${moduleError.message}`] });
        }
      }

      updateScan({
        status: 'completed',
        progress: { current: totalStages, total: totalStages, stage: 'Scan Completed' },
        elapsedMs: Date.now() - startTime,
        completedAt: Date.now(),
      });
      console.log(`[ScanService] Scan ${id} completed successfully.`);

      // Send Discord webhook notification if configured
      try {
        const currentScan = getScanById(id);
        if (currentScan) {
          await sendDiscordWebhook(currentScan);
        }
      } catch (webhookError) {
        console.error('[ScanService] Failed to send Discord webhook:', webhookError);
        updateScan({ errors: [...newScan.errors, `Discord Webhook: ${ (webhookError as Error).message}`] });
      }

    } catch (error: any) {
      console.error(`[ScanService] Scan ${id} failed:`, error);
      updateScan({
        status: 'failed',
        errors: [...newScan.errors, error.message],
        elapsedMs: Date.now() - startTime,
        completedAt: Date.now(),
      });
    } finally {
      activeScans.delete(id);
    }
  };

  const scanPromise = runScan();
  activeScans.set(id, { controller: scanController, promise: scanPromise, requestManager });

  return id;
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