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
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2"> {/* Updated text color */}
          <Network className="h-5 w-5 text-orange-500 dark:text-orange-400" /> {/* Updated text color */}
          Subnet Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">IP Address / CIDR</p> {/* Updated text color */}
            <p className="text-foreground font-mono text-lg">{subnet.ip}/{subnet.cidr}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">IP Class</p> {/* Updated text color */}
            <p className="text-foreground font-medium">{subnet.ipClass}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Network Address</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{subnet.networkAddress}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Broadcast Address</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{subnet.broadcastAddress}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Subnet Mask</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{subnet.subnetMask}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Wildcard Mask</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{subnet.wildcardMask}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">First Usable IP</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{subnet.firstUsable}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Last Usable IP</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{subnet.lastUsable}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Total Hosts</p> {/* Updated text color */}
            <p className="text-primary font-bold text-xl">{subnet.totalHosts.toLocaleString()}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Usable Hosts</p> {/* Updated text color */}
            <p className="text-green-500 dark:text-green-400 font-bold text-xl">{subnet.usableHosts.toLocaleString()}</p> {/* Updated text color */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubnetInfo;