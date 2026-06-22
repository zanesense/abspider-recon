import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ShieldOff, ShieldCheck, AlertTriangle, FileWarning } from 'lucide-react';
import { GitExposureResult } from '@/services/gitExposureService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { gitExposure?: GitExposureResult; isTested: boolean; moduleError?: string }

const GitExposureResults = ({ gitExposure, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!gitExposure;

  const content = !gitExposure ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No git exposure data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Files Exposed</p><p className={`text-lg font-bold ${gitExposure.totalExposed > 0 ? 'text-red-500' : 'text-green-500'}`}>{gitExposure.totalExposed}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Critical</p><p className={`text-lg font-bold ${gitExposure.criticalExposed > 0 ? 'text-red-500' : 'text-green-500'}`}>{gitExposure.criticalExposed}</p></div>
      </div>
      {gitExposure.criticalExposed > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Critical files exposed! Immediate action recommended.</p></div>}
      {gitExposure.totalExposed === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No sensitive files were found exposed on the target.</p></div>}
      {gitExposure.files.map((file, i) => (
        <div key={i} className={`bg-muted rounded-lg p-3 space-y-1 border-l-4 ${file.path.includes('.git') || file.path.includes('.env') ? 'border-red-500' : 'border-yellow-500'}`}>
          <div className="flex items-center gap-2">
            {file.path.includes('.git') || file.path.includes('.env') ? <FileWarning className="h-4 w-4 text-red-500" /> : <ShieldOff className="h-4 w-4 text-yellow-500" />}
            <p className="text-sm font-mono text-foreground">{file.path}</p>
            <Badge variant="outline" className="text-xs ml-auto">HTTP {file.statusCode}</Badge>
          </div>
          {file.preview && <p className="text-xs text-muted-foreground break-all font-mono bg-background rounded p-1">{file.preview}</p>}
        </div>
      ))}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="Git Exposure" icon={GitBranch} iconColorClass={hasData && gitExposure!.criticalExposed > 0 ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="Git exposure check was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default GitExposureResults;
