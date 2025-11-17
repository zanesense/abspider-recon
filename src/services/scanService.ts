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
import { performVirusTotalScan, VirusTotalResult } from './virustotalService'; // New import
import { performSslTlsAnalysis, SslTlsResult } from './sslTlsService'; // New import
import { getSettings } from './settingsService'; // Import getSettings from Supabase-backed service
import { setProxyList } from './apiUtils';
import { sendDiscordWebhook } from './webhookService';
import { createRequestManager, RequestManager } from './requestManager';
import { getAPIKeys, APIKeys } from './apiKeyService';
import { calculateSecurityGrade } from './securityGradingService';
import { startScheduledScanChecker } from './scheduledScanService'; // Import the checker
import { supabase } from '@/SupabaseClient'; // Import supabase

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
}

export interface Scan {
  id: string; // Corresponds to scan_id in DB
  user_id: string; // New field for Supabase RLS
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
  elapsedMs?: number; // Mapped to elapsed_ms in DB
  completedAt?: number; // Mapped to completed_at in DB
  securityGrade?: number; // Mapped to security_grade in DB
}

// Map Scan interface to DB column names for Supabase interaction
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

// Helper to convert Scan object to DB row format
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

// Helper to convert DB row format to Scan object
const fromScanDbRow = (row: ScanDbRow): Scan => ({
  id: row.scan_id,
  user_id: row.user_id,
  target: row.target,
  timestamp: row.timestamp,
  status: row.status as 'running' | 'completed' | 'failed' | 'paused',
  progress: row.progress,
  config: row.config,
  results: row.results,
  errors: row.errors,
  elapsedMs: row.elapsed_ms,
  completedAt: row.completed_at,
  securityGrade: row.security_grade,
});


const activeScans = new Map<string, { controller: AbortController; promise: Promise<void>; requestManager: RequestManager }>();

// Function to upsert a scan to Supabase
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

  if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found', which is fine
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
    user_id: session.user.id, // Assign user_id
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
  const startTime = Date.now();
  const modulesToRun = Object.keys(config).filter(key => (config as any)[key] === true && 
    !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests'].includes(key));
  const totalStages = modulesToRun.length;
  let completedStages = 0;

  const settings = await getSettings(); // Fetch settings from Supabase
  setProxyList(config.useProxy ? settings.proxyList.split('\n').map(p => p.trim()).filter(Boolean) : []);
  requestManager.setMinRequestInterval(Math.max(20, 1000 / config.threads)); 

  let currentScan = (await getScanById(scanId))!; // Fetch current scan state from DB

  let apiKeys: APIKeys = {};
  try {
    apiKeys = await getAPIKeys();
    console.log('[ScanService] API keys loaded for scan:', Object.keys(apiKeys).filter(k => (apiKeys as any)[k]).join(', '));
  } catch (error) {
    console.error('[ScanService] Failed to load API keys for scan:', error);
    currentScan.errors.push(`Failed to load API keys: ${(error as Error).message}`);
    await upsertScanToDatabase(currentScan); // Save error to DB
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
      await upsertScanToDatabase(currentScan); // Save progress to DB

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
            case 'virustotal': // New module case
              moduleResult = await performVirusTotalScan(config.target, requestManager, apiKeys);
              currentScan.results.virustotal = moduleResult;
              break;
            case 'sslTls': // New module case
              moduleResult = await performSslTlsAnalysis(config.target, requestManager);
              currentScan.results.sslTls = moduleResult;
              break;
            default:
              console.warn(`[ScanService] Unknown module: ${moduleName}`);
          }
          await upsertScanToDatabase(currentScan); // Save module results to DB

        } catch (moduleError: any) {
          console.error(`[ScanService] Error in ${moduleName} module:`, moduleError);
          currentScan.errors.push(`${moduleName}: ${moduleError.message}`);
          await upsertScanToDatabase(currentScan); // Save error to DB
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
      await upsertScanToDatabase(currentScan); // Save final state to DB
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
      await upsertScanToDatabase(currentScan); // Save failed state to DB
    } finally {
      activeScans.delete(scanId);
    }
  };

export const pauseScan = async (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort();
    const currentScan = (await getScanById(id))!;
    const updatedScan = { ...currentScan, status: 'paused', progress: { ...currentScan.progress!, stage: 'Paused' } };
    await upsertScanToDatabase(updatedScan);
    console.log(`[ScanService] Scan ${id} paused.`);
  }
};

export const resumeScan = async (id: string) => {
  const scan = await getScanById(id);
  if (!scan || scan.status !== 'paused') {
    console.warn(`[ScanService] Cannot resume scan ${id}: not found or not paused.`);
    return;
  }

  const newController = new AbortController();
  const requestManager = createRequestManager(newController);
  activeScans.set(id, { controller: newController, promise: Promise.resolve(), requestManager });

  const updatedScan = { ...scan, status: 'running', progress: { ...scan.progress!, stage: 'Resuming' } };
  await upsertScanToDatabase(updatedScan);

  console.log(`[ScanService] Resuming scan ${id}.`);
  // Re-run the scan from its last known state
  await runScan(scan.id, scan.config, newController, requestManager);
};

export const stopScan = async (id: string) => {
  const scanEntry = activeScans.get(id);
  if (scanEntry) {
    scanEntry.controller.abort();
    scanEntry.requestManager.abortAll();
    activeScans.delete(id);
    const currentScan = (await getScanById(id))!;
    const updatedScan = { 
      ...currentScan, 
      status: 'failed', 
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

// Start the scheduled scan checker when the scan service is initialized
startScheduledScanChecker();