import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react';
import { OpenRedirectResult } from '@/services/openRedirectService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { openRedirect?: OpenRedirectResult; isTested: boolean; moduleError?: string }

const OpenRedirectResults = ({ openRedirect, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!openRedirect;

  const content = !openRedirect ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No open redirect data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Tested</p><p className="text-lg font-bold text-foreground">{openRedirect.totalTested}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Vulnerable</p><p className={`text-lg font-bold ${openRedirect.vulnerableCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{openRedirect.vulnerableCount}</p></div>
      </div>
      {openRedirect.vulnerableCount > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Open redirect parameters detected — potential SSRF/phishing vector.</p></div>}
      {openRedirect.tests.map((test, i) => (
        <div key={i} className={`bg-muted rounded-lg p-3 space-y-1 border-l-4 ${test.vulnerable ? 'border-red-500' : 'border-green-500'}`}>
          <div className="flex items-center gap-2">
            {test.vulnerable ? <ShieldOff className="h-4 w-4 text-red-500" /> : <ShieldCheck className="h-4 w-4 text-green-500" />}
            <p className="text-sm font-medium text-foreground flex-1">?{test.param}=</p>
            <Badge variant="outline" className="text-xs">{test.statusCode}</Badge>
          </div>
          {test.redirectedTo && <p className="text-xs text-muted-foreground break-all">Redirects to: {test.redirectedTo}</p>}
        </div>
      ))}
      {openRedirect.vulnerableCount === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No open redirect vulnerabilities found in tested parameters.</p></div>}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="Open Redirect Detection" icon={ExternalLink} iconColorClass={hasData && openRedirect!.vulnerableCount > 0 ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="Open redirect check was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default OpenRedirectResults;
