import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, CheckCircle2, XCircle } from 'lucide-react';
import { CloudProviderResult } from '@/services/cloudProviderService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface CloudProviderResultsProps {
  cloudProvider?: CloudProviderResult;
  isTested: boolean;
  moduleError?: string;
}

const CloudProviderResults = ({ cloudProvider, isTested, moduleError }: CloudProviderResultsProps) => {
  if (!isTested) return null;

  const hasData = !!cloudProvider && cloudProvider.providers.length > 0;

  const content = !cloudProvider ? (
    <CardContent className="space-y-4">
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">No cloud provider detection data available.</p>
      </div>
    </CardContent>
  ) : (
    <CardContent className="space-y-4">
      {cloudProvider.detectedCount > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-sm text-muted-foreground mr-1">Detected Providers:</span>
          {cloudProvider.providers.filter(p => p.detected).map(provider => (
            <Badge key={provider.name} className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {provider.name}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-4 mb-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            No cloud provider detected
          </p>
        </div>
      )}

      {cloudProvider.detectedCount > 0 && (
        <div className="space-y-2">
          {cloudProvider.providers.filter(p => p.detected).map(provider => (
            <div key={provider.name} className="bg-muted rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">{provider.name}</p>
              {provider.evidence.map((evidence, i) => (
                <p key={i} className="text-xs text-muted-foreground break-all">{evidence}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {cloudProvider.detectedCount === 0 && (
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground break-words">
            Target: {cloudProvider.target} — No known cloud provider signatures were found in response headers or DNS records.
          </p>
        </div>
      )}
    </CardContent>
  );

  return (
    <ModuleCardWrapper
      title="Cloud Provider Detection"
      icon={Cloud}
      iconColorClass={hasData && cloudProvider.detectedCount > 0 ? 'text-sky-500 dark:text-sky-400' : 'text-muted-foreground'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="Cloud provider detection was not performed or encountered an error."
    >
      {content}
    </ModuleCardWrapper>
  );
};

export default CloudProviderResults;
