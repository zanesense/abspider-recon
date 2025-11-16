import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Info, Bug } from 'lucide-react';

interface Port {
  port: number;
  status: string;
  service: string;
  banner?: string;
  product?: string;
  os?: string;
  vulnerabilities?: string[];
}

interface PortScanResultsProps {
  ports: Port[];
}

const PortScanResults = ({ ports }: PortScanResultsProps) => {
  const openPorts = ports.filter(p => p.status === 'open');
  const closedPorts = ports.filter(p => p.status === 'closed');
  const filteredPorts = ports.filter(p => p.status === 'filtered');

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Port Scan Results ({ports.length} ports scanned)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-foreground">Open: {openPorts.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-foreground">Closed: {closedPorts.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-foreground">Filtered: {filteredPorts.length}</span>
            </div>
          </div>

          <div className="space-y-2">
            {ports.map((port, index) => (
              <div
                key={index}
                className="flex flex-col bg-muted px-4 py-3 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-mono font-bold text-lg">
                      {port.port}
                    </span>
                    <span className="text-foreground">{port.service}</span>
                    {port.product && (
                      <Badge variant="outline" className="text-xs text-blue-600 dark:text-blue-400 border-blue-500/30">
                        {port.product}
                      </Badge>
                    )}
                  </div>
                  <Badge className={
                    port.status === 'open'
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                      : port.status === 'filtered'
                      ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                  }>
                    {port.status}
                  </Badge>
                </div>
                {port.banner && (
                  <div className="mt-2 flex items-start gap-2 text-xs">
                    <Info className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-muted-foreground font-mono">{port.banner}</span>
                  </div>
                )}
                {port.os && (
                  <div className="mt-1 flex items-start gap-2 text-xs">
                    <Info className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-muted-foreground">OS: {port.os}</span>
                  </div>
                )}
                {port.vulnerabilities && port.vulnerabilities.length > 0 && (
                  <div className="mt-1 flex items-start gap-2 text-xs">
                    <Bug className="h-3 w-3 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Vulnerabilities: {port.vulnerabilities.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortScanResults;