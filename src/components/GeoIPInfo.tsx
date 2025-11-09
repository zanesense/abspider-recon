import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Globe, Wifi, Clock } from 'lucide-react';

interface GeoIPInfoProps {
  geoip: {
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
  };
}

const GeoIPInfo = ({ geoip }: GeoIPInfoProps) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-400" />
          GeoIP Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                IP Address
              </p>
              <p className="text-white font-mono">{geoip.ip || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </p>
              <p className="text-white">
                {[geoip.city, geoip.region, geoip.country].filter(Boolean).join(', ') || 'N/A'}
              </p>
              {geoip.countryCode && (
                <p className="text-sm text-slate-500 mt-1">Country Code: {geoip.countryCode}</p>
              )}
            </div>
            {(geoip.latitude && geoip.longitude) && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Coordinates</p>
                <p className="text-white font-mono text-sm">
                  {geoip.latitude.toFixed(4)}, {geoip.longitude.toFixed(4)}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {geoip.timezone && (
              <div>
                <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timezone
                </p>
                <p className="text-white">{geoip.timezone}</p>
              </div>
            )}
            {geoip.isp && (
              <div>
                <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  ISP / Organization
                </p>
                <p className="text-white">{geoip.isp}</p>
              </div>
            )}
            {geoip.asn && (
              <div>
                <p className="text-sm text-slate-400 mb-1">ASN</p>
                <p className="text-white font-mono">{geoip.asn}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeoIPInfo;