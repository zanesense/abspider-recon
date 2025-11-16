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
    <Card className="bg-card border-border"> {/* Updated background and border */}
      <CardHeader>
        <CardTitle className="text-foreground">Recent Scans</CardTitle> {/* Updated text color */}
        <CardDescription className="text-muted-foreground"> {/* Updated text color */}
          Latest reconnaissance activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scans.map((scan) => (
            <div key={scan.id} className="flex items-center justify-between group">
              <Link
                to={`/scan/${scan.id}`}
                className="flex-1 flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/50 transition-colors group" {/* Updated background */}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-foreground font-medium group-hover:text-primary transition-colors"> {/* Updated text color */}
                      {scan.target}
                    </h4>
                    <Badge className={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"> {/* Updated text color */}
                    <Clock className="h-3 w-3" />
                    <span>{new Date(scan.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors" /> {/* Updated text color */}
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the link
                  e.preventDefault();
                  handleDeleteScan(scan.id, scan.target);
                }}
                className="ml-2 p-2 text-muted-foreground/70 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" {/* Updated text color */}
                aria-label="Delete scan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {scans.length === 0 && (
            <p className="text-center text-muted-foreground/70 py-8">No scans yet</p> {/* Updated text color */}
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentScans;