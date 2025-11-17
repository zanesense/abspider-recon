import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';
import { APIKeys } from './apiKeyService';
import { fetchJSONWithBypass } from './corsProxy';

export interface VirusTotalResult {
  tested: boolean;
  domain: string;
  reputation?: number; // -10 to 10, lower is worse
  lastAnalysisDate?: string;
  maliciousVotes?: number;
  harmlessVotes?: number;
  categories?: string[];
  registrar?: string;
  whois?: string;
  detectedUrls?: Array<{ url: string; positives: number; total: number }>;
  detectedCommunicatingFiles?: Array<{ sha256: string; filename: string; positives: number }>;
  errors?: string[];
}

export const performVirusTotalScan = async (target: string, requestManager: RequestManager, apiKeys: APIKeys): Promise<VirusTotalResult> => {
  const virustotalKey = apiKeys.virustotal;
  const domain = extractDomain(target);
  console.log(`[VirusTotal] Starting scan for ${domain}`);

  const result: VirusTotalResult = {
    tested: true,
    domain,
    errors: [],
  };

  if (!virustotalKey) {
    result.errors.push('VirusTotal API key not configured.');
    console.warn('[VirusTotal] API key not configured, skipping scan.');
    return result;
  }

  try {
    // Get domain report
    try {
      const domainReportUrl = `https://www.virustotal.com/api/v3/domains/${domain}`;
      const { data: domainData } = await fetchJSONWithBypass(domainReportUrl, {
        headers: {
          'x-apikey': virustotalKey,
          'Accept': 'application/json',
        },
        timeout: 15000,
        signal: requestManager.scanController?.signal,
      });

      if (domainData.data) {
        const attributes = domainData.data.attributes;
        result.reputation = attributes.reputation;
        result.lastAnalysisDate = attributes.last_analysis_date ? new Date(attributes.last_analysis_date * 1000).toISOString() : undefined;
        result.maliciousVotes = attributes.last_analysis_stats?.malicious || 0;
        result.harmlessVotes = attributes.last_analysis_stats?.harmless || 0;
        result.categories = Object.values(attributes.categories || {});
        result.registrar = attributes.registrar;
        result.whois = attributes.whois;
        
        console.log(`[VirusTotal] Domain report fetched for ${domain}`);
      } else if (domainData.error) {
        result.errors.push(`Domain report error: ${domainData.error.message}`);
        console.warn(`[VirusTotal] Domain report error: ${domainData.error.message}`);
      }
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Resource not found')) {
        console.warn(`[VirusTotal] Domain report not found for ${domain} (expected for new/unknown domains).`);
      } else {
        result.errors.push(`Failed to fetch domain report: ${error.message}`);
        console.error(`[VirusTotal] Failed to fetch domain report: ${error.message}`);
      }
    }

    // Get detected URLs (if any)
    try {
      const detectedUrlsUrl = `https://www.virustotal.com/api/v3/domains/${domain}/detected_urls`;
      const { data: urlsData } = await fetchJSONWithBypass(detectedUrlsUrl, {
        headers: {
          'x-apikey': virustotalKey,
          'Accept': 'application/json',
        },
        timeout: 15000,
        signal: requestManager.scanController?.signal,
      });

      if (urlsData.data && urlsData.data.length > 0) {
        result.detectedUrls = urlsData.data.map((item: any) => ({
          url: item.id,
          positives: item.attributes.last_analysis_stats?.malicious || 0,
          total: Object.keys(item.attributes.last_analysis_results || {}).length,
        }));
        console.log(`[VirusTotal] Found ${result.detectedUrls.length} detected URLs.`);
      } else if (urlsData.error) {
        result.errors.push(`Detected URLs error: ${urlsData.error.message}`);
        console.warn(`[VirusTotal] Detected URLs error: ${urlsData.error.message}`);
      }
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Resource not found')) {
        console.warn(`[VirusTotal] No detected URLs found for ${domain}.`);
      } else {
        result.errors.push(`Failed to fetch detected URLs: ${error.message}`);
        console.error(`[VirusTotal] Failed to fetch detected URLs: ${error.message}`);
      }
    }

    // Get detected communicating files (if any)
    try {
      const communicatingFilesUrl = `https://www.virustotal.com/api/v3/domains/${domain}/communicating_files`;
      const { data: filesData } = await fetchJSONWithBypass(communicatingFilesUrl, {
        headers: {
          'x-apikey': virustotalKey,
          'Accept': 'application/json',
        },
        timeout: 15000,
        signal: requestManager.scanController?.signal,
      });

      if (filesData.data && filesData.data.length > 0) {
        result.detectedCommunicatingFiles = filesData.data.map((item: any) => ({
          sha256: item.id,
          filename: item.attributes.meaningful_name || 'N/A',
          positives: item.attributes.last_analysis_stats?.malicious || 0,
        }));
        console.log(`[VirusTotal] Found ${result.detectedCommunicatingFiles.length} communicating files.`);
      } else if (filesData.error) {
        result.errors.push(`Communicating files error: ${filesData.error.message}`);
        console.warn(`[VirusTotal] Communicating files error: ${filesData.error.message}`);
      }
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Resource not found')) {
        console.warn(`[VirusTotal] No communicating files found for ${domain}.`);
      } else {
        result.errors.push(`Failed to fetch communicating files: ${error.message}`);
        console.error(`[VirusTotal] Failed to fetch communicating files: ${error.message}`);
      }
    }

    console.log(`[VirusTotal] Scan complete for ${domain}`);
    return result;

  } catch (error: any) {
    // This catch block will only be hit if the initial API key check or a very general error occurs
    console.error('[VirusTotal] General error during scan:', error);
    result.errors.push(`General VirusTotal scan error: ${error.message}`);
    return result;
  }
};