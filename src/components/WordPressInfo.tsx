import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, Shield, FileText } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { CORSBypassMetadata } from '@/services/corsProxy';

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
    corsMetadata?: CORSBypassMetadata;
  };
}

const WordPressInfo = ({ wordpress }: WordPressInfoProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  return (
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2"> {/* Updated text color */}
            <Globe className="h-5 w-5 text-green-500 dark:text-green-400" /> {/* Updated text color */}
            WordPress Scanner
          </CardTitle>
          <CORSBypassIndicator metadata={wordpress.corsMetadata} />
        </div>
      </CardHeader>
      {!wordpress.isWordPress ? (
        <CardContent>
          <p className="text-muted-foreground">This site is not running WordPress</p> {/* Updated text color */}
        </CardContent>
      ) : (
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">WordPress Detected</p> {/* Updated text color */}
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
              Yes
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Version</p> {/* Updated text color */}
            <p className="text-foreground font-mono">{wordpress.version || 'Unknown'}</p> {/* Updated text color */}
          </div>
          <div className="bg-muted rounded-lg p-4"> {/* Updated background */}
            <p className="text-sm text-muted-foreground mb-1">Vulnerabilities</p> {/* Updated text color */}
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{wordpress.vulnerabilities.length}</p> {/* Updated text color */}
          </div>
        </div>

        {wordpress.vulnerabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-2 mb-3"> {/* Updated text color */}
              <AlertTriangle className="h-4 w-4" />
              Security Issues
            </h4>
            <div className="space-y-2">
              {wordpress.vulnerabilities.map((vuln, index) => (
                <div key={index} className="bg-muted rounded-lg p-4 border border-destructive/30"> {/* Updated background and border */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-foreground font-medium">{vuln.title}</span> {/* Updated text color */}
                    <Badge className={getSeverityColor(vuln.severity)}>
                      {vuln.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{vuln.description}</p> {/* Updated text color */}
                </div>
              ))}
            </div>
          </div>
        )}

        {wordpress.sensitiveFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-3"> {/* Updated text color */}
              <FileText className="h-4 w-4" />
              Sensitive Files ({wordpress.sensitiveFiles.length})
            </h4>
            <div className="space-y-1">
              {wordpress.sensitiveFiles.map((file, index) => (
                <div key={index} className="bg-muted rounded p-2 flex items-center justify-between"> {/* Updated background */}
                  <span className="text-foreground font-mono text-sm">{file.path}</span> {/* Updated text color */}
                  {file.size && (
                    <span className="text-muted-foreground/70 text-xs">{(file.size / 1024).toFixed(2)} KB</span> {/* Updated text color */}
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wordpress.plugins.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Plugins ({wordpress.plugins.length})</h4> {/* Updated text color */}
              <div className="flex flex-wrap gap-1">
                {wordpress.plugins.map((plugin, index) => (
                  <Badge key={index} className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"> {/* Updated text color */}
                    {plugin}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {wordpress.themes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Themes ({wordpress.themes.length})</h4> {/* Updated text color */}
              <div className="flex flex-wrap gap-1">
                {wordpress.themes.map((theme, index) => (
                  <Badge key={index} className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"> {/* Updated text color */}
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
};

export default WordPressInfo;