import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const BUCKET_SUFFIXES = [
  '', '-assets', '-backup', '-files', '-data', '-storage', '-uploads',
  '-public', '-static', '-media', '-content', '-dev', '-stage', '-prod',
  '-logs', '-config', '-db', '-images', '-docs', '-resources', '-archive',
  ' backup', ' files', ' data', ' storage', '-bucket',
];

export interface S3BucketInfo {
  name: string;
  accessible: boolean;
  listing: boolean;
  statusCode: number;
}

export interface S3BucketResult {
  buckets: S3BucketInfo[];
  openBuckets: number;
  totalChecked: number;
}

const checkBucket = async (bucketName: string, requestManager: RequestManager): Promise<S3BucketInfo> => {
  const info: S3BucketInfo = { name: bucketName, accessible: false, listing: false, statusCode: 0 };

  try {
    const response = await requestManager.fetch(
      `http://${bucketName}.s3.amazonaws.com/`,
      { method: 'GET', timeout: 8000 }
    );
    info.statusCode = response.status;

    if (response.status === 200) {
      info.accessible = true;
      const text = await response.text();
      info.listing = text.includes('<ListBucketResult') || text.includes('<Contents>');
    } else if (response.status === 403) {
      info.accessible = true; // bucket exists but access denied
    }
  } catch {
    // bucket doesn't exist
  }

  return info;
};

export const performS3BucketDiscovery = async (target: string, requestManager: RequestManager): Promise<S3BucketResult> => {
  const domain = extractDomain(target);
  const baseName = domain.replace(/^www\./, '').split('.')[0];
  console.log(`[S3 Bucket Discovery] Starting for ${domain}`);

  const checked = new Set<string>();
  const buckets: S3BucketInfo[] = [];

  const candidates = [
    domain,
    baseName,
    `${baseName}-${domain.split('.').slice(-2, -1)[0] || 'app'}`,
  ];

  for (const candidate of candidates) {
    for (const suffix of BUCKET_SUFFIXES) {
      const name = `${candidate}${suffix}`;
      if (checked.has(name)) continue;
      checked.add(name);

      const info = await checkBucket(name, requestManager);
      if (info.accessible || info.statusCode !== 0) {
        buckets.push(info);
      }
    }
  }

  return {
    buckets,
    openBuckets: buckets.filter(b => b.listing).length,
    totalChecked: checked.size,
  };
};
