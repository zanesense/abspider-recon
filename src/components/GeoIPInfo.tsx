import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface GeoIPInfoProps {
  geoip: {
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
  };
}

const GeoIPInfo = ({ geoip }: GeoIPInfoProps) => {
  const fields = [
    { label: 'IP Address', value: geoip.ip },
    { label: 'Country', value: geoip.country ? `${geoip.country} ${geoip.countryCode ? `(${geoip.countryCode})` : ''}` : 'N/A', flag: geoip.flag },
    { label: 'City / Region', value: geoip.city ? `${geoip.city}${geoip.region ? ` / ${geoip.region}` : ''}` : 'N/A' },
    { label: 'Coordinates', value: geoip.latitude && geoip.longitude ? `${geoip.latitude.toFixed(4)}, ${geoip.longitude.toFixed(4)}` : 'N/A' },
    { label: 'ISP / Organization', value: geoip.isp || geoip.org || 'N/A' },
    { label: 'ASN', value: geoip.asn || 'N/A' },
    { label: 'Timezone', value: geoip.timezone || 'N/A' },
    { label: 'Postal Code', value: geoip.postal || 'N/A' },
    { label: 'Currency', value: geoip.currency || 'N/A' },
    { label: 'Languages', value: geoip.languages?.length ? geoip.languages.join(', ') : 'N/A' },
  ];

  const mid = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, mid);
  const rightFields = fields.slice(mid);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-500" />
          GeoIP Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {leftFields.map((f) => (
              <div key={f.label} className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">{f.label}</p>
                <p className="text-foreground font-mono flex items-center gap-2">
                  {f.flag && <span className="text-2xl">{f.flag}</span>}
                  {f.value}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {rightFields.map((f) => (
              <div key={f.label} className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">{f.label}</p>
                <p className="text-foreground font-mono flex items-center gap-2">
                  {f.flag && <span className="text-2xl">{f.flag}</span>}
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeoIPInfo;