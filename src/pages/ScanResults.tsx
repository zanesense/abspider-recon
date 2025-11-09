import { useParams, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send, Pause, Play, StopCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getScanById, pauseScan, resumeScan, stopScan } from '@/services/scanService';
import { generatePDFReport } from '@/services/reportService';
import { sendDiscordWebhook } from '@/services/webhookService';
import { useToast } from '@/hooks/use-toast';
import ScanStatus from '@/components/ScanStatus';
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
import WordPressInfo from '@/components/WordPressInfo';
import SEOInfo from '@/components/SEOInfo';

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
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Scan not found</p>
          <Button onClick={() => navigate('/')} variant="outline" className="border-slate-700 text-slate-300">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4">
        <SidebarTrigger className="text-slate-300" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white">{scan.target}</h1>
          <p className="text-sm text-slate-400">Scan ID: {scan.id}</p>
        </div>
        <div className="flex gap-2">
          {scan.status === 'running' && (
            <>
              <Button onClick={handlePauseScan} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                <Pause className="h-4 w-4 mr-2" /> Pause
              </Button>
              <Button onClick={handleStopScan} variant="outline" size="sm" className="border-red-700 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                <StopCircle className="h-4 w-4 mr-2" /> Stop
              </Button>
            </>
          )}
          {scan.status === 'paused' && (
            <>
              <Button onClick={handleResumeScan} variant="outline" size="sm" className="border-green-700 text-green-400 hover:text-green-300 hover:bg-green-900/20">
                <Play className="h-4 w-4 mr-2" /> Resume
              </Button>
              <Button onClick={handleStopScan} variant="outline" size="sm" className="border-red-700 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                <StopCircle className="h-4 w-4 mr-2" /> Stop
              </Button>
            </>
          )}
          <Button onClick={handleSendToDiscord} disabled={scan.status === 'running' || scan.status === 'paused'} variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
            <Send className="h-4 w-4 mr-2" /> Send to Discord
          </Button>
          <Button onClick={handleDownloadReport} disabled={scan.status === 'running' || scan.status === 'paused'} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Download className="h-4 w-4 mr-2" /> Download Report
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          <ScanStatus scan={scan} />

          {scan.results.siteInfo && <SiteInfo siteInfo={scan.results.siteInfo} />}
          {scan.results.geoip && <GeoIPInfo geoip={scan.results.geoip} />}
          {scan.results.headers && <HeadersAnalysis headers={scan.results.headers} />}
          {scan.results.whois && <WhoisInfo whois={scan.results.whois} />}
          {scan.results.dns && <DNSInfo dns={scan.results.dns} />}
          {scan.results.mx && <MXInfo mx={scan.results.mx} />}
          {scan.results.subnet && <SubnetInfo subnet={scan.results.subnet} />}
          {scan.results.ports && <PortScanResults ports={scan.results.ports} />}
          {scan.results.subdomains && <SubdomainList subdomains={scan.results.subdomains} />}
          {scan.results.reverseip && <ReverseIPInfo reverseip={scan.results.reverseip} />}
          {scan.results.sqlinjection && <SQLVulnerabilities sqlinjection={scan.results.sqlinjection} />}
          {scan.results.xss && <XSSVulnerabilities xss={scan.results.xss} />}
          {scan.results.wordpress && <WordPressInfo wordpress={scan.results.wordpress} />}
          {scan.results.seo && <SEOInfo seo={scan.results.seo} />}

          {scan.errors && scan.errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Errors Encountered</h3>
              <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
                {scan.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScanResults;
