// ... existing imports ...
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService'; // Add this import

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  // ... existing code ...

  return (
    <div className="flex flex-col h-full w-full">
      {/* ... existing header ... */}
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* ... existing stats grid ... */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Quick Actions + Threat Landscape */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* ... existing Quick Actions card ... */}

              {/* ... existing Threat Landscape card ... */}

              {/* Recent Scans with delete functionality */}
              <RecentScans scans={scans.slice(0, 10)} onScanDeleted={refetch} />
            </div>

            {/* ... existing right column ... */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;