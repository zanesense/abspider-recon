import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield } from 'lucide-react';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface MXInfoProps {
  mx?: {
    domain: string;
    mxRecords: Array<{
      priority: number;
      exchange: string;
      ip?: string;
    }>;
    spfRecord?: string;
    dmarcRecord?: string;
  };
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const MXInfo = ({ mx, isTested, moduleError }: MXInfoProps) => {
  if (!isTested) return null;

  const hasData = !!mx && (
    mx.mxRecords.length > 0 ||
    !!mx.spfRecord ||
    !!mx.dmarcRecord
  );

  return (
    <ModuleCardWrapper
      title="Mail Server (MX) Records"
      icon={Mail}
      iconColorClass="text-blue-500 dark:text-blue-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No MX record information could be retrieved."
    >
      <div className="space-y-6">
        {mx?.mxRecords && mx.mxRecords.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">MX Records ({mx.mxRecords.length})</p>
            <div className="space-y-2">
              {mx.mxRecords.map((record, index) => (
                <div key={index} className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium">{record.exchange}</span>
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      Priority: {record.priority}
                    </Badge>
                  </div>
                  {record.ip && (
                    <p className="text-sm text-muted-foreground">IP: <span className="text-foreground font-mono">{record.ip}</span></p> 
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mx?.spfRecord && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500 dark:text-green-400" />
              <p className="text-sm text-muted-foreground">SPF Record</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-foreground font-mono break-all">{mx.spfRecord}</p>
            </div>
          </div>
        )}

        {mx?.dmarcRecord && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500 dark:text-green-400" />
              <p className="text-sm text-muted-foreground">DMARC Record</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-foreground font-mono break-all">{mx.dmarcRecord}</p>
            </div>
          </div>
        )}
      </div>
    </ModuleCardWrapper>
  );
};

export default MXInfo;