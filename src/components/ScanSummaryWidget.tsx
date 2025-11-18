import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ShieldAlert, Bug, CheckCircle, XCircle, Star, Clock, ShieldOff } from 'lucide-react'; // Added Clock, ShieldOff
import { Scan } from '@/services/scanService';
import { Badge } from '@/components/ui/badge'; // Import Badge for better styling

interface ScanSummaryWidgetProps {
  scan: Scan;
  securityGrade?: number; // Add securityGrade prop
}

const ScanSummaryWidget = ({ scan, securityGrade }: ScanSummaryWidgetProps) => {
  const subdomainsFound = scan.results.subdomains?.subdomains.length || 0;
  const openPortsFound = scan.results.ports?.filter(p => p.status === 'open').length || 0;
  
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const corsMisconfigVulns = scan.results.corsMisconfig?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const brokenLinksCount = scan.results.brokenLinks?.brokenLinks?.length || 0;
  const sslExpired = scan.results.sslTls?.isExpired ? 1 : 0;
  const virustotalMalicious = (scan.results.virustotal?.maliciousVotes || 0) > 0 ? 1 : 0;

  const totalVulnerabilities = sqlVulns + xssVulns + lfiVulns + corsMisconfigVulns + wpVulns + brokenLinksCount + sslExpired + virustotalMalicious;

  const ddosFirewallDetected = scan.results.ddosFirewall?.firewallDetected;

  const totalModules = Object.keys(scan.config).filter(key => 
    !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests', 'scanName', 'scheduleScan', 'scheduleFrequency', 'scheduleStartDate', 'scheduleStartTime'].includes(key)
  ).length;
  const activeModules = Object.keys(scan.config).filter(key => 
    (scan.config as any)[key] === true && !['target', 'useProxy', 'threads', 'xssPayloads', 'sqliPayloads', 'lfiPayloads', 'ddosRequests', 'scanName', 'scheduleScan', 'scheduleFrequency', 'scheduleStartDate', 'scheduleStartTime'].includes(key)
  ).length;

  const getGradeColorClass = (grade?: number) => {
    if (grade === undefined) return 'text-muted-foreground';
    if (grade >= 8) return 'text-green-500 dark:text-green-400';
    if (grade >= 6) return 'text-yellow-500 dark:text-yellow-400';
    if (grade >= 4) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          Scan Summary
        </CardTitle>
        {securityGrade !== undefined && (
          <div className="flex items-center gap-2">
            <Star className={`h-5 w-5 ${getGradeColorClass(securityGrade)}`} />
            <span className={`text-2xl font-bold ${getGradeColorClass(securityGrade)}`}>
              {securityGrade.toFixed(1)}/10
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
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
              <ShieldOff className="h-8 w-8 text-red-500 mb-2" /> // Changed icon for 'None'
            )}
            <p className="text-sm text-muted-foreground">DDoS/WAF</p>
            <p className={`text-2xl font-bold ${ddosFirewallDetected ? 'text-green-500' : 'text-red-500'}`}>
              {ddosFirewallDetected ? 'Detected' : 'None'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <span className="text-muted-foreground">Total Modules</span>
            <span className="font-semibold text-foreground">{totalModules}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <span className="text-muted-foreground">Active Modules</span>
            <span className="font-semibold text-primary">{activeModules}</span>
          </div>
        </div>

        {scan.completedAt && (
          <div className="flex items-center justify-center p-3 bg-muted/30 rounded-lg border border-border">
            <Clock className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Last Updated: {new Date(scan.completedAt).toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScanSummaryWidget;