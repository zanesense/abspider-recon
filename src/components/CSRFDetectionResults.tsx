import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldOff, AlertTriangle, FileWarning } from 'lucide-react';
import { CSRFDetectionResult } from '@/services/csrfDetectionService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { csrfDetection?: CSRFDetectionResult; isTested: boolean; moduleError?: string }

const CSRFDetectionResults = ({ csrfDetection, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!csrfDetection;

  const content = !csrfDetection ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No CSRF detection data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Forms Found</p><p className="text-lg font-bold text-foreground">{csrfDetection.totalForms}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Without CSRF</p><p className={`text-lg font-bold ${csrfDetection.formsWithoutToken > 0 ? 'text-red-500' : 'text-green-500'}`}>{csrfDetection.formsWithoutToken}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Protected</p><p className="text-lg font-bold text-green-500">{csrfDetection.totalForms - csrfDetection.formsWithoutToken}</p></div>
      </div>
      {csrfDetection.formsWithoutToken > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {csrfDetection.formsWithoutToken} form(s) lack CSRF protection tokens.</p></div>}
      {csrfDetection.totalForms === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No HTML forms were found on the scanned pages.</p></div>}
      {csrfDetection.forms.map((form, i) => (
        <div key={i} className={`bg-muted rounded-lg p-3 space-y-1 border-l-4 ${form.hasCSRFToken ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center gap-2">
            {form.hasCSRFToken ? <Shield className="h-4 w-4 text-green-500" /> : <ShieldOff className="h-4 w-4 text-red-500" />}
            <p className="text-sm font-medium text-foreground flex-1 truncate">{form.action || '(no action)'}</p>
            <Badge variant="outline" className="text-xs">{form.method}</Badge>
          </div>
          <div className="flex gap-1 flex-wrap">
            {form.hasCSRFToken ? <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"><ShieldCheck className="h-3 w-3 mr-1" />CSRF Protected</Badge> : <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"><FileWarning className="h-3 w-3 mr-1" />No CSRF Token</Badge>}
          </div>
          {form.inputs.length > 0 && <p className="text-xs text-muted-foreground">{form.inputs.length} input{form.inputs.length !== 1 ? 's' : ''}</p>}
        </div>
      ))}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="CSRF Detection" icon={Shield} iconColorClass={hasData && csrfDetection!.formsWithoutToken > 0 ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="CSRF detection was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default CSRFDetectionResults;
