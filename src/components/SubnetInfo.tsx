import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface SubnetInfoProps {
  subnet?: {
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
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const SubnetInfo = ({ subnet, isTested, moduleError }: SubnetInfoProps) => {
  if (!isTested) return null;

  const hasData = !!subnet && !!subnet.ip;

  return (
    <ModuleCardWrapper
      title="Subnet Calculator"
      icon={Network}
      iconColorClass="text-orange-500 dark:text-orange-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No subnet information could be calculated. Ensure an IP address is available from other modules."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">IP Address / CIDR</p>
          <p className="text-foreground font-mono text-lg break-all">{subnet?.ip}/{subnet?.cidr}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">IP Class</p>
          <p className="text-foreground font-medium break-words">{subnet?.ipClass}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Network Address</p>
          <p className="text-foreground font-mono break-all">{subnet?.networkAddress}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Broadcast Address</p>
          <p className="text-foreground font-mono break-all">{subnet?.broadcastAddress}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Subnet Mask</p>
          <p className="text-foreground font-mono break-all">{subnet?.subnetMask}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Wildcard Mask</p>
          <p className="text-foreground font-mono break-all">{subnet?.wildcardMask}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">First Usable IP</p>
          <p className="text-foreground font-mono break-all">{subnet?.firstUsable}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Last Usable IP</p>
          <p className="text-foreground font-mono break-all">{subnet?.lastUsable}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Hosts</p>
          <p className="text-primary font-bold text-xl">{subnet?.totalHosts.toLocaleString()}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Usable Hosts</p>
          <p className="text-green-500 dark:text-green-400 font-bold text-xl">{subnet?.usableHosts.toLocaleString()}</p>
        </div>
      </div>
    </ModuleCardWrapper>
  );
};

export default SubnetInfo;