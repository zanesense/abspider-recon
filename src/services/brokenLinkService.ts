import { normalizeUrl, extractDomain } from './apiUtils';
import { fetchWithBypass } from './corsProxy';
import { RequestManager } from './requestManager';

export interface BrokenLink {
  url: string;
  status: number;
  statusText: string;
  isInternal: boolean;
  sourcePage?: string;
}

export interface BrokenLinkResult {
  tested: boolean;
  totalLinksChecked: number;
  brokenLinks: BrokenLink[];
  errors?: string[];
  corsMetadata?: any; // From fetchWithBypass
}

export const performBrokenLinkCheck = async (target: string, requestManager: RequestManager): Promise<BrokenLinkResult> => {
  console.log(`[Broken Link] Starting check for ${target}`);

  const result: BrokenLinkResult = {
    tested: true,
    totalLinksChecked: 0,
    brokenLinks: [],
    errors: [],
  };

  const visitedUrls = new Set<string>();
  const linksToVisit: { url: string; sourcePage?: string }[] = [{ url: normalizeUrl(target) }];
  const baseUrl = new URL(normalizeUrl(target));
  const baseDomain = extractDomain(target);
  let corsMetadata: any;

  while (linksToVisit.length > 0 && !requestManager.scanController?.signal.aborted) {
    const { url: currentUrl, sourcePage } = linksToVisit.shift()!;

    if (visitedUrls.has(currentUrl)) {
      continue;
    }
    visitedUrls.add(currentUrl);
    result.totalLinksChecked++;

    try {
      const { response, metadata } = await fetchWithBypass(currentUrl, {
        method: 'HEAD', // Use HEAD for efficiency
        timeout: 10000,
        signal: requestManager.scanController?.signal,
      });
      corsMetadata = metadata; // Keep the last metadata

      if (!response.ok) {
        result.brokenLinks.push({
          url: currentUrl,
          status: response.status,
          statusText: response.statusText,
          isInternal: currentUrl.includes(baseDomain),
          sourcePage,
        });
        console.warn(`[Broken Link] Broken link found: ${currentUrl} (Status: ${response.status})`);
      } else if (response.headers.get('content-type')?.includes('text/html')) {
        // If it's HTML and not broken, fetch full content to find more links
        const { response: fullResponse } = await fetchWithBypass(currentUrl, {
          method: 'GET',
          timeout: 15000,
          signal: requestManager.scanController?.signal,
        });
        const html = await fullResponse.text();
        const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["']/gi);

        for (const match of linkMatches) {
          let link = match[1];
          if (link.startsWith('#')) continue; // Skip anchor links

          try {
            const absoluteLink = new URL(link, currentUrl).href;
            if (!visitedUrls.has(absoluteLink) && absoluteLink.includes(baseDomain)) { // Only crawl internal links
              linksToVisit.push({ url: absoluteLink, sourcePage: currentUrl });
            }
          } catch (e) {
            // Malformed URL, ignore
          }
        }
      }
    } catch (error: any) {
      if (error.message === 'Request aborted') {
        throw error;
      }
      result.brokenLinks.push({
        url: currentUrl,
        status: 0, // Indicate network error
        statusText: error.message,
        isInternal: currentUrl.includes(baseDomain),
        sourcePage,
      });
      result.errors?.push(`Failed to check ${currentUrl}: ${error.message}`);
      console.warn(`[Broken Link] Failed to check ${currentUrl}: ${error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to avoid overwhelming
  }

  console.log(`[Broken Link] Check complete. Found ${result.brokenLinks.length} broken links out of ${result.totalLinksChecked} checked.`);
  result.corsMetadata = corsMetadata;
  return result;
};