// This service now uses the Vercel Serverless Function at /api/proxy
// to reliably bypass CORS restrictions and ensure accurate results.

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

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { method = 'GET', headers = {}, body, timeout = 20000 } = options;
    const errors: string[] = [];

    // 1. Try direct fetch first (Optimization)
    try {
      console.log(`[CORS Bypass] Attempting direct fetch: ${url}`);
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

      // Check if blocked by Cloudflare or other protection
      if (response.status === 403 || response.status === 503) {
        console.log(`[CORS Bypass] Forbidden/Service Unavailable detected (likely protection), switching to Vercel proxy...`);
      }
    } catch (error: any) {
      errors.push(`Direct: ${error.message}`);
      console.log(`[CORS Bypass] Direct fetch failed: ${error.message}`);
    }

    // 2. Try via Vercel Proxy
    try {
      console.log(`[CORS Bypass] Attempting via Vercel Proxy: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Construct the proxy URL
      // We assume the app is running on same origin or Vercel
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl, {
        method, // Pass the original method (GET, POST etc)
        headers: {
          ...headers, // Pass original headers
          // We might want to remove some unsafe headers here if needed, but the proxy handles it too
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[CORS Bypass] ✓ Success with Vercel proxy`);
        return response;
      } else {
        const text = await response.text();
        throw new Error(`Proxy returned status ${response.status}: ${text}`);
      }

    } catch (error: any) {
      errors.push(`Vercel Proxy: ${error.message}`);
      console.log(`[CORS Bypass] Vercel proxy failed: ${error.message}`);
    }

    throw new Error(`All approach attempts failed. Errors: ${errors.join(' | ')}`);
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
 * Tries direct fetch first, then falls back to Vercel Proxy
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

  // Try direct fetch
  try {
    console.log(`[fetchWithBypass] Attempting direct fetch: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

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

    // Check if we should try proxy
    if (response.status === 403 || response.status === 503) {
      console.log(`[fetchWithBypass] Protection detected, switching to proxy...`);
    }

  } catch (error: any) {
    errors.push(`Direct: ${error.message}`);
    console.log(`[fetchWithBypass] Direct fetch failed: ${error.message}`);
  }

  // Try Vercel Proxy
  metadata.attemptsViaProxy++;
  try {
    console.log(`[fetchWithBypass] Trying Vercel Proxy: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      method,
      headers: {
        ...headers,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`[fetchWithBypass] ✓ Success with Vercel proxy`);
      metadata.usedProxy = true;
      metadata.proxyUrl = '/api/proxy';
      return { response, metadata };
    } else {
      const errorText = await response.text();
      throw new Error(`Proxy responded with ${response.status}: ${errorText}`);
    }

  } catch (error: any) {
    errors.push(`Proxy: ${error.message}`);
    console.log(`[fetchWithBypass] Proxy failed: ${error.message}`);
  }

  throw new Error(`All attempts failed. Errors: ${errors.join(' | ')}`);
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
