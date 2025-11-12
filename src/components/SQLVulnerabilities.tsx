import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Code, Info, Lightbulb } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { CORSBypassMetadata } from '@/services/corsProxy';

interface SQLVulnerabilitiesProps {
  sqlinjection: {
    vulnerable: boolean;
    testedPayloads: number;
    vulnerabilities: Array<{
      payload: string;
      indicator: string;
      severity: 'high' | 'medium' | 'low';
      type?: string;
      evidence?: string;
    }>;
    tested: boolean;
    method?: string;
    corsMetadata?: CORSBypassMetadata;
  };
}

const SQLVulnerabilities = ({ sqlinjection }: SQLVulnerabilitiesProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            {sqlinjection.vulnerable ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : (
              <Shield className="h-5 w-5 text-green-400" />
            )}
            SQL Injection Scan
          </CardTitle>
          <CORSBypassIndicator metadata={sqlinjection.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge className={sqlinjection.vulnerable ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}>
              {sqlinjection.vulnerable ? 'VULNERABLE' : 'SECURE'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Payloads Tested</p>
            <p className="text-2xl font-bold text-cyan-500 dark:text-cyan-400">{sqlinjection.testedPayloads}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Vulnerabilities Found</p>
            <p className="text-2xl font-bold text-red-400">{sqlinjection.vulnerabilities.length}</p>
          </div>
        </div>

        {sqlinjection.method && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3" />
              Testing Method: {sqlinjection.method}
            </p>
          </div>
        )}

        {sqlinjection.vulnerabilities.length > 0 ? (
          <>
            <Alert variant="destructive" className="bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">🛡️ Mitigation Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Use parameterized queries or prepared statements (NEVER concatenate user input)</li>
                  <li>Implement strict input validation and sanitization</li>
                  <li>Use ORM frameworks (Sequelize, TypeORM, Prisma) with parameterized queries</li>
                  <li>Apply principle of least privilege to database users</li>
                  <li>Enable Web Application Firewall (WAF) with SQL injection rules</li>
                  <li>Escape all special characters in user input</li>
                  <li>Regular security audits and penetration testing</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Detected Vulnerabilities
              </h4>
              <div className="space-y-3">
                {sqlinjection.vulnerabilities.map((vuln, index) => (
                <div key={index} className="bg-muted rounded-lg p-4 border border-red-900/50 dark:border-red-900/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      {vuln.type && (
                        <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                          {vuln.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Code className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Payload:</span>
                      </div>
                      <p className="text-sm text-foreground font-mono bg-muted/50 p-2 rounded break-all">
                        {vuln.payload}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Indicator:</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{vuln.indicator}</p>
                    </div>
                    {vuln.evidence && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Evidence:</p>
                        <p className="text-xs text-foreground bg-muted/50 p-2 rounded font-mono break-all">
                          {vuln.evidence}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              No SQL injection vulnerabilities detected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SQLVulnerabilities;