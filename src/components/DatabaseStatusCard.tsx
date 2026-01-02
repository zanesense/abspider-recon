import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-emerald-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-semibold">Database Connection</span>
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
          Supabase database connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10"> {/* Changed from space-y-3 to space-y-2 */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-lg border border-slate-200/30 dark:border-slate-700/30">
          <span className="text-slate-900 dark:text-slate-100 font-medium">Status</span>
          <Badge className={`flex items-center gap-2 ${statusColorClass}`}>
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
    </Card>
  );
};

export default DatabaseStatusCard;