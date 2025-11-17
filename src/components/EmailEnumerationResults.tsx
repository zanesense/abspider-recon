import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, Info, CheckCircle, XCircle } from 'lucide-react';
import { EmailEnumerationResult } from '@/services/emailEnumService';

interface EmailEnumerationResultsProps {
  emailEnum: EmailEnumerationResult;
}

const EmailEnumerationResults = ({ emailEnum }: EmailEnumerationResultsProps) => {
  if (!emailEnum.tested) {
    return (
      <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Email Enumeration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Email enumeration not performed or encountered an error.</p>
          {emailEnum.errors && emailEnum.errors.length > 0 && (
            <div className="mt-2 text-sm text-destructive">
              <p className="font-semibold">Errors:</p>
              <ul className="list-disc list-inside">
                {emailEnum.errors.map((error, i) => <li key={i}>{error}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          Email Enumeration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Domain</p>
            <p className="text-foreground font-mono text-lg">{emailEnum.domain}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Emails Found</p>
            <p className="text-2xl font-bold text-primary">{emailEnum.emails.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Organization</p>
            <p className="text-foreground text-lg">{emailEnum.organization || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Disposable Email Provider?</p>
            {emailEnum.disposable ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Webmail Provider?</p>
            {emailEnum.webmail ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {emailEnum.emails.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4" />
              Discovered Emails
            </h4>
            <div className="space-y-2">
              {emailEnum.emails.map((email, index) => (
                <div key={index} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-mono text-sm break-all">{email.value}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>Type: {email.type}</span>
                      {email.confidence && <span>Confidence: {email.confidence}%</span>}
                    </div>
                  </div>
                  {email.sources && email.sources.length > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {email.sources.length} Sources
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {emailEnum.errors && emailEnum.errors.length > 0 && (
          <div className="mt-4 text-sm text-destructive">
            <p className="font-semibold">Errors:</p>
            <ul className="list-disc list-inside">
              {emailEnum.errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailEnumerationResults;