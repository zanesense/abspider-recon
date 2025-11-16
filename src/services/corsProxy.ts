const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors.bridged.cc/',
  'https://yacdn.org/proxy/', // Added another common proxy
  'https://proxy.cors.sh/', // Added another common proxy
];

// Cloudflare bypass headers
const CLOUDFLARE_BYPASS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0',
};

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export class CORSBypass {
  private workingProxies: string[] = [...CORS_PROXIES];
  private currentIndex = 0;
  private failedAttempts = new Map<string, number>();

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { method = 'GET', headers = {}, body, timeout = 20000 } = options;
    const errors: string[] = [];

    // Try direct fetch with Cloudflare bypass headers
    try {
      console.log(`[CORS Bypass] Attempting direct fetch with CF bypass: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          ...CLOUDFLARE_BYPASS_HEADERS,
          ...headers,
        },
        body,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      });

      clearTimeout(timeoutId);

      if (response.ok || (response.status >= 200 && response.status < 400)) {
        console.log(`[CORS Bypass] ✓ Direct fetch successful`);
        return response;
      }
      
      // Check if blocked by Cloudflare
      if (response.status === 403 || response.status === 503) {
        const text = await response.text();
        if (text.includes('cloudflare') || text.includes('cf-ray')) {
          console.log(`[CORS Bypass] Cloudflare protection detected, trying proxies...`);
        }
      }
    } catch (error: any) {
      errors.push(`Direct: ${error.message}`);
      console.log(`[CORS Bypass] Direct fetch failed: ${error.message}`);
    }

    // Try with CORS proxies
    for (let attempt = 0; attempt < this.workingProxies.length; attempt++) {
      const proxyIndex = (this.currentIndex + attempt) % this.workingProxies.length;
      const proxy = this.workingProxies[proxyIndex];

      // Skip proxies that have failed too many times
      const failures = this.failedAttempts.get(proxy) || 0;
      if (failures > 3) {
        console.log(`[CORS Bypass] Skipping proxy ${proxy} (too many failures)`);
        continue;
      }

      try {
        console.log(`[CORS Bypass] Trying proxy ${attempt + 1}/${this.workingProxies.length}: ${proxy}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const proxyUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`[CORS Bypass] ✓ Success with proxy: ${proxy}`);
          this.currentIndex = proxyIndex;
          this.failedAttempts.set(proxy, 0); // Reset failure count
          return response;
        }
      } catch (error: any) {
        errors.push(`Proxy ${attempt + 1}: ${error.message}`);
        console.log(`[CORS Bypass] Proxy ${attempt + 1} failed: ${error.message}`);
        
        // Increment failure count
        const failures = this.failedAttempts.get(proxy) || 0;
        this.failedAttempts.set(proxy, failures + 1);
      }
    }

    throw new Error(`All CORS bypass attempts failed. The site may have strong protection. Errors: ${errors.join(' | ')}`);
  }

  async fetchText(url: string, options?: FetchOptions): Promise<string> {
    const response = await this.fetch(url, options);
    return await response.text();
  }

  async fetchJSON(url: string, options?: FetchOptions): Promise<any> {
    const response = await this.fetch(url, options);
    return await response.json();
  }
}

export const corsProxy = new CORSBypass();

// Metadata about CORS bypass usage
export interface CORSBypassMetadata {
  usedProxy: boolean;
  proxyUrl?: string;
  attemptsDirect: boolean;
  attemptsViaProxy: number;
}

// Enhanced fetch result with metadata
export interface FetchWithBypassResult {
  response: Response;
  metadata: CORSBypassMetadata;
}

/**
 * Unified CORS bypass helper with metadata tracking
 * Tries direct fetch first, then falls back to CORS proxies if needed
 */
export async function fetchWithBypass(
  url: string,
  options: FetchOptions & { signal?: AbortSignal } = {}
): Promise<FetchWithBypassResult> {
  const { method = 'GET', headers = {}, body, timeout = 20000, signal } = options;
  const errors: string[] = [];
  const metadata: CORSBypassMetadata = {
    usedProxy: false,
    attemptsDirect: true,
    attemptsViaProxy: 0,
  };

  // Try direct fetch with Cloudflare bypass headers
  try {
    console.log(`[fetchWithBypass] Attempting direct fetch: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine signals if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const response = await fetch(url, {
      method,
      headers: {
        ...CLOUDFLARE_BYPASS_HEADERS,
        ...headers,
      },
      body,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (response.ok || (response.status >= 200 && response.status < 400)) {
      console.log(`[fetchWithBypass] ✓ Direct fetch successful`);
      return { response, metadata };
    }

    // Check if blocked by Cloudflare
    if (response.status === 403 || response.status === 503) {
      const text = await response.text();
      if (text.includes('cloudflare') || text.includes('cf-ray')) {
        console.log(`[fetchWithBypass] Cloudflare protection detected, trying proxies...`);
      }
    }
  } catch (error: any) {
    errors.push(`Direct: ${error.message}`);
    console.log(`[fetchWithBypass] Direct fetch failed: ${error.message}`);
  }

  // Try with CORS proxies
  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    metadata.attemptsViaProxy++;
    const proxy = CORS_PROXIES[attempt];

    try {
      console.log(`[fetchWithBypass] Trying proxy ${attempt + 1}/${CORS_PROXIES.length}: ${proxy}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine signals if provided
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[fetchWithBypass] ✓ Success with proxy: ${proxy}`);
        metadata.usedProxy = true;
        metadata.proxyUrl = proxy;
        return { response, metadata };
      }
    } catch (error: any) {
      errors.push(`Proxy ${attempt + 1}: ${error.message}`);
      console.log(`[fetchWithBypass] Proxy ${attempt + 1} failed: ${error.message}`);
    }
  }

  throw new Error(`All CORS bypass attempts failed. Errors: ${errors.join(' | ')}`);
}

/**
 * Fetch text with CORS bypass and metadata
 */
export async function fetchTextWithBypass(
  url: string,
  options?: FetchOptions & { signal?: AbortSignal }
): Promise<{ text: string; metadata: CORSBypassMetadata }> {
  const result = await fetchWithBypass(url, options);
  const text = await result.response.text();
  return { text, metadata: result.metadata };
}

/**
 * Fetch JSON with CORS bypass and metadata
 */
export async function fetchJSONWithBypass<T = any>(
  url: string,
  options?: FetchOptions & { signal?: AbortSignal }
): Promise<{ data: T; metadata: CORSBypassMetadata }> {
  const result = await fetchWithBypass(url, options);
  const data = await result.response.json();
  return { data, metadata: result.metadata };
}