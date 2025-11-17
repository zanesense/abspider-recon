import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Globe, Clock, Building2, DollarSign, Languages, Sun } from 'lucide-react';
import { GeoIPResult } from '@/services/geoipService';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface GeoIPInfoProps {
  geoip?: GeoIPResult; // Use the full GeoIPResult interface
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const GeoIPInfo = ({ geoip, isTested, moduleError }: GeoIPInfoProps) => {
  if (!isTested) return null;

  const fields = [
    { label: 'IP Address', value: geoip?.ip, icon: Globe },
    { label: 'Country', value: geoip?.country ? `${geoip.country} ${geoip.countryCode ? `(${geoip.countryCode})` : ''}` : undefined, flag: geoip?.flag, icon: Globe },
    { label: 'City / Region', value: geoip?.city ? `${geoip.city}${geoip.region ? ` / ${geoip.region}` : ''}` : undefined, icon: MapPin },
    { label: 'State / County', value: geoip?.state ? `${geoip.state}${geoip.county ? ` / ${geoip.county}` : ''}` : undefined, icon: MapPin },
    { label: 'Suburb / Road', value: geoip?.suburb ? `${geoip.suburb}${geoip.road ? ` / ${geoip.road}` : ''}` : undefined, icon: MapPin },
    { label: 'Coordinates', value: geoip?.latitude && geoip?.longitude ? `${geoip.latitude.toFixed(4)}, ${geoip.longitude.toFixed(4)}` : undefined, icon: MapPin },
    { label: 'Timezone', value: geoip?.timezone, icon: Clock },
    { label: 'ISP / Organization', value: geoip?.isp || geoip?.org, icon: Building2 },
    { label: 'ASN', value: geoip?.asn, icon: Globe },
    { label: 'Postal Code', value: geoip?.postal, icon: MapPin },
    { label: 'Currency', value: geoip?.currency ? `${geoip.currency} ${geoip.currencyCode ? `(${geoip.currencyCode})` : ''}` : undefined, icon: DollarSign },
    { label: 'Languages', value: geoip?.languages?.length ? geoip.languages.join(', ') : undefined, icon: Languages },
    { label: 'Calling Code', value: geoip?.callingCode?.toString(), icon: Globe },
    { label: 'Sunrise / Sunset', value: geoip?.sun?.rise && geoip?.sun?.set ? `${geoip.sun.rise} / ${geoip.sun.set}` : undefined, icon: Sun },
    { label: 'Formatted Address', value: geoip?.formatted, icon: MapPin },
  ].filter(f => f.value !== undefined && f.value !== ''); // Filter out fields with no data

  const hasData = !!geoip && fields.length > 0;

  const mid = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, mid);
  const rightFields = fields.slice(mid);

  return (
    <ModuleCardWrapper
      title="GeoIP Information"
      icon={MapPin}
      iconColorClass="text-purple-500 dark:text-purple-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No GeoIP information could be retrieved."
    >
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
    </ModuleCardWrapper>
  );
};

export default GeoIPInfo;