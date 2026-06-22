import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, XCircle, Search, Map } from 'lucide-react';
import { RobotsSitemapResult } from '@/services/robotsSitemapService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { robotsSitemap?: RobotsSitemapResult; isTested: boolean; moduleError?: string }

const RobotsSitemapResults = ({ robotsSitemap, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!robotsSitemap;

  const content = !robotsSitemap ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No robots/sitemap data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">robots.txt</p><p>{robotsSitemap.robots.exists ? <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> : <XCircle className="h-5 w-5 text-red-500 inline" />}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Disallowed</p><p className="text-lg font-bold text-yellow-500">{robotsSitemap.robots.disallowedPaths.length}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">sitemap.xml</p><p>{robotsSitemap.sitemap.exists ? <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> : <XCircle className="h-5 w-5 text-red-500 inline" />}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">URLs in Sitemap</p><p className="text-lg font-bold text-foreground">{robotsSitemap.sitemap.count}</p></div>
      </div>
      {robotsSitemap.robots.disallowedPaths.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground flex items-center gap-1"><Search className="h-3 w-3" /> Disallowed Paths</p>
          <div className="flex flex-wrap gap-1">{robotsSitemap.robots.disallowedPaths.slice(0, 20).map((p, i) => <code key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded text-yellow-500 break-all">{p}</code>)}</div>
        </div>
      )}
      {robotsSitemap.sitemap.count > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground flex items-center gap-1"><Map className="h-3 w-3" /> Sitemap URLs (first 15)</p>
          <div className="space-y-1">{robotsSitemap.sitemap.urls.slice(0, 15).map((url, i) => <p key={i} className="text-xs text-muted-foreground break-all">{url}</p>)}</div>
        </div>
      )}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="Sitemap & Robots" icon={FileText} iconColorClass={hasData ? 'text-yellow-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="Sitemap/Robots parsing was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default RobotsSitemapResults;
