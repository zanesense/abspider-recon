import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager'; // Import RequestManager
import { APIKeys } from './apiKeyService'; // Import APIKeys interface

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
    const dnsResponse = await requestManager.fetch(dnsUrl, { timeout: 10000 }); // Use requestManager
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
      const ipapiResponse = await requestManager.fetch(ipapiUrl, { timeout: 10000 }); // Use requestManager

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

    // --- Try ip-api.com as fallback ---
    if (!result.country) {
      try {
        const ipApiUrl = `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp,org,as,zip,currency`;
        const ipApiResponse = await requestManager.fetch(ipApiUrl, { timeout: 10000 }); // Use requestManager

        if (ipApiResponse.ok) {
          const data = await ipApiResponse.json();

          if (data.status === 'success') {
            result.country = data.country;
            result.countryCode = data.countryCode;
            result.region = data.region;
            result.city = data.city;
            result.latitude = data.lat;
            result.longitude = data.lon;
            result.timezone = data.timezone;
            result.isp = data.isp;
            result.org = data.org;
            result.asn = data.as;
            result.postal = data.zip;
            result.currency = data.currency;

            console.log(`[GeoIP] ✓ Data from ip-api.com`);
          }
        }
      } catch {
        console.warn('[GeoIP] ip-api.com failed');
      }
    }

    // --- Enhance with OpenCage data if API key is available ---
    const opencageKey = effectiveApiKeys.opencage;
    if (opencageKey && result.latitude && result.longitude) {
      try {
        const opencageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${result.latitude}+${result.longitude}&key=${opencageKey}`;
        const opencageResponse = await requestManager.fetch(opencageUrl, { timeout: 10000 }); // Use requestManager

        if (opencageResponse.ok) {
          const data = await opencageResponse.json();

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
        }
      } catch {
        console.warn('[GeoIP] OpenCage enhancement failed');
      }
    }

    console.log(`[GeoIP] Lookup complete for ${ip}`);
    return result;
  } catch (error: any) {
    console.error('[GeoIP] Error:', error);
    throw new Error(error.message || 'GeoIP lookup failed');
  }
};