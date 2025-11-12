import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';

interface HeadersAnalysisProps {
  headers: Record<string, any>;
}

const HeadersAnalysis = ({ headers }: HeadersAnalysisProps) => {
  const analysis = headers._analysis;
  const actualHeaders = { ...headers };
  delete actualHeaders._analysis;

  if (!analysis) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-500" />
            HTTP Headers Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No header analysis available</p>
        </CardContent>
      </Card>
    );
  }

  const securityHeaders = analysis.securityHeaders || {
    present: [],
    missing: [],
    score: 0,
    grade: 'N/A',
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-500" />
            HTTP Headers Analysis
          </CardTitle>
          <CORSBypassIndicator metadata={analysis.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Status Code</p>
            <p className="text-2xl font-bold text-primary">{analysis.statusCode}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Security Grade</p>
            <p className="text-2xl font-bold text-green-500">{securityHeaders.grade}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Score</p>
            <p className="text-2xl font-bold text-cyan-500">{securityHeaders.score}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Technologies</p>
            <p className="text-sm text-foreground">
              {analysis.technologies?.length > 0 ? analysis.technologies.join(', ') : 'None'}
            </p>
          </div>
        </div>

        {/* Security Headers */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Headers
          </h4>
          
          {/* Present Headers */}
          {securityHeaders.present && securityHeaders.present.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Present ({securityHeaders.present.length})</p>
              {securityHeaders.present.map((header: any, index: number) => (
                <div key={index} className="bg-muted rounded-lg p-3 border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {header.secure ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="font-medium text-foreground">{header.name}</span>
                        <Badge className={`${getSeverityColor(header.severity)} text-xs`}>
                          {header.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{header.value}</p>
                      {header.recommendation && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          ⚠️ {header.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missing Headers */}
          {securityHeaders.missing && securityHeaders.missing.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Missing ({securityHeaders.missing.length})</p>
              {securityHeaders.missing.map((header: any, index: number) => (
                <div key={index} className="bg-muted rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{header.name}</span>
                        <Badge className={`${getSeverityColor(header.severity)} text-xs`}>
                          {header.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{header.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cookies Analysis */}
        {analysis.cookies && analysis.cookies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Cookies ({analysis.cookies.length})
            </h4>
            {analysis.cookies.map((cookie: any, index: number) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{cookie.name}</span>
                  <div className="flex gap-2">
                    {cookie.secure && <Badge className="bg-green-500/20 text-green-500">Secure</Badge>}
                    {cookie.httpOnly && <Badge className="bg-blue-500/20 text-blue-500">HttpOnly</Badge>}
                    {cookie.sameSite && <Badge className="bg-purple-500/20 text-purple-500">{cookie.sameSite}</Badge>}
                  </div>
                </div>
                {cookie.issues && cookie.issues.length > 0 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-500">
                    {cookie.issues.map((issue: string, i: number) => (
                      <div key={i}>⚠️ {issue}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* All Headers */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">All Headers</h4>
          <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {Object.entries(actualHeaders).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-cyan-500">{key}:</span>
                  <span className="text-muted-foreground break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeadersAnalysis;