import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Scan, FileText, Activity, TrendingUp, StopCircle, Sparkles, Zap } from 'lucide-react';
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

  const stats = [
    { 
      title: 'Total Scans', 
      value: scans.length, 
      icon: Scan, 
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    { 
      title: 'Active Scans', 
      value: scans.filter(s => s.status === 'running' || s.status === 'paused').length, 
      icon: Activity, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      title: 'Completed', 
      value: scans.filter(s => s.status === 'completed').length, 
      icon: FileText, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    { 
      title: 'Success Rate', 
      value: scans.length > 0 ? `${Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100)}%` : '0%', 
      icon: TrendingUp, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
  ];

  const activeScans = scans.filter(s => s.status === 'running' || s.status === 'paused').length;

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4 shadow-sm">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-500" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Professional Web Reconnaissance Overview</p>
        </div>
        {activeScans > 0 && (
          <Button
            onClick={handleStopAllScans}
            variant="destructive"
            className="shadow-lg"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Stop All ({activeScans})
          </Button>
        )}
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className={`border ${stat.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Start a comprehensive reconnaissance scan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/new-scan">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" />
                  New Comprehensive Scan
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <RecentScans scans={scans.slice(0, 10)} />
        </div>
      </main>
    </div>
  );
};

export default Index;