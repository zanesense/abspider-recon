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
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2"> {/* Updated text color */}
          <Network className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> {/* Updated text color */}
          Reverse IP Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">IP Address</p> {/* Updated text color */}
            <p className="text-foreground font-mono text-lg">{reverseip.ip}</p> {/* Updated text color */}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-3">Domains on this IP ({reverseip.totalDomains})</p> {/* Updated text color */}
            <div className="space-y-2">
              {reverseip.domains.map((item, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 flex items-center justify-between"> {/* Updated background */}
                  <span className="text-foreground font-mono">{item.domain}</span> {/* Updated text color */}
                  {item.cms && (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"> {/* Updated text color */}
                      {item.cms}
                    </Badge>
                  )}
                </div>
              ))}
              {reverseip.domains.length === 0 && (
                <p className="text-muted-foreground/70 text-sm text-center py-4">No other domains found on this IP</p> {/* Updated text color */}
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReverseIPInfo;