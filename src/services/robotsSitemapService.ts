import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

export interface RobotsSitemapResult {
  robots: {
    exists: boolean;
    content: string;
    userAgents: { agent: string; disallowed: string[]; allowed: string[] }[];
    disallowedPaths: string[];
    sitemapLinks: string[];
  };
  sitemap: {
    exists: boolean;
    urls: string[];
    count: number;
  };
}

export const performRobotsSitemapParse = async (target: string, requestManager: RequestManager): Promise<RobotsSitemapResult> => {
  const domain = extractDomain(target);
  console.log(`[Robots/Sitemap] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const result: RobotsSitemapResult = {
    robots: {
      exists: false,
      content: '',
      userAgents: [],
      disallowedPaths: [],
      sitemapLinks: [],
    },
    sitemap: {
      exists: false,
      urls: [],
      count: 0,
    },
  };

  // Parse robots.txt
  try {
    const robotsResponse = await requestManager.fetch(`${baseUrl}/robots.txt`, { timeout: 10000 });
    if (robotsResponse.status === 200) {
      const text = await robotsResponse.text();
      result.robots.exists = true;
      result.robots.content = text.substring(0, 2000);

      let currentAgent = '';
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('User-agent:')) {
          currentAgent = trimmed.split(':')[1]?.trim() || '*';
          result.robots.userAgents.push({ agent: currentAgent, disallowed: [], allowed: [] });
        } else if (trimmed.startsWith('Disallow:')) {
          const path = trimmed.split(':').slice(1).join(':').trim();
          if (path) {
            result.robots.disallowedPaths.push(path);
            if (result.robots.userAgents.length > 0) {
              result.robots.userAgents[result.robots.userAgents.length - 1].disallowed.push(path);
            }
          }
        } else if (trimmed.startsWith('Allow:')) {
          const path = trimmed.split(':').slice(1).join(':').trim();
          if (path && result.robots.userAgents.length > 0) {
            result.robots.userAgents[result.robots.userAgents.length - 1].allowed.push(path);
          }
        } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
          const url = trimmed.split(':').slice(1).join(':').trim();
          if (url) result.robots.sitemapLinks.push(url);
        }
      }
    }
  } catch { /* ignore */ }

  // Parse sitemap.xml
  const sitemapUrls = result.robots.sitemapLinks.length > 0
    ? result.robots.sitemapLinks
    : [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`];

  for (const sitemapUrl of sitemapUrls.slice(0, 3)) {
    try {
      const sitemapResponse = await requestManager.fetch(sitemapUrl, { timeout: 10000 });
      if (sitemapResponse.status === 200) {
        const xmlText = await sitemapResponse.text();

        // Extract all <loc> tags
        const locRegex = /<loc>([^<]+)<\/loc>/g;
        let locMatch;
        while ((locMatch = locRegex.exec(xmlText)) !== null) {
          result.sitemap.urls.push(locMatch[1]);
        }

        // Check for sitemap index (nested sitemaps)
        if (result.sitemap.urls.length === 0) {
          const sitemapIndexRegex = /<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
          while ((locMatch = sitemapIndexRegex.exec(xmlText)) !== null) {
            try {
              const nestedResponse = await requestManager.fetch(locMatch[1], { timeout: 8000 });
              if (nestedResponse.status === 200) {
                const nestedXml = await nestedResponse.text();
                const nestedLocRegex = /<loc>([^<]+)<\/loc>/g;
                let n;
                while ((n = nestedLocRegex.exec(nestedXml)) !== null) {
                  result.sitemap.urls.push(n[1]);
                }
              }
            } catch { /* ignore */ }
          }
        }

        result.sitemap.exists = true;
        result.sitemap.count = result.sitemap.urls.length;
        break;
      }
    } catch { /* ignore */ }
  }

  // Limit URLs
  result.sitemap.urls = result.sitemap.urls.slice(0, 500);

  return result;
};
