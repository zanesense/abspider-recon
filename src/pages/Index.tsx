import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Shield, TrendingUp, Zap, AlertTriangle, CheckCircle, Settings, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import RecentScans from '@/components/RecentScans';
import { getScanHistory } from '@/services/scanService';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { getAPIKeys, hasAPIKey } from '@/services/apiKeyService';
import { useMemo } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts'; // Updated imports for RadialBarChart

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scans = [], refetch } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 3000,
  });

  const apiKeys = useMemo(() => getAPIKeys(), []);

  const apiKeyServices = [
    { name: 'Shodan', key: 'shodan' },
    { name: 'VirusTotal', key: 'virustotal' },
    { name: 'SecurityTrails', key: 'securitytrails' },
    { name: 'BuiltWith', key: 'builtwith' },
    { name: 'OpenCage', key: 'opencage' },
    { name: 'Hunter.io', key: 'hunter' },
    { name: 'Clearbit', key: 'clearbit' },
  ];

  const chartData = useMemo(() => {
    const completed = scans.filter(s => s.status === 'completed').length;
    const running = scans.filter(s => s.status === 'running').length;
    const failed = scans.filter(s => s.status === 'failed').length;
    const paused = scans.filter(s => s.status === 'paused').length;

    // Calculate total for percentage in RadialBar
    const total = completed + running + failed + paused;

    return [
      { name: 'Completed', value: completed, fill: '#10B981', percentage: total > 0 ? (completed / total) * 100 : 0 }, // Green
      { name: 'Running', value: running, fill: '#F59E0B', percentage: total > 0 ? (running / total) * 100 : 0 },     // Yellow
      { name: 'Failed', value: failed, fill: '#EF4444', percentage: total > 0 ? (failed / total) * 100 : 0 },       // Red
      { name: 'Paused', value: paused, fill: '#6B7280', percentage: total > 0 ? (paused / total) * 100 : 0 },       // Gray
    ].filter(item => item.value > 0);
  }, [scans]);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl"> {/* Updated background */}
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3"> {/* Updated gradient colors for better light mode visibility */}
            <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> {/* Updated text color */}
            ABSpider Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your reconnaissance activities</p> {/* Updated text color */}
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
          <Link to="/new-scan">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"> {/* Updated background */}
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
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Completed Scans</CardTitle> {/* Updated text color */}
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'completed').length}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-yellow-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Running Scans</CardTitle> {/* Updated text color */}
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{scans.filter(s => s.status === 'running').length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border border-red-500/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Failed Scans</CardTitle> {/* Updated text color */}
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
                  <CardTitle className="text-blue-600 dark:text-blue-400">Quick Actions</CardTitle> {/* Updated text color */}
                  <CardDescription className="text-muted-foreground"> {/* Updated text color */}
                    Start new scans or view documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
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
              <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg"> {/* Updated border */}
                <CardHeader>
                  <CardTitle className="text-primary">Threat Landscape</CardTitle> {/* Updated text color */}
                  <CardDescription className="text-muted-foreground"> {/* Updated text color */}
                    Insights into common vulnerabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">SQL Injection</span> {/* Updated text color */}
                      <Badge variant="destructive">High Risk</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">Cross-Site Scripting (XSS)</span> {/* Updated text color */}
                      <Badge variant="destructive">High Risk</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">Missing Security Headers</span> {/* Updated text color */}
                      <Badge variant="secondary">Medium Risk</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Scans with delete functionality */}
              <RecentScans scans={scans.slice(0, 10)} onScanDeleted={refetch} />
            </div>

            {/* Right Column: Scan Progress Chart + API Key Status */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border border-green-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">Scan Progress Overview</CardTitle> {/* Updated text color */}
                  <CardDescription className="text-muted-foreground"> {/* Updated text color */}
                    Visual representation of active scans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          innerRadius="10%"
                          outerRadius="100%"
                          data={chartData}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar
                            minAngle={15}
                            label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                            background
                            clockWise
                            dataKey="value"
                          />
                          <Legend
                            iconSize={10}
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.375rem', fontSize: '12px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number, name: string, props: any) => [`${value} scans (${props.payload.percentage.toFixed(1)}%)`, name]}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 opacity-20" />
                      <p className="absolute text-sm">No scan data to display</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border border-orange-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-600 dark:text-orange-400">API Key Status</CardTitle> {/* Updated text color */}
                  <CardDescription className="text-muted-foreground"> {/* Updated text color */}
                    Check the status of your integrated API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeyServices.map((service) => (
                      <div key={service.key} className="flex items-center justify-between">
                        <span className="text-foreground">{service.name}</span> {/* Updated text color */}
                        {hasAPIKey(service.key as any) ? (
                          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                            Configured
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                            Not Configured
                          </Badge>
                        )}
                      </div>
                    ))}
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