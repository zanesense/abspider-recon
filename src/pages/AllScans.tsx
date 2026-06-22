import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Search, Filter, Trash2, Loader2 } from 'lucide-react';
import RecentScans from '@/components/RecentScans';
import { getScanHistory, deleteAllScans } from '@/services/scanService';
import ScanOverviewCards from '@/components/ScanOverviewCards';
import VulnerabilitySummaryCard from '@/components/VulnerabilitySummaryCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';

const AllScans = () => {
  const [filterTarget, setFilterTarget] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const matchesTarget = scan.target.toLowerCase().includes(filterTarget.toLowerCase());
      const matchesStatus = filterStatus === 'all' || scan.status === filterStatus;
      return matchesTarget && matchesStatus;
    });
  }, [scans, filterTarget, filterStatus]);

  const handleDeleteAllScans = async () => {
    setIsDeleting(true);
    try {
      await deleteAllScans();
      toast({
        title: "Success",
        description: "All scan history has been permanently deleted.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "An error occurred while deleting scans.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <AppHeader title="All Scans History" subtitle="A complete overview of all your reconnaissance scans">
        <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={scans.length === 0 || isDeleting}
            className="flex-shrink-0 bg-gradient-to-r from-destructive via-destructive/70 to-destructive/40 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Scans
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete all {scans.length} scans from your history and database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted/50">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllScans} 
              disabled={isDeleting}
              className="bg-gradient-to-r from-destructive via-destructive/70 to-destructive/40 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </AppHeader>
      
      <main className="flex-1 overflow-auto p-4 sm:p-6 surface-main">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by target URL..."
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
                className="pl-9 bg-muted/30 border-border"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] bg-muted/30 border-border">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScanOverviewCards scans={filteredScans} />
          <VulnerabilitySummaryCard scans={filteredScans} />
          <RecentScans scans={filteredScans} onScanDeleted={refetch} />
        </div>
      </main>
    </div>
  );
};

export default AllScans;