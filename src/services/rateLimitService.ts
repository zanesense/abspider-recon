import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

export interface RateLimitResult {
  rateLimited: boolean;
  statusCodes: number[];
  requestsSent: number;
  requestsBlocked: number;
  details: string;
  rateLimitHeaders: Record<string, string>;
}

export const performRateLimitTest = async (target: string, requestManager: RequestManager): Promise<RateLimitResult> => {
  const domain = extractDomain(target);
  console.log(`[Rate Limit] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const statusCodes: number[] = [];
  const rateLimitHeaders: Record<string, string> = {};
  let requestsBlocked = 0;
  let details = '';

  // Send rapid sequential requests
  for (let i = 0; i < 20; i++) {
    try {
      const response = await requestManager.fetch(baseUrl, {
        method: 'GET',
        timeout: 5000,
      });

      statusCodes.push(response.status);

      // Check rate limit headers
      if (i === 0) {
        const relevantHeaders = ['retry-after', 'x-ratelimit-remaining', 'x-ratelimit-limit', 'x-ratelimit-reset', 'rate-limit'];
        relevantHeaders.forEach(h => {
          const val = response.headers.get(h);
          if (val) rateLimitHeaders[h] = val;
        });
      }

      if (response.status === 429) {
        requestsBlocked++;
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          details = `Rate limited after ${i + 1} requests. Retry-After: ${retryAfter}s`;
        }
      }
    } catch {
      // Network errors are not rate limiting — just skip
    }
  }

  if (requestsBlocked === 0 && Object.keys(rateLimitHeaders).length > 0) {
    details = 'Rate limit headers detected but no blocking occurred within 20 requests';
  } else if (requestsBlocked === 0) {
    details = 'No rate limiting detected within 20 rapid requests';
  } else if (!details) {
    details = `Rate limited: ${requestsBlocked}/${20} requests blocked`;
  }

  return {
    rateLimited: requestsBlocked > 0,
    statusCodes,
    requestsSent: 20,
    requestsBlocked,
    details,
    rateLimitHeaders,
  };
};
