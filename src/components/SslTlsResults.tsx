import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, ShieldCheck, ShieldOff, Calendar, Fingerprint, Info, XCircle, CheckCircle } from 'lucide-react';
import { SslTlsResult } from '@/services/sslTlsService';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface SslTlsResultsProps {
  sslTls?: SslTlsResult;
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const SslTlsResults = ({ sslTls, isTested, moduleError }: SslTlsResultsProps) => {
  if (!isTested) return null;

  const hasData = !!sslTls && sslTls.tested;
  const isExpired = sslTls?.isExpired;
  const daysUntilExpiry = sslTls?.daysUntilExpiry;
  const expiryStatus = isExpired ? 'Expired' : (daysUntilExpiry !== undefined && daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Valid');

  const getExpiryBadgeClass = () => {
    if (isExpired) return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
    if (daysUntilExpiry !== undefined && daysUntilExpiry <= 30) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
  };

  return (
    <ModuleCardWrapper
      title="SSL/TLS Analysis"
      icon={Lock}
      iconColorClass="text-purple-500 dark:text-purple-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="SSL/TLS analysis not performed or encountered an error."
    >
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Domain</p>
            <p className="text-foreground font-mono text-lg">{sslTls?.domain}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Certificate Status</p>
            <Badge className={getExpiryBadgeClass()}>
              {expiryStatus}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Days Until Expiry</p>
            <p className="text-2xl font-bold text-primary">{daysUntilExpiry !== undefined ? daysUntilExpiry : 'N/A'}</p>
          </div>
        </div>

        {sslTls?.certificateIssuer && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3 text-muted-foreground/70" />
              Issuer: <span className="text-foreground font-medium">{sslTls.certificateIssuer}</span>
            </p>
          </div>
        )}
        {sslTls?.certificateSubject && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3 text-muted-foreground/70" />
              Subject: <span className="text-foreground font-medium">{sslTls.certificateSubject}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground/70" />
              Valid From
            </p>
            <p className="text-foreground">{sslTls?.validFrom || 'N/A'}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground/70" />
              Valid To
            </p>
            <p className="text-foreground">{sslTls?.validTo || 'N/A'}</p>
          </div>
        </div>

        {sslTls?.commonNames && sslTls.commonNames.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Common Names
            </h4>
            <div className="flex flex-wrap gap-2">
              {sslTls.commonNames.map((name, index) => (
                <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sslTls?.altNames && sslTls.altNames.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Alternative Names
            </h4>
            <div className="flex flex-wrap gap-2">
              {sslTls.altNames.map((name, index) => (
                <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sslTls?.fingerprintSha256 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Fingerprint className="h-4 w-4" />
              Fingerprint (SHA256)
            </h4>
            <p className="text-foreground bg-muted rounded p-3 text-sm font-mono break-all">{sslTls.fingerprintSha256}</p>
          </div>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default SslTlsResults;