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
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Supabase database connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-foreground">Status</span>
          <Badge className={`flex items-center gap-1 ${statusColorClass}`}>
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