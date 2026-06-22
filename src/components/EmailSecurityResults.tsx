import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, ShieldCheck, ShieldOff, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { EmailSecurityResult } from '@/services/emailSecurityService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface EmailSecurityResultsProps {
  emailSecurity?: EmailSecurityResult;
  isTested: boolean;
  moduleError?: string;
}

const EmailSecurityResults = ({ emailSecurity, isTested, moduleError }: EmailSecurityResultsProps) => {
  if (!isTested) return null;

  const hasData = !!emailSecurity;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500 dark:text-green-400';
    if (score >= 5) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <ModuleCardWrapper
      title="Email Security (SPF/DKIM/DMARC)"
      icon={Mail}
      iconColorClass={hasData ? (emailSecurity!.overallScore >= 5 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400') : 'text-muted-foreground'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="Email security check was not performed or encountered an error."
    >
      <CardContent className="space-y-4">
        {hasData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Security Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(emailSecurity!.overallScore)}`}>
                  {emailSecurity!.overallScore}/10
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Domain</p>
                <p className="text-sm font-medium text-foreground break-all">{emailSecurity!.domain}</p>
              </div>
            </div>

            {/* SPF */}
            <div className={`bg-muted rounded-lg p-3 space-y-2 border-l-4 ${emailSecurity!.spf.exists ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center gap-2">
                {emailSecurity!.spf.exists ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className="text-sm font-medium text-foreground">SPF Record</span>
                {emailSecurity!.spf.exists && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {emailSecurity!.spf.allMechanism || 'none'}
                  </Badge>
                )}
              </div>
              {emailSecurity!.spf.exists && (
                <p className="text-xs text-muted-foreground break-all font-mono">{emailSecurity!.spf.raw.substring(0, 200)}</p>
              )}
              {emailSecurity!.spf.issues.map((issue, i) => (
                <p key={i} className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {issue}
                </p>
              ))}
            </div>

            {/* DKIM */}
            <div className={`bg-muted rounded-lg p-3 space-y-2 border-l-4 ${emailSecurity!.dkim.length > 0 ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-4 w-4 ${emailSecurity!.dkim.length > 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium text-foreground">DKIM Records</span>
                {emailSecurity!.dkim.length > 0 && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {emailSecurity!.dkim.length} selector(s)
                  </Badge>
                )}
              </div>
              {emailSecurity!.dkim.length === 0 && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> No DKIM records found for common selectors
                </p>
              )}
              {emailSecurity!.dkim.map(dkim => (
                <div key={dkim.selector} className="bg-background rounded p-2">
                  <p className="text-xs font-medium text-foreground">{dkim.selector}</p>
                  <p className="text-xs text-muted-foreground break-all font-mono">{dkim.raw}</p>
                </div>
              ))}
            </div>

            {/* DMARC */}
            <div className={`bg-muted rounded-lg p-3 space-y-2 border-l-4 ${emailSecurity!.dmarc.exists ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center gap-2">
                {emailSecurity!.dmarc.exists ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldOff className="h-4 w-4 text-red-500" />}
                <span className="text-sm font-medium text-foreground">DMARC Record</span>
                {emailSecurity!.dmarc.exists && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {emailSecurity!.dmarc.policy || 'none'}
                  </Badge>
                )}
              </div>
              {emailSecurity!.dmarc.exists && (
                <p className="text-xs text-muted-foreground break-all font-mono">{emailSecurity!.dmarc.raw}</p>
              )}
              {emailSecurity!.dmarc.issues.map((issue, i) => (
                <p key={i} className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {issue}
                </p>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </ModuleCardWrapper>
  );
};

export default EmailSecurityResults;
