import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, Clock, AlertTriangle, Shield, Globe, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getScanHistory } from '@/services/scanService';
import { generatePdfReport } from '@/services/reportService';
import AppHeader from '@/components/AppHeader';
import { useMemo, useState } from 'react';

const MODULE_LABELS: Record<string, string> = {
  headers: 'Headers', whois: 'WHOIS', subdomains: 'Subdomains',
  dns: 'DNS', mx: 'MX', subnet: 'Subnet', portScan: 'Ports',
  geoip: 'GeoIP', reverseIp: 'Reverse IP', ssl: 'SSL/TLS',
  techStack: 'Tech Stack', wordpress: 'WordPress', seo: 'SEO',
  brokenLinks: 'Broken Links', cors: 'CORS', ddos: 'DDoS',
  sql: 'SQLi', xss: 'XSS', lfi: 'LFI',
};

const Reports = () => {
  const { data: scans = [] } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
  });

  const completedScans = scans.filter(s => s.status === 'completed');
  const [search, setSearch] = useState('');
  const [reportNow] = useState(() => Date.now());

  const filtered = useMemo(() => {
    if (!search.trim()) return completedScans;
    const q = search.toLowerCase();
    return completedScans.filter(s =>
      s.target.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q)
    );
  }, [completedScans, search]);

  const weekAgo = reportNow - 7 * 86400000;
  const grouped = useMemo(() => {
    const groups: { label: string; scans: typeof filtered }[] = [];
    const today: typeof filtered = [];
    const thisWeek: typeof filtered = [];
    const earlier: typeof filtered = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    filtered.forEach(s => {
      const ts = new Date(s.timestamp).getTime();
      if (ts >= todayStart) today.push(s);
      else if (ts >= weekAgo) thisWeek.push(s);
      else earlier.push(s);
    });

    if (today.length) groups.push({ label: 'Today', scans: today });
    if (thisWeek.length) groups.push({ label: 'This Week', scans: thisWeek });
    if (earlier.length) groups.push({ label: 'Earlier', scans: earlier });
    return groups;
  }, [filtered, weekAgo]);

  const totalCompleted = completedScans.length;
  const vulnerableScans = completedScans.filter(s => {
    const r = s.results;
    return r?.sqlinjection?.vulnerable || r?.xss?.vulnerable || r?.lfi?.vulnerable;
  }).length;

  return (
    <div className="flex flex-col h-full w-full">
      <AppHeader
        title="Reports"
        subtitle="Download and manage scan reports"
      />

      <main className="flex-1 overflow-auto p-4 sm:p-6 surface-main">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="p-3 rounded-xl bg-primary/15">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
                  <p className="text-xs text-muted-foreground">Reports Available</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="p-3 rounded-xl bg-amber-500/15">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{vulnerableScans}</p>
                  <p className="text-xs text-muted-foreground">Scans with Issues</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="p-3 rounded-xl bg-emerald-500/15">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalCompleted - vulnerableScans}</p>
                  <p className="text-xs text-muted-foreground">Clean Scans</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by target or scan ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Report Groups */}
          {grouped.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-medium mb-1">
                  {search ? 'No reports match your search' : 'No reports available yet'}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {search ? 'Try a different search term' : 'Complete a scan to generate downloadable reports'}
                </p>
                {!search && (
                  <Link to="/new-scan">
                    <Button className="bg-gradient-to-r from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-primary-foreground">
                      Start a Scan
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {grouped.map(group => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</h3>
              <div className="grid grid-cols-1 gap-3">
                {group.scans.map(scan => {
                  const r = scan.results;
                  const hasIssues = !!(r?.sqlinjection?.vulnerable || r?.xss?.vulnerable || r?.lfi?.vulnerable);
                  const dur = scan.elapsedMs ? `${(scan.elapsedMs / 1000).toFixed(0)}s` : null;
                  return (
                    <Card key={scan.id} className="group/card bg-card border-border hover:border-primary/40 transition-all duration-200">
                      <div className="flex items-stretch">
                        <div className="hidden sm:flex flex-col items-center justify-center w-14 bg-gradient-to-b from-primary/5 to-primary/10 rounded-l-xl border-r border-border/50">
                          <FileText className="h-5 w-5 text-primary/60" />
                          <span className="text-[10px] font-medium text-primary/50 mt-1">PDF</span>
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground/60">#{scan.id}</span>
                              {hasIssues ? (
                                <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Issues found
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Clean
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-foreground truncate">{scan.target}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {new Date(scan.timestamp).toLocaleString()}
                              {dur && (
                                <>
                                  <Clock className="h-3 w-3 ml-1" />
                                  {dur}
                                </>
                              )}
                            </p>
                            {scan.config && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(MODULE_LABELS).filter(([key]) => (scan.config as any)[key]).map(([key, label]) => (
                                  <span key={key} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/8 text-primary/70 border border-primary/15">
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => generatePdfReport(scan)}
                            size="sm"
                            className="shrink-0 bg-gradient-to-r from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-primary-foreground"
                          >
                            <Download className="h-4 w-4 mr-1.5" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Reports;
