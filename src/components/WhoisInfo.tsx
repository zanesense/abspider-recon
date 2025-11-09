import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Calendar, Server } from 'lucide-react';

interface WhoisInfoProps {
  whois: {
    domain: string;
    registrar: string;
    created: string;
    expires: string;
    nameservers: string[];
    status?: string;
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
              <p className="text-white">{whois.registrar}</p>
            </div>
            {whois.status && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-white">{whois.status}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </p>
              <p className="text-white">{whois.created}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expires
              </p>
              <p className="text-white">{whois.expires}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Server className="h-3 w-3" />
                Nameservers
              </p>
              <div className="space-y-1">
                {whois.nameservers.map((ns, index) => (
                  <p key={index} className="text-white text-sm font-mono">{ns}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhoisInfo;