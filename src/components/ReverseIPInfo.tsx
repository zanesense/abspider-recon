import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, ExternalLink, Globe, Server, Shield, FileText, Code } from 'lucide-react'; // Added new icons
import { ReverseIPResult, DiscoveredDomain } from '@/services/reverseIPService'; // Import DiscoveredDomain
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface ReverseIPInfoProps {
  reverseip?: ReverseIPResult;
  isTested: boolean;
  moduleError?: string;
}

const ReverseIPInfo = ({ reverseip, isTested, moduleError }: ReverseIPInfoProps) => {
  if (!isTested) return null;

  const hasData = !!reverseip && (!!reverseip.ip && reverseip.domains.length > 0);

  return (
    <ModuleCardWrapper
      title="Reverse IP Lookup"
      icon={Network}
      iconColorClass="text-indigo-500 dark:text-indigo-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="No other domains found on this IP or reverse IP lookup not performed."
    >
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">IP Address</p>
          <p className="text-foreground font-mono text-lg break-all">{reverseip?.ip || 'N/A'}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-3">Domains on this IP ({reverseip?.totalDomains || 0})</p>
          <div className="space-y-2">
            {reverseip?.domains && reverseip.domains.length > 0 ? (
              reverseip.domains.map((item: DiscoveredDomain, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 border-l-4 border-indigo-500/50">
                  <a href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group">
                    <span className="flex-1 min-w-0 text-foreground font-mono text-sm group-hover:text-primary transition-colors break-all">
                      {item.domain}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/70 group-hover:text-primary transition-colors ml-2 flex-shrink-0" />
                  </a>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {item.httpStatus && (
                      <Badge variant="outline" className={item.httpStatus >= 200 && item.httpStatus < 300 ? "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"}>
                        Status: {item.httpStatus}
                      </Badge>
                    )}
                    {item.cms && (
                      <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
                        CMS: {item.cms}
                      </Badge>
                    )}
                    {item.webServer && (
                      <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                        Server: {item.webServer}
                      </Badge>
                    )}
                    {item.cloudflare && (
                      <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30">
                        <Shield className="h-3 w-3 mr-1" /> Cloudflare
                      </Badge>
                    )}
                    {item.technologies && item.technologies.length > 0 && (
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        <Code className="h-3 w-3 mr-1" /> {item.technologies.join(', ')}
                      </Badge>
                    )}
                  </div>
                  {item.title && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground/70" />
                      Title: <span className="text-foreground break-words">{item.title}</span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground/70 text-sm text-center py-4">No other domains found on this IP</p>
            )}
          </div>
        </div>
      </div>
    </ModuleCardWrapper>
  );
};

export default ReverseIPInfo;