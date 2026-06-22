import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, AlertTriangle, Info } from 'lucide-react';
import { EmailHarvestingResult } from '@/services/emailHarvestingService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { emailHarvesting?: EmailHarvestingResult; isTested: boolean; moduleError?: string }

const EmailHarvestingResults = ({ emailHarvesting, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!emailHarvesting;

  const content = !emailHarvesting ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No email harvesting data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Emails Found</p><p className="text-lg font-bold text-foreground">{emailHarvesting.totalEmails}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Unique Domains</p><p className="text-lg font-bold text-blue-500">{emailHarvesting.uniqueDomains.length}</p></div>
      </div>
      {emailHarvesting.emails.length === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No email addresses were found on the scanned pages.</p></div>}
      {emailHarvesting.emails.slice(0, 30).map((entry, i) => (
        <div key={i} className="bg-muted rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-blue-500" />
            <p className="text-sm font-mono text-foreground">{entry.email}</p>
            <Badge variant="outline" className="text-xs ml-auto">{entry.source}</Badge>
          </div>
          {entry.context && <p className="text-xs text-muted-foreground truncate">{entry.context}</p>}
        </div>
      ))}
      {emailHarvesting.totalEmails > 30 && <p className="text-xs text-muted-foreground">...and {emailHarvesting.totalEmails - 30} more</p>}
      {emailHarvesting.totalEmails > 0 && <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"><p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Exposed email addresses can be harvested by spammers and attackers.</p></div>}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="Email Harvesting" icon={Mail} iconColorClass={hasData ? 'text-blue-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="Email harvesting was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default EmailHarvestingResults;
