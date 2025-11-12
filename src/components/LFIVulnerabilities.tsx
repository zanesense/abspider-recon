import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <FileWarning className="h-5 w-5" />
            LFI Vulnerability Assessment
          </CardTitle>
          <CardDescription>Local File Inclusion vulnerability testing not performed</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-600 hover:bg-red-700';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <FileWarning className="h-5 w-5" />
          LFI Vulnerability Assessment
        </CardTitle>
        <CardDescription>
          Tested {lfi.testedPayloads} Local File Inclusion payloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lfi.vulnerable && lfi.vulnerabilities.length > 0 ? (
          <>
            <Alert variant="destructive" className="bg-red-950/30 border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                {lfi.vulnerabilities.length} Local File Inclusion vulnerabilit{lfi.vulnerabilities.length === 1 ? 'y' : 'ies'} detected!
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {lfi.vulnerabilities.map((vuln, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-card/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{vuln.type}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(vuln.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>

                  {vuln.parameter && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Parameter: </span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{vuln.parameter}</code>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Payload:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                      {vuln.payload}
                    </code>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground block mb-1">Indicator:</span>
                    <div className="text-sm text-amber-400 font-mono">
                      {vuln.indicator}
                    </div>
                  </div>

                  {vuln.evidence && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Evidence:</span>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                        {vuln.evidence}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <Alert className="bg-green-950/30 border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
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
