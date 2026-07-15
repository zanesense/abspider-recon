import { normalizeUrl, extractDomain } from './apiUtils';
import { RequestManager } from './requestManager'; // Import RequestManager
import { fetchWithBypass } from './corsProxy'; // Use fetchWithBypass

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

export const performSEOAnalysis = async (target: string, requestManager: RequestManager): Promise<SEOAnalysis> => {
  console.log(`[SEO Analysis] Starting for ${target}`);

  try {
    const url = normalizeUrl(target);
    const domain = extractDomain(target);

    const startTime = Date.now();
    // Use fetchWithBypass which is integrated with RequestManager's signal
    const { response } = await fetchWithBypass(url, { timeout: 15000, signal: requestManager.getAbortSignal() });
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

    const document = new DOMParser().parseFromString(html, 'text/html');
    result.title = document.title.trim();
    result.metaDescription = document.querySelector('meta[name="description" i]')?.getAttribute('content') || undefined;
    result.h1Tags = Array.from(document.querySelectorAll('h1'), element => element.textContent?.trim() || '').filter(Boolean);
    result.h2Tags = Array.from(document.querySelectorAll('h2'), element => element.textContent?.trim() || '').filter(Boolean);
    result.imageCount = document.images.length;

    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = link.getAttribute('href') || '';
      result.allLinks.push(href);

      try {
        const linkedUrl = new URL(href, url);
        if (linkedUrl.protocol === 'http:' || linkedUrl.protocol === 'https:') {
          if (linkedUrl.hostname === domain || linkedUrl.hostname.endsWith(`.${domain}`)) result.linkCount.internal++;
          else result.linkCount.external++;
        }
      } catch { /* Ignore non-URL hrefs. */ }

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
    throw new Error(error.message || 'SEO analysis failed', { cause: error });
  }
};
