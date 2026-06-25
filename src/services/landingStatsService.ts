import { supabase } from '@/SupabaseClient';

export interface LandingStats {
  repositoryStars: number | null;
  repositoryForks: number | null;
  repositoryIssues: number | null;
  latestVersion: string | null;
  monthlyDownloads: number | null;
  totalScans: number | null;
  completedScans: number | null;
  totalFindings: number | null;
  avgScanTimeSeconds: number | null;
  lastUpdated: string | null;
}

const GITHUB_REPO_API = 'https://api.github.com/repos/zanesense/abspider-recon';
const NPM_DOWNLOADS_API = 'https://api.npmjs.org/downloads/point/last-month/abspider';
const NPM_PACKAGE_API = 'https://registry.npmjs.org/abspider/latest';
const CACHE_DURATION = 5 * 60 * 1000;

let cachedStats: LandingStats | null = null;
let cacheTimestamp = 0;

const emptyStats = (): LandingStats => ({
  repositoryStars: null,
  repositoryForks: null,
  repositoryIssues: null,
  latestVersion: null,
  monthlyDownloads: null,
  totalScans: null,
  completedScans: null,
  totalFindings: null,
  avgScanTimeSeconds: null,
  lastUpdated: null,
});

const fetchJson = async <T>(url: string, timeoutMs = 5000): Promise<T | null> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
};

const countFindings = (results: Record<string, any> | null | undefined): number => {
  if (!results) return 0;

  const countArray = (value: unknown) => Array.isArray(value) ? value.length : 0;

  return [
    countArray(results.sqlinjection?.vulnerabilities || results.sqlinjection?.findings),
    countArray(results.xss?.vulnerabilities || results.xss?.findings),
    countArray(results.lfi?.vulnerabilities || results.lfi?.findings),
    countArray(results.wordpress?.vulnerabilities),
    countArray(results.virustotal?.detectedUrls),
    results.corsMisconfig?.vulnerable ? 1 : 0,
    results.openRedirect?.vulnerableCount || 0,
    results.cveScanner?.totalFound || 0,
    results.graphQL?.introspectionEnabled ? 1 : 0,
    results.csrfDetection?.formsWithoutToken || 0,
    results.gitExposure?.criticalExposed || 0,
    results.s3Bucket?.openBuckets || 0,
    results.cookieAudit?.insecureCookies || 0,
  ].reduce((total, value) => total + Number(value || 0), 0);
};

const getPublicProjectMetrics = async (): Promise<Partial<LandingStats>> => {
  const [repo, downloads, latest] = await Promise.all([
    fetchJson<{ stargazers_count?: number; forks_count?: number; open_issues_count?: number; pushed_at?: string }>(GITHUB_REPO_API),
    fetchJson<{ downloads?: number }>(NPM_DOWNLOADS_API),
    fetchJson<{ version?: string }>(NPM_PACKAGE_API),
  ]);

  return {
    repositoryStars: repo?.stargazers_count ?? null,
    repositoryForks: repo?.forks_count ?? null,
    repositoryIssues: repo?.open_issues_count ?? null,
    latestVersion: latest?.version ?? null,
    monthlyDownloads: downloads?.downloads ?? null,
    lastUpdated: repo?.pushed_at ?? null,
  };
};

const getScanMetrics = async (): Promise<Partial<LandingStats>> => {
  try {
    const [{ count: totalScans }, { count: completedScans }, { data: completedRows }, { data: scanTimes }] = await Promise.all([
      supabase.from('user_scans').select('*', { count: 'exact', head: true }),
      supabase.from('user_scans').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('user_scans').select('results').eq('status', 'completed').not('results', 'is', null).limit(500),
      supabase.from('user_scans').select('elapsed_ms').eq('status', 'completed').not('elapsed_ms', 'is', null).limit(500),
    ]);

    const totalFindings = completedRows?.reduce((sum, scan) => sum + countFindings(scan.results), 0) ?? null;
    const elapsedValues = scanTimes?.map((scan) => scan.elapsed_ms).filter((value): value is number => typeof value === 'number' && value > 0) || [];
    const avgScanTimeSeconds = elapsedValues.length
      ? Math.round(elapsedValues.reduce((sum, value) => sum + value, 0) / elapsedValues.length / 1000)
      : null;

    return {
      totalScans: totalScans ?? null,
      completedScans: completedScans ?? null,
      totalFindings,
      avgScanTimeSeconds,
    };
  } catch {
    return {};
  }
};

export const getLandingStats = async (): Promise<LandingStats> => {
  const [projectMetrics, scanMetrics] = await Promise.all([
    getPublicProjectMetrics(),
    getScanMetrics(),
  ]);

  return {
    ...emptyStats(),
    ...projectMetrics,
    ...scanMetrics,
  };
};

export const getCachedLandingStats = async (): Promise<LandingStats> => {
  const now = Date.now();

  if (cachedStats && now - cacheTimestamp < CACHE_DURATION) {
    return cachedStats;
  }

  cachedStats = await getLandingStats();
  cacheTimestamp = now;

  return cachedStats;
};
