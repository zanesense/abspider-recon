import { isIP } from 'node:net'; // Import isIP from node:net

interface ProxyConfig {
  url: string;
  enabled: boolean;
}

let currentProxyIndex = 0;
let proxyList: string[] = [];

export const setProxyList = (proxies: string[]) => {
  proxyList = proxies.filter(p => p.trim().length > 0);
  currentProxyIndex = 0;
};

export const getNextProxy = (): string | null => {
  if (proxyList.length === 0) return null;
  const proxy = proxyList[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  return proxy;
};

export const makeRequest = async (
  url: string,
  options: RequestInit = {},
  useProxy: boolean = false,
  timeout: number = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestUrl = useProxy && proxyList.length > 0 
    ? `${getNextProxy()}/${url}` 
    : url;

  const response = await fetch(requestUrl, {
    ...options,
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...options.headers,
    },
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  return response;
};

export const normalizeUrl = (target: string): string => {
  let url = target.trim();
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
};

export const extractDomain = (target: string): string => {
  let url = target.trim();
  
  url = url.replace(/^https?:\/\//, '');
  
  url = url.replace(/\/.*$/, '');
  
  url = url.replace(/:\d+$/, '');
  
  return url;
};

export const extractHostname = (target: string): string => {
  const url = normalizeUrl(target);
  const urlObj = new URL(url);
  return urlObj.hostname;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const safeJsonParse = (text: string, fallback: any = null) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

// New function to check if an IP address is internal
export const isInternalIP = (ip: string): boolean => {
  if (!isIP(ip)) return false; // Not a valid IP address

  // IPv4 private ranges
  // 10.0.0.0/8
  // 172.16.0.0/12
  // 192.168.0.0/16
  // 127.0.0.0/8 (localhost)
  if (isIP(ip) === 4) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
  }

  // IPv6 private ranges (ULA - Unique Local Addresses)
  // fc00::/7
  // ::1/128 (localhost)
  if (isIP(ip) === 6) {
    if (ip.startsWith('fc00:') || ip.startsWith('fd')) return true; // fc00::/7
    if (ip === '::1') return true; // IPv6 localhost
  }

  return false;
};