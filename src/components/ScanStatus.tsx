import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Loader2, Timer } from 'lucide-react';
import { Scan } from '@/services/scanService';

interface ScanStatusProps {
  scan: Scan;
}

const ScanStatus = ({ scan }: ScanStatusProps) => {
  const getStatusIcon = () => {
    switch (scan.status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'running': return <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (scan.status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'running': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const progressPercentage = scan.progress 
    ? (scan.progress.current / scan.progress.total) * 100 
    : 0;

  const formatElapsedTime = (ms?: number) => {
    if (!ms && ms !== 0) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {getStatusIcon()}
          Scan Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <Badge className={getStatusColor()}>
              {scan.status.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Started</p>
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{new Date(scan.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Elapsed Time</p>
            <div className="flex items-center gap-2 text-white">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-mono">{formatElapsedTime(scan.elapsedMs)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-sm text-slate-400 mb-2">Active Modules</p>
          <div className="flex flex-wrap gap-1">
            {scan.config.geoip && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">GeoIP</span>}
            {scan.config.headers && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Headers</span>}
            {scan.config.whois && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">WHOIS</span>}
            {scan.config.subdomains && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Subdomains</span>}
            {scan.config.ports && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Ports</span>}
            {scan.config.sqlinjection && <span className="px-2 py-1 bg-red-900 rounded text-xs text-red-300">SQL</span>}
            {scan.config.xss && <span className="px-2 py-1 bg-red-900 rounded text-xs text-red-300">XSS</span>}
            {scan.config.lfi && <span className="px-2 py-1 bg-red-900 rounded text-xs text-red-300">LFI</span>}
          </div>
        </div>

        {scan.status === 'running' && scan.progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{scan.progress.stage}</span>
              <span className="text-cyan-400 font-medium">
                {scan.progress.current} / {scan.progress.total}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {scan.completedAt && (
          <div className="pt-2 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Completed at: <span className="text-white">{new Date(scan.completedAt).toLocaleString()}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScanStatus;