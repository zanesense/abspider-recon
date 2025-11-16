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
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-400" />
          WHOIS Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Domain</p>
              <p className="text-white font-medium">{whois.domain}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Registrar</p>
              <p className="text-white">{whois.registrar || 'N/A'}</p>
            </div>
            {whois.status && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-white">{whois.status}</p>
              </div>
            )}
            {whois.dnssec && (
              <div>
                <p className="text-sm text-slate-400 mb-1">DNSSEC</p>
                <p className="text-white">{whois.dnssec}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </p>
              <p className="text-white">{whois.created || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expires
              </p>
              <p className="text-white">{whois.expires || 'N/A'}</p>
            </div>
            {whois.updated && (
              <div>
                <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Updated
                </p>
                <p className="text-white">{whois.updated}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Server className="h-3 w-3" />
                Nameservers
              </p>
              <div className="space-y-1">
                {whois.nameservers.length > 0 ? (
                  whois.nameservers.map((ns, index) => (
                    <p key={index} className="text-white text-sm font-mono">{ns}</p>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">N/A</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {whois.registrant && (whois.registrant.organization || whois.registrant.country || whois.registrant.email) && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Registrant Details</p>
            <div className="space-y-2">
              {whois.registrant.organization && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span>Organization: {whois.registrant.organization}</span>
                </div>
              )}
              {whois.registrant.country && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Globe className="h-4 w-4 text-slate-500" />
                  <span>Country: {whois.registrant.country}</span>
                </div>
              )}
              {whois.registrant.email && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>Email: {whois.registrant.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {whois.whoisRaw && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Raw WHOIS Data</p>
            <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded overflow-x-auto max-h-64">
              {whois.whoisRaw}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhoisInfo;