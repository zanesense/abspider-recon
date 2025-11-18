import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Code, Info, Lightbulb } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { CORSBypassMetadata } from '@/services/corsProxy';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface SQLVulnerabilitiesProps {
  sqlinjection?: {
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
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const SQLVulnerabilities = ({ sqlinjection, isTested, moduleError }: SQLVulnerabilitiesProps) => {
  if (!isTested) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const hasData = !!sqlinjection && (sqlinjection.testedPayloads > 0 || sqlinjection.vulnerabilities.length > 0);

  return (
    <ModuleCardWrapper
      title="SQL Injection Scan"
      icon={sqlinjection?.vulnerable ? AlertTriangle : Shield}
      iconColorClass={sqlinjection?.vulnerable ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="SQL Injection scan not performed or no vulnerabilities detected."
      headerActions={<CORSBypassIndicator metadata={sqlinjection?.corsMetadata} />}
    >
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge className={sqlinjection?.vulnerable ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'}>
              {sqlinjection?.vulnerable ? 'VULNERABLE' : 'SECURE'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Payloads Tested</p>
            <p className="text-2xl font-bold text-primary">{sqlinjection?.testedPayloads}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Vulnerabilities Found</p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{sqlinjection?.vulnerabilities.length}</p>
          </div>
        </div>

        {sqlinjection?.method && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2 break-words">
              <Info className="h-3 w-3 text-muted-foreground/70" />
              Testing Method: {sqlinjection.method}
            </p>
          </div>
        )}

        {sqlinjection?.vulnerabilities && sqlinjection.vulnerabilities.length > 0 ? (
          <>
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2 text-destructive dark:text-red-400">🛡️ Mitigation Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-destructive-foreground dark:text-red-300 text-sm">
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
              <h4 className="text-sm font-medium text-destructive dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Detected Vulnerabilities
              </h4>
              <div className="space-y-3">
                {sqlinjection.vulnerabilities.map((vuln, index) => (
                <div key={index} className="bg-muted rounded-lg p-4 border border-destructive/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      {vuln.type && (
                        <Badge className="bg-muted/50 text-muted-foreground border-border">
                          {vuln.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Code className="h-3 w-3 text-muted-foreground/70" />
                        <span className="text-xs text-muted-foreground">Payload:</span>
                      </div>
                      <p className="text-foreground font-mono bg-muted/50 p-2 rounded break-all">
                        {vuln.payload}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Indicator:</p>
                      <p className="text-destructive dark:text-red-400 break-words">{vuln.indicator}</p>
                    </div>
                    {vuln.evidence && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Evidence:</p>
                        <p className="text-foreground bg-muted/50 p-2 rounded font-mono break-all">
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
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              No SQL injection vulnerabilities detected
            </p>
          </div>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default SQLVulnerabilities;