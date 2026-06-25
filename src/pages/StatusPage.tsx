import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle,
  Clock,
  Database,
  Gauge,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCachedAppStatus } from '@/services/statusService';
import { cn } from '@/lib/utils';
import BackToTop from '@/components/landing/BackToTop';

type StatusTone = 'operational' | 'degraded' | 'down' | 'unknown';

const TONE: Record<StatusTone, {
  label: string;
  icon: typeof CheckCircle;
  text: string;
  badge: string;
  dot: string;
  bar: string;
}> = {
  operational: {
    label: 'Operational',
    icon: CheckCircle,
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  },
  degraded: {
    label: 'Degraded',
    icon: AlertTriangle,
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
  },
  down: {
    label: 'Down',
    icon: XCircle,
    text: 'text-destructive',
    badge: 'border-destructive/25 bg-destructive/8 text-destructive',
    dot: 'bg-destructive',
    bar: 'bg-destructive',
  },
  unknown: {
    label: 'Unknown',
    icon: AlertCircle,
    text: 'text-muted-foreground',
    badge: 'border-border bg-muted/50 text-muted-foreground',
    dot: 'bg-muted-foreground',
    bar: 'bg-muted',
  },
};

const getTone = (s: string) => TONE[(s as StatusTone) in TONE ? (s as StatusTone) : 'unknown'];

const StatusBadge = ({ status }: { status: string }) => {
  const tone = getTone(status);
  return (
    <Badge variant="outline" className={cn('gap-1.5 border px-2.5 py-1 text-xs font-medium', tone.badge)}>
      <tone.icon className="h-3.5 w-3.5" />
      {tone.label}
    </Badge>
  );
};

const ServiceIcon = ({ name }: { name: string }) => {
  if (name === 'Database') return <Database className="h-5 w-5" />;
  if (name === 'Authentication') return <Shield className="h-5 w-5" />;
  return <Server className="h-5 w-5" />;
};

const StatusPage = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: status, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['appStatus'],
    queryFn: getCachedAppStatus,
    refetchInterval: autoRefresh ? 30_000 : false,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-main px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Checking system status…</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-main p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Status unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The latest health check could not be loaded. Retry once your connection is available.
          </p>
          <Button onClick={() => refetch()} className="mt-6 w-full cursor-pointer">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const overallTone = getTone(status.overall);
  const successRate = Math.max(0, 100 - status.metrics.errorRate);
  const updatedAgo = formatDistanceToNow(new Date(status.lastUpdated));

  return (
    <div className="min-h-screen surface-main">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Top nav */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="cursor-pointer gap-1.5 text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              ABSpider
            </Link>
          </Button>
          <Badge variant="outline" className="border-primary/20 bg-primary/8 text-primary text-xs">
            Public telemetry
          </Badge>
        </div>

        {/* Hero status banner */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid lg:grid-cols-[1fr_320px]">
            {/* Left */}
            <div className="relative overflow-hidden p-8">
              <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <Bug className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">ABSpider Status</h1>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  Service health, scan engine readiness, and live telemetry for the ABSpider environment.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', overallTone.dot)} />
                    Updated {updatedAgo} ago
                  </span>
                  <span className="hidden h-3 w-px bg-border sm:block" />
                  <span>{autoRefresh ? 'Refreshing every 30s' : 'Auto-refresh paused'}</span>
                </div>
              </div>
            </div>

            {/* Right - overall status */}
            <div className="flex flex-col justify-center gap-5 border-t border-border bg-muted/20 p-8 lg:border-l lg:border-t-0">
              <div className={cn('inline-flex w-fit items-center gap-2 rounded-xl border px-3.5 py-1.5 text-sm font-semibold', overallTone.badge)}>
                <overallTone.icon className="h-4 w-4" />
                {overallTone.label}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Confidence index</p>
                <p className="mt-1 text-5xl font-black tracking-tight text-foreground">{successRate.toFixed(1)}%</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', overallTone.bar)}
                    style={{ width: `${Math.min(100, successRate)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  className="h-8 w-8 cursor-pointer"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                </Button>
                <Button
                  size="sm"
                  variant={autoRefresh ? 'default' : 'outline'}
                  onClick={() => setAutoRefresh((v) => !v)}
                  className="cursor-pointer"
                >
                  <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', autoRefresh ? 'bg-primary-foreground' : 'bg-muted-foreground')} />
                  Auto-refresh {autoRefresh ? 'on' : 'off'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Metric strip */}
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { icon: TrendingUp, label: 'Uptime', value: `${status.metrics.uptime}%`, sub: 'current model' },
            { icon: Activity, label: 'Total scans', value: status.metrics.totalScans.toLocaleString(), sub: 'recorded jobs' },
            { icon: Zap, label: 'Active scans', value: status.metrics.activeScans.toLocaleString(), sub: 'running now' },
            { icon: Clock, label: 'Avg scan time', value: `${Math.round(status.metrics.avgResponseTime)}s`, sub: 'recent completed' },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                  <p className="mt-1.5 text-3xl font-black tracking-tight text-foreground">{m.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{m.sub}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <m.icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Services + modules */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Core infrastructure */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4 text-primary" />
                Core infrastructure
              </CardTitle>
              <CardDescription className="text-xs">Database and authentication health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {status.services.map((service) => (
                <div key={service.name} className="rounded-xl border border-border bg-background/50 p-4 transition-colors hover:border-primary/25">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                        <ServiceIcon name={service.name} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{service.name}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{service.details}</p>
                        {service.error && <p className="mt-1 text-xs text-destructive">{service.error}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={service.status} />
                      {service.responseTime !== undefined && (
                        <span className="text-[11px] text-muted-foreground">{Math.round(service.responseTime)}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Scan engine */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bug className="h-4 w-4 text-primary" />
                Scan engine
              </CardTitle>
              <CardDescription className="text-xs">Module readiness and dependency checks.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {status.modules.map((mod) => (
                <div key={mod.name} className="rounded-xl border border-border bg-background/50 p-4 transition-colors hover:border-primary/25">
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={mod.status} />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {formatDistanceToNow(new Date(mod.lastTested))} ago
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{mod.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mod.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {mod.dependencies.slice(0, 3).map((dep) => (
                      <span key={dep} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Telemetry */}
        <Card className="mb-8 border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-primary" />
              Telemetry summary
            </CardTitle>
            <CardDescription className="text-xs">Aggregate scan activity from the current status service.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Users with scans', value: status.metrics.totalUsers.toLocaleString(), sub: 'from user scan records' },
                { label: 'Success rate', value: `${Math.max(0, 100 - status.metrics.errorRate).toFixed(1)}%`, sub: 'completed vs failed, 24h' },
                { label: 'Error rate', value: `${status.metrics.errorRate.toFixed(1)}%`, sub: 'failed scans, 24h' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-background/50 p-5 transition-colors hover:border-primary/25">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{item.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>ABSpider status is updated from live service checks where available.</span>
          <a href="mailto:ops@abspider.com" className="font-medium text-primary transition-colors hover:text-primary/80">
            ops@abspider.com
          </a>
        </footer>
      </div>

      <BackToTop />
    </div>
  );
};

export default StatusPage;
