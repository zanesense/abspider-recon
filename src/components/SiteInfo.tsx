import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Server, Shield, FileText, Clock } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { CORSBypassMetadata } from '@/services/corsProxy';

interface SiteInfoProps {
  siteInfo: {
    title?: string;
    ip?: string;
    webServer?: string;
    cms?: string;
    cloudflare: boolean;
    robotsTxt?: string;
    statusCode?: number;
    responseTime?: number;
    technologies: string[];
    meta?: {
      description?: string;
      keywords?: string;
      author?: string;
    };
    corsMetadata?: CORSBypassMetadata;
    robotsTxtMetadata?: CORSBypassMetadata;
  };
}

const SiteInfo = ({ siteInfo }: SiteInfoProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-500" />
            Site Information
          </CardTitle>
          <CORSBypassIndicator metadata={siteInfo.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Site Title
              </p>
              <p className="text-foreground font-medium">{siteInfo.title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                IP Address
              </p>
              <p className="text-foreground font-mono">{siteInfo.ip || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Server className="h-3 w-3" />
                Web Server
              </p>
              <p className="text-foreground">{siteInfo.webServer || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">CMS Detected</p>
              <p className="text-foreground">{siteInfo.cms || 'None detected'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Cloudflare
              </p>
              <Badge className={siteInfo.cloudflare ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-muted text-muted-foreground'}>
                {siteInfo.cloudflare ? 'Detected' : 'Not Detected'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">HTTP Status</p>
              <Badge className={siteInfo.statusCode === 200 ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}>
                {siteInfo.statusCode || 'N/A'}
              </Badge>
            </div>
            {siteInfo.responseTime && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Response Time
                </p>
                <p className="text-foreground">{siteInfo.responseTime}ms</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Technologies</p>
              <div className="flex flex-wrap gap-1">
                {siteInfo.technologies.length > 0 ? (
                  siteInfo.technologies.map((tech, index) => (
                    <Badge key={index} className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
                      {tech}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">None detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {siteInfo.robotsTxt && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">robots.txt</p>
            <pre className="text-xs text-foreground bg-muted p-3 rounded overflow-x-auto max-h-48">
              {siteInfo.robotsTxt}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SiteInfo;