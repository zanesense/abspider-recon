import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle2, XCircle } from 'lucide-react';
import { CDNDetectionResult } from '@/services/cdnDetectionService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface CDNDetectionResultsProps {
  cdnDetection?: CDNDetectionResult;
  isTested: boolean;
  moduleError?: string;
}

const CDNDetectionResults = ({ cdnDetection, isTested, moduleError }: CDNDetectionResultsProps) => {
  if (!isTested) return null;

  const hasData = !!cdnDetection && cdnDetection.cdns.length > 0;

  const content = !cdnDetection ? (
    <CardContent className="space-y-4">
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">No CDN detection data available.</p>
      </div>
    </CardContent>
  ) : (
    <CardContent className="space-y-4">
      {cdnDetection.detectedCount > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-sm text-muted-foreground mr-1">Detected CDNs:</span>
          {cdnDetection.cdns.filter(c => c.detected).map(cdn => (
            <Badge key={cdn.name} className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {cdn.name}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-4 mb-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            No CDN detected
          </p>
        </div>
      )}

      {cdnDetection.detectedCount > 0 && (
        <div className="space-y-2">
          {cdnDetection.cdns.filter(c => c.detected).map(cdn => (
            <div key={cdn.name} className="bg-muted rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">{cdn.name}</p>
              {cdn.evidence.map((evidence, i) => (
                <p key={i} className="text-xs text-muted-foreground break-all">{evidence}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {cdnDetection.detectedCount === 0 && (
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground break-words">
            Target: {cdnDetection.target} — No known CDN signatures were found in response headers or DNS records.
          </p>
        </div>
      )}
    </CardContent>
  );

  return (
    <ModuleCardWrapper
      title="CDN Detection"
      icon={Globe}
      iconColorClass={hasData && cdnDetection.detectedCount > 0 ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground'}
      moduleError={moduleError}
      hasData={hasData}
      noDataMessage="CDN detection was not performed or encountered an error."
    >
      {content}
    </ModuleCardWrapper>
  );
};

export default CDNDetectionResults;
