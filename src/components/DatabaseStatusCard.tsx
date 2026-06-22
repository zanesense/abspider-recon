import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface DatabaseStatusCardProps {
  isLoading: boolean;
  isError: boolean;
}

const DatabaseStatusCard = ({ isLoading, isError }: DatabaseStatusCardProps) => {
  let statusText: string;
  let statusColorClass: string;
  let statusIcon;

  if (isLoading) {
    statusText = 'Connecting...';
    statusColorClass = 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    statusIcon = <Loader2 className="h-4 w-4 animate-spin" />;
  } else if (isError) {
    statusText = 'Disconnected';
    statusColorClass = 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
    statusIcon = <XCircle className="h-4 w-4" />;
  } else {
    statusText = 'Connected';
    statusColorClass = 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
    statusIcon = <CheckCircle className="h-4 w-4" />;
  }

  return (
    <SurfaceCard color="emerald">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex min-w-0 items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="shrink-0 p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="min-w-0 font-semibold">Database Connection</span>
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
          Supabase database connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-lg border border-slate-200/30 dark:border-slate-700/30">
          <span className="text-slate-900 dark:text-slate-100 font-medium">Status</span>
          <Badge className={`flex shrink-0 items-center gap-2 ${statusColorClass}`}>
            {statusIcon}
            {statusText}
          </Badge>
        </div>
        {isError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-destructive dark:text-red-400">Connection Error</AlertTitle>
            <AlertDescription className="text-sm text-destructive-foreground dark:text-red-300">
              Failed to connect to Supabase. Please check your network or Supabase configuration.
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !isError && (
          <Alert className="bg-green-500/10 border-green-500/50">
            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            <AlertTitle className="text-green-600 dark:text-green-400">Connection Stable</AlertTitle>
            <AlertDescription className="text-sm text-green-600 dark:text-green-400">
              Successfully connected to the Supabase database.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </SurfaceCard>
  );
};

export default DatabaseStatusCard;
