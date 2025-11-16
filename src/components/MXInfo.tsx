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
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2"> {/* Updated text color */}
          <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" /> {/* Updated text color */}
          Mail Server (MX) Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-3">MX Records ({mx.mxRecords.length})</p> {/* Updated text color */}
          <div className="space-y-2">
            {mx.mxRecords.map((record, index) => (
              <div key={index} className="bg-muted rounded-lg p-3"> {/* Updated background */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">{record.exchange}</span> {/* Updated text color */}
                  <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"> {/* Updated text color */}
                    Priority: {record.priority}
                  </Badge>
                </div>
                {record.ip && (
                  <p className="text-sm text-muted-foreground">IP: <span className="text-foreground font-mono">{record.ip}</span></p> {/* Updated text color */}
                )}
              </div>
            ))}
          </div>
        </div>

        {mx.spfRecord && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500 dark:text-green-400" /> {/* Updated text color */}
              <p className="text-sm text-muted-foreground">SPF Record</p> {/* Updated text color */}
            </div>
            <div className="bg-muted rounded-lg p-3"> {/* Updated background */}
              <p className="text-xs text-foreground font-mono break-all">{mx.spfRecord}</p> {/* Updated text color */}
            </div>
          </div>
        )}

        {mx.dmarcRecord && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500 dark:text-green-400" /> {/* Updated text color */}
              <p className="text-sm text-muted-foreground">DMARC Record</p> {/* Updated text color */}
            </div>
            <div className="bg-muted rounded-lg p-3"> {/* Updated background */}
              <p className="text-xs text-foreground font-mono break-all">{mx.dmarcRecord}</p> {/* Updated text color */}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MXInfo;