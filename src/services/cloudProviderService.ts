import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const CLOUD_SIGNATURES: {
  name: string;
  headers?: Record<string, RegExp>;
  serverPattern?: RegExp;
  cnamePattern?: RegExp;
  asnPatterns?: number[];
}[] = [
  {
    name: 'Amazon Web Services',
    headers: {
      'x-amz-request-id': /.*/,
      'x-amz-id-2': /.*/,
      'x-amz-cf-id': /.*/,
      'x-amz-cf-pop': /.*/,
    },
    serverPattern: /(AmazonS3|CloudFront|awselb)/i,
    cnamePattern: /\.(amazonaws\.com|cloudfront\.net|elb\.amazonaws\.com)$/i,
    asnPatterns: [16509, 14618, 7224, 8987],
  },
  {
    name: 'Google Cloud Platform',
    headers: {
      'x-goog-*': /.*/,
    },
    serverPattern: /^Google\s/i,
    cnamePattern: /\.(cdn\.google\.com|googleusercontent\.com|gcp\.gov)|c\.googleservices\.com$/i,
    asnPatterns: [15169, 396982, 36492, 36040, 19527],
  },
  {
    name: 'Microsoft Azure',
    headers: {
      'x-azure-*': /.*/,
    },
    serverPattern: /Azure/i,
    cnamePattern: /\.(azureedge\.net|azurewebsites\.net|trafficmanager\.net|cloudapp\.net|azurefd\.net)$/i,
    asnPatterns: [8075, 12076, 6584],
  },
  {
    name: 'DigitalOcean',
    serverPattern: /DigitalOcean/i,
    cnamePattern: /\.digitaloceanspaces\.com$/i,
    asnPatterns: [14061, 203323],
  },
  {
    name: 'OVH',
    serverPattern: /OVH/i,
    asnPatterns: [16276, 35540],
  },
  {
    name: 'Linode',
    serverPattern: /Linode/i,
    asnPatterns: [63949, 3598],
  },
  {
    name: 'Vultr',
    serverPattern: /Vultr/i,
    asnPatterns: [20473],
  },
  {
    name: 'Heroku',
    headers: {
      'x-heroku-*': /.*/,
    },
    serverPattern: /Heroku/i,
    cnamePattern: /\.herokuapp\.com$/i,
  },
  {
    name: 'Alibaba Cloud',
    headers: {
      'x-aliyun-*': /.*/,
    },
    serverPattern: /Aliyun/i,
    cnamePattern: /\.alicdn\.com$/i,
    asnPatterns: [37963, 45090],
  },
  {
    name: 'Oracle Cloud',
    serverPattern: /Oracle/i,
    cnamePattern: /\.oraclecloud\.com$/i,
    asnPatterns: [31898, 394655],
  },
  {
    name: 'IBM Cloud',
    serverPattern: /IBM/i,
    cnamePattern: /\.(cloudibm\.com|appdomain\.cloud)$/i,
    asnPatterns: [36351, 13425],
  },
];

export interface CloudProvider {
  name: string;
  detected: boolean;
  evidence: string[];
}

export interface CloudProviderResult {
  providers: CloudProvider[];
  detectedCount: number;
  target: string;
}

export const performCloudProviderDetection = async (target: string, requestManager: RequestManager): Promise<CloudProviderResult> => {
  const domain = extractDomain(target);
  console.log(`[Cloud Provider Detection] Starting for ${domain}`);

  const detected: CloudProvider[] = CLOUD_SIGNATURES.map(c => ({ name: c.name, detected: false, evidence: [] }));

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

    CLOUD_SIGNATURES.forEach((cloud, index) => {
      if (cloud.serverPattern && cloud.serverPattern.test(serverHeader)) {
        detected[index].detected = true;
        detected[index].evidence.push(`Server header: ${serverHeader}`);
      }

      if (cloud.headers) {
        Object.entries(cloud.headers).forEach(([headerKey, _pattern]) => {
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
    console.warn(`[Cloud Provider Detection] Failed to fetch headers:`, error);
  }

  // Check CNAME records for cloud provider patterns
  try {
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=CNAME`;
    const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000, skipProxy: true });
    const dnsData = await dnsResponse.json();

    if (dnsData.Answer) {
      dnsData.Answer.forEach((record: any) => {
        const cnameValue = record.data.toLowerCase();
        CLOUD_SIGNATURES.forEach((cloud, index) => {
          if (cloud.cnamePattern && cloud.cnamePattern.test(cnameValue)) {
            detected[index].detected = true;
            detected[index].evidence.push(`CNAME record: ${cnameValue}`);
          }
        });
      });
    }
  } catch (error) {
    console.warn(`[Cloud Provider Detection] Failed to query CNAME:`, error);
  }

  return {
    providers: detected,
    detectedCount: detected.filter(c => c.detected).length,
    target: domain,
  };
};
