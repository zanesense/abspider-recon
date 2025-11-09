const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
];

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export class CORSBypass {
  private workingProxies: string[] = [...CORS_PROXIES];
  private currentIndex = 0;

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { method = 'GET', headers = {}, body, timeout = 15000 } = options;
    const errors: string[] = [];

    // Try direct fetch first
    try {
      console.log(`[CORS Bypass] Attempting direct fetch: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...headers,
        },
        body,
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      if (response.ok || (response.status >= 200 && response.status < 400)) {
        console.log(`[CORS Bypass] ✓ Direct fetch successful`);
        return response;
      }
    } catch (error: any) {
      errors.push(`Direct: ${error.message}`);
      console.log(`[CORS Bypass] Direct fetch failed: ${error.message}`);
    }

    // Try with CORS proxies
    for (let attempt = 0; attempt < this.workingProxies.length; attempt++) {
      const proxyIndex = (this.currentIndex + attempt) % this.workingProxies.length;
      const proxy = this.workingProxies[proxyIndex];

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
          return response;
        }
      } catch (error: any) {
        errors.push(`Proxy ${attempt + 1}: ${error.message}`);
        console.log(`[CORS Bypass] Proxy ${attempt + 1} failed: ${error.message}`);
      }
    }

    throw new Error(`All CORS bypass attempts failed. Errors: ${errors.join(' | ')}`);
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