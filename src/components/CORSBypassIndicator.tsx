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
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
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
        <TooltipContent className="bg-slate-900 border-slate-700 max-w-xs">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-cyan-400" />
              <span className="font-semibold text-slate-200">Connection Details</span>
            </div>
            <div className="space-y-1 text-slate-400">
              <p>
                <span className="text-slate-300">Method:</span>{' '}
                {usedProxy ? 'CORS Proxy Bypass' : 'Direct Connection'}
              </p>
              {usedProxy && proxyUrl && (
                <p>
                  <span className="text-slate-300">Proxy:</span>{' '}
                  <span className="font-mono text-xs">{proxyUrl.replace('https://', '')}</span>
                </p>
              )}
              {attemptsDirect && (
                <p>
                  <span className="text-slate-300">Direct Attempt:</span>{' '}
                  {usedProxy ? 'Failed (CORS blocked)' : 'Success'}
                </p>
              )}
              {attemptsViaProxy > 0 && (
                <p>
                  <span className="text-slate-300">Proxy Attempts:</span> {attemptsViaProxy}
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
