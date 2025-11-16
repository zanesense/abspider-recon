import { useQuery } from '@tanstack/react-query';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { History, Shield } from 'lucide-react';
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';

const AllScans = () => {
  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000, // Keep real-time updates for scan statuses
  });

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-md px-6 py-4 shadow-2xl">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
            <History className="h-7 w-7 text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            All Scans History
          </h1>
          <p className="text-sm text-slate-400 mt-1">A complete overview of all your reconnaissance scans</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          <RecentScans scans={scans} onScanDeleted={refetch} />
        </div>
      </main>
    </div>
  );
};

export default AllScans;