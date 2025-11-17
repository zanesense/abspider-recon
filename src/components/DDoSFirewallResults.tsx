import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldOff, AlertTriangle, Zap, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { DDoSFirewallResult } from '@/services/ddosFirewallService';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface DDoSFirewallResultsProps {
  ddosFirewall?: DDoSFirewallResult;
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const DDoSFirewallResults = ({ ddosFirewall, isTested, moduleError }: DDoSFirewallResultsProps) => {
  if (!isTested) return null;

  const hasData = !!ddosFirewall && ddosFirewall.tested;

  return (
    <ModuleCardWrapper
      title="DDoS Firewall Test"
      icon={ddosFirewall?.firewallDetected ? ShieldCheck : ShieldOff}
      iconColorClass={ddosFirewall?.firewallDetected ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="DDoS Firewall testing not performed or encountered an error."
      headerActions={<CORSBypassIndicator metadata={ddosFirewall?.corsMetadata} />}
    >
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Firewall Detected</p>
            <Badge className={ddosFirewall?.firewallDetected ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'}>
              {ddosFirewall?.firewallDetected ? 'YES' : 'NO'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-primary">{ddosFirewall?.totalRequests}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Successful / Failed</p>
            <p className="text-2xl font-bold text-foreground">
              <span className="text-green-500 dark:text-green-400">{ddosFirewall?.successfulRequests}</span> / <span className="text-red-500 dark:text-red-400">{ddosFirewall?.failedRequests}</span>
            </p>
          </div>
        </div>

        {ddosFirewall?.wafDetected && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3 text-muted-foreground/70" />
              WAF/CDN Detected: <span className="text-foreground font-medium">{ddosFirewall.wafDetected}</span>
            </p>
          </div>
        )}

        {ddosFirewall?.indicators && ddosFirewall.indicators.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Detection Indicators
            </h4>
            <div className="space-y-2">
              {ddosFirewall.indicators.map((indicator, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 border-l-4 border-yellow-500/50">
                  <p className="text-foreground text-sm">{indicator}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ddosFirewall?.responseSummary && ddosFirewall.responseSummary.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4" />
              Response Summary
            </h4>
            <div className="space-y-2">
              {ddosFirewall.responseSummary.map((summary, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <span className="text-foreground font-medium">HTTP {summary.status}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Count: {summary.count}</span>
                    <span>Avg. Time: {summary.avgResponseTime.toFixed(2)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ddosFirewall?.evidence && ddosFirewall.evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Evidence Snippets
            </h4>
            <div className="space-y-2">
              {ddosFirewall.evidence.map((snippet, index) => (
                <pre key={index} className="text-xs text-foreground bg-muted/50 p-2 rounded overflow-x-auto max-h-24">
                  {snippet}
                </pre>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default DDoSFirewallResults;