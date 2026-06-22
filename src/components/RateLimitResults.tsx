import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, ShieldCheck, ShieldOff, Info } from 'lucide-react';
import { RateLimitResult } from '@/services/rateLimitService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { rateLimit?: RateLimitResult; isTested: boolean; moduleError?: string }

const RateLimitResults = ({ rateLimit, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!rateLimit;

  const content = !rateLimit ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No rate limit data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Rate Limited</p><p>{rateLimit.rateLimited ? <ShieldCheck className="h-5 w-5 text-green-500 inline" /> : <ShieldOff className="h-5 w-5 text-red-500 inline" />}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Requests</p><p className="text-lg font-bold text-foreground">{rateLimit.requestsSent}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Blocked</p><p className={`text-lg font-bold ${rateLimit.requestsBlocked > 0 ? 'text-green-500' : 'text-red-500'}`}>{rateLimit.requestsBlocked}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Status Codes</p><p className="text-lg font-bold text-foreground">{rateLimit.statusCodes.filter((v,i,a)=>a.indexOf(v)===i).join(', ')}</p></div>
      </div>
      {rateLimit.details && <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> {rateLimit.details}</p></div>}
      {Object.keys(rateLimit.rateLimitHeaders).length > 0 && (
        <div className="space-y-1"><p className="text-xs font-medium text-foreground">Rate Limit Headers</p>{Object.entries(rateLimit.rateLimitHeaders).map(([k, v]) => <p key={k} className="text-xs text-muted-foreground"><span className="font-mono">{k}</span>: {v}</p>)}</div>
      )}
      {!rateLimit.rateLimited && Object.keys(rateLimit.rateLimitHeaders).length === 0 && <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"><p className="text-sm text-yellow-600 dark:text-yellow-400">No rate limiting detected. Target may be susceptible to brute-force attacks.</p></div>}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="Rate Limiting Test" icon={Gauge} iconColorClass={hasData ? (rateLimit!.rateLimited ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="Rate limit test was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default RateLimitResults;
