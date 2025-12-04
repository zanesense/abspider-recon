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
import { performVirusTotalScan, VirusTotalResult } from './virustotalService';
import { performSslTlsAnalysis, SslTlsResult } from './sslTlsService';
import { performTechStackFingerprinting, TechStackResult } from './techStackService';
import { performBrokenLinkCheck, BrokenLinkResult } from './brokenLinkService';
import { performCorsMisconfigScan, CorsMisconfigResult } from './corsMisconfigService';
import { getSettings } from './settingsService';
import { setProxyList } from './apiUtils';
import { sendDiscordWebhook } from './webhookService';
import { createRequestManager, RequestManager } from './requestManager';
import { getAPIKeys, APIKeys } from './apiKeyService';
import { calculateSecurityGrade } from './securityGradingService';
import { startScheduledScanChecker } from './scheduledScanService';
import { supabase } from '@/SupabaseClient';

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
  virustotal: boolean;
  sslTls: boolean;
  techStack: boolean;
  brokenLinks: boolean;
  corsMisconfig: boolean;
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
  virustotal?: VirusTotalResult;
  sslTls?: SslTlsResult;
  techStack?: TechStackResult;
  brokenLinks?: BrokenLinkResult;
  corsMisconfig?: CorsMisconfigResult;
}

export interface Scan {
  id: string;
  user_id: string;
  target: string;
  timestamp: number;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'stopped';
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
  securityGrade?: number;
  throttleLevel: number; // Added throttleLevel
}

interface ScanDbRow {
  scan_id: string;
  user_id: string;
  target: string;
  timestamp: number;
  status: string;
  progress?: any;
  config: any;
  results: any;
  errors: string[];
  elapsed_ms?: number;
  completed_at?: number;
  security_grade?: number;
  throttle_level: number; // Added throttle_level
}

const toScanDbRow = (scan: Scan): ScanDbRow => ({
  scan_id: scan.id,
  user_id: scan.user_id,
  target: scan.target,
  timestamp: scan.timestamp,
  status: scan.status,
  progress: scan.progress,
  config: scan.config,
  results: scan.results,
  errors: scan.errors,
  elapsed_ms: scan.elapsedMs,
  completed_at: scan.completedAt,
  security_grade: scan.securityGrade,
  throttle_level: scan.throttleLevel, // Map to DB column
});

const fromScanDbRow = (row: ScanDbRow): Scan => ({
  id: row.scan_id,
  user_id: row.user_id,
  target: row.target,
  timestamp: row.timestamp,
  status: row.status as 'running' | 'completed' | 'failed' | 'paused' | 'stopped',
  progress: row.progress,
  config: row.config,
  results: row.results,
  errors: row.errors,
  elapsedMs: row.elapsed_ms,
  completedAt: row.completed_at,
  securityGrade: row.security_grade,
  throttleLevel: row.throttle_level, // Map from DB column
});


const activeScans = new Map<string, { controller: AbortController; promise: Promise<void>; requestManager: RequestManager }>();

const upsertScanToDatabase = async (scan: Scan) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) {
    throw new Error('No active user session to save scan.');
  }

  const scanDbRow = toScanDbRow(scan);

  const { error } = await supabase
    .from('user_scans')
    .upsert(scanDbRow, { onConflict: 'scan_id' });

  if (error) {
    console.error('[ScanService] Failed to upsert scan to Supabase:', error);
    throw new Error(`Failed to save scan: ${error.message}`);
  }
};

export const getScanHistory = async (): Promise<Scan[]> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) {
    console.warn('[ScanService] No active session, returning empty scan history.');
    return [];
  }

  const { data, error } = await supabase
    .from('user_scans')
    .select('*')
    .eq('user_id', session.user.id)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('[ScanService] Failed to fetch scan history from Supabase:', error);
    throw new Error(`Failed to load scan history: ${error.message}`);
  }

  return data.map(fromScanDbRow);
};

export const getScanById = async (id: string): Promise<Scan | undefined> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) {
    console.warn('[ScanService] No active session, cannot retrieve scan by ID.');
    return undefined;
  }

  const { data, error } = await supabase
    .from('user_scans')
    .select('*')
    .eq('scan_id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[ScanService] Failed to fetch scan by ID from Supabase:', error);
    throw new Error(`Failed to load scan: ${error.message}`);
  }

  return data ? fromScanDbRow(data) : undefined;
};

export const startScan = async (config: ScanConfig): Promise<string> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) {
    throw new Error('User not authenticated. Cannot start scan.');
  }

  const id = uuidv4();
  let newScan: Scan = {
    id,
    user_id: session.user.id,
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
    throttleLevel: 0, // Initialize throttle level
  };

  try {
    await upsertScanToDatabase(newScan);
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
  let currentScan = (await getScanById(scanId))!;

  const modulesToRun = Object.keys(config).filter(key => (config as any)[key] === true && 
    !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests'].includes(key));
  const totalStages = modulesToRun.length;
  let completedStages = currentScan.progress?.current || 0;

  const settings = await getSettings();
  setProxyList(config.useProxy ? settings.proxyList.split('\n').map(p => p.trim()).filter(Boolean) : []);
  
  // Set initial minRequestInterval based on configured threads
  requestManager.adjustMinRequestInterval(1000 / config.threads); 

  let apiKeys: APIKeys = {};
  try {
    apiKeys = await getAPIKeys();
    console.log('[ScanService] API keys loaded for scan:', Object.keys(apiKeys).filter(k => (apiKeys as any)[k]).join(', '));
  } catch (error) {
    console.error('[ScanService] Failed to load API keys for scan:', error);
    currentScan.errors.push(`Failed to load API keys: ${(error as Error).message}`);
    await upsertScanToDatabase(currentScan);
  }

  // Dynamic throttling parameters
  const THROTTLE_RESPONSE_TIME_HIGH = 2000; // ms
  const THROTTLE_RESPONSE_TIME_LOW = 500; // ms
  const THROTTLE_ERROR_RATE_HIGH = 15; // %
  const THROTTLE_ERROR_RATE_LOW = 5; // %

  const MAX_PAYLOADS_SQLI = 51;
  const MAX_PAYLOADS_XSS = 50;
  const MAX_PAYLOADS_LFI = 65;
  const MAX_DDOS_REQUESTS = 100;

  // Local copies of config values that can be adjusted dynamically
  let currentSqliPayloads = config.sqliPayloads;
  let currentXssPayloads = config.xssPayloads;
  let currentLfiPayloads = config.lfiPayloads;
  let currentDdosRequests = config.ddosRequests;

  // Function to apply throttling adjustments
  const applyThrottling = async () => {
    const metrics = requestManager.getPerformanceMetrics();
    if (metrics.totalRequests < requestManager.metricsBufferSize / 2) {
      // Not enough data to make informed decisions yet
      return;
    }

    let newThrottleLevel = currentScan.throttleLevel;
    let changed = false;

    // Increase throttling if performance is poor
    if (metrics.avgResponseTime > THROTTLE_RESPONSE_TIME_HIGH || metrics.errorRate > THROTTLE_ERROR_RATE_HIGH) {
      newThrottleLevel = Math.min(10, newThrottleLevel + 1); // Max throttle level 10
      changed = true;
    }
    // Decrease throttling if performance is good
    else if (metrics.avgResponseTime < THROTTLE_RESPONSE_TIME_LOW && metrics.errorRate < THROTTLE_ERROR_RATE_LOW) {
      newThrottleLevel = Math.max(0, newThrottleLevel - 1); // Min throttle level 0
      changed = true;
    }

    if (changed) {
      currentScan.throttleLevel = newThrottleLevel;
      console.log(`[ScanService] Adjusting throttle level to: ${newThrottleLevel}`);

      // Adjust request rate (minRequestInterval)
      // Higher throttleLevel means longer interval (slower requests)
      const intervalFactor = 1 + (newThrottleLevel * 0.2); // e.g., level 0 -> 1x, level 5 -> 2x, level 10 -> 3x
      requestManager.adjustMinRequestInterval(Math.max(50, (1000 / config.threads) * intervalFactor));

      // Adjust payload counts (reduce for higher throttle)
      const payloadReductionFactor = 1 - (newThrottleLevel * 0.05); // e.g., level 0 -> 1x, level 5 -> 0.75x, level 10 -> 0.5x
      currentSqliPayloads = Math.max(1, Math.floor(config.sqliPayloads * payloadReductionFactor));
      currentXssPayloads = Math.max(1, Math.floor(config.xssPayloads * payloadReductionFactor));
      currentLfiPayloads = Math.max(1, Math.floor(config.lfiPayloads * payloadReductionFactor));
      currentDdosRequests = Math.max(1, Math.floor(config.ddosRequests * payloadReductionFactor));
      
      // Update scan in DB to reflect new throttle level
      await upsertScanToDatabase(currentScan);
    }
  };

  try {
    for (let i = 0; i < modulesToRun.length; i++) {
      const moduleName = modulesToRun[i];

      if (i < completedStages) {
        console.log(`[ScanService] Skipping already completed module: ${moduleName}`);
        continue;
      }

      if (scanController.signal.aborted) {
        throw new Error('Scan execution aborted'); 
      }

      // Apply throttling before running each module
      await applyThrottling();

      completedStages++;
      currentScan = {
        ...currentScan,
        progress: {
          current: completedStages,
          total: totalStages,
          stage: `Running ${moduleName} scan`,
        },
      };
      await upsertScanToDatabase(currentScan);

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
            moduleResult = await performReverseIPLookup(config.target, requestManager, apiKeys);
            currentScan.results.reverseip = moduleResult;
            break;
          case 'sqlinjection':
            moduleResult = await performSQLScan(config.target, requestManager, currentSqliPayloads);
            currentScan.results.sqlinjection = moduleResult;
            break;
            case 'xss':
              moduleResult = await performXSSScan(config.target, requestManager, currentXssPayloads);
              currentScan.results.xss = moduleResult;
              break;
            case 'lfi':
              moduleResult = await performLFIScan(config.target, requestManager, currentLfiPayloads);
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
              moduleResult = await performDDoSFirewallTest(config.target, currentDdosRequests, requestManager.getMinRequestInterval(), requestManager);
              currentScan.results.ddosFirewall = moduleResult;
              break;
            case 'virustotal':
              moduleResult = await performVirusTotalScan(config.target, requestManager, apiKeys);
              currentScan.results.virustotal = moduleResult;
              break;
            case 'sslTls':
              moduleResult = await performSslTlsAnalysis(config.target, requestManager);
              currentScan.results.sslTls = moduleResult;
              break;
            case 'techStack':
              moduleResult = await performTechStackFingerprinting(config.target, requestManager);
              currentScan.results.techStack = moduleResult;
              break;
            case 'brokenLinks':
              moduleResult = await performBrokenLinkCheck(config.target, requestManager);
              currentScan.results.brokenLinks = moduleResult;
              break;
            case 'corsMisconfig':
              moduleResult = await performCorsMisconfigScan(config.target, requestManager);
              currentScan.results.corsMisconfig = moduleResult;
              break;
            default:
              console.warn(`[ScanService] Unknown module: ${moduleName}`);
          }
          await upsertScanToDatabase(currentScan);

        } catch (moduleError: any) {
          console.error(`[ScanService] Error in ${moduleName} module:`, moduleError);
          currentScan.errors.push(`${moduleName}: ${moduleError.message}`);
          await upsertScanToDatabase(currentScan);
        }
      }

      currentScan.securityGrade = calculateSecurityGrade(currentScan);

      currentScan = {
        ...currentScan,
        status: 'completed',
        progress: { current: totalStages, total: totalStages, stage: 'Scan Completed' },
        elapsedMs: Date.now() - currentScan.timestamp,
        completedAt: Date.now(),
      };
      await upsertScanToDatabase(currentScan);
      console.log(`[ScanService] Scan ${scanId} completed successfully. Security Grade: ${currentScan.securityGrade}`);

    } catch (error: any) {
      console.error(`[ScanService] Scan ${scanId} failed or was aborted:`, error);
      
      const latestScanState = await getScanById(scanId);
      
      if (latestScanState && latestScanState.status === 'stopped') {
        console.log(`[ScanService] Scan ${scanId} was explicitly stopped. Not overwriting status to 'failed'.`);
        throw error; 
      }

      currentScan = {
        ...currentScan,
        status: 'failed',
        errors: [...currentScan.errors, error.message],
        elapsedMs: Date.now() - currentScan.timestamp,
        completedAt: Date.now(),
      };
      await upsertScanToDatabase(currentScan);
    } finally {
      if (currentScan.status === 'completed' || currentScan.status === 'failed' || currentScan.status === 'stopped') {
        activeScans.delete(scanId);
      }
    }
  };

export const pauseScan = async (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort();
    const currentScan = (await getScanById(id))!;
    const updatedScan: Scan = { 
      ...currentScan, 
      status: 'paused', 
      progress: { ...currentScan.progress!, stage: 'Paused' },
      elapsedMs: Date.now() - currentScan.timestamp,
      completedAt: Date.now(),
    };
    await upsertScanToDatabase(updatedScan);
    console.log(`[ScanService] Scan ${id} paused.`);
  }
};

export const resumeScan = async (id: string) => {
  const scan = await getScanById(id);
  if (!scan || scan.status !== 'paused') {
    console.warn(`[ScanService] Cannot resume scan ${id}: not found or not paused.`);
    throw new Error('Cannot resume scan: not found or not paused.');
  }

  const newController = new AbortController();
  const newRequestManager = createRequestManager(newController);
  
  activeScans.set(id, { controller: newController, promise: Promise.resolve(), requestManager: newRequestManager });

  const updatedScan: Scan = { 
    ...scan, 
    status: 'running', 
    progress: { ...scan.progress!, stage: 'Resuming scan' },
  };
  await upsertScanToDatabase(updatedScan);

  console.log(`[ScanService] Resuming scan ${id}.`);
  await runScan(updatedScan.id, updatedScan.config, newController, newRequestManager);
};

export const stopScan = async (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort();
    scanEntry.requestManager.abortAll();
    activeScans.delete(id);
    
    const currentScan = (await getScanById(id))!;
    const updatedScan: Scan = { 
      ...currentScan, 
      status: 'stopped',
      errors: [...currentScan.errors, 'Scan stopped by user'], 
      elapsedMs: Date.now() - currentScan.timestamp, 
      completedAt: Date.now() 
    };
    await upsertScanToDatabase(updatedScan);
    console.log(`[ScanService] Scan ${id} stopped.`);
  }
};

export const deleteScan = async (id: string): Promise<void> => {
  console.log(`[Delete Scan] Deleting scan ${id}`);
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) {
    throw new Error('User not authenticated. Cannot delete scan.');
  }

  const { error } = await supabase
    .from('user_scans')
    .delete()
    .eq('scan_id', id)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('[ScanService] Failed to delete scan from Supabase:', error);
    throw new Error(`Failed to delete scan: ${error.message}`);
  }
};

export const deleteAllScans = async (): Promise<void> => {
  console.log(`[Delete All Scans] Deleting all scans for current user`);
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) {
    throw new Error('User not authenticated. Cannot delete all scans.');
  }

  const { error } = await supabase
    .from('user_scans')
    .delete()
    .eq('user_id', session.user.id);

  if (error) {
    console.error('[ScanService] Failed to delete all scans from Supabase:', error);
    throw new Error(`Failed to delete all scans: ${error.message}`);
  }
  console.log('[Delete All Scans] Successfully deleted all scans.');
};

export const cleanupStuckScans = async (): Promise<void> => {
  console.log('[ScanService] Cleaning up stuck scans...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    console.warn('[ScanService] No active session for cleanup, skipping stuck scan cleanup.');
    return;
  }

  try {
    const { data: activeScansInDb, error } = await supabase
      .from('user_scans')
      .select('scan_id, target, timestamp, status')
      .eq('user_id', session.user.id)
      .in('status', ['running', 'paused']);

    if (error) {
      console.error('[ScanService] Error fetching active scans for cleanup:', error);
      return;
    }

    if (activeScansInDb && activeScansInDb.length > 0) {
      for (const dbScan of activeScansInDb) {
        if (!activeScans.has(dbScan.scan_id)) {
          console.warn(`[ScanService] Detected stuck scan: ${dbScan.scan_id} (${dbScan.target}). Marking as failed.`);
          const stuckScan = await getScanById(dbScan.scan_id);
          if (stuckScan) {
            const updatedScan: Scan = {
              ...stuckScan,
              status: 'failed',
              errors: [...stuckScan.errors, 'Scan failed: Browser tab/window was closed unexpectedly.'],
              elapsedMs: Date.now() - stuckScan.timestamp,
              completedAt: Date.now(),
              throttleLevel: 0, // Reset throttle level on cleanup
            };
            await upsertScanToDatabase(updatedScan);
          }
        }
      }
    }
    console.log('[ScanService] Stuck scan cleanup complete.');
  } catch (error: any) {
    console.error('[ScanService] Unexpected error during stuck scan cleanup:', error.message);
  }
};

export const getRunningScanCount = (): number => {
  return activeScans.size;
};

startScheduledScanChecker();