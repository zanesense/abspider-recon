import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, AlertTriangle, Link, KeyRound, FolderTree } from 'lucide-react';
import { JSInspectionResult } from '@/services/jsAnalysisService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { jsInspection?: JSInspectionResult; isTested: boolean; moduleError?: string }

const JSAnalysisResults = ({ jsInspection, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!jsInspection;

  const content = !jsInspection ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No JS analysis data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Files Analyzed</p><p className="text-lg font-bold text-foreground">{jsInspection.totalFiles}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Endpoints</p><p className="text-lg font-bold text-blue-500">{jsInspection.totalEndpoints}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">API Keys Found</p><p className={`text-lg font-bold ${jsInspection.totalApiKeys > 0 ? 'text-red-500' : 'text-green-500'}`}>{jsInspection.totalApiKeys}</p></div>
      </div>
      {jsInspection.files.map((file, i) => (
        <div key={i} className="bg-muted rounded-lg p-3 space-y-2 border-l-4 border-blue-500">
          <p className="text-xs font-medium text-foreground break-all">{file.url}</p>
          <div className="flex gap-1 flex-wrap">
            {file.endpoints.length > 0 && <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"><Link className="h-3 w-3 mr-1" />{file.endpoints.length} endpoints</Badge>}
            {file.apiKeys.length > 0 && <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"><KeyRound className="h-3 w-3 mr-1" />{file.apiKeys.length} keys</Badge>}
            {file.internalPaths.length > 0 && <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"><FolderTree className="h-3 w-3 mr-1" />{file.internalPaths.length} paths</Badge>}
          </div>
          {file.apiKeys.length > 0 && <div className="space-y-1"><p className="text-xs font-medium text-red-500 flex items-center gap-1"><KeyRound className="h-3 w-3" /> API Keys</p>{file.apiKeys.map((k, j) => <p key={j} className="text-xs text-muted-foreground break-all font-mono">{k}</p>)}</div>}
          {file.endpoints.length > 0 && <div className="space-y-1"><p className="text-xs font-medium text-blue-500 flex items-center gap-1"><Link className="h-3 w-3" /> Endpoints</p><div className="flex flex-wrap gap-1">{file.endpoints.slice(0, 10).map((ep, j) => <code key={j} className="text-xs bg-background px-1.5 py-0.5 rounded text-blue-500 break-all">{ep}</code>)}</div></div>}
        </div>
      ))}
      {jsInspection.totalApiKeys > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Potential API keys/secrets were found in JavaScript files. Review carefully.</p></div>}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="JavaScript Analysis" icon={FileCode} iconColorClass={hasData && jsInspection!.totalApiKeys > 0 ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="JS analysis was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default JSAnalysisResults;
