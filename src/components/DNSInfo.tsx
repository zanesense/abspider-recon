import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

interface DNSInfoProps {
  dns: {
    domain: string;
    records: {
      A: Array<{ type: string; value: string; ttl?: number }>;
      AAAA: Array<{ type: string; value: string; ttl?: number }>;
      MX: Array<{ type: string; value: string; ttl?: number }>;
      NS: Array<{ type: string; value: string; ttl?: number }>;
      TXT: Array<{ type: string; value: string; ttl?: number }>;
      CNAME: Array<{ type: string; value: string; ttl?: number }>;
      SOA: Array<{ type: string; value: string; ttl?: number }>;
    };
  };
}

const DNSInfo = ({ dns }: DNSInfoProps) => {
  const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];

  return (
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2"> {/* Updated text color */}
          <Network className="h-5 w-5 text-purple-500 dark:text-purple-400" /> {/* Updated text color */}
          DNS Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recordTypes.map((type) => {
            const records = dns.records[type as keyof typeof dns.records];
            if (records.length === 0) return null;

            return (
              <div key={type} className="bg-muted rounded-lg p-4"> {/* Updated background */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"> {/* Updated text color */}
                    {type}
                  </Badge>
                  <span className="text-muted-foreground text-sm">{records.length} record(s)</span> {/* Updated text color */}
                </div>
                <div className="space-y-2">
                  {records.map((record, index) => (
                    <div key={index} className="flex items-start justify-between text-sm">
                      <span className="text-foreground font-mono break-all">{record.value}</span> {/* Updated text color */}
                      {record.ttl && (
                        <span className="text-muted-foreground/70 ml-2 whitespace-nowrap">TTL: {record.ttl}</span> {/* Updated text color */}
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DNSInfo;