import { normalizeUrl, extractDomain } from './apiUtils';
import { fetchWithBypass, CORSBypassMetadata, fetchJSONWithBypass } from './corsProxy'; // Import fetchJSONWithBypass
import { getAPIKey } from './apiKeyService';
import { RequestManager } from './requestManager'; // Import RequestManager

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
  corsMetadata?: CORSBypassMetadata;
  robotsTxtMetadata?: CORSBypassMetadata;
}

export const performSiteInfoScan = async (target: string, requestManager: RequestManager): Promise<SiteInfo> => {
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
      const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000 }); // Use requestManager
      const dnsData = await dnsResponse.json();
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        result.ip = dnsData.Answer[0].data;
        console.log(`[Site Info] IP Address: ${result.ip}`);
      }
    } catch (error) {
      console.warn('[Site Info] DNS lookup failed:', error);
    }

    // Try to fetch the page using unified CORS bypass
    const startTime = Date.now();
    let response: Response;
    let html = '';
    
    try {
      const fetchResult = await fetchWithBypass(url, { timeout: 15000, signal: requestManager.scanController?.signal }); // Pass signal
      result.responseTime = Date.now() - startTime;
      result.corsMetadata = fetchResult.metadata;
      
      // Clone response before text() to preserve headers access
      response = fetchResult.response.clone();
      result.statusCode = response.status;
      html = await fetchResult.response.text();
      
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

      // --- Enhance with BuiltWith data if API key is available ---
      const builtwithKey = getAPIKey('builtwith');
      if (builtwithKey) {
        try {
          console.log('[Site Info] Attempting BuiltWith API enrichment...');
          const builtwithApiUrl = `https://api.builtwith.com/v1/api.json?key=${builtwithKey}&lookup=${domain}`;
          // Use fetchJSONWithBypass for BuiltWith API, passing requestManager's signal
          const { data: builtwithData, metadata: builtwithCorsMetadata } = await fetchJSONWithBypass(builtwithApiUrl, { timeout: 15000, signal: requestManager.scanController?.signal });

          if (builtwithData.Results && builtwithData.Results.length > 0) {
            const technologies = builtwithData.Results[0].Result.Paths[0].Technologies;
            technologies.forEach((tech: any) => {
              if (tech.Name && !result.technologies.includes(tech.Name)) {
                result.technologies.push(tech.Name);
              }
            });
            console.log(`[Site Info] ✓ Enhanced with BuiltWith data`);
          } else if (builtwithData.Errors && builtwithData.Errors.length > 0) {
            console.warn(`[Site Info] BuiltWith API returned error: ${builtwithData.Errors[0].Message}`);
          }
        } catch (builtwithError: any) {
          console.warn('[Site Info] BuiltWith API enrichment failed:', builtwithError.message);
        }
      }

      // Try to get robots.txt
      try {
        const robotsUrl = `${url}/robots.txt`;
        const robotsResult = await fetchWithBypass(robotsUrl, { timeout: 5000, signal: requestManager.scanController?.signal }); // Pass signal
        
        if (robotsResult.response.ok) {
          result.robotsTxt = await robotsResult.response.text();
          result.robotsTxtMetadata = robotsResult.metadata;
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