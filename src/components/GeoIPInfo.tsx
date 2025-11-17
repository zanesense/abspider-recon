import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Globe, Clock, Building2, DollarSign, Languages, Sun } from 'lucide-react';
import { GeoIPResult } from '@/services/geoipService'; // Import the full GeoIPResult interface

interface GeoIPInfoProps {
  geoip: GeoIPResult; // Use the full GeoIPResult interface
}

const GeoIPInfo = ({ geoip }: GeoIPInfoProps) => {
  const fields = [
    { label: 'IP Address', value: geoip.ip, icon: Globe },
    { label: 'Country', value: geoip.country ? `${geoip.country} ${geoip.countryCode ? `(${geoip.countryCode})` : ''}` : 'N/A', flag: geoip.flag, icon: Globe },
    { label: 'City / Region', value: geoip.city ? `${geoip.city}${geoip.region ? ` / ${geoip.region}` : ''}` : 'N/A', icon: MapPin },
    { label: 'State / County', value: geoip.state ? `${geoip.state}${geoip.county ? ` / ${geoip.county}` : ''}` : 'N/A', icon: MapPin },
    { label: 'Suburb / Road', value: geoip.suburb ? `${geoip.suburb}${geoip.road ? ` / ${geoip.road}` : ''}` : 'N/A', icon: MapPin },
    { label: 'Coordinates', value: geoip.latitude && geoip.longitude ? `${geoip.latitude.toFixed(4)}, ${geoip.longitude.toFixed(4)}` : 'N/A', icon: MapPin },
    { label: 'Timezone', value: geoip.timezone || 'N/A', icon: Clock },
    { label: 'ISP / Organization', value: geoip.isp || geoip.org || 'N/A', icon: Building2 },
    { label: 'ASN', value: geoip.asn || 'N/A', icon: Globe },
    { label: 'Postal Code', value: geoip.postal || 'N/A', icon: MapPin },
    { label: 'Currency', value: geoip.currency ? `${geoip.currency} ${geoip.currencyCode ? `(${geoip.currencyCode})` : ''}` : 'N/A', icon: DollarSign },
    { label: 'Languages', value: geoip.languages?.length ? geoip.languages.join(', ') : 'N/A', icon: Languages },
    { label: 'Calling Code', value: geoip.callingCode || 'N/A', icon: Globe },
    { label: 'Sunrise / Sunset', value: geoip.sun?.rise && geoip.sun?.set ? `${geoip.sun.rise} / ${geoip.sun.set}` : 'N/A', icon: Sun },
    { label: 'Formatted Address', value: geoip.formatted || 'N/A', icon: MapPin },
  ].filter(f => f.value !== 'N/A' && f.value !== ''); // Filter out fields with no data

  const mid = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, mid);
  const rightFields = fields.slice(mid);

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          GeoIP Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {leftFields.map((f, index) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">{f.label}</p>
                <p className="text-foreground font-mono flex items-center gap-2">
                  {f.icon && <f.icon className="h-4 w-4 text-muted-foreground/70" />}
                  {f.flag && <span className="text-2xl">{f.flag}</span>}
                  {f.value}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {rightFields.map((f, index) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">{f.label}</p>
                <p className="text-foreground font-mono flex items-center gap-2">
                  {f.icon && <f.icon className="h-4 w-4 text-muted-foreground/70" />}
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