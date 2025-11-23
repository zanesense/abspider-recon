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
import { performTechStackFingerprinting, TechStackResult } from './techStackService'; // New import
import { performBrokenLinkCheck, BrokenLinkResult } from './brokenLinkService'; // New import
import { performCorsMisconfigScan, CorsMisconfigResult } from './corsMisconfigService'; // New import
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
  techStack: boolean; // New module
  brokenLinks: boolean; // New module
  corsMisconfig: boolean; // New module
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
  techStack?: TechStackResult; // New module
  brokenLinks?: BrokenLinkResult; // New module
  corsMisconfig?: CorsMisconfigResult; // New module
}

export interface Scan {
  id: string;
  user_id: string;
  target: string;
  timestamp: number;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'stopped'; // Added 'stopped'
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
});

const fromScanDbRow = (row: ScanDbRow): Scan => ({
  id: row.scan_id,
  user_id: row.user_id,
  target: row.target,
  timestamp: row.timestamp,
  status: row.status as 'running' | 'completed' | 'failed' | 'paused' | 'stopped', // Added 'stopped'
  progress: row.progress,
  config: row.config,
  results: row.results,
  errors: row.errors,
  elapsedMs: row.elapsed_ms,
  completedAt: row.completed_at,
  securityGrade: row.security_grade,
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
  let currentScan = (await getScanById(scanId))!; // Always fetch latest state

  const modulesToRun = Object.keys(config).filter(key => (config as any)[key] === true && 
    !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests'].includes(key));
  const totalStages = modulesToRun.length;
  let completedStages = currentScan.progress?.current || 0; // Start from where it left off

  const settings = await getSettings();
  setProxyList(config.useProxy ? settings.proxyList.split('\n').map(p => p.trim()).filter(Boolean) : []);
  requestManager.setMinRequestInterval(Math.max(20, 1000 / config.threads)); 

  let apiKeys: APIKeys = {};
  try {
    apiKeys = await getAPIKeys();
    console.log('[ScanService] API keys loaded for scan:', Object.keys(apiKeys).filter(k => (apiKeys as any)[k]).join(', '));
  } catch (error) {
    console.error('[ScanService] Failed to load API keys for scan:', error);
    currentScan.errors.push(`Failed to load API keys: ${(error as Error).message}`);
    await upsertScanToDatabase(currentScan);
  }

  try {
    for (let i = 0; i < modulesToRun.length; i++) {
      const moduleName = modulesToRun[i];

      // Skip modules that were already completed
      if (i < completedStages) {
        console.log(`[ScanService] Skipping already completed module: ${moduleName}`);
        continue;
      }

      if (scanController.signal.aborted) {
        // If aborted, the outer catch/finally will set status to 'paused' or 'stopped'
        throw new Error('Scan execution aborted'); 
      }

      completedStages++; // Increment for the module we are about to run
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
            case 'virustotal':
              moduleResult = await performVirusTotalScan(config.target, requestManager, apiKeys);
              currentScan.results.virustotal = moduleResult;
              break;
            case 'sslTls':
              moduleResult = await performSslTlsAnalysis(config.target, requestManager);
              currentScan.results.sslTls = moduleResult;
              break;
            case 'techStack': // New module execution
              moduleResult = await performTechStackFingerprinting(config.target, requestManager);
              currentScan.results.techStack = moduleResult;
              break;
            case 'brokenLinks': // New module execution
              moduleResult = await performBrokenLinkCheck(config.target, requestManager);
              currentScan.results.brokenLinks = moduleResult;
              break;
            case 'corsMisconfig': // New module execution
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
      
      // Fetch the latest scan state from DB to see if it was already handled by pause/stop
      const latestScanState = await getScanById(scanId);
      
      if (latestScanState && (latestScanState.status === 'paused' || latestScanState.status === 'failed' || latestScanState.status === 'stopped')) { // Added 'stopped'
        // Status already set by pauseScan or stopScan, do nothing further in this catch block
        console.log(`[ScanService] Scan ${scanId} status already handled by external action (${latestScanState.status}).`);
        // Re-throw the error so the promise chain correctly rejects, but don't modify DB status again.
        throw error; 
      }

      // If not already handled, then it's a genuine failure within runScan
      currentScan = {
        ...currentScan,
        status: 'failed', // Always 'failed' if it wasn't explicitly paused/stopped
        errors: [...currentScan.errors, error.message],
        elapsedMs: Date.now() - currentScan.timestamp,
        completedAt: Date.now(),
      };
      await upsertScanToDatabase(currentScan);
    } finally {
      // Only remove from activeScans if it's truly finished or failed, not just paused
      if (currentScan.status === 'completed' || currentScan.status === 'failed' || currentScan.status === 'stopped') { // Added 'stopped'
        activeScans.delete(scanId);
      }
    }
  };

export const pauseScan = async (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort(); // Abort the current execution
    const currentScan = (await getScanById(id))!;
    const updatedScan: Scan = { 
      ...currentScan, 
      status: 'paused', 
      progress: { ...currentScan.progress!, stage: 'Paused' },
      elapsedMs: Date.now() - currentScan.timestamp, // Capture elapsed time up to pause
      completedAt: Date.now(), // Update completedAt to reflect pause time
    };
    await upsertScanToDatabase(updatedScan);
    console.log(`[ScanService] Scan ${id} paused.`);
    // Do NOT delete from activeScans, so it can be resumed
  }
};

export const resumeScan = async (id: string) => {
  const scan = await getScanById(id);
  if (!scan || scan.status !== 'paused') {
    console.warn(`[ScanService] Cannot resume scan ${id}: not found or not paused.`);
    throw new Error('Cannot resume scan: not found or not paused.');
  }

  // Create a new controller and request manager for the resumed execution
  const newController = new AbortController();
  const newRequestManager = createRequestManager(newController);
  
  // Update activeScans map with the new controller and manager
  activeScans.set(id, { controller: newController, promise: Promise.resolve(), requestManager: newRequestManager });

  const updatedScan: Scan = { 
    ...scan, 
    status: 'running', 
    progress: { ...scan.progress!, stage: 'Resuming scan' },
    // Keep original timestamp, elapsedMs will be recalculated at completion
  };
  await upsertScanToDatabase(updatedScan);

  console.log(`[ScanService] Resuming scan ${id}.`);
  // Re-run the scan logic. It will pick up from where it left off based on `updatedScan.progress.current`.
  await runScan(updatedScan.id, updatedScan.config, newController, newRequestManager);
};

export const stopScan = async (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort(); // Abort the current execution
    scanEntry.requestManager.abortAll(); // Abort any pending requests
    activeScans.delete(id); // Remove from active scans
    
    const currentScan = (await getScanById(id))!;
    const updatedScan: Scan = { 
      ...currentScan, 
      status: 'stopped', // Changed from 'failed' to 'stopped'
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

  // Note: Supabase RLS should ensure only the user's own rows are deleted.
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

/**
 * Cleans up any scans that were marked as 'running' or 'paused' in the database
 * but are no longer active in the current browser session.
 * These scans are marked as 'failed'.
 */
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
      .select('scan_id, target, timestamp, status') // Also fetch status
      .eq('user_id', session.user.id)
      .in('status', ['running', 'paused']); // Only check running and paused

    if (error) {
      console.error('[ScanService] Error fetching active scans for cleanup:', error);
      return;
    }

    if (activeScansInDb && activeScansInDb.length > 0) {
      for (const dbScan of activeScansInDb) {
        if (!activeScans.has(dbScan.scan_id)) {
          // This scan is 'running' or 'paused' in DB but not active in current session -> it's stuck
          console.warn(`[ScanService] Detected stuck scan: ${dbScan.scan_id} (${dbScan.target}). Marking as failed.`);
          const stuckScan = await getScanById(dbScan.scan_id);
          if (stuckScan) {
            const updatedScan: Scan = {
              ...stuckScan,
              status: 'failed', // Always mark as failed if browser closed
              errors: [...stuckScan.errors, 'Scan failed: Browser tab/window was closed unexpectedly.'],
              elapsedMs: Date.now() - stuckScan.timestamp,
              completedAt: Date.now(),
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

/**
 * Returns the number of scans currently active in the browser session.
 */
export const getRunningScanCount = (): number => {
  return activeScans.size;
};

startScheduledScanChecker();