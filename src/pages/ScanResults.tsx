import { useParams, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send, Pause, Play, StopCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getScanById, pauseScan, resumeScan, stopScan } from '@/services/scanService';
import { generatePDFReport } from '@/services/reportService';
import { sendDiscordWebhook } from '@/services/webhookService';
import { useToast } from '@/hooks/use-toast';
import ScanStatus from '@/components/ScanStatus';
import ScanSummaryWidget from '@/components/ScanSummaryWidget';
import SiteInfo from '@/components/SiteInfo';
import HeadersAnalysis from '@/components/HeadersAnalysis';
import WhoisInfo from '@/components/WhoisInfo';
import GeoIPInfo from '@/components/GeoIPInfo';
import DNSInfo from '@/components/DNSInfo';
import MXInfo from '@/components/MXInfo';
import SubnetInfo from '@/components/SubnetInfo';
import PortScanResults from '@/components/PortScanResults';
import SubdomainList from '@/components/SubdomainList';
import ReverseIPInfo from '@/components/ReverseIPInfo';
import SQLVulnerabilities from '@/components/SQLVulnerabilities';
import XSSVulnerabilities from '@/components/XSSVulnerabilities';
import LFIVulnerabilities from '@/components/LFIVulnerabilities';
import WordPressInfo from '@/components/WordPressInfo';
import SEOInfo from '@/components/SEOInfo';
import DDoSFirewallResults from '@/components/DDoSFirewallResults';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card'; // Import Card to use for error display

const ScanResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', id],
    queryFn: () => getScanById(id!),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'running' || data?.status === 'paused' ? 2000 : false;
    },
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    return () => {
      // Cleanup for any listeners if they were added, but none are now.
    };
  }, [id]);

  const handleDownloadReport = () => {
    if (!scan) return;
    generatePDFReport(scan);
    toast({
      title: "Report Generated",
      description: "Comprehensive PDF report has been downloaded successfully",
    });
  };

  const handleSendToDiscord = async () => {
    if (!scan) return;
    try {
      await sendDiscordWebhook(scan);
      toast({
        title: "Sent to Discord",
        description: "Comprehensive scan results have been sent to your Discord webhook",
      });
    } catch (error: any) {
      toast({
        title: "Discord Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePauseScan = () => {
    if (!scan) return;
    pauseScan(scan.id);
    queryClient.invalidateQueries({ queryKey: ['scan', id] });
    toast({ title: "Scan Paused", description: "The scan has been paused" });
  };

  const handleResumeScan = () => {
    if (!scan) return;
    resumeScan(scan.id);
    queryClient.invalidateQueries({ queryKey: ['scan', id] });
    toast({ title: "Scan Resumed", description: "The scan has been resumed" });
  };

  const handleStopScan = () => {
    if (!scan) return;
    stopScan(scan.id);
    queryClient.invalidateQueries({ queryKey: ['scan', id] });
    toast({ title: "Scan Stopped", description: "The scan has been stopped" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Scan not found</p>
          <Button onClick={() => navigate('/')} variant="outline" className="border-border text-foreground hover:bg-muted/50">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl"> {/* Updated background */}
        <SidebarTrigger />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-primary hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{scan.target}</h1>
          <p className="text-sm text-muted-foreground">Scan ID: {scan.id}</p>
        </div>
        <div className="flex gap-2">
          {scan.status === 'running' && (
            <>
              <Button onClick={handlePauseScan} variant="outline" size="sm" className="border-border text-foreground hover:text-primary hover:bg-muted/50">
                <Pause className="h-4 w-4 mr-2" /> Pause
              </Button>
              <Button onClick={handleStopScan} variant="outline" size="sm" className="border-destructive text-destructive hover:text-destructive-foreground hover:bg-destructive/20">
                <StopCircle className="h-4 w-4 mr-2" /> Stop
              </Button>
            </>
          )}
          {scan.status === 'paused' && (
            <>
              <Button onClick={handleResumeScan} variant="outline" size="sm" className="border-green-700 text-green-600 dark:text-green-400 hover:text-green-300 hover:bg-green-900/20"> {/* Updated text color */}
                <Play className="h-4 w-4 mr-2" /> Resume
              </Button>
              <Button onClick={handleStopScan} variant="outline" size="sm" className="border-destructive text-destructive hover:text-destructive-foreground hover:bg-destructive/20">
                <StopCircle className="h-4 w-4 mr-2" /> Stop
              </Button>
            </>
          )}
          <Button onClick={handleSendToDiscord} disabled={scan.status === 'running' || scan.status === 'paused'} variant="outline" className="border-border text-foreground hover:text-primary hover:bg-muted/50">
            <Send className="h-4 w-4 mr-2" /> Send to Discord
          </Button>
          <Button onClick={handleDownloadReport} disabled={scan.status === 'running' || scan.status === 'paused'} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md">
            <Download className="h-4 w-4 mr-2" /> Download Report
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"> {/* Updated background */}
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Row: Scan Status and Summary Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScanStatus scan={scan} />
            <ScanSummaryWidget scan={scan} />
          </div>

          {/* Main Content: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {scan.results.siteInfo && <SiteInfo siteInfo={scan.results.siteInfo} />}
              {scan.results.headers && <HeadersAnalysis headersAnalysis={scan.results.headers} />}
              {scan.results.whois && <WhoisInfo whois={scan.results.whois} />}
              {scan.results.dns && <DNSInfo dns={scan.results.dns} />}
              {scan.results.mx && <MXInfo mx={scan.results.mx} />}
              {scan.results.subnet && <SubnetInfo subnet={scan.results.subnet} />}
              {scan.results.ports && <PortScanResults ports={scan.results.ports} />}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {scan.results.geoip && <GeoIPInfo geoip={scan.results.geoip} />}
              {scan.results.subdomains && <SubdomainList subdomains={scan.results.subdomains} />}
              {scan.results.reverseip && <ReverseIPInfo reverseip={scan.results.reverseip} />}
              {scan.results.sqlinjection && <SQLVulnerabilities sqlinjection={scan.results.sqlinjection} />}
              {scan.results.xss && <XSSVulnerabilities xss={scan.results.xss} />}
              {scan.results.lfi && <LFIVulnerabilities lfi={scan.results.lfi} />}
              {scan.results.wordpress && <WordPressInfo wordpress={scan.results.wordpress} />}
              {scan.results.seo && <SEOInfo seo={scan.results.seo} />}
              {scan.results.ddosFirewall && <DDoSFirewallResults ddosFirewall={scan.results.ddosFirewall} />}
              {scan.results.deepDdosFirewall && <DDoSFirewallResults ddosFirewall={scan.results.deepDdosFirewall} />}
            </div>
          </div>

          {scan.errors && scan.errors.length > 0 && (
            <Card className="bg-card border-destructive shadow-lg"> {/* Use Card for error display */}
              <div className="p-4">
                <h3 className="text-destructive font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Errors Encountered
                </h3>
                <ul className="list-disc list-inside text-destructive-foreground text-sm space-y-1">
                  {scan.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScanResults;