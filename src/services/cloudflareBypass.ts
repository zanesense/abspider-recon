import { corsProxy } from './corsProxy';

interface CloudflareChallenge {
  detected: boolean;
  type?: 'captcha' | 'javascript' | 'firewall' | 'rate-limit';
  canBypass: boolean;
}

const CLOUDFLARE_INDICATORS = [
  'cf-ray',
  'cf-cache-status',
  'cloudflare',
  '__cf_bm',
  'cf_clearance',
  'Attention Required',
  'Checking your browser',
  'DDoS protection by Cloudflare',
];

const BYPASS_HEADERS = {
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

export const detectCloudflare = async (url: string): Promise<CloudflareChallenge> => {
  console.log('[Cloudflare] Detecting protection...');
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: BYPASS_HEADERS,
    });

    const headers = response.headers;
    let detected = false;
    let type: CloudflareChallenge['type'];

    // Check headers
    if (headers.get('cf-ray') || headers.get('cf-cache-status')) {
      detected = true;
      console.log('[Cloudflare] Detected via headers');
    }

    // Check status codes
    if (response.status === 403 || response.status === 503) {
      const text = await response.text();
      
      for (const indicator of CLOUDFLARE_INDICATORS) {
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
          
          console.log(`[Cloudflare] Detected: ${type || 'unknown'}`);
          break;
        }
      }
    }

    return {
      detected,
      type,
      canBypass: detected && type !== 'captcha',
    };
  } catch (error) {
    console.warn('[Cloudflare] Detection failed:', error);
    return { detected: false, canBypass: true };
  }
};

export const bypassCloudflare = async (url: string): Promise<Response> => {
  console.log('[Cloudflare] Attempting bypass...');
  
  const challenge = await detectCloudflare(url);
  
  if (!challenge.detected) {
    console.log('[Cloudflare] No protection detected, direct fetch');
    return await fetch(url, { headers: BYPASS_HEADERS });
  }

  if (!challenge.canBypass) {
    console.log('[Cloudflare] Cannot bypass CAPTCHA, using proxy');
    return await corsProxy.fetch(url);
  }

  // Try multiple bypass techniques
  const techniques = [
    // Technique 1: Standard headers with delay
    async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await fetch(url, { headers: BYPASS_HEADERS });
    },
    
    // Technique 2: Use CORS proxy
    async () => {
      return await corsProxy.fetch(url);
    },
    
    // Technique 3: Try with different User-Agent
    async () => {
      const headers = {
        ...BYPASS_HEADERS,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      return await fetch(url, { headers });
    },
  ];

  for (let i = 0; i < techniques.length; i++) {
    try {
      console.log(`[Cloudflare] Trying bypass technique ${i + 1}...`);
      const response = await techniques[i]();
      
      if (response.ok) {
        console.log(`[Cloudflare] ✓ Bypass successful with technique ${i + 1}`);
        return response;
      }
    } catch (error) {
      console.warn(`[Cloudflare] Technique ${i + 1} failed:`, error);
    }
  }

  throw new Error('All Cloudflare bypass techniques failed');
};