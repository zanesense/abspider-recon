import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Settings, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface APIKeyStatusCardProps {
  configuredKeys: number;
  totalKeys: number;
  isLoading: boolean;
}

const APIKeyStatusCard = ({ configuredKeys, totalKeys, isLoading }: APIKeyStatusCardProps) => {
  const statusText = `${configuredKeys}/${totalKeys} Configured`;
  const statusColorClass = configuredKeys === totalKeys && totalKeys > 0
    ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
    : configuredKeys > 0
    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-orange-500/30 shadow-lg">
      <CardHeader>
        <CardTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Status
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Overview of your integrated API keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-foreground">Configured Keys</span>
            <Badge className={statusColorClass}>
              {statusText}
            </Badge>
          </div>
        )}
        <Button asChild variant="outline" className="w-full mt-4 border-border text-foreground hover:bg-muted/50">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Manage API Keys
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default APIKeyStatusCard;