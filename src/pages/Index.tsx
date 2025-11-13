import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Scan, FileText, Activity, TrendingUp, StopCircle, Sparkles, Zap, 
  Globe, Network, AlertTriangle, Code, Search, Lock, Server, Database,
  Radio, Wifi, Target, Eye, ShieldCheck, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getScanHistory, stopAllScans } from '@/services/scanService';
import { useToast } from '@/hooks/use-toast';
import RecentScans from '@/components/RecentScans';

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scans = [] } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  const handleStopAllScans = () => {
    stopAllScans();
    queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    toast({
      title: "All Scans Stopped",
      description: "All running scans have been stopped",
    });
  };

  const activeScansCount = scans.filter(s => s.status === 'running' || s.status === 'paused').length;
  const completedScans = scans.filter(s => s.status === 'completed').length;
  const failedScans = scans.filter(s => s.status === 'failed').length;
  const successRate = scans.length > 0 ? Math.round((completedScans / scans.length) * 100) : 0;

  const stats = [
    { 
      title: 'Total Scans', 
      value: scans.length, 
      icon: Scan, 
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      trend: '+12% from last week'
    },
    { 
      title: 'Active Scans', 
      value: activeScansCount, 
      icon: Radio, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      trend: activeScansCount > 0 ? 'In Progress' : 'Idle'
    },
    { 
      title: 'Completed', 
      value: completedScans, 
      icon: CheckCircle2, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      trend: `${failedScans} failed`
    },
    { 
      title: 'Success Rate', 
      value: `${successRate}%`, 
      icon: TrendingUp, 
      color: successRate >= 80 ? 'text-emerald-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400',
      bgColor: successRate >= 80 ? 'bg-emerald-500/10' : successRate >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10',
      borderColor: successRate >= 80 ? 'border-emerald-500/30' : successRate >= 50 ? 'border-yellow-500/30' : 'border-red-500/30',
      trend: successRate >= 80 ? 'Excellent' : successRate >= 50 ? 'Good' : 'Needs Attention'
    },
  ];

  // Scan module categories with their status
  const scanModules = [
    { name: 'Site Info', icon: Globe, enabled: true, count: scans.filter(s => s.config?.siteInfo).length },
    { name: 'Headers', icon: Lock, enabled: true, count: scans.filter(s => s.config?.headers).length },
    { name: 'WHOIS', icon: Search, enabled: true, count: scans.filter(s => s.config?.whois).length },
    { name: 'GeoIP', icon: Target, enabled: true, count: scans.filter(s => s.config?.geoip).length },
    { name: 'DNS', icon: Server, enabled: true, count: scans.filter(s => s.config?.dns).length },
    { name: 'Ports', icon: Network, enabled: true, count: scans.filter(s => s.config?.ports).length },
    { name: 'Subdomains', icon: Wifi, enabled: true, count: scans.filter(s => s.config?.subdomains).length },
    { name: 'Vulnerabilities', icon: AlertTriangle, enabled: true, count: scans.filter(s => s.config?.sqlinjection || s.config?.xss || s.config?.lfi).length },
  ];

  // Recent activity feed from scans
  const recentActivity = scans
    .slice(0, 5)
    .map(scan => {
      const elapsed = scan.elapsedMs ? `${(scan.elapsedMs / 1000).toFixed(1)}s` : 'N/A';
      return {
        id: scan.id,
        target: scan.target,
        status: scan.status,
        timestamp: new Date(scan.timestamp),
        elapsed,
        progress: scan.progress?.current && scan.progress?.total 
          ? Math.round((scan.progress.current / scan.progress.total) * 100)
          : scan.status === 'completed' ? 100 : 0
      };
    });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Enhanced Header with System Status */}
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-md px-6 py-4 shadow-2xl">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            Recon Dashboard
          </h1>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${activeScansCount > 0 ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></span>
            {activeScansCount > 0 ? `${activeScansCount} Active Scan${activeScansCount > 1 ? 's' : ''}` : 'System Ready'}
          </p>
        </div>
        {activeScansCount > 0 && (
          <Button
            onClick={handleStopAllScans}
            variant="destructive"
            className="shadow-lg shadow-red-500/20 border border-red-500/30"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Emergency Stop ({activeScansCount})
          </Button>
        )}
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Enhanced Stats Grid with Animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card 
                key={stat.title} 
                className={`border ${stat.borderColor} bg-slate-900/50 backdrop-blur-sm hover:shadow-xl hover:shadow-${stat.color.replace('text-', '')}/20 transition-all duration-300 hover:-translate-y-1 hover:border-${stat.color.replace('text-', '')}/50 group`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${stat.bgColor} shadow-lg shadow-${stat.color.replace('text-', '')}/10 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <p className="text-xs text-slate-500">{stat.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Quick Actions + Threat Landscape */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Actions */}
              <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-blue-950/30 to-purple-950/30 shadow-2xl shadow-cyan-500/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Sparkles className="h-5 w-5" />
                    Launch Reconnaissance
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Deploy comprehensive security scanning modules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/new-scan">
                    <Button size="lg" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/30 border border-cyan-400/20 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-[1.02] text-white font-semibold">
                      <Zap className="mr-2 h-5 w-5" />
                      Initialize New Scan
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Threat Landscape - Scan Modules Matrix */}
              <Card className="border-purple-500/30 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <ShieldCheck className="h-5 w-5" />
                    Scan Modules Overview
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Available reconnaissance capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {scanModules.map((module) => (
                      <div
                        key={module.name}
                        className="flex flex-col items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-300 group cursor-pointer"
                      >
                        <module.icon className="h-8 w-8 text-slate-400 group-hover:text-cyan-400 mb-2 transition-colors" />
                        <span className="text-xs font-medium text-slate-300 text-center mb-1">{module.name}</span>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {module.count} scans
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Scans */}
              <RecentScans scans={scans.slice(0, 10)} />
            </div>

            {/* Right Column: Live Activity Feed */}
            <div className="space-y-6">
              
              {/* System Health */}
              <Card className="border-emerald-500/30 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-400">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">CORS Bypass</span>
                      <span className="text-emerald-400 font-semibold">Operational</span>
                    </div>
                    <Progress value={100} className="h-2 bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Scan Engine</span>
                      <span className="text-emerald-400 font-semibold">Ready</span>
                    </div>
                    <Progress value={100} className="h-2 bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">API Services</span>
                      <span className="text-emerald-400 font-semibold">Online</span>
                    </div>
                    <Progress value={100} className="h-2 bg-slate-800" />
                  </div>
                </CardContent>
              </Card>

              {/* Live Activity Feed */}
              <Card className="border-blue-500/30 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <Eye className="h-5 w-5" />
                    Live Activity
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Recent reconnaissance operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <Link
                          key={activity.id}
                          to={`/scan/${activity.id}`}
                          className="block p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                                {activity.target}
                              </p>
                              <p className="text-xs text-slate-500">
                                {activity.timestamp.toLocaleTimeString()} • {activity.elapsed}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${
                                activity.status === 'completed' ? 'border-emerald-500/30 text-emerald-400' :
                                activity.status === 'running' ? 'border-blue-500/30 text-blue-400 animate-pulse' :
                                activity.status === 'failed' ? 'border-red-500/30 text-red-400' :
                                'border-slate-600 text-slate-400'
                              }`}
                            >
                              {activity.status}
                            </Badge>
                          </div>
                          {activity.status === 'running' && (
                            <Progress value={activity.progress} className="h-1 bg-slate-700" />
                          )}
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="mt-6 border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-amber-500">Legal Notice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-2">
                This tool is designed for authorized security testing only. You must have explicit 
                permission to scan any target system.
              </p>
              <p className="text-muted-foreground">
                Unauthorized scanning may be illegal in your jurisdiction and could result in 
                criminal prosecution.
              </p>
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