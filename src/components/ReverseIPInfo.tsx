import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface ReverseIPInfoProps {
  reverseip?: {
    ip: string;
    domains: Array<{
      domain: string;
      cms?: string;
    }>;
    totalDomains: number;
  };
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const ReverseIPInfo = ({ reverseip, isTested, moduleError }: ReverseIPInfoProps) => {
  if (!isTested) return null;

  const hasData = !!reverseip && (!!reverseip.ip && reverseip.domains.length > 0);

  return (
    <ModuleCardWrapper
      title="Reverse IP Lookup"
      icon={Network}
      iconColorClass="text-indigo-500 dark:text-indigo-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No other domains found on this IP or reverse IP lookup not performed."
    >
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">IP Address</p>
          <p className="text-foreground font-mono text-lg">{reverseip?.ip || 'N/A'}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-3">Domains on this IP ({reverseip?.totalDomains || 0})</p>
          <div className="space-y-2">
            {reverseip?.domains && reverseip.domains.length > 0 ? (
              reverseip.domains.map((item, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <span className="text-foreground font-mono">{item.domain}</span>
                  {item.cms && (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                      {item.cms}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground/70 text-sm text-center py-4">No other domains found on this IP</p>
            )}
          </div>
        </div>
      </div>
    </ModuleCardWrapper>
  );
};

export default ReverseIPInfo;