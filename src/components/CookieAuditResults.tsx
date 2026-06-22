import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, ShieldCheck, ShieldOff, AlertTriangle, Lock, Eye, Globe } from 'lucide-react';
import { CookieAuditResult } from '@/services/cookieAuditService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface CookieAuditResultsProps {
  cookieAudit?: CookieAuditResult;
  isTested: boolean;
  moduleError?: string;
}

const CookieAuditResults = ({ cookieAudit, isTested, moduleError }: CookieAuditResultsProps) => {
  if (!isTested) return null;

  const hasData = !!cookieAudit;

  return (
    <ModuleCardWrapper
      title="Cookie Security Audit"
      icon={Cookie}
      iconColorClass={hasData ? (cookieAudit!.insecureCookies === 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400') : 'text-muted-foreground'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="Cookie audit was not performed or encountered an error."
    >
      <CardContent className="space-y-4">
        {hasData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Cookies</p>
                <p className="text-lg font-bold text-foreground">{cookieAudit!.totalCount}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Secure</p>
                <p className="text-lg font-bold text-green-500 dark:text-green-400">{cookieAudit!.secureCount}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">HttpOnly</p>
                <p className="text-lg font-bold text-blue-500 dark:text-blue-400">{cookieAudit!.httpOnlyCount}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">SameSite</p>
                <p className="text-lg font-bold text-purple-500 dark:text-purple-400">{cookieAudit!.sameSiteCount}</p>
              </div>
            </div>

            {cookieAudit!.insecureCookies > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {cookieAudit!.insecureCookies} cookie(s) have security issues
                </p>
              </div>
            )}

            {cookieAudit!.totalCount === 0 && (
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">No cookies were set by the target.</p>
              </div>
            )}

            <div className="space-y-2">
              {cookieAudit!.cookies.map((cookie, index) => (
                <div key={index} className={`bg-muted rounded-lg p-3 space-y-1 ${cookie.issues.length > 0 ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{cookie.name}</p>
                    <div className="flex gap-1">
                      {cookie.secure && <Lock className="h-3 w-3 text-green-500" />}
                      {cookie.httpOnly && <Eye className="h-3 w-3 text-blue-500" />}
                      {cookie.sameSite && <Globe className="h-3 w-3 text-purple-500" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cookie.secure ? (
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-[10px]">Secure</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">No Secure</Badge>
                    )}
                    {cookie.httpOnly ? (
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-[10px]">HttpOnly</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">No HttpOnly</Badge>
                    )}
                    {cookie.sameSite ? (
                      <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]">
                        SameSite: {cookie.sameSite}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">No SameSite</Badge>
                    )}
                  </div>
                  {cookie.domain && <p className="text-xs text-muted-foreground">Domain: {cookie.domain}{cookie.path ? ` Path: ${cookie.path}` : ''}</p>}
                  {cookie.issues.filter(i => !i.startsWith('Missing')).map((issue, i) => (
                    <p key={i} className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {issue}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default CookieAuditResults;
