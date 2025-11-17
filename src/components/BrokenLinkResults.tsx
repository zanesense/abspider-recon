import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { BrokenLinkResult } from '@/services/brokenLinkService';

interface BrokenLinkResultsProps {
  brokenLinks: BrokenLinkResult;
}

const BrokenLinkResults = ({ brokenLinks }: BrokenLinkResultsProps) => {
  if (!brokenLinks.tested) {
    return (
      <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <LinkIcon className="h-5 w-5 text-pink-500 dark:text-pink-400" />
            Broken Link Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Broken link check not performed.</p>
        </CardContent>
      </Card>
    );
  }

  const hasBrokenLinks = brokenLinks.brokenLinks.length > 0;

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <LinkIcon className="h-5 w-5 text-pink-500 dark:text-pink-400" />
            Broken Link Checker
          </CardTitle>
          <CORSBypassIndicator metadata={brokenLinks.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Links Checked</p>
            <p className="text-2xl font-bold text-primary">{brokenLinks.totalLinksChecked}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Broken Links Found</p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{brokenLinks.brokenLinks.length}</p>
          </div>
        </div>

        {hasBrokenLinks ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Broken Links
            </h4>
            {brokenLinks.brokenLinks.map((link, index) => (
              <div key={index} className="bg-muted rounded-lg p-3 border-l-4 border-red-500/50">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-foreground font-mono text-sm hover:underline break-all">
                  {link.url}
                </a>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
                    Status: {link.status || 'Network Error'}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground border-border">
                    {link.isInternal ? 'Internal' : 'External'}
                  </Badge>
                </div>
                {link.sourcePage && (
                  <div className="mt-1 flex items-start gap-2 text-xs">
                    <Info className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-muted-foreground">From: <a href={link.sourcePage} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.sourcePage}</a></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              No broken links found.
            </p>
          </div>
        )}

        {brokenLinks.errors && brokenLinks.errors.length > 0 && (
          <div className="mt-4 text-sm text-destructive">
            <p className="font-semibold">Errors:</p>
            <ul className="list-disc list-inside">
              {brokenLinks.errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrokenLinkResults;