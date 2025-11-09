import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, Shield, FileText } from 'lucide-react';

interface WordPressInfoProps {
  wordpress: {
    isWordPress: boolean;
    version?: string;
    vulnerabilities: Array<{
      title: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
    }>;
    sensitiveFiles: Array<{
      path: string;
      accessible: boolean;
      size?: number;
    }>;
    plugins: string[];
    themes: string[];
  };
}

const WordPressInfo = ({ wordpress }: WordPressInfoProps) => {
  if (!wordpress.isWordPress) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-400" />
            WordPress Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">This site is not running WordPress</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-green-400" />
          WordPress Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">WordPress Detected</p>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Yes
            </Badge>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Version</p>
            <p className="text-white font-mono">{wordpress.version || 'Unknown'}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Vulnerabilities</p>
            <p className="text-2xl font-bold text-red-400">{wordpress.vulnerabilities.length}</p>
          </div>
        </div>

        {wordpress.vulnerabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Security Issues
            </h4>
            <div className="space-y-2">
              {wordpress.vulnerabilities.map((vuln, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-4 border border-red-900/30">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white font-medium">{vuln.title}</span>
                    <Badge className={getSeverityColor(vuln.severity)}>
                      {vuln.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{vuln.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {wordpress.sensitiveFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-400 flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Sensitive Files ({wordpress.sensitiveFiles.length})
            </h4>
            <div className="space-y-1">
              {wordpress.sensitiveFiles.map((file, index) => (
                <div key={index} className="bg-slate-800 rounded p-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300 font-mono">{file.path}</span>
                  {file.size && (
                    <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wordpress.plugins.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Plugins ({wordpress.plugins.length})</h4>
              <div className="flex flex-wrap gap-1">
                {wordpress.plugins.map((plugin, index) => (
                  <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {plugin}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {wordpress.themes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Themes ({wordpress.themes.length})</h4>
              <div className="flex flex-wrap gap-1">
                {wordpress.themes.map((theme, index) => (
                  <Badge key={index} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WordPressInfo;