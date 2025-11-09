import { normalizeUrl, extractDomain } from './apiUtils';

export interface SiteInfo {
  title?: string;
  ip?: string;
  webServer?: string;
  cms?: string;
  cloudflare: boolean;
  robotsTxt?: string;
  statusCode?: number;
  responseTime?: number;
  technologies: string[];
  meta?: {
    description?: string;
    keywords?: string;
    author?: string;
  };
}

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

let currentProxyIndex = 0;

const fetchWithProxy = async (url: string, timeout: number = 15000): Promise<Response> => {
  const errors: string[] = [];
  
  // Try direct fetch first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok || response.type !== 'opaque') {
      return response;
    }
  } catch (error: any) {
    errors.push(`Direct: ${error.message}`);
    console.log('[Site Info] Direct fetch failed, trying proxies...');
  }
  
  // Try with CORS proxies
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[(currentProxyIndex + i) % CORS_PROXIES.length];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(proxyUrl + encodeURIComponent(url), {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        currentProxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length;
        console.log(`[Site Info] Success with proxy: ${proxyUrl}`);
        return response;
      }
    } catch (error: any) {
      errors.push(`Proxy ${i}: ${error.message}`);
    }
  }
  
  throw new Error(`All fetch attempts failed: ${errors.join(', ')}`);
};

export const performSiteInfoScan = async (target: string): Promise<SiteInfo> => {
  console.log(`[Site Info] Starting comprehensive scan for ${target}`);
  
  const result: SiteInfo = {
    cloudflare: false,
    technologies: [],
  };

  try {
    const url = normalizeUrl(target);
    const domain = extractDomain(target);

    // Get IP address first (always works)
    try {
      const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
      const dnsResponse = await fetch(dnsUrl);
      const dnsData = await dnsResponse.json();
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        result.ip = dnsData.Answer[0].data;
        console.log(`[Site Info] IP Address: ${result.ip}`);
      }
    } catch (error) {
      console.warn('[Site Info] DNS lookup failed:', error);
    }

    // Try to fetch the page
    const startTime = Date.now();
    let response: Response;
    let html = '';
    
    try {
      response = await fetchWithProxy(url, 15000);
      result.responseTime = Date.now() - startTime;
      result.statusCode = response.status;
      html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.title = titleMatch[1].trim();
        console.log(`[Site Info] Title: ${result.title}`);
      }

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (descMatch) {
        result.meta = { ...result.meta, description: descMatch[1] };
      }

      // Extract meta keywords
      const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
      if (keywordsMatch) {
        result.meta = { ...result.meta, keywords: keywordsMatch[1] };
      }

      // Check headers
      const server = response.headers.get('server');
      if (server) {
        result.webServer = server;
        result.technologies.push(server);
        console.log(`[Site Info] Web Server: ${server}`);
      }

      const poweredBy = response.headers.get('x-powered-by');
      if (poweredBy) {
        result.technologies.push(poweredBy);
      }

      // Check for Cloudflare
      const cfRay = response.headers.get('cf-ray');
      const cfCache = response.headers.get('cf-cache-status');
      if (cfRay || cfCache || html.includes('cloudflare')) {
        result.cloudflare = true;
        result.technologies.push('Cloudflare');
        console.log(`[Site Info] Cloudflare detected`);
      }

      // Detect CMS
      if (html.includes('wp-content') || html.includes('wordpress')) {
        result.cms = 'WordPress';
        result.technologies.push('WordPress');
      } else if (html.includes('joomla')) {
        result.cms = 'Joomla';
        result.technologies.push('Joomla');
      } else if (html.includes('drupal')) {
        result.cms = 'Drupal';
        result.technologies.push('Drupal');
      } else if (html.includes('shopify')) {
        result.cms = 'Shopify';
        result.technologies.push('Shopify');
      } else if (html.includes('wix.com')) {
        result.cms = 'Wix';
        result.technologies.push('Wix');
      } else if (html.includes('squarespace')) {
        result.cms = 'Squarespace';
        result.technologies.push('Squarespace');
      }

      if (result.cms) {
        console.log(`[Site Info] CMS detected: ${result.cms}`);
      }

      // Try to get robots.txt
      try {
        const robotsUrl = `${url}/robots.txt`;
        const robotsResponse = await fetchWithProxy(robotsUrl, 5000);
        
        if (robotsResponse.ok) {
          result.robotsTxt = await robotsResponse.text();
          console.log(`[Site Info] robots.txt found (${result.robotsTxt.length} bytes)`);
        }
      } catch (error) {
        console.log('[Site Info] robots.txt not accessible');
      }

    } catch (error: any) {
      console.warn('[Site Info] Page fetch failed:', error.message);
      // Return partial results with IP if we have it
      if (!result.ip) {
        throw new Error('Unable to fetch site information. The site may be blocking automated requests or have CORS restrictions.');
      }
    }

    console.log(`[Site Info] Scan complete for ${target}`);
    return result;
  } catch (error: any) {
    console.error('[Site Info] Error:', error);
    throw new Error(error.message || 'Site information scan failed');
  }
};