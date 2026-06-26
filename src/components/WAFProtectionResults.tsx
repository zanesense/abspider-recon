import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldOff, AlertTriangle, Zap, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { WAFProtectionResult } from '@/services/wafProtectionService';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface WAFProtectionResultsProps {
  wafProtection?: WAFProtectionResult;
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const WAFProtectionResults = ({ wafProtection, isTested, moduleError }: WAFProtectionResultsProps) => {
  if (!isTested) return null;

  const hasData = !!wafProtection && wafProtection.tested;

  return (
    <ModuleCardWrapper
      title="WAF Protection Check"
      icon={wafProtection?.firewallDetected ? ShieldCheck : ShieldOff}
      iconColorClass={wafProtection?.firewallDetected ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="WAF protection check was not performed or encountered an error."
      headerActions={<CORSBypassIndicator metadata={wafProtection?.corsMetadata} />}
    >
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">WAF Detected</p>
            <Badge className={wafProtection?.firewallDetected ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'}>
              {wafProtection?.firewallDetected ? 'YES' : 'NO'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-primary">{wafProtection?.totalRequests}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Successful / Failed</p>
            <p className="text-2xl font-bold text-foreground">
              <span className="text-green-500 dark:text-green-400">{wafProtection?.successfulRequests}</span> / <span className="text-red-500 dark:text-red-400">{wafProtection?.failedRequests}</span>
            </p>
          </div>
        </div>

        {wafProtection?.wafDetected && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2 break-words">
              <Info className="h-3 w-3 text-muted-foreground/70" />
              WAF/CDN Detected: <span className="text-foreground font-medium">{wafProtection.wafDetected}</span>
            </p>
          </div>
        )}

        {wafProtection?.indicators && wafProtection.indicators.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Detection Indicators
            </h4>
            <div className="space-y-2">
              {wafProtection.indicators.map((indicator, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 border-l-4 border-yellow-500/50">
                  <p className="text-foreground text-sm break-words">{indicator}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {wafProtection?.responseSummary && wafProtection.responseSummary.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4" />
              Response Summary
            </h4>
            <div className="space-y-2">
              {wafProtection.responseSummary.map((summary, index) => (
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

        {wafProtection?.evidence && wafProtection.evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Evidence Snippets
            </h4>
            <div className="space-y-2">
              {wafProtection.evidence.map((snippet, index) => (
                <pre key={index} className="text-xs text-foreground bg-muted/50 p-2 rounded overflow-x-auto max-h-24 break-words">
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

export default WAFProtectionResults;
