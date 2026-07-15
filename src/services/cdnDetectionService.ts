import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

export const hasCloudflareHeaders = (headers: Headers): boolean => Boolean(
  headers.get('cf-ray') ||
  headers.get('cf-cache-status') ||
  /^cloudflare(?:$|[\s/])/i.test(headers.get('server') || '')
);

const CDN_SIGNATURES: { name: string; headers?: Record<string, RegExp>; serverPattern?: RegExp; cnamePattern?: RegExp }[] = [
  {
    name: 'Cloudflare',
    headers: {
      'cf-ray': /.*/,
      'cf-cache-status': /.*/,
      'cf-request-id': /.*/,
    },
    serverPattern: /^cloudflare/i,
  },
  {
    name: 'Akamai',
    headers: {
      'x-akamai-*': /.*/,
      'x-check-cacheable': /.*/,
      'x-akamai-transformed': /.*/,
    },
    serverPattern: /Akamai/i,
  },
  {
    name: 'Fastly',
    headers: {
      'x-cache': /.*/,
      'x-served-by': /.*/,
      'x-timer': /.*/,
    },
    serverPattern: /Fastly/i,
  },
  {
    name: 'Amazon CloudFront',
    headers: {
      'x-amz-cf-id': /.*/,
      'x-amz-cf-pop': /.*/,
    },
    serverPattern: /CloudFront/i,
    cnamePattern: /\.cloudfront\.net$/i,
  },
  {
    name: 'AWS S3',
    headers: {
      'x-amz-request-id': /.*/,
      'x-amz-id-2': /.*/,
    },
    serverPattern: /AmazonS3/i,
  },
  {
    name: 'StackPath',
    serverPattern: /StackPath/i,
  },
  {
    name: 'Imperva Incapsula',
    headers: {
      'x-iinfo': /.*/,
    },
    serverPattern: /Incapsula/i,
    cnamePattern: /\.incapdns\.net$/i,
  },
  {
    name: 'Sucuri',
    headers: {
      'x-sucuri-id': /.*/,
      'x-sucuri-cache': /.*/,
    },
    serverPattern: /Sucuri/i,
    cnamePattern: /\.sucuri\.net$/i,
  },
  {
    name: 'BunnyCDN',
    serverPattern: /BunnyCDN/i,
    cnamePattern: /\.bunnycdn\.com$/i,
  },
  {
    name: 'KeyCDN',
    headers: {
      'x-keycdn-*': /.*/,
    },
    serverPattern: /KeyCDN/i,
  },
  {
    name: 'CacheFly',
    cnamePattern: /\.cachefly\.net$/i,
  },
  {
    name: 'jsDelivr',
    cnamePattern: /\.jsdelivr\.net$/i,
  },
  {
    name: 'Azure CDN',
    headers: {
      'x-azure-*': /.*/,
    },
    serverPattern: /Azure/i,
    cnamePattern: /\.azureedge\.net$/i,
  },
  {
    name: 'Google Cloud CDN',
    headers: {
      'x-goog-*': /.*/,
    },
    serverPattern: /^Google\s/i,
    cnamePattern: /\.cdn\.google\.com$/i,
  },
];

export interface CDNDetection {
  name: string;
  detected: boolean;
  evidence: string[];
}

export interface CDNDetectionResult {
  cdns: CDNDetection[];
  detectedCount: number;
  target: string;
}

export const performCDNDetection = async (target: string, requestManager: RequestManager): Promise<CDNDetectionResult> => {
  const domain = extractDomain(target);
  console.log(`[CDN Detection] Starting for ${domain}`);

  const detected: CDNDetection[] = CDN_SIGNATURES.map(cdn => ({ name: cdn.name, detected: false, evidence: [] }));

  // Check response headers
  try {
    const url = target.startsWith('http') ? target : `https://${target}`;
    const response = await requestManager.fetch(url, {
      method: 'HEAD',
      timeout: 15000,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const serverHeader = headers['server'] || '';

    CDN_SIGNATURES.forEach((cdn, index) => {
      // Check server header
      if (cdn.serverPattern && cdn.serverPattern.test(serverHeader)) {
        detected[index].detected = true;
        detected[index].evidence.push(`Server header: ${serverHeader}`);
      }

      // Check other specific headers
      if (cdn.headers) {
        Object.entries(cdn.headers).forEach(([headerKey, _pattern]) => {
          const wildcardKey = headerKey.replace(/\*$/, '');
          const matchingHeaders = Object.entries(headers).filter(([k]) =>
            headerKey.endsWith('*') ? k.startsWith(wildcardKey) : k === headerKey
          );
          matchingHeaders.forEach(([k, v]) => {
            detected[index].detected = true;
            detected[index].evidence.push(`Header ${k}: ${v.substring(0, 100)}`);
          });
        });
      }
    });
  } catch (error) {
    console.warn(`[CDN Detection] Failed to fetch headers:`, error);
  }

  // Check CNAME records for CDN patterns
  try {
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=CNAME`;
    const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000, skipProxy: true });
    const dnsData = await dnsResponse.json();

    if (dnsData.Answer) {
      dnsData.Answer.forEach((record: any) => {
        const cnameValue = record.data.toLowerCase();
        CDN_SIGNATURES.forEach((cdn, index) => {
          if (cdn.cnamePattern && cdn.cnamePattern.test(cnameValue)) {
            detected[index].detected = true;
            detected[index].evidence.push(`CNAME record: ${cnameValue}`);
          }
        });
      });
    }
  } catch (error) {
    console.warn(`[CDN Detection] Failed to query CNAME:`, error);
  }

  return {
    cdns: detected,
    detectedCount: detected.filter(c => c.detected).length,
    target: domain,
  };
};
