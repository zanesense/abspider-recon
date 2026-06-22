import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle2, XCircle, AlertTriangle, Unlock } from 'lucide-react';
import { S3BucketResult } from '@/services/s3BucketService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { s3Bucket?: S3BucketResult; isTested: boolean; moduleError?: string }

const S3BucketResults = ({ s3Bucket, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!s3Bucket;

  const content = !s3Bucket ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No S3 bucket data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Checked</p><p className="text-lg font-bold text-foreground">{s3Bucket.totalChecked}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Open (Listing)</p><p className={`text-lg font-bold ${s3Bucket.openBuckets > 0 ? 'text-red-500' : 'text-green-500'}`}>{s3Bucket.openBuckets}</p></div>
      </div>
      {s3Bucket.openBuckets > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Open S3 buckets with public listing detected!</p></div>}
      {s3Bucket.buckets.length === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No S3 buckets found for the target domain.</p></div>}
      {s3Bucket.buckets.map((bucket, i) => (
        <div key={i} className={`bg-muted rounded-lg p-3 space-y-1 border-l-4 ${bucket.listing ? 'border-red-500' : bucket.accessible ? 'border-yellow-500' : 'border-green-500'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground break-all">{bucket.name}</p>
            {bucket.listing ? <Unlock className="h-4 w-4 text-red-500" /> : bucket.accessible ? <CheckCircle2 className="h-4 w-4 text-yellow-500" /> : <XCircle className="h-4 w-4 text-green-500" />}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{bucket.listing ? 'Public Listing' : bucket.accessible ? 'Exists (Access Denied)' : 'Not Found'}</Badge>
          </div>
        </div>
      ))}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="S3 Bucket Discovery" icon={Database} iconColorClass={hasData && s3Bucket!.openBuckets > 0 ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="S3 bucket discovery was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default S3BucketResults;
