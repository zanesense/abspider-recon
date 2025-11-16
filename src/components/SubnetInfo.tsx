import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';

interface SubnetInfoProps {
  subnet: {
    ip: string;
    cidr: number;
    networkAddress: string;
    broadcastAddress: string;
    subnetMask: string;
    wildcardMask: string;
    firstUsable: string;
    lastUsable: string;
    totalHosts: number;
    usableHosts: number;
    ipClass: string;
  };
}

const SubnetInfo = ({ subnet }: SubnetInfoProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          Subnet Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">IP Address / CIDR</p>
            <p className="text-foreground font-mono text-lg">{subnet.ip}/{subnet.cidr}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">IP Class</p>
            <p className="text-foreground font-medium">{subnet.ipClass}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Network Address</p>
            <p className="text-foreground font-mono">{subnet.networkAddress}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Broadcast Address</p>
            <p className="text-foreground font-mono">{subnet.broadcastAddress}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Subnet Mask</p>
            <p className="text-foreground font-mono">{subnet.subnetMask}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Wildcard Mask</p>
            <p className="text-foreground font-mono">{subnet.wildcardMask}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">First Usable IP</p>
            <p className="text-foreground font-mono">{subnet.firstUsable}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Last Usable IP</p>
            <p className="text-foreground font-mono">{subnet.lastUsable}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Hosts</p>
            <p className="text-primary font-bold text-xl">{subnet.totalHosts.toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Usable Hosts</p>
            <p className="text-green-500 dark:text-green-400 font-bold text-xl">{subnet.usableHosts.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubnetInfo;