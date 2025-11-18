import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { BrokenLinkResult } from '@/services/brokenLinkService';
import ModuleCardWrapper from './ModuleCardWrapper'; // Import the new wrapper

interface BrokenLinkResultsProps {
  brokenLinks?: BrokenLinkResult;
  isTested: boolean; // New prop
  moduleError?: string; // New prop
}

const BrokenLinkResults = ({ brokenLinks, isTested, moduleError }: BrokenLinkResultsProps) => {
  if (!isTested) return null;

  const hasBrokenLinks = (brokenLinks?.brokenLinks?.length || 0) > 0;
  const hasData = !!brokenLinks && (brokenLinks.totalLinksChecked > 0 || hasBrokenLinks);

  return (
    <ModuleCardWrapper
      title="Broken Link Checker"
      icon={LinkIcon}
      iconColorClass="text-pink-500 dark:text-pink-400"
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="Broken link check not performed or no links found."
      headerActions={<CORSBypassIndicator metadata={brokenLinks?.corsMetadata} />}
    >
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Links Checked</p>
            <p className="text-2xl font-bold text-primary">{brokenLinks?.totalLinksChecked}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Broken Links Found</p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{brokenLinks?.brokenLinks.length}</p>
          </div>
        </div>

        {hasBrokenLinks ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Broken Links
            </h4>
            {brokenLinks?.brokenLinks.map((link, index) => (
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
                    <span className="text-muted-foreground">From: <a href={link.sourcePage} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{link.sourcePage}</a></span>
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

        {brokenLinks?.errors && brokenLinks.errors.length > 0 && (
          <div className="mt-4 text-sm text-destructive">
            <p className="font-semibold">Errors:</p>
            <ul className="list-disc list-inside">
              {brokenLinks.errors.map((error, i) => <li key={i} className="break-words">{error}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default BrokenLinkResults;