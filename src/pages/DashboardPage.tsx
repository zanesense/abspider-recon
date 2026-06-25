import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Zap, AlertTriangle, CheckCircle, Bug, TrendingUp, Clock, AlertCircle, Activity, FileText, Github, Star } from 'lucide-react';
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';
import { Badge } from '@/components/ui/badge';
import { getAPIKeys } from '@/services/apiKeyService';
import DatabaseStatusCard from '@/components/DatabaseStatusCard';
import APIKeyStatusCard from '@/components/APIKeyStatusCard';
import VulnerabilitySummaryCard from '@/components/VulnerabilitySummaryCard';
import AppHeader from '@/components/AppHeader';
import { useInitialNotifications } from '@/hooks/useInitialNotifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BETA_NOTICE_STORAGE_KEY = 'abspider-beta-notice-seen';

const DashboardPage = () => {
  const [showBetaNotice, setShowBetaNotice] = useState(
    () => localStorage.getItem(BETA_NOTICE_STORAGE_KEY) !== 'true'
  );

  // Initialize notifications
  useInitialNotifications();

  const dismissBetaNotice = () => {
    localStorage.setItem(BETA_NOTICE_STORAGE_KEY, 'true');
    setShowBetaNotice(false);
  };

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

  return (
    <div className="flex flex-col h-full w-full">
      <Dialog open={showBetaNotice} onOpenChange={(open) => {
        if (open) {
          setShowBetaNotice(true);
          return;
        }

        dismissBetaNotice();
      }}>
        <DialogContent className="max-w-xl border-border bg-card text-card-foreground shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bug className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl">ABSpider is still in beta</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              ABSpider is in an active beta/dev stage. We are continuously working to improve scan accuracy, dashboard stability, reports, and module coverage.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground">
            If ABSpider helps your workflow, please star the repository. If you find a bug, inaccurate module result, broken UI state, or missing edge case, report it on GitHub so it can be tracked and fixed.
          </div>

          <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
            <Button variant="outline" onClick={dismissBetaNotice}>
              Continue
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" asChild>
                <a href="https://github.com/zanesense/abspider-recon/issues" target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  Report issue
                </a>
              </Button>
              <Button asChild>
                <a href="https://github.com/zanesense/abspider-recon" target="_blank" rel="noreferrer">
                  <Star className="mr-2 h-4 w-4" />
                  Star repo
                </a>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppHeader 
        title="Dashboard" 
        subtitle="Overview of your reconnaissance activities"
      >
        <Button asChild className="bg-gradient-to-r from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-primary-foreground">
          <Link to="/new-scan">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </AppHeader>
      
      <main className="flex-1 overflow-auto p-4 sm:p-6 surface-main">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full border border-blue-500/20 backdrop-blur-sm">
              <Bug className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Security Intelligence Dashboard
              </span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Monitor your reconnaissance activities, track vulnerabilities, and manage security scans from a unified command center.
            </p>
          </div>

          {/* Scan Overview Cards */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-start gap-4 sm:gap-6">
            <SurfaceCard color="blue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">Total Scans</CardTitle>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {scans.length > 0 ? 'All time total' : 'No scans yet'}
                </p>
              </CardContent>
            </SurfaceCard>

            <SurfaceCard color="emerald">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">Completed</CardTitle>
                <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.filter(s => s.status === 'completed').length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Bug className="h-3 w-3" />
                  {scans.length > 0 ? `${Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100)}% success rate` : 'No data yet'}
                </p>
              </CardContent>
            </SurfaceCard>

            <SurfaceCard color="amber">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">Active Scans</CardTitle>
                <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.filter(s => s.status === 'running').length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {scans.filter(s => s.status === 'running').length > 0 ? 'Currently scanning' : 'Ready to scan'}
                </p>
              </CardContent>
            </SurfaceCard>

            <SurfaceCard color="rose">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">Failed Scans</CardTitle>
                <div className="p-3 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.filter(s => s.status === 'failed').length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {scans.filter(s => s.status === 'failed').length > 0 ? 'Needs attention' : 'All systems good'}
                </p>
              </CardContent>
            </SurfaceCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700 ml-6" />
            </div>
            
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-start gap-4 sm:gap-6">
              <Link to="/new-scan" className="group">
                <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 via-purple-500/10 to-indigo-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="text-center p-5 sm:p-6 relative z-10">
                    <div className="mx-auto aspect-square w-16 sm:w-20 p-4 sm:p-5 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Zap className="h-full w-full text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-violet-700 dark:text-violet-300 mt-4">Quick Scan</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                      Launch an intelligent reconnaissance scan with adaptive payload management
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              
              <Link to="/all-scans" className="group">
                <Card className="relative overflow-hidden bg-gradient-to-br from-teal-500/5 via-cyan-500/10 to-blue-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="text-center p-5 sm:p-6 relative z-10">
                    <div className="mx-auto aspect-square w-16 sm:w-20 p-4 sm:p-5 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Activity className="h-full w-full text-teal-600 dark:text-teal-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-4">Scan History</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                      View, manage, and analyze all your security reconnaissance activities
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              
              <Link to="/reports" className="group">
                <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-yellow-500/10 to-orange-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="text-center p-5 sm:p-6 relative z-10">
                    <div className="mx-auto aspect-square w-16 sm:w-20 p-4 sm:p-5 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <FileText className="h-full w-full text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-4">Reports</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                      Generate comprehensive security reports and export findings
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>

          {/* System Status & API Keys */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">System Status</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start gap-4 sm:gap-6">
              <DatabaseStatusCard isLoading={isLoadingApiKeys} isError={isErrorApiKeys} />
              <APIKeyStatusCard 
                configuredKeys={configuredApiKeys} 
                totalKeys={totalApiKeys} 
                isLoading={isLoadingApiKeys} 
              />
            </div>
          </div>


          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))] items-start gap-4 sm:gap-6">
            <VulnerabilitySummaryCard scans={scans} />
            <RecentScans scans={scans.slice(0, 7)} onScanDeleted={refetch} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
