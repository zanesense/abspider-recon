import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink, Trash2 } from 'lucide-react';
import { Scan } from '@/services/scanService';
import { useToast } from '@/hooks/use-toast';
import { deleteScan } from '@/services/scanService';

interface RecentScansProps {
  scans: Scan[];
  onScanDeleted?: () => void; // Add callback for when a scan is deleted
}

const RecentScans = ({ scans, onScanDeleted }: RecentScansProps) => {
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'running': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'paused': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'; // Added paused status
      case 'stopped': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const handleDeleteScan = async (scanId: string, scanTarget: string) => {
    try {
      await deleteScan(scanId);
      toast({
        title: "Scan Deleted",
        description: `Scan for ${scanTarget} has been deleted.`,
      });
      if (onScanDeleted) {
        onScanDeleted(); // Notify parent component to refresh data
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete scan.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-purple-500/10 to-indigo-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-semibold">Recent Scans</span>
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
          Latest reconnaissance activities
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-3">
          {scans.map((scan) => (
            <div key={scan.id} className="flex items-center justify-between group">
              <Link
                to={`/scan/${scan.id}`}
                className="flex-1 flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-lg border border-slate-200/30 dark:border-slate-700/30 hover:border-indigo-500/40 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/10 transition-all duration-300 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-slate-900 dark:text-slate-100 font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {scan.target}
                    </h4>
                    <Badge className={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(scan.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the link
                  e.preventDefault();
                  handleDeleteScan(scan.id, scan.target);
                }}
                className="ml-2 p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                aria-label="Delete scan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {scans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-indigo-500/20 rounded-full mb-4">
                <Clock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">No scans yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Your recent scans will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentScans;