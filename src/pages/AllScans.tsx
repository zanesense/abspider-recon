import { useQuery } from '@tanstack/react-query';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { History, Shield, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';
import ScanOverviewCards from '@/components/ScanOverviewCards';
import VulnerabilitySummaryCard from '@/components/VulnerabilitySummaryCard';

const AllScans = () => {
  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000, // Keep real-time updates for scan statuses
  });

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl"> {/* Updated background */}
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3"> {/* Updated gradient colors for better light mode visibility */}
            <History className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> {/* Updated text color */}
            All Scans History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">A complete overview of all your reconnaissance scans</p> {/* Updated text color */}
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"> {/* Updated background */}
        <div className="max-w-7xl mx-auto space-y-6">
          <ScanOverviewCards scans={scans} />
          <VulnerabilitySummaryCard scans={scans} />
          <RecentScans scans={scans} onScanDeleted={refetch} />
        </div>
      </main>
    </div>
  );
};

export default AllScans;