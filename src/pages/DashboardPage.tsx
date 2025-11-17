import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Shield, Zap, AlertTriangle, CheckCircle, Loader2, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';
import { Badge } from '@/components/ui/badge';
import { getAPIKeys } from '@/services/apiKeyService';
import { useState, useEffect } from 'react';
import { supabase } from '@/SupabaseClient';
import DatabaseStatusCard from '@/components/DatabaseStatusCard';
import APIKeyStatusCard from '@/components/APIKeyStatusCard'; // New import
import VulnerabilitySummaryCard from '@/components/VulnerabilitySummaryCard'; // Existing, but now used here
import CurrentDateTime from '@/components/CurrentDateTime'; // Import the new component

const DashboardPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loadingLogout, setLoadingLogout] = useState(false); // Renamed to avoid conflict

  useEffect(() => {
    const fetchUserAndSession = async () => {
      const { data: { user, session } } = await supabase.auth.getSession();
      setSession(session);
      if (user) {
        setUserEmail(user.email);
      }
    };
    fetchUserAndSession();
  }, []);

  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  const { data: apiKeys = {}, isLoading: isLoadingApiKeys, isError: isErrorApiKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: getAPIKeys,
  });

  const totalApiKeys = 7; // Shodan, VirusTotal, SecurityTrails, BuiltWith, OpenCage, Hunter.io, Clearbit
  const configuredApiKeys = Object.values(apiKeys).filter(key => typeof key === 'string' && key.trim().length > 0).length;

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Logout Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            ABSpider Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your reconnaissance activities</p>
        </div>
        <CurrentDateTime className="hidden md:flex" /> {/* Display current date and time */}
        <div className="flex items-center gap-2">
          {userEmail && (
            <Badge variant="secondary" className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              {userEmail}
            </Badge>
          )}
          {session && (
            <Button
              onClick={handleLogout}
              disabled={loadingLogout}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-muted/50"
            >
              {loadingLogout ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
            <Link to="/new-scan">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Scan
            </Link>
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Scan Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Total Scans</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-green-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Completed Scans</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'completed').length}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-yellow-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Running Scans</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'running').length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-red-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Failed Scans</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'failed').length}</div>
                <p className="text-xs text-muted-foreground">With errors</p>
              </CardContent>
            </Card>
          </div>

          {/* System Status & API Keys */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
              <DatabaseStatusCard isLoading={isLoadingApiKeys} isError={isErrorApiKeys} />
              <APIKeyStatusCard 
                configuredKeys={configuredApiKeys} 
                totalKeys={totalApiKeys} 
                isLoading={isLoadingApiKeys} 
              />
            </div>
          </div>

          {/* Vulnerability Summary & Recent Scans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VulnerabilitySummaryCard scans={scans} />
            <RecentScans scans={scans.slice(0, 7)} onScanDeleted={refetch} /> {/* Limit recent scans */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;