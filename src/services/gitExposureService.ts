import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const EXPOSURE_PATHS = [
  '/.git/HEAD',
  '/.git/config',
  '/.env',
  '/.env.example',
  '/.env.backup',
  '/.gitignore',
  '/.htaccess',
  '/config.json',
  '/config.js',
  '/config.php',
  '/backup.sql',
  '/dump.sql',
  '/db.sql',
  '/wp-config.php.bak',
  '/.svn/entries',
  '/.DS_Store',
  '/composer.json',
  '/package.json',
  '/npm-debug.log',
  '/yarn-error.log',
];

export interface ExposureFile {
  path: string;
  exposed: boolean;
  statusCode: number;
  preview?: string;
}

export interface GitExposureResult {
  files: ExposureFile[];
  totalExposed: number;
  criticalExposed: number;
}

export const performGitExposureCheck = async (target: string, requestManager: RequestManager): Promise<GitExposureResult> => {
  const domain = extractDomain(target);
  console.log(`[Git Exposure] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const files: ExposureFile[] = [];
  let totalExposed = 0;
  let criticalExposed = 0;

  for (const path of EXPOSURE_PATHS) {
    try {
      const url = `${baseUrl}${path}`;
      const response = await requestManager.fetch(url, { method: 'GET', timeout: 10000 });

      if (response.status === 200) {
        const exposed: ExposureFile = {
          path,
          exposed: true,
          statusCode: response.status,
        };

        const text = await response.text();
        exposed.preview = text.substring(0, 200);

        files.push(exposed);
        totalExposed++;

        const critical = path.includes('.git') || path.includes('.env') || path.includes('backup') || path.includes('dump') || path.includes('sql');
        if (critical) criticalExposed++;
      }
    } catch {
      // file not found or unreachable
    }
  }

  return { files, totalExposed, criticalExposed };
};
