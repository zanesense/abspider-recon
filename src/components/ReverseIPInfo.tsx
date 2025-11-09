import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

interface ReverseIPInfoProps {
  reverseip: {
    ip: string;
    domains: Array<{
      domain: string;
      cms?: string;
    }>;
    totalDomains: number;
  };
}

const ReverseIPInfo = ({ reverseip }: ReverseIPInfoProps) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="h-5 w-5 text-indigo-400" />
          Reverse IP Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">IP Address</p>
            <p className="text-white font-mono text-lg">{reverseip.ip}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-400 mb-3">Domains on this IP ({reverseip.totalDomains})</p>
            <div className="space-y-2">
              {reverseip.domains.map((item, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white font-mono">{item.domain}</span>
                  {item.cms && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {item.cms}
                    </Badge>
                  )}
                </div>
              ))}
              {reverseip.domains.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No other domains found on this IP</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReverseIPInfo;