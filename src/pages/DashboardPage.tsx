import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Zap, AlertTriangle, CheckCircle, CalendarDays, Pause, Play, Trash2, Clock as ClockIcon, Repeat, Bug, TrendingUp, Clock, AlertCircle, Activity, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';
import { Badge } from '@/components/ui/badge';
import { getAPIKeys } from '@/services/apiKeyService';
import DatabaseStatusCard from '@/components/DatabaseStatusCard';
import APIKeyStatusCard from '@/components/APIKeyStatusCard';
import VulnerabilitySummaryCard from '@/components/VulnerabilitySummaryCard';
import AppHeader from '@/components/AppHeader';
import { getScheduledScans, updateScheduledScan, deleteScheduledScan, ScheduledScan } from '@/services/scheduledScanService';
import { format } from 'date-fns';
import { useInitialNotifications } from '@/hooks/useInitialNotifications';

const DashboardPage = () => {
  const { toast } = useToast();

  // Initialize notifications
  useInitialNotifications();

  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  const { data: scheduledScans = [], refetch: refetchScheduledScans } = useQuery({
    queryKey: ['scheduledScans'],
    queryFn: getScheduledScans,
    refetchInterval: 5000,
  });

  const { data: apiKeys = {}, isLoading: isLoadingApiKeys, isError: isErrorApiKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: getAPIKeys,
  });

  const totalApiKeys = 7; // Shodan, VirusTotal, SecurityTrails, BuiltWith, OpenCage, Hunter.io, Clearbit
  const configuredApiKeys = Object.values(apiKeys).filter(key => typeof key === 'string' && key.trim().length > 0).length;

  const handleToggleScheduledScanStatus = (scan: ScheduledScan) => {
    const newStatus = scan.status === 'active' ? 'paused' : 'active';
    updateScheduledScan(scan.id, { status: newStatus });
    refetchScheduledScans();
    toast({
      title: `${newStatus === 'active' ? 'Resumed' : 'Paused'} Scheduled Scan`,
      description: `Scan '${scan.name}' is now ${newStatus}.`,
    });
  };

  const handleDeleteScheduledScan = (scanId: string, scanName: string) => {
    deleteScheduledScan(scanId);
    refetchScheduledScans();
    toast({
      title: "Deleted Scheduled Scan",
      description: `Scheduled scan '${scanName}' has been deleted.`,
    });
  };

  const getScheduledStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'once': return 'Once';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'N/A';
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <AppHeader 
        title="ABSpider Dashboard" 
        subtitle="Overview of your reconnaissance activities"
      >
        <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
          <Link to="/new-scan">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </AppHeader>
      
      <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Scans</CardTitle>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {scans.length > 0 ? 'All time total' : 'No scans yet'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-emerald-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Completed</CardTitle>
                <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.filter(s => s.status === 'completed').length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Bug className="h-3 w-3" />
                  {scans.length > 0 ? `${Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100)}% success rate` : 'No data yet'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-yellow-500/10 to-orange-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Active Scans</CardTitle>
                <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.filter(s => s.status === 'running').length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {scans.filter(s => s.status === 'running').length > 0 ? 'Currently scanning' : 'Ready to scan'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-rose-500/5 via-red-500/10 to-pink-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Failed Scans</CardTitle>
                <div className="p-3 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{scans.filter(s => s.status === 'failed').length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {scans.filter(s => s.status === 'failed').length > 0 ? 'Needs attention' : 'All systems good'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700 ml-6" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link to="/new-scan" className="group">
                <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 via-purple-500/10 to-indigo-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="text-center pb-6 pt-8 relative z-10">
                    <div className="mx-auto p-6 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Zap className="h-10 w-10 text-violet-600 dark:text-violet-400" />
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
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="text-center pb-6 pt-8 relative z-10">
                    <div className="mx-auto p-6 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Activity className="h-10 w-10 text-teal-600 dark:text-teal-400" />
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
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="text-center pb-6 pt-8 relative z-10">
                    <div className="mx-auto p-6 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <FileText className="h-10 w-10 text-amber-600 dark:text-amber-400" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 auto-rows-min">
              <DatabaseStatusCard isLoading={isLoadingApiKeys} isError={isErrorApiKeys} />
              <APIKeyStatusCard 
                configuredKeys={configuredApiKeys} 
                totalKeys={totalApiKeys} 
                isLoading={isLoadingApiKeys} 
              />
            </div>
          </div>

          {/* Scheduled Scans */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Scheduled Scans</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700 ml-6" />
            </div>
            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/5 via-violet-500/10 to-indigo-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold">Your Scheduled Scans</span>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                  Automated reconnaissance tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {scheduledScans.length > 0 ? (
                    scheduledScans.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                        <div className="flex-1 space-y-1">
                          <h4 className="text-foreground font-medium">{scan.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Bug className="h-3 w-3" />
                            {scan.config.target}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Repeat className="h-3 w-3" />
                            <span>Frequency: {getFrequencyLabel(scan.schedule.frequency)}</span>
                            {scan.status === 'active' && scan.schedule.nextRun && (
                              <>
                                <span className="text-border">•</span>
                                <ClockIcon className="h-3 w-3" />
                                <span>Next Run: {format(new Date(scan.schedule.nextRun), 'MMM dd, yyyy HH:mm')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getScheduledStatusColor(scan.status)}>
                            {scan.status.toUpperCase()}
                          </Badge>
                          {scan.status !== 'completed' && scan.status !== 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleScheduledScanStatus(scan)}
                              className="border-border text-foreground hover:bg-muted/50"
                            >
                              {scan.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteScheduledScan(scan.id, scan.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 bg-purple-500/20 rounded-full mb-4">
                        <CalendarDays className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No scheduled scans yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Create one from "New Scan" to automate your reconnaissance</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vulnerability Summary & Recent Scans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VulnerabilitySummaryCard scans={scans} />
            <RecentScans scans={scans.slice(0, 7)} onScanDeleted={refetch} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;