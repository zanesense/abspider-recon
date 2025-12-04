import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { HeaderAnalysisResult } from '@/services/headerService';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper
import React from 'react'; // Import React for Fragment

interface HeadersAnalysisProps {
  headersAnalysis?: HeaderAnalysisResult;
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const HeadersAnalysis = ({ headersAnalysis, isTested, moduleError }: HeadersAnalysisProps) => {
  if (!isTested) return null;

  const currentHeadersAnalysis: HeaderAnalysisResult = headersAnalysis || {
    headers: {},
    statusCode: 0,
    securityHeaders: {
      present: [],
      missing: [],
      score: 0,
      grade: 'N/A',
    },
    cookies: [],
    cacheControl: {
      present: false,
      directives: [],
      issues: [],
    },
    cors: {
      enabled: false,
      issues: [],
    },
    corsMetadata: {
      usedProxy: false,
      attemptsDirect: false,
      attemptsViaProxy: 0,
    }
  };

  const securityHeaders = currentHeadersAnalysis.securityHeaders;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const hasData = !!headersAnalysis && (
    Object.keys(headersAnalysis.headers).length > 0 ||
    headersAnalysis.securityHeaders.present.length > 0 ||
    headersAnalysis.securityHeaders.missing.length > 0 ||
    headersAnalysis.cookies.length > 0
  );

  return (
    <ModuleCardWrapper
      title="HTTP Headers Analysis"
      icon={Shield}
      iconColorClass="text-primary"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No HTTP header information could be retrieved."
      headerActions={<CORSBypassIndicator metadata={currentHeadersAnalysis.corsMetadata} />}
    >
      <React.Fragment> {/* Added React.Fragment here */}
        {/* Security Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Status Code</p>
            <p className="text-primary font-bold text-2xl">{currentHeadersAnalysis.statusCode}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Security Grade</p>
            <p className="text-green-500 dark:text-green-400 font-bold text-2xl">{securityHeaders.grade}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Score</p>
            <p className="text-purple-500 dark:text-purple-400 font-bold text-2xl">{securityHeaders.score}</p>
          </div>
        </div>

        {/* Security Headers */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
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
                        <Badge className={getSeverityColor(header.severity)}>
                          {header.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">{header.value}</p>
                      {header.recommendation && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 break-words">
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
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{header.name}</span>
                          <Badge className={getSeverityColor(header.severity)}>
                            {header.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground break-words">{header.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* Cookies Analysis */}
        {currentHeadersAnalysis.cookies && currentHeadersAnalysis.cookies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              Cookies ({currentHeadersAnalysis.cookies.length})
            </h4>
            {currentHeadersAnalysis.cookies.map((cookie: any, index: number) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground break-all">{cookie.name}</span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {cookie.secure && <Badge className="bg-green-500/20 text-green-600 dark:text-green-500 border-green-500/30">Secure</Badge>}
                    {cookie.httpOnly && <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-500 border-blue-500/30">HttpOnly</Badge>}
                    {cookie.sameSite && <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-500 border-purple-500/30">{cookie.sameSite}</Badge>}
                    {cookie.domain && <span className="text-xs text-muted-foreground break-all">Domain: {cookie.domain}</span>}
                    {cookie.path && <span className="text-xs text-muted-foreground break-all">Path: {cookie.path}</span>}
                    {cookie.expires && <span className="text-xs text-muted-foreground break-all">Expires: {cookie.expires}</span>}
                  </div>
                </div>
                {cookie.issues && cookie.issues.length > 0 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                    {cookie.issues.map((issue: string, i: number) => (
                      <div key={i} className="break-words">⚠️ {issue}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cache Control Analysis */}
        {currentHeadersAnalysis.cacheControl && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              Cache Control
            </h4>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Directives:</p>
              <p className="text-foreground font-mono text-xs break-all">
                {currentHeadersAnalysis.cacheControl.directives.length > 0 ? currentHeadersAnalysis.cacheControl.directives.join(', ') : 'None'}
              </p>
              {currentHeadersAnalysis.cacheControl.issues.length > 0 && (
                <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 space-y-1">
                  {currentHeadersAnalysis.cacheControl.issues.map((issue, i) => (
                    <div key={i} className="break-words">⚠️ {issue}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CORS Analysis */}
        {currentHeadersAnalysis.cors && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-red-500 dark:text-red-400" />
              CORS Policy
            </h4>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Enabled: <span className="text-foreground">{currentHeadersAnalysis.cors.enabled ? 'Yes' : 'No'}</span></p>
              {currentHeadersAnalysis.cors.allowOrigin && <p className="text-sm text-muted-foreground break-all">Allow-Origin: <span className="text-foreground font-mono">{currentHeadersAnalysis.cors.allowOrigin}</span></p>}
              {currentHeadersAnalysis.cors.allowMethods && <p className="text-sm text-muted-foreground break-all">Allow-Methods: <span className="text-foreground font-mono">{currentHeadersAnalysis.cors.allowMethods}</span></p>}
              {currentHeadersAnalysis.cors.allowHeaders && <p className="text-sm text-muted-foreground break-all">Allow-Headers: <span className="text-foreground font-mono">{currentHeadersAnalysis.cors.allowHeaders}</span></p>}
              {currentHeadersAnalysis.cors.exposeHeaders && <p className="text-sm text-muted-foreground break-all">Expose-Headers: <span className="text-foreground font-mono">{currentHeadersAnalysis.cors.exposeHeaders}</span></p>}
              {currentHeadersAnalysis.cors.allowCredentials && <p className="text-sm text-muted-foreground">Allow-Credentials: <span className="text-foreground">{currentHeadersAnalysis.cors.allowCredentials ? 'Yes' : 'No'}</span></p>}
              {currentHeadersAnalysis.cors.maxAge !== undefined && <p className="text-sm text-muted-foreground">Max-Age: <span className="text-foreground">{currentHeadersAnalysis.cors.maxAge}s</span></p>}
              {currentHeadersAnalysis.cors.issues.length > 0 && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
                  {currentHeadersAnalysis.cors.issues.map((issue, i) => (
                    <div key={i} className="break-words">⚠️ {issue}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Headers */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">All Headers</h4>
          <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {Object.entries(currentHeadersAnalysis.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-primary break-words">{key}:</span>
                  <span className="text-muted-foreground break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </React.Fragment> {/* Closed React.Fragment here */}
    </ModuleCardWrapper>
  );
};

export default HeadersAnalysis;