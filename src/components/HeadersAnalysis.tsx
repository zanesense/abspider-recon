import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { HeaderAnalysisResult } from '@/services/headerService'; // Import the correct interface

interface HeadersAnalysisProps {
  headersAnalysis: HeaderAnalysisResult; // Change prop name and type
}

const HeadersAnalysis = ({ headersAnalysis }: HeadersAnalysisProps) => { // Destructure new prop name
  const securityHeaders = headersAnalysis.securityHeaders || {
    present: [],
    missing: [],
    score: 0,
    grade: 'N/A',
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-cyan-400" />
            HTTP Headers Analysis
          </CardTitle>
          <CORSBypassIndicator metadata={headersAnalysis.corsMetadata} /> {/* Use headersAnalysis.corsMetadata */}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Status Code</p>
            <p className="text-2xl font-bold text-cyan-400">{headersAnalysis.statusCode}</p> {/* Use headersAnalysis.statusCode */}
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Security Grade</p>
            <p className="text-2xl font-bold text-green-400">{securityHeaders.grade}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Score</p>
            <p className="text-2xl font-bold text-purple-400">{securityHeaders.score}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Technologies</p>
            <p className="text-sm text-white">
              {headersAnalysis.technologies?.length > 0 ? headersAnalysis.technologies.join(', ') : 'None'} {/* Use headersAnalysis.technologies */}
            </p>
          </div>
        </div>

        {/* Security Headers */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            Security Headers
          </h4>
          
          {/* Present Headers */}
          {securityHeaders.present && securityHeaders.present.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Present ({securityHeaders.present.length})</p>
              {securityHeaders.present.map((header: any, index: number) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3 border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {header.secure ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="font-medium text-white">{header.name}</span>
                        <Badge className={getSeverityColor(header.severity)}>
                          {header.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{header.value}</p>
                      {header.recommendation && (
                        <p className="text-xs text-yellow-500 mt-1">
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
              <p className="text-xs text-slate-400">Missing ({securityHeaders.missing.length})</p>
              {securityHeaders.missing.map((header: any, index: number) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{header.name}</span>
                        <Badge className={getSeverityColor(header.severity)}>
                          {header.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{header.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cookies Analysis */}
        {headersAnalysis.cookies && headersAnalysis.cookies.length > 0 && ( {/* Use headersAnalysis.cookies */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              Cookies ({headersAnalysis.cookies.length})
            </h4>
            {headersAnalysis.cookies.map((cookie: any, index: number) => (
              <div key={index} className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{cookie.name}</span>
                  <div className="flex gap-2">
                    {cookie.secure && <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Secure</Badge>}
                    {cookie.httpOnly && <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">HttpOnly</Badge>}
                    {cookie.sameSite && <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">{cookie.sameSite}</Badge>}
                  </div>
                </div>
                {cookie.issues && cookie.issues.length > 0 && (
                  <div className="text-xs text-yellow-500">
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
          <h4 className="text-sm font-semibold text-white">All Headers</h4>
          <div className="bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {Object.entries(headersAnalysis.headers).map(([key, value]) => ( {/* Use headersAnalysis.headers */}
                <div key={key} className="flex gap-2">
                  <span className="text-cyan-400">{key}:</span>
                  <span className="text-slate-400 break-all">{String(value)}</span>
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