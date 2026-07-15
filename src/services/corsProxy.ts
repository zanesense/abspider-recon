// This service now uses the FastAPI proxy at /api/proxy
// to reliably bypass CORS restrictions and ensure accurate results.

const INTERNAL_HOSTNAME_SUFFIXES = ['.internal', '.local', '.corp', '.lan', '.intranet', '.private'];

const isInternalTarget = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (INTERNAL_HOSTNAME_SUFFIXES.some(s => hostname.endsWith(s))) return true;
    const parts = hostname.split('.').map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      const [a, b] = parts;
      if (a === 10 || a === 127) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
    }
    return false;
  } catch {
    return false;
  }
};

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
  skipProxy?: boolean;
  redirect?: RequestRedirect;
}

const proxyRequest = (url: string, headers: Record<string, string>, redirect?: RequestRedirect) => {
  const params = new URLSearchParams({ url });
  if (redirect === 'manual') params.set('redirect', 'manual');
  const origin = Object.entries(headers).find(([key]) => key.toLowerCase() === 'origin')?.[1];
  if (origin) params.set('origin', origin);
  return {
    url: `/api/proxy?${params}`,
    headers: Object.fromEntries(Object.entries(headers).filter(([key]) => key.toLowerCase() !== 'origin')),
  };
};

const hasTestOrigin = (headers: Record<string, string>) => Object.keys(headers).some(key => key.toLowerCase() === 'origin');

export class CORSBypass {

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { method = 'GET', headers = {}, body, timeout = 20000, skipProxy = false, redirect } = options;
    const errors: string[] = [];

    // 1. Try direct fetch first (Optimization)
    // Skip direct fetch for internal/private IPs — route through SSRF-protected proxy
    if (!skipProxy && (isInternalTarget(url) || hasTestOrigin(headers))) {
      console.log(`[CORS Bypass] Proxy-only request, skipping direct fetch: ${url}`);
    } else {
      try {
        console.log(`[CORS Bypass] Attempting direct fetch: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: skipProxy ? headers : {
            ...CLOUDFLARE_BYPASS_HEADERS,
            ...headers,
          },
          body,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit',
          redirect,
        });

        clearTimeout(timeoutId);

        if (skipProxy || response.ok || (response.status >= 200 && response.status < 400)) {
          console.log(`[CORS Bypass] ✓ Direct fetch successful`);
          return response;
        }

        // Check if blocked by Cloudflare or other protection
        if (response.status === 403 || response.status === 503) {
          console.log(`[CORS Bypass] Forbidden/Service Unavailable detected (likely protection), switching to proxy...`);
        }
      } catch (error: any) {
        errors.push(`Direct: ${error.message}`);
        console.log(`[CORS Bypass] Direct fetch failed: ${error.message}`);
        if (skipProxy) {
          throw new Error(`Direct fetch failed and proxy is disabled. Errors: ${errors.join(' | ')}`, { cause: error });
        }
      }
    }

    // 2. Try via backend proxy
    if (skipProxy) {
      throw new Error(`Direct fetch returned an unsupported response and proxy is disabled. Errors: ${errors.join(' | ')}`);
    }

    try {
      console.log(`[CORS Bypass] Attempting via backend proxy: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Construct the proxy URL
      // We assume the app is running on same origin
      const proxy = proxyRequest(url, headers, redirect);

      const response = await fetch(proxy.url, {
        method, // Pass the original method (GET, POST etc)
        headers: proxy.headers,
        body,
        signal: controller.signal,
        redirect,
      });

      clearTimeout(timeoutId);

      if (response.ok || (redirect === 'manual' && response.status >= 300 && response.status < 400)) {
        await assertValidProxyResponse(response, url);
        console.log(`[CORS Bypass] ✓ Success with backend proxy`);
        return restoreUpstreamHeaders(response);
      } else {
        const text = await response.text();
        throw new Error(`Proxy returned status ${response.status}: ${text}`);
      }

    } catch (error: any) {
        errors.push(`Backend Proxy: ${error.message}`);
      console.log(`[CORS Bypass] Backend proxy failed: ${error.message}`);
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

const isLikelyAppShell = (text: string) => {
  const normalized = text.slice(0, 5000).toLowerCase();
  return (
    normalized.includes('<div id="root"') &&
    (normalized.includes('abspider recon') || normalized.includes('/src/main.tsx') || normalized.includes('/assets/'))
  );
};

const assertValidProxyResponse = async (response: Response, targetUrl: string) => {
  if (response.headers.get('x-abspider-proxy')) return;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return;

  const text = await response.clone().text().catch(() => '');
  if (isLikelyAppShell(text)) {
    throw new Error(
      `Backend proxy is unavailable or misrouted for ${targetUrl}. Received the ABSpider app shell instead of target content.`
    );
  }
};

const restoreUpstreamHeaders = (response: Response) => {
  const headers = new Headers(response.headers);
  const preserved = headers.get('x-abspider-upstream-headers');
  const replaced = ['server', 'set-cookie', 'content-length', 'access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-expose-headers'];
  replaced.forEach(name => headers.delete(name));
  if (preserved) {
    try {
      Object.entries(JSON.parse(decodeURIComponent(preserved))).forEach(([name, value]) => headers.set(name, String(value)));
    } catch { /* Ignore malformed transport metadata. */ }
  } else {
    const upstreamServer = headers.get('x-abspider-upstream-server');
    if (upstreamServer) headers.set('server', upstreamServer);
  }
  Array.from(headers.keys()).filter(name => name.startsWith('x-abspider-')).forEach(name => headers.delete(name));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

/**
 * Unified CORS bypass helper with metadata tracking
 * Tries direct fetch first, then falls back to backend proxy
 */
export async function fetchWithBypass(
  url: string,
  options: FetchOptions & { signal?: AbortSignal } = {}
): Promise<FetchWithBypassResult> {
  const { method = 'GET', headers = {}, body, timeout = 20000, signal, skipProxy = false, redirect } = options;
  const errors: string[] = [];
  const metadata: CORSBypassMetadata = {
    usedProxy: false,
    attemptsDirect: !hasTestOrigin(headers),
    attemptsViaProxy: 0,
  };

  // Try direct fetch
  // Skip direct fetch for internal/private IPs — route through SSRF-protected proxy
  if (skipProxy || (!isInternalTarget(url) && !hasTestOrigin(headers))) {
    try {
      console.log(`[fetchWithBypass] Attempting direct fetch: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const response = await fetch(url, {
        method,
        headers: skipProxy ? headers : {
          ...CLOUDFLARE_BYPASS_HEADERS,
          ...headers,
        },
        body,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        redirect,
      });

      clearTimeout(timeoutId);

      if (skipProxy || response.ok || (response.status >= 200 && response.status < 400)) {
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
      if (skipProxy) {
        throw new Error(`Direct fetch failed and proxy is disabled. Errors: ${errors.join(' | ')}`, { cause: error });
      }
    }
  } else {
    console.log(`[fetchWithBypass] Proxy-only request, skipping direct fetch: ${url}`);
  }

  // Try backend proxy
  if (skipProxy) {
    throw new Error(`Direct fetch returned an unsupported response and proxy is disabled. Errors: ${errors.join(' | ')}`);
  }

  metadata.attemptsViaProxy++;
  try {
    console.log(`[fetchWithBypass] Trying backend proxy: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const proxy = proxyRequest(url, headers, redirect);

    const response = await fetch(proxy.url, {
      method,
      headers: proxy.headers,
      body,
      signal: controller.signal,
      redirect,
    });

    clearTimeout(timeoutId);

    if (response.ok || (redirect === 'manual' && response.status >= 300 && response.status < 400)) {
      await assertValidProxyResponse(response, url);
      console.log(`[fetchWithBypass] ✓ Success with backend proxy`);
      metadata.usedProxy = true;
      metadata.proxyUrl = '/api/proxy';
      return { response: restoreUpstreamHeaders(response), metadata };
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
