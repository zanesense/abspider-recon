import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldOff, AlertTriangle, Zap, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { DDoSFirewallResult } from '@/services/ddosFirewallService';

interface DDoSFirewallResultsProps {
  ddosFirewall: DDoSFirewallResult;
}

const DDoSFirewallResults = ({ ddosFirewall }: DDoSFirewallResultsProps) => {
  if (!ddosFirewall.tested) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShieldOff className="h-5 w-5" />
            DDoS Firewall Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">DDoS Firewall testing not performed or encountered an error.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            {ddosFirewall.firewallDetected ? (
              <ShieldCheck className="h-5 w-5 text-green-400" />
            ) : (
              <ShieldOff className="h-5 w-5 text-red-400" />
            )}
            DDoS Firewall Test
          </CardTitle>
          <CORSBypassIndicator metadata={ddosFirewall.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Firewall Detected</p>
            <Badge className={ddosFirewall.firewallDetected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
              {ddosFirewall.firewallDetected ? 'YES' : 'NO'}
            </Badge>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-cyan-400">{ddosFirewall.totalRequests}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Successful / Failed</p>
            <p className="text-2xl font-bold text-white">
              <span className="text-green-400">{ddosFirewall.successfulRequests}</span> / <span className="text-red-400">{ddosFirewall.failedRequests}</span>
            </p>
          </div>
        </div>

        {ddosFirewall.wafDetected && (
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Info className="h-3 w-3 text-slate-500" />
              WAF/CDN Detected: <span className="text-white font-medium">{ddosFirewall.wafDetected}</span>
            </p>
          </div>
        )}

        {ddosFirewall.indicators.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Detection Indicators
            </h4>
            <div className="space-y-2">
              {ddosFirewall.indicators.map((indicator, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3 border-l-4 border-yellow-500/50">
                  <p className="text-sm text-slate-300">{indicator}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ddosFirewall.responseSummary.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4" />
              Response Summary
            </h4>
            <div className="space-y-2">
              {ddosFirewall.responseSummary.map((summary, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white font-medium">HTTP {summary.status}</span>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Count: {summary.count}</span>
                    <span>Avg. Time: {summary.avgResponseTime.toFixed(2)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ddosFirewall.evidence && ddosFirewall.evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Evidence Snippets
            </h4>
            <div className="space-y-2">
              {ddosFirewall.evidence.map((snippet, index) => (
                <pre key={index} className="text-xs text-slate-300 bg-slate-700 p-2 rounded overflow-x-auto max-h-24">
                  {snippet}
                </pre>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DDoSFirewallResults;