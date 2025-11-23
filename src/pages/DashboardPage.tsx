import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Shield, Zap, AlertTriangle, CheckCircle, Loader2, LogOut, User, CalendarDays, Pause, Play, Trash2, Clock as ClockIcon, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';
import { Badge } from '@/components/ui/badge';
import { getAPIKeys } from '@/services/apiKeyService';
import { useState, useEffect } from 'react';
import { supabase } from '@/SupabaseClient';
import DatabaseStatusCard from '@/components/DatabaseStatusCard';
import APIKeyStatusCard from '@/components/APIKeyStatusCard';
import VulnerabilitySummaryCard from '@/components/VulnerabilitySummaryCard';
import CurrentDateTime from '@/components/CurrentDateTime';
import { getScheduledScans, updateScheduledScan, deleteScheduledScan, ScheduledScan } from '@/services/scheduledScanService';
import { format } from 'date-fns';
// Removed import of ProfileCardPopover as it's now global

const DashboardPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      {/* The header content is now global in App.tsx */}
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Scan Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Total Scans</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-green-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Completed Scans</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'completed').length}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-yellow-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-yellow-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Running Scans</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'running').length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-red-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-red-500/50">
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
            <h2 className="text-xl font-semibold text-foreground">Scheduled Scans</h2>
            <Card className="bg-card/50 backdrop-blur-sm border border-purple-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-purple-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <CalendarDays className="h-5 w-5" />
                  Your Scheduled Scans
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Automated reconnaissance tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduledScans.length > 0 ? (
                    scheduledScans.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                        <div className="flex-1 space-y-1">
                          <h4 className="text-foreground font-medium">{scan.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" />
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
                    <p className="text-center text-muted-foreground/70 py-8">No scheduled scans yet. Create one from "New Scan".</p>
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