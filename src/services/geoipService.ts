import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';
import { APIKeys } from './apiKeyService';
import { proxyProviderJSON } from './apiProxyClient';

export interface GeoIPResult {
  ip: string;
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
  postal?: string;
  currency?: string;
  languages?: string[];
  flag?: string;

  // Extended OpenCage fields
  state?: string;
  county?: string;
  suburb?: string;
  road?: string;
  continent?: string;
  currencyCode?: string;
  callingCode?: number;
  dms?: any;
  mgrs?: string;
  osm?: any;
  qibla?: number;
  sun?: { rise?: string; set?: string };
  formatted?: string;
  components?: Record<string, any>;
}

export const performGeoIPLookup = async (target: string, requestManager: RequestManager, apiKeys: APIKeys): Promise<GeoIPResult> => {
  console.log(`[GeoIP] Starting lookup for ${target}`);

  // Ensure apiKeys is an object, even if it somehow comes in as null/undefined
  const effectiveApiKeys = apiKeys ?? {};

  try {
    const domain = extractDomain(target);

    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
    const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000, skipProxy: true }); // Use requestManager
    const dnsData = await dnsResponse.json();

    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      throw new Error('Could not resolve domain to IP address');
    }

    const ip = dnsData.Answer[0].data;
    console.log(`[GeoIP] Resolved IP: ${ip}`);

    const result: GeoIPResult = { ip };

    // --- Try ipapi.co ---
    try {
      const ipapiUrl = `https://ipapi.co/${ip}/json/`;
      const ipapiResponse = await requestManager.fetch(ipapiUrl, { timeout: 10000, skipProxy: true }); // Use requestManager

      if (ipapiResponse.ok) {
        const data = await ipapiResponse.json();

        result.country = data.country_name;
        result.countryCode = data.country_code;
        result.region = data.region;
        result.city = data.city;
        result.latitude = data.latitude;
        result.longitude = data.longitude;
        result.timezone = data.timezone;
        result.isp = data.org;
        result.asn = data.asn;
        result.postal = data.postal;
        result.currency = data.currency;
        result.languages = data.languages?.split(',');
        result.flag = data.country_flag; // Add country flag from ipapi.co

        console.log(`[GeoIP] ✓ Data from ipapi.co`);
      }
    } catch {
      console.warn('[GeoIP] ipapi.co failed, trying alternatives...');
    }

    // --- Try ipwho.is as HTTPS fallback ---
    if (!result.country) {
      try {
        const ipApiUrl = `https://ipwho.is/${ip}?fields=success,country,country_code,region,city,latitude,longitude,timezone,connection,postal,currency`;
        const ipApiResponse = await requestManager.fetch(ipApiUrl, { timeout: 10000, skipProxy: true }); // Use requestManager

        if (ipApiResponse.ok) {
          const data = await ipApiResponse.json();

          if (data.success !== false) {
            result.country = data.country;
            result.countryCode = data.country_code;
            result.region = data.region;
            result.city = data.city;
            result.latitude = data.latitude;
            result.longitude = data.longitude;
            result.timezone = data.timezone?.id || data.timezone;
            result.isp = data.connection?.isp;
            result.org = data.connection?.org;
            result.asn = data.connection?.asn ? `AS${data.connection.asn}` : undefined;
            result.postal = data.postal;
            result.currency = data.currency?.code || data.currency;

            console.log(`[GeoIP] ✓ Data from ipwho.is`);
          }
        }
      } catch {
        console.warn('[GeoIP] ipwho.is failed');
      }
    }

    // --- Enhance with OpenCage data if API key is available ---
    const opencageKey = effectiveApiKeys.opencage;
    if (opencageKey && result.latitude && result.longitude) {
      try {
        const opencageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${result.latitude}+${result.longitude}`;
        const data = await proxyProviderJSON('opencage', opencageUrl);

          if (data.results && data.results.length > 0) {
            const location = data.results[0];

            // --- Extended OpenCage enrichment ---
            result.country = location.components.country || result.country;
            result.countryCode = location.components.country_code?.toUpperCase() || result.countryCode;
            result.city =
              location.components.city ||
              location.components.town ||
              location.components.village ||
              location.components.hamlet ||
              result.city;
            result.state = location.components.state || location.components.region || result.state;
            result.county = location.components.county || result.county;
            result.postal = location.components.postcode || result.postal;
            result.suburb = location.components.suburb || result.suburb;
            result.road = location.components.road || location.components.street || result.road;
            result.continent = location.components.continent || result.continent;
            result.flag = location.annotations?.flag || result.flag;
            result.timezone = location.annotations?.timezone?.name || result.timezone;
            result.currency = location.annotations?.currency?.name || result.currency;
            result.currencyCode = location.annotations?.currency?.iso_code || result.currencyCode;
            result.callingCode = location.annotations?.callingcode || result.callingCode;
            result.latitude = location.geometry?.lat || result.latitude;
            result.longitude = location.geometry?.lng || result.longitude;
            result.dms = location.annotations?.DMS || result.dms;
            result.mgrs = location.annotations?.MGRS || result.mgrs;
            result.osm = location.annotations?.OSM || result.osm;
            result.qibla = location.annotations?.qibla || result.qibla;
            result.sun = {
              rise: location.annotations?.sun?.rise?.apparent,
              set: location.annotations?.sun?.set?.apparent,
            };
            result.formatted = location.formatted || result.formatted;
            result.components = {
              house_number: location.components.house_number,
              neighbourhood: location.components.neighbourhood,
              city_district: location.components.city_district,
              county: location.components.county,
              state_district: location.components.state_district,
              ...result.components,
            };

            console.log(`[GeoIP] ✓ Enhanced with OpenCage data`);
          }
      } catch {
        console.warn('[GeoIP] OpenCage enhancement failed');
      }
    }

    console.log(`[GeoIP] Lookup complete for ${ip}`);
    return result;
  } catch (error: any) {
    console.error('[GeoIP] Error:', error);
    throw new Error(error.message || 'GeoIP lookup failed', { cause: error });
  }
};
