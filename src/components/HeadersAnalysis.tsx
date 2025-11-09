import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, Server } from 'lucide-react';

interface HeadersAnalysisProps {
  headers: Record<string, any>;
}

const HeadersAnalysis = ({ headers }: HeadersAnalysisProps) => {
  const analysis = headers._analysis;
  const actualHeaders = { ...headers };
  delete actualHeaders._analysis;

  const securityHeaders = analysis?.securityHeaders || {
    present: [],
    missing: [],
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          HTTP Headers Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Status Code</p>
              <p className="text-2xl font-bold text-cyan-400">{analysis.statusCode}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Security Score</p>
              <p className="text-2xl font-bold text-green-400">
                {securityHeaders.present.length}/{securityHeaders.present.length + securityHeaders.missing.length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Technologies</p>
              <p className="text-sm text-white">
                {analysis.technologies.length > 0 ? analysis.technologies.join(', ') : 'None detected'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Present Security Headers ({securityHeaders.present.length})
            </h4>
            <div className="space-y-1">
              {securityHeaders.present.length > 0 ? (
                securityHeaders.present.map((header: string) => (
                  <div key={header} className="text-sm text-slate-300 bg-slate-800 px-3 py-2 rounded flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    {header}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No security headers found</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Missing Security Headers ({securityHeaders.missing.length})
            </h4>
            <div className="space-y-1">
              {securityHeaders.missing.length > 0 ? (
                securityHeaders.missing.map((header: string) => (
                  <div key={header} className="text-sm text-slate-400 bg-slate-800 px-3 py-2 rounded flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-400" />
                    {header}
                  </div>
                ))
              ) : (
                <p className="text-sm text-green-400 italic">All security headers present!</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Server className="h-4 w-4" />
            All Headers ({Object.keys(actualHeaders).length})
          </h4>
          <div className="bg-slate-800 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(actualHeaders).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-cyan-400 font-mono">{key}:</span>
                <span className="text-slate-300 ml-2 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeadersAnalysis;