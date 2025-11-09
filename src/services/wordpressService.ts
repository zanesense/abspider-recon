import { normalizeUrl } from './apiUtils';

export interface WordPressScanResult {
  isWordPress: boolean;
  version?: string;
  vulnerabilities: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  sensitiveFiles: Array<{
    path: string;
    accessible: boolean;
    size?: number;
  }>;
  plugins: string[];
  themes: string[];
}

const SENSITIVE_FILES = [
  'wp-config.php',
  'wp-config.php.bak',
  'readme.html',
  'license.txt',
  'wp-content/debug.log',
  'xmlrpc.php',
];

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

const fetchWithProxy = async (url: string, timeout: number = 5000): Promise<Response | null> => {
  // Try direct fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.log('[WordPress] Direct fetch failed, trying proxy...');
  }
  
  // Try with proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(proxy + encodeURIComponent(url), {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
};

export const performWordPressScan = async (target: string): Promise<WordPressScanResult> => {
  console.log(`[WordPress] Starting scan for ${target}`);

  const result: WordPressScanResult = {
    isWordPress: false,
    vulnerabilities: [],
    sensitiveFiles: [],
    plugins: [],
    themes: [],
  };

  try {
    const url = normalizeUrl(target);

    const response = await fetchWithProxy(url, 10000);
    
    if (!response) {
      throw new Error('Unable to fetch site. CORS restrictions may be blocking the scan.');
    }

    const html = await response.text();

    // Check if it's WordPress
    if (!html.includes('wp-content') && !html.includes('wordpress') && !html.includes('wp-includes')) {
      console.log(`[WordPress] Not a WordPress site`);
      return result;
    }

    result.isWordPress = true;
    console.log(`[WordPress] WordPress detected`);

    // Detect version
    const versionMatch = html.match(/wordpress\s+(\d+\.\d+(?:\.\d+)?)/i);
    if (versionMatch) {
      result.version = versionMatch[1];
      console.log(`[WordPress] Version: ${result.version}`);
    }

    const metaGenerator = html.match(/<meta name="generator" content="WordPress ([^"]+)"/i);
    if (metaGenerator && !result.version) {
      result.version = metaGenerator[1];
    }

    // Check sensitive files
    for (const file of SENSITIVE_FILES) {
      try {
        const fileUrl = `${url}/${file}`;
        const fileResponse = await fetchWithProxy(fileUrl, 3000);

        if (fileResponse && fileResponse.ok) {
          const size = fileResponse.headers.get('content-length');
          result.sensitiveFiles.push({
            path: file,
            accessible: true,
            size: size ? parseInt(size) : undefined,
          });
          console.log(`[WordPress] Sensitive file found: ${file}`);
        }
      } catch (error) {
        // File not accessible, which is good
      }
    }

    // Extract plugins
    const pluginMatches = html.matchAll(/wp-content\/plugins\/([^\/'"]+)/g);
    for (const match of pluginMatches) {
      if (!result.plugins.includes(match[1])) {
        result.plugins.push(match[1]);
      }
    }
    console.log(`[WordPress] Found ${result.plugins.length} plugins`);

    // Extract themes
    const themeMatches = html.matchAll(/wp-content\/themes\/([^\/'"]+)/g);
    for (const match of themeMatches) {
      if (!result.themes.includes(match[1])) {
        result.themes.push(match[1]);
      }
    }
    console.log(`[WordPress] Found ${result.themes.length} themes`);

    // Check for vulnerabilities
    if (result.version) {
      const majorVersion = parseFloat(result.version);
      if (majorVersion < 6.0) {
        result.vulnerabilities.push({
          title: 'Outdated WordPress Version',
          severity: 'high',
          description: `WordPress ${result.version} is outdated. Current version is 6.4+. Update recommended.`,
        });
      }
    }

    if (result.sensitiveFiles.some(f => f.path === 'xmlrpc.php')) {
      result.vulnerabilities.push({
        title: 'XML-RPC Enabled',
        severity: 'medium',
        description: 'XML-RPC is accessible and can be used for brute force attacks',
      });
    }

    if (result.sensitiveFiles.some(f => f.path.includes('debug.log'))) {
      result.vulnerabilities.push({
        title: 'Debug Log Exposed',
        severity: 'high',
        description: 'Debug log file is publicly accessible and may contain sensitive information',
      });
    }

    if (result.sensitiveFiles.some(f => f.path.includes('wp-config'))) {
      result.vulnerabilities.push({
        title: 'Configuration File Exposed',
        severity: 'high',
        description: 'WordPress configuration file or backup is accessible',
      });
    }

    console.log(`[WordPress] Scan complete: ${result.vulnerabilities.length} vulnerabilities found`);
    return result;
  } catch (error: any) {
    console.error('[WordPress] Error:', error);
    throw new Error(error.message || 'WordPress scan failed');
  }
};