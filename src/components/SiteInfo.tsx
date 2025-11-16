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
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground"> {/* Updated text color */}
            <Globe className="h-5 w-5 text-primary" /> {/* Updated text color */}
            Site Information
          </CardTitle>
          <CORSBypassIndicator metadata={siteInfo.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"> {/* Updated text color */}
                <FileText className="h-3 w-3 text-muted-foreground/70" /> {/* Updated text color */}
                Site Title
              </p>
              <p className="text-foreground font-medium">{siteInfo.title || 'N/A'}</p> {/* Updated text color */}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"> {/* Updated text color */}
                <Globe className="h-3 w-3 text-muted-foreground/70" /> {/* Updated text color */}
                IP Address
              </p>
              <p className="text-foreground font-mono">{siteInfo.ip || 'N/A'}</p> {/* Updated text color */}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"> {/* Updated text color */}
                <Server className="h-3 w-3 text-muted-foreground/70" /> {/* Updated text color */}
                Web Server
              </p>
              <p className="text-foreground">{siteInfo.webServer || 'N/A'}</p> {/* Updated text color */}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">CMS Detected</p> {/* Updated text color */}
              <p className="text-foreground">{siteInfo.cms || 'None detected'}</p> {/* Updated text color */}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"> {/* Updated text color */}
                <Shield className="h-3 w-3 text-muted-foreground/70" /> {/* Updated text color */}
                Cloudflare
              </p>
              <Badge className={siteInfo.cloudflare ? 'bg-green-500/20 text-green-600 dark:text-green-500 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}> {/* Updated background, text, and border */}
                {siteInfo.cloudflare ? 'Detected' : 'Not Detected'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">HTTP Status</p> {/* Updated text color */}
              <Badge className={siteInfo.statusCode === 200 ? 'bg-green-500/20 text-green-600 dark:text-green-500 border-green-500/30' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border-yellow-500/30'}> {/* Updated text color */}
                {siteInfo.statusCode || 'N/A'}
              </Badge>
            </div>
            {siteInfo.responseTime && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"> {/* Updated text color */}
                  <Clock className="h-3 w-3 text-muted-foreground/70" /> {/* Updated text color */}
                  Response Time
                </p>
                <p className="text-foreground">{siteInfo.responseTime}ms</p> {/* Updated text color */}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Technologies</p> {/* Updated text color */}
              <div className="flex flex-wrap gap-1">
                {siteInfo.technologies.length > 0 ? (
                  siteInfo.technologies.map((tech, index) => (
                    <Badge key={index} className="bg-primary/20 text-primary border-primary/30"> {/* Updated background, text, and border */}
                      {tech}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground/70 text-sm">None detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {siteInfo.robotsTxt && (
          <div className="mt-6 pt-6 border-t border-border"> {/* Updated border */}
            <p className="text-sm text-muted-foreground mb-2">robots.txt</p> {/* Updated text color */}
            <pre className="text-xs text-foreground bg-muted p-3 rounded overflow-x-auto max-h-48"> {/* Updated text and background color */}
              {siteInfo.robotsTxt}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SiteInfo;