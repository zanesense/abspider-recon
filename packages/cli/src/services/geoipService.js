import { extractDomain } from './apiUtils.js';
import { httpFetchWithRetry } from './proxyFetch.js';
import dns from 'node:dns/promises';

export async function performGeoIPLookup(target, options = {}) {
  const domain = extractDomain(target);
  const timeout = options.timeout || 15000;

  const result = { ip: '' };

  try {
    const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
    const dnsRes = await httpFetchWithRetry(dnsUrl, { timeout: 10000, retries: 1 });
    if (dnsRes.ok) {
      const dnsData = await dnsRes.json();
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        result.ip = dnsData.Answer[0].data;
      }
    }
  } catch (dnsError) {
    console.warn('[GeoIP] DNS A lookup via dns.google failed:', dnsError.message);
  }

  if (!result.ip) {
    try {
      const records = await dns.resolve4(domain);
      if (records && records.length > 0) {
        result.ip = records[0];
        console.log('[GeoIP] Resolved IP via native DNS');
      }
    } catch (nativeError) {
      console.warn('[GeoIP] Native DNS A lookup also failed:', nativeError.message);
    }
  }

  if (!result.ip) {
    const error = new Error('Could not resolve domain to IP address');
    error.code = 'EIPRESOLVE';
    throw error;
  }

  try {
    const ipapiUrl = `https://ipapi.co/${result.ip}/json/`;
    const ipapiRes = await httpFetchWithRetry(ipapiUrl, { timeout, retries: 1 });
    if (ipapiRes.ok) {
      const data = await ipapiRes.json();
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
      result.languages = data.languages ? data.languages.split(',') : undefined;
      result.flag = data.country_flag;
      result.found = true;
      result.source = 'ipapi.co';
    }
  } catch (ipapiError) {
    console.warn('[GeoIP] ipapi.co failed:', ipapiError.message);
  }

  if (!result.found) {
    try {
      const ipApiUrl = `http://ip-api.com/json/${result.ip}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp,org,as,zip,currency`;
      const ipApiRes = await httpFetchWithRetry(ipApiUrl, { timeout, retries: 1 });
      if (ipApiRes.ok) {
        const data = await ipApiRes.json();
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
          result.found = true;
          result.source = 'ip-api.com';
        }
      }
    } catch (ipApiError) {
      console.warn('[GeoIP] ip-api.com failed:', ipApiError.message);
    }
  }

  const opencageKey = options.opencageKey;
  if (opencageKey && result.latitude != null && result.longitude != null) {
    try {
      const ocUrl = `https://api.opencagedata.com/geocode/v1/json?q=${result.latitude}+${result.longitude}&key=${opencageKey}`;
      const ocRes = await httpFetchWithRetry(ocUrl, { timeout, retries: 1 });
      if (ocRes.ok) {
        const ocData = await ocRes.json();
        if (ocData.results && ocData.results.length > 0) {
          const loc = ocData.results[0];
          result.country = loc.components.country || result.country;
          result.countryCode = (loc.components.country_code || '').toUpperCase() || result.countryCode;
          result.city = loc.components.city || loc.components.town || loc.components.village || result.city;
          result.state = loc.components.state || loc.components.region;
          result.county = loc.components.county;
          result.suburb = loc.components.suburb;
          result.road = loc.components.road || loc.components.street;
          result.continent = loc.components.continent;
          result.timezone = loc.annotations?.timezone?.name || result.timezone;
          result.currency = loc.annotations?.currency?.name || result.currency;
          result.flag = loc.annotations?.flag || result.flag;
          result.formatted = loc.formatted;
          result.reverseGeocoding = {
            source: 'opencage',
            confidence: loc.confidence,
          };
          result.source = result.source || 'opencage';
        }
      }
    } catch (ocError) {
      console.warn('[GeoIP] OpenCage failed:', ocError.message);
    }
  }

  return result;
}
