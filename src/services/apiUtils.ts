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