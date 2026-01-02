import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-orange-500/10 to-amber-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-semibold">API Key Status</span>
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
          Overview of your integrated API keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600 dark:text-amber-400" />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-lg border border-slate-200/30 dark:border-slate-700/30">
            <span className="text-slate-900 dark:text-slate-100 font-medium">Configured Keys</span>
            <Badge className={statusColorClass}>
              {statusText}
            </Badge>
          </div>
        )}
        <Button asChild variant="outline" className="w-full bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200/50 dark:border-amber-700/30 text-amber-700 dark:text-amber-300 hover:bg-gradient-to-r hover:from-amber-100/70 hover:to-orange-100/50 dark:hover:from-amber-800/30 dark:hover:to-orange-800/20 transition-all duration-300">
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