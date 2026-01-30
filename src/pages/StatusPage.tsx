import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Activity, 
  Database, 
  Shield, 
  Globe, 
  Zap,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Server,
  Wifi,
  Bug
} from 'lucide-react';
import { getCachedAppStatus, AppStatus, ServiceStatus, ModuleStatus } from '@/services/statusService';
import { formatDistanceToNow } from 'date-fns';

const StatusPage = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['appStatus'],
    queryFn: getCachedAppStatus,
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if enabled
    refetchOnWindowFocus: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Down</Badge>;
      case 'unknown':
        return <Badge variant="secondary">Unknown</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Status Check Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unable to retrieve system status. Please try again.
            </p>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bug className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ABSpider Status
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6">
            Real-time system health and performance monitoring
          </p>
          
          {/* Overall Status */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-cyan-500/5 border border-blue-500/10">
            {getStatusIcon(status.overall)}
            <span className={`text-lg font-semibold ${getStatusColor(status.overall)}`}>
              System {status.overall === 'operational' ? 'Operational' : status.overall === 'degraded' ? 'Degraded' : 'Down'}
            </span>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Last updated: {formatDistanceToNow(status.lastUpdated)} ago</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-8 px-3"
            >
              <Activity className={`h-3 w-3 mr-1 ${autoRefresh ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              Auto-refresh {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/5 border-emerald-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {status.metrics.uptime}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 border-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {status.metrics.totalScans.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-pink-500/5 border-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Scans</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {status.metrics.activeScans}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-red-500/5 border-orange-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(status.metrics.avgResponseTime)}s
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Core Services
              </CardTitle>
              <CardDescription>
                Database, authentication, and external API services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {service.name === 'Database' && <Database className="h-5 w-5 text-muted-foreground" />}
                    {service.name === 'Authentication' && <Shield className="h-5 w-5 text-muted-foreground" />}
                    {(service.name.includes('API') || service.name.includes('Shodan') || service.name.includes('VirusTotal')) && <Globe className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.details}</p>
                      {service.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{service.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(service.status)}
                    {service.responseTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatResponseTime(service.responseTime)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Modules Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Scan Modules
              </CardTitle>
              <CardDescription>
                Core reconnaissance and scanning functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status.modules.map((module, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{module.name}</p>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {module.dependencies.map((dep, depIndex) => (
                        <Badge key={depIndex} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(module.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(module.lastTested)} ago
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              System performance and reliability statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {status.metrics.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {(100 - status.metrics.errorRate).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate (24h)</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {status.metrics.errorRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Error Rate (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Status page updates every 30 seconds • All times in UTC</p>
          <p className="mt-2">
            For support, contact us at{' '}
            <a href="mailto:support@abspider.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@abspider.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;