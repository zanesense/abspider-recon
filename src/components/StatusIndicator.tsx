import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { getCachedAppStatus } from '@/services/statusService';

interface StatusIndicatorProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  showText = true, 
  size = 'sm',
  className = '' 
}) => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['appStatus'],
    queryFn: getCachedAppStatus,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'down':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
    
    switch (status) {
      case 'operational':
        return <CheckCircle className={`${iconSize} text-emerald-600 dark:text-emerald-400`} />;
      case 'degraded':
        return <AlertTriangle className={`${iconSize} text-yellow-600 dark:text-yellow-400`} />;
      case 'down':
        return <XCircle className={`${iconSize} text-red-600 dark:text-red-400`} />;
      default:
        return <XCircle className={`${iconSize} text-muted-foreground`} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Systems Degraded';
      case 'down':
        return 'System Issues Detected';
      default:
        return 'Status Unknown';
    }
  };

  if (isLoading) {
    return (
      <Badge variant="secondary" className={className}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        {showText && 'Checking Status...'}
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge variant="secondary" className={className}>
        <XCircle className="h-3 w-3 mr-1" />
        {showText && 'Status Unavailable'}
      </Badge>
    );
  }

  return (
    <Badge className={`${getStatusColor(status.overall)} ${className}`}>
      {getStatusIcon(status.overall)}
      {showText && <span className="ml-1">{getStatusText(status.overall)}</span>}
    </Badge>
  );
};

export default StatusIndicator;