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
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="h-5 w-5 text-orange-400" />
          Subnet Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">IP Address / CIDR</p>
            <p className="text-white font-mono text-lg">{subnet.ip}/{subnet.cidr}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">IP Class</p>
            <p className="text-white font-medium">{subnet.ipClass}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Network Address</p>
            <p className="text-white font-mono">{subnet.networkAddress}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Broadcast Address</p>
            <p className="text-white font-mono">{subnet.broadcastAddress}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Subnet Mask</p>
            <p className="text-white font-mono">{subnet.subnetMask}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Wildcard Mask</p>
            <p className="text-white font-mono">{subnet.wildcardMask}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">First Usable IP</p>
            <p className="text-white font-mono">{subnet.firstUsable}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Last Usable IP</p>
            <p className="text-white font-mono">{subnet.lastUsable}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Total Hosts</p>
            <p className="text-cyan-400 font-bold text-xl">{subnet.totalHosts.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Usable Hosts</p>
            <p className="text-green-400 font-bold text-xl">{subnet.usableHosts.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubnetInfo;