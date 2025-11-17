import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';
import { APIKeys } from './apiKeyService';
import { fetchJSONWithBypass } from './corsProxy';

export interface EmailEnumerationResult {
  tested: boolean;
  domain: string;
  emails: Array<{
    value: string;
    type: string;
    confidence?: number;
    sources?: Array<{ domain: string; uri: string; extracted_on: string; }>
  }>;
  organization?: string;
  disposable?: boolean;
  webmail?: boolean;
  errors?: string[];
}

export const performEmailEnumeration = async (target: string, requestManager: RequestManager, apiKeys: APIKeys): Promise<EmailEnumerationResult> => {
  const hunterKey = apiKeys.hunter;
  const domain = extractDomain(target);
  console.log(`[Email Enum] Starting enumeration for ${domain}`);

  const result: EmailEnumerationResult = {
    tested: true,
    domain,
    emails: [],
    errors: [],
  };

  if (!hunterKey) {
    result.errors.push('Hunter.io API key not configured.');
    console.warn('[Email Enum] Hunter.io API key not configured, skipping enumeration.');
    return result;
  }

  try {
    const hunterApiUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}`;
    const { data: hunterData } = await fetchJSONWithBypass(hunterApiUrl, {
      timeout: 15000,
      signal: requestManager.scanController?.signal,
    });

    if (hunterData.data) {
      result.organization = hunterData.data.organization;
      result.disposable = hunterData.data.disposable;
      result.webmail = hunterData.data.webmail;

      if (hunterData.data.emails && hunterData.data.emails.length > 0) {
        result.emails = hunterData.data.emails.map((email: any) => ({
          value: email.value,
          type: email.type,
          confidence: email.confidence,
          sources: email.sources,
        }));
        console.log(`[Email Enum] Found ${result.emails.length} emails via Hunter.io`);
      } else {
        console.log(`[Email Enum] No emails found for ${domain} via Hunter.io`);
      }
    } else if (hunterData.errors) {
      const errorMsg = hunterData.errors.map((e: any) => e.details || e.message).join(', ');
      result.errors.push(`Hunter.io API error: ${errorMsg}`);
      console.warn(`[Email Enum] Hunter.io API error: ${errorMsg}`);
    }

    console.log(`[Email Enum] Complete for ${domain}`);
    return result;

  } catch (error: any) {
    console.error('[Email Enum] Error during enumeration:', error);
    result.errors.push(`General error: ${error.message}`);
    return result;
  }
};