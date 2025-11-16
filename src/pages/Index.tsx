import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Shield, TrendingUp, Zap, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-md px-6 py-4 shadow-2xl">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-7 w-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            ABSpider Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Overview of your reconnaissance activities</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-primary/30">
          <Link to="/new-scan">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
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
                <CardTitle className="text-sm font-medium text-green-400">Completed Scans</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'completed').length}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-yellow-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-400">Running Scans</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'running').length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-red-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-400">Failed Scans</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'failed').length}</div>
                <p className="text-xs text-muted-foreground">With errors</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Quick Actions + Threat Landscape */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <Card className="bg-card/50 backdrop-blur-sm border border-blue-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-400">Quick Actions</CardTitle>
                  <CardDescription className="text-slate-400">
                    Start new scans or view documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-primary/30">
                    <Link to="/new-scan">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Start New Scan
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted/50">
                    <a href="https://zanesense.github.io/abspider-recon/" target="_blank" rel="noopener noreferrer">
                      <History className="mr-2 h-4 w-4" />
                      View Documentation
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Threat Landscape */}
              <Card className="bg-card/50 backdrop-blur-sm border border-purple-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-purple-400">Threat Landscape</CardTitle>
                  <CardDescription className="text-slate-400">
                    Insights into common vulnerabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">SQL Injection</span>
                      <Badge variant="destructive">High Risk</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">Cross-Site Scripting (XSS)</span>
                      <Badge variant="destructive">High Risk</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">Missing Security Headers</span>
                      <Badge variant="secondary">Medium Risk</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Scans with delete functionality */}
              <RecentScans scans={scans.slice(0, 10)} onScanDeleted={refetch} />
            </div>

            {/* Right Column: Scan Progress Chart (Placeholder) */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border border-green-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-400">Scan Progress Overview</CardTitle>
                  <CardDescription className="text-slate-400">
                    Visual representation of active scans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 opacity-20" />
                    <p className="absolute text-sm">Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border border-orange-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-400">API Key Status</CardTitle>
                  <CardDescription className="text-slate-400">
                    Check the status of your integrated API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">Shodan</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Not Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">VirusTotal</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">SecurityTrails</span>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Invalid Key</Badge>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full mt-4 border-border text-foreground hover:bg-muted/50">
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage API Keys
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;