import { useParams, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send, Pause, Play, StopCircle, AlertTriangle, FileText, FileDown, FileType, FileSpreadsheet, RotateCcw, RefreshCcw } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getScanById, pauseScan, resumeScan, stopScan, startScan } from '@/services/scanService';
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
import VirusTotalResults from '@/components/VirusTotalResults';
import SslTlsResults from '@/components/SslTlsResults';
import TechStackInfo from '@/components/TechStackInfo';
import BrokenLinkResults from '@/components/BrokenLinkResults';
import CorsMisconfigResults from '@/components/CorsMisconfigResults';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { generateReportContent } from '@/utils/reportUtils';
import { SQLScanResult } from '@/services/sqlScanService';
import { XSSScanResult } from '@/services/xssScanService';
import { LFIScanResult } from '@/services/lfiScanService';

type ReportFormat = 'pdf' | 'docx' | 'md' | 'csv';

const ScanResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [selectedReportFormat, setSelectedReportFormat] = useState<ReportFormat | null>(null);

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

  const handleGenerateAndDownload = async (format: ReportFormat) => {
    if (!scan) {
      toast({
        title: "Error",
        description: "Scan data not available for download.",
        variant: "destructive",
      });
      return;
    }
    try {
      await generateReportContent(scan, format); // Triggers direct download
      toast({
        title: "Report Generated",
        description: `The ${format.toUpperCase()} report has been downloaded successfully.`,
      });
      setShowDownloadDialog(false);
      setSelectedReportFormat(null);
    } catch (error: any) {
      toast({
        title: "Report Generation Failed",
        description: error.message || `Failed to generate ${format.toUpperCase()} report.`,
        variant: "destructive",
      });
    }
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

  const rescanMutation = useMutation({
    mutationFn: async (config: typeof scan.config) => {
      const newScanId = await startScan(config);
      return newScanId;
    },
    onSuccess: (newScanId, config) => {
      toast({
        title: "Scan Initiated",
        description: `New scan for ${config.target} started successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
      navigate(`/scan/${newScanId}`);
    },
    onError: (error: any, config) => {
      toast({
        title: "Failed to Start Scan",
        description: error.message || `Could not start new scan for ${config.target}.`,
        variant: "destructive",
      });
    },
  });

  const handleRetryRescan = () => {
    if (!scan) return;
    rescanMutation.mutate(scan.config);
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

  // Helper to get module-specific error
  const getModuleError = (moduleName: string) => {
    return scan.errors.find(error => error.startsWith(`${moduleName}:`));
  };

  const isScanActive = scan.status === 'running' || scan.status === 'paused';
  const canRescan = scan.status === 'completed' || scan.status === 'failed' || scan.status === 'stopped'; // Enable rescan for stopped

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
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
              <Button onClick={handleResumeScan} variant="outline" size="sm" className="border-green-700 text-green-600 dark:text-green-400 hover:text-green-300 hover:bg-green-900/20">
                <Play className="h-4 w-4 mr-2" /> Resume
              </Button>
              <Button onClick={handleStopScan} variant="outline" size="sm" className="border-destructive text-destructive hover:text-destructive-foreground hover:bg-destructive/20">
                <StopCircle className="h-4 w-4 mr-2" /> Stop
              </Button>
            </>
          )}

          {canRescan && (
            <Button
              onClick={handleRetryRescan}
              disabled={isScanActive || rescanMutation.isPending}
              variant="outline"
              size="sm"
              className={scan.status === 'failed' ? "border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20" : "border-primary text-primary hover:bg-primary/20"}
            >
              {rescanMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              {scan.status === 'failed' ? 'Retry Scan' : 'Rescan'}
            </Button>
          )}

          <Button onClick={handleSendToDiscord} disabled={isScanActive} variant="outline" className="border-border text-foreground hover:text-primary hover:bg-muted/50">
            <Send className="h-4 w-4 mr-2" /> Send to Discord
          </Button>
          <Button 
            onClick={() => setShowDownloadDialog(true)}
            disabled={isScanActive} 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md"
          >
            <Download className="h-4 w-4 mr-2" /> Download Report
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Row: Scan Status and Summary Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScanStatus scan={scan} />
            <ScanSummaryWidget scan={scan} securityGrade={scan.securityGrade} />
          </div>

          {/* Main Content: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <SiteInfo 
                siteInfo={scan.results.siteInfo} 
                isTested={scan.config.siteInfo} 
                moduleError={getModuleError('siteInfo')} 
              />
              <HeadersAnalysis 
                headersAnalysis={scan.results.headers} 
                isTested={scan.config.headers} 
                moduleError={getModuleError('headers')} 
              />
              <TechStackInfo 
                techStack={scan.results.techStack} 
                isTested={scan.config.techStack} 
                moduleError={getModuleError('techStack')} 
              />
              <WhoisInfo 
                whois={scan.results.whois} 
                isTested={scan.config.whois} 
                moduleError={getModuleError('whois')} 
              />
              <DNSInfo 
                dns={scan.results.dns} 
                isTested={scan.config.dns} 
                moduleError={getModuleError('dns')} 
              />
              <MXInfo 
                mx={scan.results.mx} 
                isTested={scan.config.mx} 
                moduleError={getModuleError('mx')} 
              />
              <SubnetInfo 
                subnet={scan.results.subnet} 
                isTested={scan.config.subnet} 
                moduleError={getModuleError('subnet')} 
              />
              <PortScanResults 
                ports={scan.results.ports} 
                isTested={scan.config.ports} 
                moduleError={getModuleError('ports')} 
              />
              <VirusTotalResults 
                virustotal={scan.results.virustotal} 
                isTested={scan.config.virustotal} 
                moduleError={getModuleError('virustotal')} 
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <GeoIPInfo 
                geoip={scan.results.geoip} 
                isTested={scan.config.geoip} 
                moduleError={getModuleError('geoip')} 
              />
              <SubdomainList 
                subdomains={scan.results.subdomains} 
                isTested={scan.config.subdomains} 
                moduleError={getModuleError('subdomains')} 
              />
              <ReverseIPInfo 
                reverseip={scan.results.reverseip} 
                isTested={scan.config.reverseip} 
                moduleError={getModuleError('reverseip')} 
              />
              <SQLVulnerabilities 
                sqlinjection={scan.results.sqlinjection as SQLScanResult} 
                isTested={scan.config.sqlinjection}
                moduleError={getModuleError('sqlinjection')}
              />
              <XSSVulnerabilities 
                xss={scan.results.xss as XSSScanResult} 
                isTested={scan.config.xss}
                moduleError={getModuleError('xss')}
              />
              <LFIVulnerabilities 
                lfi={scan.results.lfi as LFIScanResult} 
                isTested={scan.config.lfi} 
                moduleError={getModuleError('lfi')} 
              />
              <CorsMisconfigResults 
                corsMisconfig={scan.results.corsMisconfig} 
                isTested={scan.config.corsMisconfig} 
                moduleError={getModuleError('corsMisconfig')} 
              />
              <WordPressInfo 
                wordpress={scan.results.wordpress} 
                isTested={scan.config.wordpress} 
                moduleError={getModuleError('wordpress')} 
              />
              <SEOInfo 
                seo={scan.results.seo} 
                isTested={scan.config.seo} 
                moduleError={getModuleError('seo')} 
              />
              <BrokenLinkResults 
                brokenLinks={scan.results.brokenLinks} 
                isTested={scan.config.brokenLinks} 
                moduleError={getModuleError('brokenLinks')} 
              />
              <DDoSFirewallResults 
                ddosFirewall={scan.results.ddosFirewall} 
                isTested={scan.config.ddosFirewall} 
                moduleError={getModuleError('ddosFirewall')} 
              />
              <SslTlsResults 
                sslTls={scan.results.sslTls} 
                isTested={scan.config.sslTls} 
                moduleError={getModuleError('sslTls')} 
              />
            </div>
          </div>

          {scan.errors && scan.errors.length > 0 && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-destructive/70">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-destructive dark:text-red-400 font-bold">
                Errors Encountered During Scan
              </AlertTitle>
              <AlertDescription className="text-sm mt-2 text-destructive-foreground dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {scan.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      {/* Download Report Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-xl">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Download className="h-6 w-6 text-primary" /> Download Report
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select the desired format for your scan report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-format" className="text-right text-foreground">
                Format
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="col-span-3 justify-between border-border text-foreground hover:bg-muted/50">
                    {selectedReportFormat ? (
                      <span className="capitalize">{selectedReportFormat}</span>
                    ) : (
                      "Select a format"
                    )}
                    <Download className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px] bg-card border-border">
                  <DropdownMenuLabel>Report Formats</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedReportFormat('pdf')} className="cursor-pointer hover:bg-muted/50">
                    <FileText className="mr-2 h-4 w-4 text-red-500" /> PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedReportFormat('docx')} className="cursor-pointer hover:bg-muted/50">
                    <FileType className="mr-2 h-4 w-4 text-blue-500" /> Word (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedReportFormat('md')} className="cursor-pointer hover:bg-muted/50">
                    <FileDown className="mr-2 h-4 w-4 text-gray-500" /> Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedReportFormat('csv')} className="cursor-pointer hover:bg-muted/50">
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" /> CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={() => { setShowDownloadDialog(false); setSelectedReportFormat(null); }} 
              className="flex-1 sm:flex-none border-border text-foreground hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedReportFormat && handleGenerateAndDownload(selectedReportFormat)} 
              disabled={!selectedReportFormat}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScanResults;