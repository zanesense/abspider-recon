import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, AlertTriangle, CheckCircle2, FileText, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LFIVulnerabilitiesProps {
  lfi: {
    vulnerable: boolean;
    tested: boolean;
    testedPayloads: number;
    vulnerabilities: Array<{
      payload: string;
      indicator: string;
      severity: 'critical' | 'high' | 'medium';
      type: string;
      evidence?: string;
      parameter?: string;
      confidence: number;
    }>;
  };
}

const LFIVulnerabilities = ({ lfi }: LFIVulnerabilitiesProps) => {
  if (!lfi || !lfi.tested) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-500 dark:text-orange-400">
            <FileWarning className="h-5 w-5" />
            LFI Vulnerability Assessment
          </CardTitle>
          <CardDescription className="text-muted-foreground">Local File Inclusion vulnerability testing not performed</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-500 dark:text-orange-400">
          <FileWarning className="h-5 w-5" />
          LFI Vulnerability Assessment
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Tested {lfi.testedPayloads} Local File Inclusion payloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lfi.vulnerable && lfi.vulnerabilities.length > 0 ? (
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
                      <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded text-foreground">{vuln.parameter}</code>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Payload:</span>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded block overflow-x-auto text-foreground">
                      {vuln.payload}
                    </code>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Indicator:</span>
                    <div className="text-amber-600 dark:text-amber-400 font-mono">
                      {vuln.indicator}
                    </div>
                  </div>

                  {vuln.evidence && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Evidence:</span>
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto text-foreground">
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

        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Status: {lfi.vulnerable ? 'Vulnerable' : 'Secure'} • {lfi.testedPayloads} payloads tested</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LFIVulnerabilities;