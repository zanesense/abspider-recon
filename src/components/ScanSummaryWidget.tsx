import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ShieldAlert, Bug, CheckCircle, XCircle } from 'lucide-react';
import { Scan } from '@/services/scanService';

interface ScanSummaryWidgetProps {
  scan: Scan;
}

const ScanSummaryWidget = ({ scan }: ScanSummaryWidgetProps) => {
  const subdomainsFound = scan.results.subdomains?.subdomains.length || 0;
  const openPortsFound = scan.results.ports?.filter(p => p.status === 'open').length || 0;
  
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const totalVulnerabilities = sqlVulns + xssVulns + lfiVulns + wpVulns;

  const ddosFirewallDetected = scan.results.ddosFirewall?.firewallDetected; // Only one DDoS module now

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          Scan Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg border border-border">
          <Network className="h-8 w-8 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Subdomains</p>
          <p className="text-2xl font-bold text-foreground">{subdomainsFound}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg border border-border">
          <Network className="h-8 w-8 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Open Ports</p>
          <p className="text-2xl font-bold text-foreground">{openPortsFound}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg border border-border">
          <Bug className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground">Vulnerabilities</p>
          <p className="text-2xl font-bold text-red-500">{totalVulnerabilities}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg border border-border">
          {ddosFirewallDetected ? (
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500 mb-2" />
          )}
          <p className="text-sm text-muted-foreground">DDoS/WAF</p>
          <p className={`text-2xl font-bold ${ddosFirewallDetected ? 'text-green-500' : 'text-red-500'}`}>
            {ddosFirewallDetected ? 'Detected' : 'None'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanSummaryWidget;