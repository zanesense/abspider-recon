import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Calendar, Server, Mail, Building2 } from 'lucide-react';

interface WhoisInfoProps {
  whois: {
    domain: string;
    registrar?: string;
    created?: string;
    expires?: string;
    updated?: string;
    nameservers: string[];
    status?: string;
    registrant?: {
      organization?: string;
      country?: string;
      email?: string;
    };
    dnssec?: string;
    whoisRaw?: string;
  };
}

const WhoisInfo = ({ whois }: WhoisInfoProps) => {
  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Globe className="h-5 w-5 text-primary" />
          WHOIS Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Domain</p>
              <p className="text-foreground font-medium">{whois.domain}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Registrar</p>
              <p className="text-foreground">{whois.registrar || 'N/A'}</p>
            </div>
            {whois.status && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-foreground">{whois.status}</p>
              </div>
            )}
            {whois.dnssec && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">DNSSEC</p>
                <p className="text-foreground">{whois.dnssec}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                Created
              </p>
              <p className="text-foreground">{whois.created || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                Expires
              </p>
              <p className="text-foreground">{whois.expires || 'N/A'}</p>
            </div>
            {whois.updated && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground/70" />
                  Last Updated
                </p>
                <p className="text-foreground">{whois.updated}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Server className="h-3 w-3 text-muted-foreground/70" />
                Nameservers
              </p>
              <div className="space-y-1">
                {whois.nameservers.length > 0 ? (
                  whois.nameservers.map((ns, index) => (
                    <p key={index} className="text-foreground text-sm font-mono">{ns}</p> 
                  ))
                ) : (
                  <p className="text-muted-foreground/70 text-sm">N/A</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {whois.registrant && (whois.registrant.organization || whois.registrant.country || whois.registrant.email) && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Registrant Details</p>
            <div className="space-y-2">
              {whois.registrant.organization && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground/70" />
                  <span>Organization: {whois.registrant.organization}</span>
                </div>
              )}
              {whois.registrant.country && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Globe className="h-4 w-4 text-muted-foreground/70" />
                  <span>Country: {whois.registrant.country}</span>
                </div>
              )}
              {whois.registrant.email && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground/70" />
                  <span>Email: {whois.registrant.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {whois.whoisRaw && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Raw WHOIS Data</p>
            <pre className="text-xs text-foreground bg-muted p-3 rounded overflow-x-auto max-h-64">
              {whois.whoisRaw}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhoisInfo;