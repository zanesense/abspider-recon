import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Globe, AlertCircle } from 'lucide-react';
import { CORSBypassMetadata } from '@/services/corsProxy';

interface CORSBypassIndicatorProps {
  metadata?: CORSBypassMetadata;
  className?: string;
}

const CORSBypassIndicator = ({ metadata, className = '' }: CORSBypassIndicatorProps) => {
  if (!metadata) {
    return null;
  }

  const { usedProxy, proxyUrl, attemptsDirect, attemptsViaProxy } = metadata;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${className} ${
              usedProxy 
                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' 
                : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
            } cursor-help`}
          >
            {usedProxy ? (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                CORS Proxy Used
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Direct Fetch
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-card border-border max-w-xs">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-primary" />
              <span className="font-semibold text-foreground">Connection Details</span>
            </div>
            <div className="space-y-1 text-muted-foreground">
              <p>
                <span className="text-foreground">Method:</span>{' '}
                {usedProxy ? 'CORS Proxy Bypass' : 'Direct Connection'}
              </p>
              {usedProxy && proxyUrl && (
                <p>
                  <span className="text-foreground">Proxy:</span>{' '}
                  <span className="font-mono text-xs">{proxyUrl.replace('https://', '')}</span>
                </p>
              )}
              {attemptsDirect && (
                <p>
                  <span className="text-foreground">Direct Attempt:</span>{' '}
                  {usedProxy ? 'Failed (CORS blocked)' : 'Success'}
                </p>
              )}
              {attemptsViaProxy > 0 && (
                <p>
                  <span className="text-foreground">Proxy Attempts:</span> {attemptsViaProxy}
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CORSBypassIndicator;