import { corsProxy } from './corsProxy';

interface WafChallenge {
  detected: boolean;
  type?: 'captcha' | 'javascript' | 'firewall' | 'rate-limit';
  canRetry: boolean;
}

const WAF_CHALLENGE_INDICATORS = [
  'cf-ray',
  'cf-cache-status',
  'cloudflare',
  '__cf_bm',
  'cf_clearance',
  'Attention Required',
  'Checking your browser',
  'DDoS protection by Cloudflare',
];

const CHALLENGE_REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

export const detectWafChallenge = async (url: string): Promise<WafChallenge> => {
  console.log('[WAF Challenge] Detecting protection...');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: CHALLENGE_REQUEST_HEADERS,
    });

    const headers = response.headers;
    let detected = false;
    let type: WafChallenge['type'];

    if (headers.get('cf-ray') || headers.get('cf-cache-status')) {
      detected = true;
      console.log('[WAF Challenge] Detected via headers');
    }

    if (response.status === 403 || response.status === 503) {
      const text = await response.text();

      for (const indicator of WAF_CHALLENGE_INDICATORS) {
        if (text.toLowerCase().includes(indicator.toLowerCase())) {
          detected = true;

          if (text.includes('captcha') || text.includes('hCaptcha')) {
            type = 'captcha';
          } else if (text.includes('Checking your browser')) {
            type = 'javascript';
          } else if (text.includes('firewall')) {
            type = 'firewall';
          } else if (text.includes('rate')) {
            type = 'rate-limit';
          }

          console.log(`[WAF Challenge] Detected: ${type || 'unknown'}`);
          break;
        }
      }
    }

    return {
      detected,
      type,
      canRetry: detected && type !== 'captcha',
    };
  } catch (error) {
    console.warn('[WAF Challenge] Detection failed:', error);
    return { detected: false, canRetry: true };
  }
};

export const fetchWithWafChallengeFallback = async (url: string): Promise<Response> => {
  console.log('[WAF Challenge] Attempting fallback fetch...');

  const challenge = await detectWafChallenge(url);

  if (!challenge.detected) {
    console.log('[WAF Challenge] No protection detected, direct fetch');
    return await fetch(url, { headers: CHALLENGE_REQUEST_HEADERS });
  }

  if (!challenge.canRetry) {
    console.log('[WAF Challenge] CAPTCHA challenge detected, using proxy fallback');
    return await corsProxy.fetch(url);
  }

  const fallbacks = [
    async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await fetch(url, { headers: CHALLENGE_REQUEST_HEADERS });
    },
    async () => {
      return await corsProxy.fetch(url);
    },
    async () => {
      const headers = {
        ...CHALLENGE_REQUEST_HEADERS,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      return await fetch(url, { headers });
    },
  ];

  for (let i = 0; i < fallbacks.length; i++) {
    try {
      console.log(`[WAF Challenge] Trying fallback ${i + 1}...`);
      const response = await fallbacks[i]();

      if (response.ok) {
        console.log(`[WAF Challenge] Fallback ${i + 1} succeeded`);
        return response;
      }
    } catch (error) {
      console.warn(`[WAF Challenge] Fallback ${i + 1} failed:`, error);
    }
  }

  throw new Error('All WAF challenge fallback attempts failed');
};

export const detectCloudflare = detectWafChallenge;
export const bypassCloudflare = fetchWithWafChallengeFallback;
