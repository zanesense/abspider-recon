import { extractDomain } from './apiUtils';

export interface GeoIPResult {
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  asn?: string;
}

const resolveToIP = async (domain: string): Promise<string | null> => {
  try {
    console.log(`[GeoIP] Resolving ${domain} to IP...`);
    
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
    const response = await fetch(dnsUrl);
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      const ip = data.Answer[0].data;
      console.log(`[GeoIP] Resolved ${domain} to ${ip}`);
      return ip;
    }
    
    return null;
  } catch (error) {
    console.error('[GeoIP] DNS resolution failed:', error);
    return null;
  }
};

export const performGeoIPLookup = async (target: string): Promise<GeoIPResult> => {
  try {
    const domain = extractDomain(target);
    console.log(`[GeoIP] Starting lookup for ${domain}`);

    const ip = await resolveToIP(domain);
    
    if (!ip) {
      throw new Error('Could not resolve domain to IP address');
    }

    const result: GeoIPResult = { ip };

    const ipApiUrl = `https://ipapi.co/${ip}/json/`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[GeoIP] Request timeout, aborting...');
      controller.abort();
    }, 10000);
    
    let response: Response;
    
    try {
      response = await fetch(ipApiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.warn(`[GeoIP] ipapi.co fetch failed: ${fetchError.message}`);
      return result;
    }
    
    if (!response.ok) {
      console.warn(`[GeoIP] ipapi.co returned status ${response.status}`);
      return result;
    }

    const data = await response.json();
    
    if (data.error) {
      console.warn(`[GeoIP] API error: ${data.reason}`);
      return result;
    }
    
    console.log(`[GeoIP] Retrieved data for ${domain}`);

    result.country = data.country_name;
    result.countryCode = data.country_code;
    result.region = data.region;
    result.city = data.city;
    result.latitude = data.latitude;
    result.longitude = data.longitude;
    result.timezone = data.timezone;
    result.isp = data.org;
    result.asn = data.asn;

    console.log(`[GeoIP] Lookup complete for ${domain}`);
    
    return result;
  } catch (error: any) {
    console.error('[GeoIP] Critical error:', error);
    throw error;
  }
};