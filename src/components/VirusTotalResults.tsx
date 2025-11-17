import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckCircle, XCircle, Info, Link, Mail, FileText } from 'lucide-react';
import { VirusTotalResult } from '@/services/virustotalService';

interface VirusTotalResultsProps {
  virustotal: VirusTotalResult;
}

const VirusTotalResults = ({ virustotal }: VirusTotalResultsProps) => {
  if (!virustotal.tested) {
    return (
      <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ShieldAlert className="h-5 w-5 text-red-500 dark:text-red-400" />
            VirusTotal Scan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">VirusTotal scan not performed or encountered an error.</p>
          {virustotal.errors && virustotal.errors.length > 0 && (
            <div className="mt-2 text-sm text-destructive">
              <p className="font-semibold">Errors:</p>
              <ul className="list-disc list-inside">
                {virustotal.errors.map((error, i) => <li key={i}>{error}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const isMalicious = (virustotal.maliciousVotes || 0) > 0;

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ShieldAlert className="h-5 w-5 text-red-500 dark:text-red-400" />
          VirusTotal Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Domain</p>
            <p className="text-foreground font-mono text-lg">{virustotal.domain}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Reputation</p>
            <Badge className={isMalicious ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'}>
              {virustotal.reputation !== undefined ? virustotal.reputation : 'N/A'}
            </Badge>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Malicious / Harmless Votes</p>
            <p className="text-2xl font-bold text-foreground">
              <span className="text-red-500 dark:text-red-400">{virustotal.maliciousVotes || 0}</span> / <span className="text-green-500 dark:text-green-400">{virustotal.harmlessVotes || 0}</span>
            </p>
          </div>
        </div>

        {virustotal.lastAnalysisDate && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3 text-muted-foreground/70" />
              Last Analysis: <span className="text-foreground font-medium">{new Date(virustotal.lastAnalysisDate).toLocaleString()}</span>
            </p>
          </div>
        )}

        {virustotal.categories && virustotal.categories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {virustotal.categories.map((category, index) => (
                <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {virustotal.registrar && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Registrar
            </h4>
            <p className="text-foreground bg-muted rounded p-3 text-sm">{virustotal.registrar}</p>
          </div>
        )}

        {virustotal.detectedUrls && virustotal.detectedUrls.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-2 mb-3">
              <Link className="h-4 w-4" />
              Detected URLs ({virustotal.detectedUrls.length})
            </h4>
            <div className="space-y-2">
              {virustotal.detectedUrls.map((url, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-foreground font-mono text-sm hover:underline break-all">
                    {url.url}
                  </a>
                  <Badge className={url.positives > 0 ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'}>
                    {url.positives}/{url.total} Malicious
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {virustotal.detectedCommunicatingFiles && virustotal.detectedCommunicatingFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Detected Communicating Files ({virustotal.detectedCommunicatingFiles.length})
            </h4>
            <div className="space-y-2">
              {virustotal.detectedCommunicatingFiles.map((file, index) => (
                <div key={index} className="bg-muted rounded-lg p-3">
                  <p className="text-foreground font-medium">{file.filename}</p>
                  <p className="text-sm text-muted-foreground font-mono break-all">SHA256: {file.sha256}</p>
                  <Badge className={file.positives > 0 ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'}>
                    {file.positives} Detections
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {virustotal.errors && virustotal.errors.length > 0 && (
          <div className="mt-4 text-sm text-destructive">
            <p className="font-semibold">Errors:</p>
            <ul className="list-disc list-inside">
              {virustotal.errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VirusTotalResults;