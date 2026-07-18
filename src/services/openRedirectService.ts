import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const REDIRECT_PARAMS = [
  'url', 'redirect', 'redirect_uri', 'redirect_url', 'return', 'return_to',
  'return_path', 'next', 'goto', 'target', 'destination', 'out', 'view',
  'image_url', 'go', 'to', 'link', 'ref', 'source', 'u', 'r', 'qurl',
];

const TEST_EXTERNAL_URL = 'https://example.com';
const TEST_EXTERNAL_ORIGIN = new URL(TEST_EXTERNAL_URL).origin;

const pointsToTestOrigin = (value: string, baseUrl: string) => {
  try {
    return new URL(value, baseUrl).origin === TEST_EXTERNAL_ORIGIN;
  } catch {
    return false;
  }
};

const hasExternalRedirectParam = (value: string, baseUrl: string) => {
  try {
    const url = new URL(value, baseUrl);
    return REDIRECT_PARAMS.some((param) => {
      const candidate = url.searchParams.get(param);
      return candidate ? pointsToTestOrigin(candidate, baseUrl) : false;
    });
  } catch {
    return false;
  }
};

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
        test.vulnerable = pointsToTestOrigin(location, baseUrl) || hasExternalRedirectParam(location, baseUrl);
      }

      // Also check response body for meta/JS redirects
      if ([200, 302, 301, 307, 308].includes(response.status)) {
        const text = await response.text();
        const document = new DOMParser().parseFromString(text, 'text/html');
        const metaRedirect = Array.from(document.querySelectorAll('meta[http-equiv]')).some((meta) => {
          if (meta.getAttribute('http-equiv')?.toLowerCase() !== 'refresh') return false;
          const candidate = meta.getAttribute('content')?.match(/(?:^|;)\s*url\s*=\s*["']?([^"']+)["']?\s*$/i)?.[1];
          return candidate ? pointsToTestOrigin(candidate, baseUrl) : false;
        });
        const scriptRedirect = Array.from(document.scripts).some((script) => {
          const source = script.textContent || '';
          const assignment = source.match(/(?:window\.)?location(?:\.href)?\s*=\s*(["'])(.*?)\1/i)?.[2];
          const method = source.match(/(?:window\.)?location\.(?:assign|replace)\s*\(\s*(["'])(.*?)\1\s*\)/i)?.[2];
          const candidate = assignment || method;
          return candidate ? pointsToTestOrigin(candidate, baseUrl) : false;
        });
        if (metaRedirect || scriptRedirect) {
          test.vulnerable = true;
          if (!test.redirectedTo) test.redirectedTo = '(body performs external redirect)';
        }
      }

      tests.push(test);
    } catch (e) {
      console.warn(`[OpenRedirect] Error testing param ${param}:`, e);
    }
  }

  return {
    tests,
    vulnerableCount: tests.filter(t => t.vulnerable).length,
    totalTested: tests.length,
  };
};
