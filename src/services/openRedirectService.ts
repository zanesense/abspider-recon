import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const REDIRECT_PARAMS = [
  'url', 'redirect', 'redirect_uri', 'redirect_url', 'return', 'return_to',
  'return_path', 'next', 'goto', 'target', 'destination', 'out', 'view',
  'image_url', 'go', 'to', 'link', 'ref', 'source', 'u', 'r', 'qurl',
];

const TEST_EXTERNAL_URL = 'https://example.com';

export interface RedirectTest {
  param: string;
  url: string;
  vulnerable: boolean;
  statusCode: number;
  redirectedTo?: string;
}

export interface OpenRedirectResult {
  tests: RedirectTest[];
  vulnerableCount: number;
  totalTested: number;
}

export const performOpenRedirectCheck = async (target: string, requestManager: RequestManager): Promise<OpenRedirectResult> => {
  const domain = extractDomain(target);
  console.log(`[Open Redirect] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const tests: RedirectTest[] = [];

  for (const param of REDIRECT_PARAMS.slice(0, 15)) {
    const testUrl = `${baseUrl}?${param}=${encodeURIComponent(TEST_EXTERNAL_URL)}`;
    try {
      const response = await requestManager.fetch(testUrl, {
        method: 'GET',
        timeout: 10000,
        redirect: 'manual',
      });

      const test: RedirectTest = {
        param,
        url: testUrl,
        vulnerable: false,
        statusCode: response.status,
      };

      // Check for redirect
      const location = response.headers.get('location');
      if (location) {
        test.redirectedTo = location;
        // If redirect points to our external test URL or a different domain, it's vulnerable
        if (location.includes(TEST_EXTERNAL_URL) || (!location.startsWith('/') && !location.includes(domain))) {
          test.vulnerable = true;
        }
      }

      // Also check response body for meta/JS redirects
      if ([200, 302, 301, 307, 308].includes(response.status)) {
        const text = await response.text();
        if (text.includes(TEST_EXTERNAL_URL)) {
          test.vulnerable = true;
          if (!test.redirectedTo) test.redirectedTo = '(body contains external URL)';
        }
      }

      tests.push(test);
    } catch { /* ignore */ }
  }

  return {
    tests,
    vulnerableCount: tests.filter(t => t.vulnerable).length,
    totalTested: tests.length,
  };
};
