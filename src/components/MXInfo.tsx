import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield } from 'lucide-react';

interface MXInfoProps {
  mx: {
    domain: string;
    mxRecords: Array<{
      priority: number;
      exchange: string;
      ip?: string;
    }>;
    spfRecord?: string;
    dmarcRecord?: string;
  };
}

const MXInfo = ({ mx }: MXInfoProps) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-400" />
          Mail Server (MX) Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-slate-400 mb-3">MX Records ({mx.mxRecords.length})</p>
          <div className="space-y-2">
            {mx.mxRecords.map((record, index) => (
              <div key={index} className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{record.exchange}</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Priority: {record.priority}
                  </Badge>
                </div>
                {record.ip && (
                  <p className="text-sm text-slate-400">IP: <span className="text-slate-300 font-mono">{record.ip}</span></p>
                )}
              </div>
            ))}
          </div>
        </div>

        {mx.spfRecord && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-400" />
              <p className="text-sm text-slate-400">SPF Record</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-300 font-mono break-all">{mx.spfRecord}</p>
            </div>
          </div>
        )}

        {mx.dmarcRecord && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-400" />
              <p className="text-sm text-slate-400">DMARC Record</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-300 font-mono break-all">{mx.dmarcRecord}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MXInfo;