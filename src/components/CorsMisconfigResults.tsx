import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, ShieldCheck, AlertTriangle, Lightbulb } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { CorsMisconfigResult } from '@/services/corsMisconfigService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface CorsMisconfigResultsProps {
  corsMisconfig?: CorsMisconfigResult;
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const CorsMisconfigResults = ({ corsMisconfig, isTested, moduleError }: CorsMisconfigResultsProps) => {
  if (!isTested) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  const hasData = !!corsMisconfig && (corsMisconfig.vulnerable || corsMisconfig.vulnerabilities.length > 0);

  return (
    <ModuleCardWrapper
      title="CORS Misconfiguration Scan"
      icon={Bug}
      iconColorClass="text-orange-500 dark:text-orange-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="CORS misconfiguration scan not performed or no vulnerabilities detected."
      headerActions={<CORSBypassIndicator metadata={corsMisconfig?.corsMetadata} />}
    >
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge className={corsMisconfig?.vulnerable ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'}>
              {corsMisconfig?.vulnerable ? 'VULNERABLE' : 'SECURE'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Vulnerabilities Found</p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{corsMisconfig?.vulnerabilities.length}</p>
          </div>
        </div>

        {corsMisconfig?.vulnerable && corsMisconfig.vulnerabilities.length > 0 ? (
          <>
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2 text-destructive dark:text-red-400">🛡️ Mitigation Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-destructive-foreground dark:text-red-300 text-sm">
                  <li>Avoid `Access-Control-Allow-Origin: *` for sensitive resources.</li>
                  <li>Do not reflect the `Origin` header dynamically without strict validation.</li>
                  <li>Explicitly whitelist allowed origins, and ensure they are fully qualified domains.</li>
                  <li>Be cautious with `null` origin; only allow if absolutely necessary for specific use cases (e.g., local files, sandboxed iframes).</li>
                  <li>Implement robust input validation for any origin-related parameters.</li>
                  <li>Regularly review CORS policies as part of security audits.</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Detected Misconfigurations
              </h4>
              {corsMisconfig.vulnerabilities.map((vuln, index) => (
                <div key={index} className="border border-destructive/50 rounded-lg p-4 bg-muted">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      <span className="text-foreground font-medium">{vuln.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 break-words">{vuln.description}</p>
                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Evidence:</span>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded block overflow-x-auto text-foreground break-all">
                      {vuln.evidence}
                    </code>
                  </div>
                  {vuln.originTested && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Origin Tested:</span>
                      <code className="text-xs bg-muted/50 px-2 py-1 rounded block overflow-x-auto text-foreground break-all">
                        {vuln.originTested}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              No significant CORS misconfigurations detected.
            </p>
          </div>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default CorsMisconfigResults;