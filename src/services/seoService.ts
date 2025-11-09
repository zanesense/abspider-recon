import { normalizeUrl, extractDomain } from './apiUtils';

export interface SEOAnalysis {
  httpCode: number;
  title: string;
  metaDescription?: string;
  h1Tags: string[];
  h2Tags: string[];
  imageCount: number;
  linkCount: {
    internal: number;
    external: number;
    total: number;
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  allLinks: string[];
  pageSize: number;
  loadTime: number;
}

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

const fetchWithProxy = async (url: string, timeout: number = 15000): Promise<Response> => {
  const errors: string[] = [];
  
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
    
    if (response.ok || response.type !== 'opaque') {
      return response;
    }
  } catch (error: any) {
    errors.push(`Direct: ${error.message}`);
  }
  
  // Try with proxies
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
    } catch (error: any) {
      errors.push(`Proxy: ${error.message}`);
    }
  }
  
  throw new Error(`Unable to fetch page: ${errors.join(', ')}`);
};

export const performSEOAnalysis = async (target: string): Promise<SEOAnalysis> => {
  console.log(`[SEO Analysis] Starting for ${target}`);

  try {
    const url = normalizeUrl(target);
    const domain = extractDomain(target);

    const startTime = Date.now();
    const response = await fetchWithProxy(url, 15000);
    const loadTime = Date.now() - startTime;

    const html = await response.text();
    const pageSize = new Blob([html]).size;

    const result: SEOAnalysis = {
      httpCode: response.status,
      title: '',
      h1Tags: [],
      h2Tags: [],
      imageCount: 0,
      linkCount: { internal: 0, external: 0, total: 0 },
      socialLinks: {},
      allLinks: [],
      pageSize,
      loadTime,
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDescMatch) {
      result.metaDescription = metaDescMatch[1];
    }

    // Extract H1 tags
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    for (const match of h1Matches) {
      result.h1Tags.push(match[1].trim());
    }

    // Extract H2 tags
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    for (const match of h2Matches) {
      result.h2Tags.push(match[1].trim());
    }

    // Count images
    const imgMatches = html.matchAll(/<img[^>]*>/gi);
    result.imageCount = Array.from(imgMatches).length;

    // Extract and analyze links
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["']/gi);
    for (const match of linkMatches) {
      const href = match[1];
      result.allLinks.push(href);
      
      if (href.startsWith('http')) {
        if (href.includes(domain)) {
          result.linkCount.internal++;
        } else {
          result.linkCount.external++;
        }
      } else if (href.startsWith('/') || href.startsWith('#') || !href.includes('://')) {
        result.linkCount.internal++;
      }

      // Extract social links
      if (href.includes('facebook.com')) result.socialLinks.facebook = href;
      if (href.includes('twitter.com') || href.includes('x.com')) result.socialLinks.twitter = href;
      if (href.includes('instagram.com')) result.socialLinks.instagram = href;
      if (href.includes('linkedin.com')) result.socialLinks.linkedin = href;
      if (href.includes('youtube.com')) result.socialLinks.youtube = href;
    }

    result.linkCount.total = result.linkCount.internal + result.linkCount.external;

    console.log(`[SEO Analysis] Complete: ${result.linkCount.total} links, ${result.imageCount} images`);
    return result;
  } catch (error: any) {
    console.error('[SEO Analysis] Error:', error);
    throw new Error(error.message || 'SEO analysis failed');
  }
};