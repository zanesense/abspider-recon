import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Loader2, Timer, Shield, Globe, Network, AlertTriangle, Code, TrendingUp, Zap, MapPin, Mail, FileWarning, Star, Link, Lock, Fingerprint, Link as LinkIcon, Bug } from 'lucide-react';
import { Scan } from '@/services/scanService';
import React, { useState, useEffect } from 'react'; // Import React and hooks

interface ScanStatusProps {
  scan: Scan;
}

const ScanStatus = ({ scan }: ScanStatusProps) => {
  const [realtimeElapsedMs, setRealtimeElapsedMs] = useState<number | undefined>(scan.elapsedMs);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (scan.status === 'running') {
      // Initialize with current elapsed time or calculate from timestamp
      setRealtimeElapsedMs(Date.now() - scan.timestamp);

      interval = setInterval(() => {
        setRealtimeElapsedMs(Date.now() - scan.timestamp);
      }, 1000); // Update every second
    } else {
      // If not running, use the final elapsedMs from the scan object
      setRealtimeElapsedMs(scan.elapsedMs);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [scan.status, scan.timestamp, scan.elapsedMs]); // Re-run effect if status or timestamp changes

  const getStatusIcon = () => {
    switch (scan.status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'running': return <Loader2 className="h-5 w-5 text-yellow-500 dark:text-yellow-400 animate-spin" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'paused': return <Timer className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (scan.status) {
      case 'completed': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'running': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'paused': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (grade == null) return 'text-muted-foreground';
    if (grade >= 8) return 'text-green-500 dark:text-green-400';
    if (grade >= 6) return 'text-yellow-500 dark:text-yellow-400';
    if (grade >= 4) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  const progressPercentage = scan.progress 
    ? (scan.progress.current / scan.progress.total) * 100 
    : 0;

  const formatElapsedTime = (ms?: number) => {
    if (ms == null) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const hasVulnerabilities = 
    (scan.results.sqlinjection?.vulnerable && scan.results.sqlinjection.vulnerabilities.length > 0) ||
    (scan.results.xss?.vulnerable && scan.results.xss.vulnerabilities.length > 0) ||
    (scan.results.lfi?.vulnerable && scan.results.lfi.vulnerabilities.length > 0) ||
    (scan.results.wordpress?.vulnerabilities && scan.results.wordpress.vulnerabilities.length > 0) ||
    (scan.results.virustotal?.reputation !== undefined && scan.results.virustotal.reputation < 0) ||
    (scan.results.sslTls?.isExpired) ||
    (scan.results.corsMisconfig?.vulnerable && scan.results.corsMisconfig.vulnerabilities.length > 0); // New

  const moduleIcons: Record<string, React.ElementType> = {
    siteInfo: Globe,
    headers: Shield,
    whois: Globe,
    geoip: MapPin,
    dns: Network,
    mx: Mail,
    subnet: Network,
    ports: Network,
    subdomains: Network,
    reverseip: Network,
    sqlinjection: AlertTriangle,
    xss: Code,
    lfi: FileWarning,
    wordpress: Code,
    seo: TrendingUp,
    ddosFirewall: Zap,
    virustotal: Link,
    sslTls: Lock,
    techStack: Fingerprint, // New
    brokenLinks: LinkIcon, // New
    corsMisconfig: Bug, // New
  };

  const moduleLabels: Record<string, string> = {
    siteInfo: 'Site Info',
    headers: 'Headers',
    whois: 'WHOIS',
    geoip: 'GeoIP',
    dns: 'DNS',
    mx: 'MX Records',
    subnet: 'Subnet',
    ports: 'Ports',
    subdomains: 'Subdomains',
    reverseip: 'Reverse IP',
    sqlinjection: 'SQLi',
    xss: 'XSS',
    lfi: 'LFI',
    wordpress: 'WordPress',
    seo: 'SEO',
    ddosFirewall: 'DDoS Firewall',
    virustotal: 'VirusTotal',
    sslTls: 'SSL/TLS',
    techStack: 'Tech Stack', // New
    brokenLinks: 'Broken Links', // New
    corsMisconfig: 'CORS Misconfig', // New
  };

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          {getStatusIcon()}
          Scan Overview
        </CardTitle>
        <div className="flex items-center gap-2">
          {hasVulnerabilities && (
            <Badge variant="destructive" className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" /> Vulnerabilities Detected
            </Badge>
          )}
          {scan.securityGrade != null && scan.status === 'completed' && (
            <Badge className={`flex items-center gap-1 ${getGradeColor(scan.securityGrade)} bg-opacity-10 border-opacity-30`}>
              <Star className="h-3 w-3 mr-1" /> Security Grade: {scan.securityGrade?.toFixed(1) || 'N/A'}/10
            </Badge>
          )}
          <Badge className={getStatusColor()}>
            {scan.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <p className="text-muted-foreground mb-1">Target</p>
            <p className="font-semibold text-foreground break-all">{scan.target}</p>
          </div>
          <div className="flex flex-col">
            <p className="text-muted-foreground mb-1">Scan ID</p>
            <p className="font-mono text-foreground text-xs">{scan.id}</p>
          </div>
          <div className="flex flex-col">
            <p className="text-muted-foreground mb-1">Started</p>
            <div className="flex items-center gap-1 text-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(scan.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-muted-foreground mb-1">Elapsed Time</p>
            <div className="flex items-center gap-1 text-foreground">
              <Timer className="h-3 w-3" />
              <span className="font-mono">{formatElapsedTime(realtimeElapsedMs)}</span>
            </div>
          </div>
          {scan.completedAt && (
            <div className="flex flex-col">
              <p className="text-muted-foreground mb-1">Last Updated</p>
              <div className="flex items-center gap-1 text-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(scan.completedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {scan.status === 'running' && scan.progress && (
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{scan.progress.stage}</span>
              <span className="text-primary font-medium">
                {scan.progress.current} / {scan.progress.total}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-muted" indicatorColor="bg-primary" />
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <p className="text-muted-foreground mb-2 text-sm">Active Modules</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scan.config).map(([key, value]) => {
              if (value === true && moduleLabels[key]) {
                const Icon = moduleIcons[key];
                const isVulnModule = ['sqlinjection', 'xss', 'lfi', 'virustotal', 'sslTls', 'corsMisconfig'].includes(key); // Updated
                const isSecurityModule = ['ddosFirewall'].includes(key);
                return (
                  <Badge 
                    key={key} 
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium 
                                ${isVulnModule ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 
                                  isSecurityModule ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30' :
                                  'bg-primary/10 text-primary border-primary/30'}`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {moduleLabels[key]}
                    {key === 'sqlinjection' && ` (${scan.config.sqliPayloads} payloads)`}
                    {key === 'xss' && ` (${scan.config.xssPayloads} payloads)`}
                    {key === 'lfi' && ` (${scan.config.lfiPayloads} payloads)`}
                    {key === 'ddosFirewall' && ` (${scan.config.ddosRequests} requests)`}
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanStatus;