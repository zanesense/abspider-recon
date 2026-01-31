import React, { useState } from 'react';
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
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  Server,
  Bug
} from 'lucide-react';
import { getCachedAppStatus } from '@/services/statusService';
import { formatDistanceToNow } from 'date-fns';

const StatusPage = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['appStatus'],
    queryFn: getCachedAppStatus,
    refetchInterval: autoRefresh ? 30000 : false,
    refetchOnWindowFocus: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-500';
      case 'degraded':
        return 'text-amber-500';
      case 'down':
        return 'text-rose-500';
      default:
        return 'text-zinc-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-6 w-6 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'down':
        return <XCircle className="h-6 w-6 text-rose-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-300">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 transition-all duration-300">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 transition-all duration-300">Down</Badge>;
      default:
        return <Badge variant="secondary" className="opacity-50">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full animate-pulse"></div>
          <div className="relative flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-500" />
            <span className="text-xl font-medium text-zinc-400 tracking-tight">Synchronizing System Status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-md bg-zinc-900 border-zinc-800 shadow-2xl shadow-rose-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-rose-500 text-2xl">
              <XCircle className="h-8 w-8" />
              Connection Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-zinc-400 leading-relaxed text-center">
              We encountered an issue while attempting to retrieve the real-time system status. Please verify your connection and try again.
            </p>
            <Button onClick={() => refetch()} className="w-full h-12 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-bold transition-all transform hover:scale-[1.02]">
              <RefreshCw className="h-5 w-5 mr-3" />
              Reconnect Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-blue-500/30">
      {/* Background blobs for premium feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16 space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 shadow-lg shadow-blue-500/5 group hover:scale-110 transition-transform duration-500">
            <Shield className="h-10 w-10 text-blue-500 group-hover:rotate-12 transition-transform" />
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              System Fidelity
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-light tracking-wide max-w-2xl">
              Live observability and performance orchestrations for ABSpider security engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
              {getStatusIcon(status.overall)}
              <span className={`text-lg font-bold tracking-tight ${getStatusColor(status.overall)}`}>
                Global Status: {status.overall.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-full bg-zinc-900 border border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="rounded-full h-10 w-10 p-0 hover:bg-zinc-800">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${autoRefresh ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${autoRefresh ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                Auto-Live: {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest pt-4">
            Last Telemetry Node Sync: {formatDistanceToNow(new Date(status.lastUpdated))} ago
          </p>
        </div>

        {/* Global Performance Pulse */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Network Uptime', value: `${status.metrics.uptime}%`, icon: TrendingUp, color: 'emerald' },
            { label: 'Fleet Throughput', value: status.metrics.totalScans.toLocaleString(), icon: Activity, color: 'blue' },
            { label: 'Active Sessions', value: status.metrics.activeScans, icon: Zap, color: 'purple' },
            { label: 'Latency Mean', value: `${Math.round(status.metrics.avgResponseTime)}s`, icon: Clock, color: 'amber' }
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx} className="group overflow-hidden bg-zinc-900/50 backdrop-blur-xl border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-500 tracking-wider uppercase">{metric.label}</p>
                      <p className={`text-4xl font-black tracking-tighter ${metric.color === 'emerald' ? 'text-emerald-500' :
                          metric.color === 'blue' ? 'text-blue-500' :
                            metric.color === 'purple' ? 'text-purple-500' :
                              'text-amber-500'
                        }`}>{metric.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 text-zinc-700 transition-colors`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Infrastructure Matrix */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-bold tracking-tight">Core Infrastructure</h2>
            </div>

            <div className="grid gap-4">
              {status.services.map((service, index) => (
                <div key={index} className="group relative p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800 hover:bg-zinc-900/50 transition-all duration-300">
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                        {service.name === 'Database' && <Database className="h-6 w-6 text-zinc-400 group-hover:text-blue-400" />}
                        {service.name === 'Authentication' && <Shield className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{service.name}</h3>
                        <p className="text-sm text-zinc-500 font-medium">{service.details}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(service.status)}
                      {service.responseTime && (
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {Math.round(service.responseTime)}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Engine Sub-systems */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Bug className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-bold tracking-tight">Sub-system Clusters</h2>
            </div>

            <div className="grid gap-4">
              {status.modules.map((module, index) => (
                <div key={index} className="group p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800 hover:bg-zinc-900/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors">{module.name}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{module.description}</p>
                    </div>
                    {getStatusBadge(module.status)}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                    <div className="flex flex-wrap gap-2">
                      {module.dependencies.slice(0, 3).map((dep, depIndex) => (
                        <span key={depIndex} className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-500 uppercase">
                          {dep}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase">
                      Validated {formatDistanceToNow(new Date(module.lastTested))} ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Global Telemetry Card */}
        <Card className="mt-16 bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Activity className="h-64 w-64 -mr-20 -mt-20" />
          </div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-3xl font-black italic tracking-tighter">
              <Zap className="h-8 w-8 text-amber-500" />
              TELEMETRY_DUMP
            </CardTitle>
            <CardDescription className="text-zinc-500 text-lg uppercase tracking-widest font-mono">
              Aggregate ecosystem analytics • last 24h
            </CardDescription>
          </CardHeader>
          <CardContent className="relative py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-2 text-center">
                <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">Fleet Userbase</p>
                <p className="text-5xl font-black text-white tracking-tighter">{status.metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-zinc-700 font-mono">Verified Entities</p>
              </div>

              <div className="space-y-4 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 blur-2xl bg-emerald-500/20"></div>
                  <p className="relative text-zinc-500 text-sm font-mono tracking-widest uppercase mb-2">Confidence Index</p>
                  <p className="relative text-6xl font-black text-emerald-500 tracking-tighter leading-none">
                    {(100 - status.metrics.errorRate).toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-zinc-700 font-mono uppercase tracking-widest underline decoration-emerald-900/30">Succesful Payload Delivery</p>
              </div>

              <div className="space-y-2 text-center text-zinc-800">
                <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">Anomalous Spike</p>
                <p className="text-5xl font-black tracking-tighter">{status.metrics.errorRate.toFixed(1)}%</p>
                <p className="text-xs text-zinc-700 font-mono">Fault Incidence Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Footer */}
        <footer className="mt-20 pt-12 border-t border-zinc-900 text-center space-y-4">
          <div className="flex items-center justify-center gap-8 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="h-10 w-32 bg-zinc-800/50 rounded flex items-center justify-center font-black text-zinc-600 tracking-tighter">SUPABASE</div>
            <div className="h-10 w-32 bg-zinc-800/50 rounded flex items-center justify-center font-black text-zinc-600 tracking-tighter">VERCEL.EDGE</div>
            <div className="h-10 w-32 bg-zinc-800/50 rounded flex items-center justify-center font-black text-zinc-600 tracking-tighter">LUCIDE.CORE</div>
          </div>
          <p className="text-zinc-600 font-mono text-xs tracking-widest uppercase">
            &copy; 2026 ABSpider Intelligent Reconnaissance. All telemetry points encrypted.
          </p>
          <div className="flex items-center justify-center gap-6 text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Incident History</a>
            <span className="text-zinc-800">•</span>
            <a href="mailto:ops@abspider.com" className="hover:text-white transition-colors font-mono text-xs">ops@abspider.com</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StatusPage;