import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Server, Shield, FileText, Clock } from 'lucide-react';

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
  };
}

const SiteInfo = ({ siteInfo }: SiteInfoProps) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-400" />
          Site Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Site Title
              </p>
              <p className="text-white font-medium">{siteInfo.title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                IP Address
              </p>
              <p className="text-white font-mono">{siteInfo.ip || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Server className="h-3 w-3" />
                Web Server
              </p>
              <p className="text-white">{siteInfo.webServer || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">CMS Detected</p>
              <p className="text-white">{siteInfo.cms || 'None detected'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Cloudflare
              </p>
              <Badge className={siteInfo.cloudflare ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-700 text-slate-400'}>
                {siteInfo.cloudflare ? 'Detected' : 'Not Detected'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">HTTP Status</p>
              <Badge className={siteInfo.statusCode === 200 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                {siteInfo.statusCode || 'N/A'}
              </Badge>
            </div>
            {siteInfo.responseTime && (
              <div>
                <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Response Time
                </p>
                <p className="text-white">{siteInfo.responseTime}ms</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400 mb-1">Technologies</p>
              <div className="flex flex-wrap gap-1">
                {siteInfo.technologies.length > 0 ? (
                  siteInfo.technologies.map((tech, index) => (
                    <Badge key={index} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {tech}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">None detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {siteInfo.robotsTxt && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-2">robots.txt</p>
            <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-x-auto max-h-48">
              {siteInfo.robotsTxt}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SiteInfo;