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
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <FileWarning className="h-5 w-5" />
            LFI Vulnerability Assessment
          </CardTitle>
          <CardDescription className="text-slate-400">Local File Inclusion vulnerability testing not performed</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <FileWarning className="h-5 w-5" />
          LFI Vulnerability Assessment
        </CardTitle>
        <CardDescription className="text-slate-400">
          Tested {lfi.testedPayloads} Local File Inclusion payloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lfi.vulnerable && lfi.vulnerabilities.length > 0 ? (
          <>
            <Alert variant="destructive" className="bg-red-950/30 border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-semibold text-red-400">
                {lfi.vulnerabilities.length} Local File Inclusion vulnerabilit{lfi.vulnerabilities.length === 1 ? 'y' : 'ies'} detected!
              </AlertDescription>
            </Alert>

            <Alert variant="destructive" className="bg-red-950/30 border-red-800 mt-4">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2 text-red-400">🛡️ Mitigation Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
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
                <div key={index} className="border border-slate-800 rounded-lg p-4 bg-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium text-white">{vuln.type}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                      {(vuln.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>

                  {vuln.parameter && (
                    <div className="mb-2">
                      <span className="text-xs text-slate-400">Parameter: </span>
                      <code className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-white">{vuln.parameter}</code>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-xs text-slate-400 block mb-1">Payload:</span>
                    <code className="text-xs bg-slate-700 px-2 py-1 rounded block overflow-x-auto text-white">
                      {vuln.payload}
                    </code>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-slate-400 block mb-1">Indicator:</span>
                    <div className="text-sm text-amber-400 font-mono">
                      {vuln.indicator}
                    </div>
                  </div>

                  {vuln.evidence && (
                    <div>
                      <span className="text-xs text-slate-400 block mb-1">Evidence:</span>
                      <pre className="text-xs bg-slate-700 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto text-white">
                        {vuln.evidence}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <Alert className="bg-green-900/20 border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              No Local File Inclusion vulnerabilities detected
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <FileText className="h-4 w-4" />
            <span>Status: {lfi.vulnerable ? 'Vulnerable' : 'Secure'} • {lfi.testedPayloads} payloads tested</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LFIVulnerabilities;