import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';
import { fetchJSONWithBypass } from './corsProxy';
import { format } from 'date-fns';

export interface SslTlsResult {
  tested: boolean;
  domain: string;
  certificateIssuer?: string;
  certificateSubject?: string;
  validFrom?: string;
  validTo?: string;
  serialNumber?: string;
  fingerprintSha256?: string;
  commonNames?: string[];
  altNames?: string[];
  isExpired?: boolean;
  daysUntilExpiry?: number;
  errors?: string[];
}

export const performSslTlsAnalysis = async (target: string, requestManager: RequestManager): Promise<SslTlsResult> => {
  const domain = extractDomain(target);
  console.log(`[SSL/TLS] Starting analysis for ${domain}`);

  const result: SslTlsResult = {
    tested: true,
    domain,
    errors: [],
  };

  try {
    // Use crt.sh to get certificate details
    const crtShUrl = `https://crt.sh/?q=${domain}&output=json`;
    const { data: crtData } = await fetchJSONWithBypass(crtShUrl, {
      timeout: 15000,
      signal: requestManager.scanController?.signal,
    });

    if (Array.isArray(crtData) && crtData.length > 0) {
      // Find the most recent valid certificate
      const validCerts = crtData
        .filter(cert => cert.not_before && cert.not_after)
        .sort((a, b) => new Date(b.not_before).getTime() - new Date(a.not_before).getTime()); // Sort by most recent

      if (validCerts.length > 0) {
        const latestCert = validCerts[0];

        result.certificateIssuer = latestCert.issuer_name;
        result.certificateSubject = latestCert.subject_name;
        result.validFrom = latestCert.not_before ? format(new Date(latestCert.not_before), 'PPP') : undefined;
        result.validTo = latestCert.not_after ? format(new Date(latestCert.not_after), 'PPP') : undefined;
        result.serialNumber = latestCert.serial_number;
        result.fingerprintSha256 = latestCert.pubkey_info?.sha256; // crt.sh might not always provide this directly in JSON

        // Extract common names and alt names
        const nameValues = latestCert.name_value ? latestCert.name_value.split('\n') : [];
        result.commonNames = nameValues.filter((name: string) => name.startsWith(domain) && !name.startsWith('*'));
        result.altNames = nameValues.filter((name: string) => name !== domain && name.endsWith(domain));

        // Check expiry
        if (latestCert.not_after) {
          const expiryDate = new Date(latestCert.not_after);
          const now = new Date();
          result.isExpired = expiryDate < now;
          result.daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        console.log(`[SSL/TLS] Certificate details fetched for ${domain}`);
      } else {
        result.errors.push('No valid certificates found on crt.sh for this domain.');
        console.warn('[SSL/TLS] No valid certificates found on crt.sh.');
      }
    } else {
      result.errors.push('No certificate data found on crt.sh for this domain.');
      console.warn('[SSL/TLS] No certificate data found on crt.sh.');
    }

    console.log(`[SSL/TLS] Analysis complete for ${domain}`);
    return result;

  } catch (error: any) {
    console.error('[SSL/TLS] Error during analysis:', error);
    result.errors.push(`Failed to perform SSL/TLS analysis: ${error.message}`);
    return result;
  }
};