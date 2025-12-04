import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, AlertTriangle, CheckCircle2, FileText, Lightbulb, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper
import CORSBypassIndicator from './CORSBypassIndicator'; // Import CORSBypassIndicator
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

interface LFIVulnerabilitiesProps {
  lfi?: {
    vulnerable: boolean;
    tested: boolean;
    testedPayloads: number;
    vulnerabilities: Array<{
      payload: string;
      indicator: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'catastrophic'; // Updated severity types
      type: string;
      evidence?: string;
      parameter?: string;
      confidence: number;
    }>;
    corsMetadata?: any; // Added corsMetadata
  };
  isTested: boolean; // New prop
  moduleError?: string; // New prop
  configLfiPayloads: number; // New prop for configured payloads
}

const LFIVulnerabilities = ({ lfi, isTested, moduleError, configLfiPayloads }: LFIVulnerabilitiesProps) => {
  if (!isTested) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'catastrophic': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  const hasData = !!lfi && (lfi.testedPayloads > 0 || lfi.vulnerabilities.length > 0);

  return (
    <ModuleCardWrapper
      title="LFI Vulnerability Assessment"
      icon={FileWarning}
      iconColorClass="text-orange-500 dark:text-orange-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="Local File Inclusion vulnerability testing not performed or no vulnerabilities detected."
      headerActions={<CORSBypassIndicator metadata={lfi?.corsMetadata} />}
    >
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge className={lfi?.vulnerable ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'}>
              {lfi?.vulnerable ? 'VULNERABLE' : 'SECURE'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Configured Payloads</p>
            <p className="text-2xl font-bold text-primary">{configLfiPayloads}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              Tested Payloads
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs bg-card border-border">
                    This count reflects payloads for which a response was successfully received and processed.
                    Requests that failed due to network errors or timeouts are not included.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
            <p className="text-2xl font-bold text-primary">{lfi?.testedPayloads}</p>
          </div>
        </div>

        {lfi?.vulnerable && lfi.vulnerabilities.length > 0 ? (
          <>
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-semibold text-destructive dark:text-red-400">
                {lfi.vulnerabilities.length} Local File Inclusion vulnerabilit{lfi.vulnerabilities.length === 1 ? 'y' : 'ies'} detected!
              </AlertDescription>
            </Alert>

            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 mt-4">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2 text-destructive dark:text-red-400">🛡️ Mitigation Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-destructive-foreground dark:text-red-300 text-sm">
                  <li>Use whitelisting for allowed file paths (never blacklisting)</li>
                  <li>Validate and sanitize all user input - reject path traversal patterns (../, ..\)</li>
                  <li>Use built-in secure file handling functions with restricted directories</li>
                  <li>Implement strict input validation with regular expressions</li>
                  <li>Disable remote file inclusion (allow_url_include = Off in PHP)</li>
                  <li>Use absolute paths and map user input to predefined file IDs</li>
                  <li>Run application with minimum required file system permissions</li>
                  <li>Deploy Web Application Firewall (WAF) with LFI protection rules</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {lfi.vulnerabilities.map((vuln, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-muted">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      <span className="text-foreground font-medium">{vuln.type}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                      {(vuln.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>

                  {vuln.parameter && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Parameter: </span>
                      <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded text-foreground break-all">{vuln.parameter}</code>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Payload:</span>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded block overflow-x-auto text-foreground break-all">
                      {vuln.payload}
                    </code>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Indicator:</span>
                    <div className="text-amber-600 dark:text-amber-400 font-mono break-words">
                      {vuln.indicator}
                    </div>
                  </div>

                  {vuln.evidence && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Evidence:</span>
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto text-foreground break-words">
                        {vuln.evidence}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <Alert className="bg-green-500/10 border-green-500/50">
            <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              No Local File Inclusion vulnerabilities detected
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default LFIVulnerabilities;