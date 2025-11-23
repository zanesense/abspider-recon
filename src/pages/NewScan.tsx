import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Globe, Network, AlertTriangle, Code, TrendingUp, Settings2, Loader2, PlusCircle, Zap, CheckSquare, Square, CalendarDays, Clock, Repeat, AlertCircle, Mail, Lock, Fingerprint, Link as LinkIcon, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startScan, ScanConfig } from '@/services/scanService'; // Import ScanConfig
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { isInternalIP, extractHostname } from '@/services/apiUtils';
import { addScheduledScan } from '@/services/scheduledScanService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

// Define the maximum available payloads based on service files
const MAX_SQLI_PAYLOADS = 50; // Updated to 50
const MAX_XSS_PAYLOADS = 50; // Updated to 50
const MAX_LFI_PAYLOADS = 29;

// Define validation schema with Zod
const scanFormSchema = z.object({
  target: z.string().min(1, { message: "Target URL or IP address is required." })
    .refine(val => {
      try {
        new URL(val.startsWith('http') ? val : `https://${val}`);
        return true;
      } catch {
        return false;
      }
    }, { message: "Invalid URL or IP address format." }),
  scanName: z.string().optional(),
  siteInfo: z.boolean(),
  headers: z.boolean(),
  whois: z.boolean(),
  geoip: z.boolean(),
  dns: z.boolean(),
  mx: z.boolean(),
  subnet: z.boolean(),
  ports: z.boolean(),
  subdomains: z.boolean(),
  reverseip: z.boolean(),
  sqlinjection: z.boolean(),
  xss: z.boolean(),
  lfi: z.boolean(),
  wordpress: z.boolean(),
  seo: z.boolean(),
  ddosFirewall: z.boolean(),
  virustotal: z.boolean(),
  sslTls: z.boolean(),
  techStack: z.boolean(),
  brokenLinks: z.boolean(),
  corsMisconfig: z.boolean(),
  xssPayloads: z.number().min(1).max(MAX_XSS_PAYLOADS).default(20),
  sqliPayloads: z.number().min(1).max(MAX_SQLI_PAYLOADS).default(20),
  lfiPayloads: z.number().min(1).max(MAX_LFI_PAYLOADS).default(20),
  ddosRequests: z.number().min(1).max(100).default(20),
  useProxy: z.boolean(),
  threads: z.number().min(1).max(50),
  
  // Scheduling fields
  scheduleScan: z.boolean().default(false),
  scheduleFrequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  scheduleStartDate: z.string().optional(),
  scheduleStartTime: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.scheduleScan) {
    if (!data.scanName || data.scanName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheduled scan requires a name.",
        path: ['scanName'],
      });
    }
    if (!data.scheduleFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Frequency is required for scheduled scans.",
        path: ['scheduleFrequency'],
      });
    }
    if (!data.scheduleStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required for scheduled scans.",
        path: ['scheduleStartDate'],
      });
    }
    if (!data.scheduleStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time is required for scheduled scans.",
        path: ['scheduleStartTime'],
      });
    }
  }
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

const NewScan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  
  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      target: '',
      scanName: '',
      siteInfo: true,
      headers: true,
      whois: true,
      geoip: true,
      dns: true,
      mx: true,
      subnet: false,
      ports: false,
      subdomains: true,
      reverseip: false,
      sqlinjection: false,
      xss: false,
      lfi: false,
      wordpress: false,
      seo: true,
      ddosFirewall: false,
      virustotal: false,
      sslTls: false,
      techStack: false,
      brokenLinks: false,
      corsMisconfig: false,
      xssPayloads: 20,
      sqliPayloads: 20,
      lfiPayloads: 20,
      ddosRequests: 20,
      useProxy: false,
      threads: 20,
      scheduleScan: false,
      scheduleFrequency: 'daily',
      scheduleStartDate: format(new Date(), 'yyyy-MM-dd'),
      scheduleStartTime: format(new Date(), 'HH:mm'),
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
  const formData = watch();

  const onSubmit = async (data: ScanFormValues) => {
    setIsScanning(true);
    try {
      if (data.scheduleScan) {
        if (!data.scanName || !data.scheduleFrequency || !data.scheduleStartDate || !data.scheduleStartTime) {
          throw new Error("Missing scheduling details.");
        }
        // Extract scheduling fields and ensure remaining data matches ScanConfig
        const { scanName, scheduleFrequency, scheduleStartDate, scheduleStartTime, scheduleScan, ...scanConfig } = data;
        
        // Explicitly cast to ScanConfig to satisfy the type
        addScheduledScan(scanName, scanConfig as ScanConfig, {
          frequency: scheduleFrequency,
          startDate: scheduleStartDate,
          startTime: scheduleStartTime,
        });
        toast({
          title: "Scan Scheduled",
          description: `Scan '${scanName}' has been scheduled to run ${scheduleFrequency}.`,
        });
        navigate('/dashboard');
      } else {
        // Explicitly cast to ScanConfig to satisfy the type
        const scanId = await startScan(data as ScanConfig);
        toast({
          title: "Scan Started",
          description: `Scanning ${data.target}...`,
        });
        navigate(`/scan/${scanId}`);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Process Scan",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const toggleBasicScans = () => {
    const allChecked = formData.siteInfo && formData.headers && formData.techStack;
    setValue('siteInfo', !allChecked);
    setValue('headers', !allChecked);
    setValue('techStack', !allChecked);
  };

  const toggleNetworkIntelligence = () => {
    const allChecked = formData.whois && formData.geoip && formData.dns && formData.mx && formData.subnet && formData.ports && formData.subdomains && formData.reverseip;
    setValue('whois', !allChecked);
    setValue('geoip', !allChecked);
    setValue('dns', !allChecked);
    setValue('mx', !allChecked);
    setValue('subnet', !allChecked);
    setValue('ports', !allChecked);
    setValue('subdomains', !allChecked);
    setValue('reverseip', !allChecked);
  };

  const toggleVulnerabilityAssessment = () => {
    const allChecked = formData.sqlinjection && formData.xss && formData.lfi && formData.virustotal && formData.corsMisconfig;
    setValue('sqlinjection', !allChecked);
    setValue('xss', !allChecked);
    setValue('lfi', !allChecked);
    setValue('virustotal', !allChecked);
    setValue('corsMisconfig', !allChecked);
  };

  const toggleCmsDetection = () => {
    const allChecked = formData.wordpress;
    setValue('wordpress', !allChecked);
  };

  const toggleSeoAnalytics = () => {
    const allChecked = formData.seo && formData.brokenLinks;
    setValue('seo', !allChecked);
    setValue('brokenLinks', !allChecked);
  };

  const toggleSecurityTesting = () => {
    const allChecked = formData.ddosFirewall && formData.sslTls;
    setValue('ddosFirewall', !allChecked);
    setValue('sslTls', !allChecked);
  };

  const allBasicChecked = formData.siteInfo && formData.headers && formData.techStack;
  const anyBasicChecked = formData.siteInfo || formData.headers || formData.techStack;

  const allNetworkChecked = formData.whois && formData.geoip && formData.dns && formData.mx && formData.subnet && formData.ports && formData.subdomains && formData.reverseip;
  const anyNetworkChecked = formData.whois || formData.geoip || formData.dns || formData.mx || formData.subnet || formData.ports || formData.subdomains || formData.reverseip;

  const allVulnChecked = formData.sqlinjection && formData.xss && formData.lfi && formData.virustotal && formData.corsMisconfig;
  const anyVulnChecked = formData.sqlinjection || formData.xss || formData.lfi || formData.virustotal || formData.corsMisconfig;

  const allCmsChecked = formData.wordpress;
  const anyCmsChecked = formData.wordpress;

  const allSeoChecked = formData.seo && formData.brokenLinks;
  const anySeoChecked = formData.seo || formData.brokenLinks;

  const allSecurityChecked = formData.ddosFirewall && formData.sslTls;
  const anySecurityChecked = formData.ddosFirewall || formData.sslTls;

  const targetHostname = formData.target ? extractHostname(formData.target) : '';
  const isTargetInternal = targetHostname && (isInternalIP(targetHostname) || targetHostname === 'localhost');

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            New Reconnaissance Scan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure and launch a comprehensive security and intelligence scan</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
          <Link to="/new-scan">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Target Input */}
            <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Globe className="h-5 w-5" />
                  Target Configuration
                </CardTitle>
                <CardDescription>
                  Enter the URL or IP address to scan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="target">Target URL or IP Address</Label>
                  <Input
                    id="target"
                    type="text"
                    placeholder="example.com or 192.168.1.1"
                    {...form.register("target")}
                    className={cn("text-base bg-muted/30 border-border focus:border-primary focus:ring-primary", errors.target && "border-destructive focus:border-destructive focus:ring-destructive")}
                  />
                  {errors.target && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> {errors.target.message}
                    </p>
                  )}
                  {isTargetInternal && (
                    <Alert className="border-yellow-500/50 bg-yellow-500/10">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <AlertTitle className="text-yellow-600 dark:text-yellow-400 font-bold">
                        WARNING: Internal Target Detected
                      </AlertTitle>
                      <AlertDescription className="text-sm mt-2 text-yellow-600 dark:text-yellow-300">
                        You are attempting to scan an internal IP address or localhost.
                        Ensure you have explicit authorization before scanning internal networks.
                        Unauthorized scanning may be illegal.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Scan Feature */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              formData.scheduleScan ? "border-purple-500/70 hover:border-purple-500/90" : "border-purple-500/30 hover:border-purple-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <CalendarDays className="h-5 w-5" />
                  Schedule Scan
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="scheduleScan" className="text-sm text-muted-foreground">Enable Scheduling</Label>
                  <Checkbox
                    id="scheduleScan"
                    checked={formData.scheduleScan}
                    onCheckedChange={(checked) => setValue('scheduleScan', checked as boolean)}
                  />
                </div>
              </CardHeader>
              {formData.scheduleScan && (
                <CardContent className="space-y-4">
                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                    <AlertTitle className="text-blue-600 dark:text-blue-400 font-bold">
                      Client-Side Scheduling
                    </AlertTitle>
                    <AlertDescription className="text-sm mt-2 text-blue-600 dark:text-blue-300">
                      Scheduled scans will only run when this application is open in your browser.
                      Ensure the tab remains active for scans to execute as planned.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="scanName">Scheduled Scan Name</Label>
                    <Input
                      id="scanName"
                      type="text"
                      placeholder="My Daily Website Check"
                      {...form.register("scanName")}
                      className={cn("bg-muted/30 border-border focus:border-primary focus:ring-primary", errors.scanName && "border-destructive focus:border-destructive focus:ring-destructive")}
                    />
                    {errors.scanName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> {errors.scanName.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduleFrequency">Frequency</Label>
                      <Select
                        onValueChange={(value) => setValue('scheduleFrequency', value as 'once' | 'daily' | 'weekly' | 'monthly')}
                        value={formData.scheduleFrequency}
                      >
                        <SelectTrigger className={cn("bg-muted/30 border-border focus:ring-primary", errors.scheduleFrequency && "border-destructive focus:border-destructive focus:ring-destructive")}>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.scheduleFrequency && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> {errors.scheduleFrequency.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduleStartDate">Start Date</Label>
                      <Input
                        id="scheduleStartDate"
                        type="date"
                        {...form.register("scheduleStartDate")}
                        className={cn("bg-muted/30 border-border focus:border-primary focus:ring-primary", errors.scheduleStartDate && "border-destructive focus:border-destructive focus:ring-destructive")}
                      />
                      {errors.scheduleStartDate && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> {errors.scheduleStartDate.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduleStartTime">Start Time</Label>
                      <Input
                        id="scheduleStartTime"
                        type="time"
                        {...form.register("scheduleStartTime")}
                        className={cn("bg-muted/30 border-border focus:border-primary focus:ring-primary", errors.scheduleStartTime && "border-destructive focus:border-destructive focus:ring-destructive")}
                      />
                      {errors.scheduleStartTime && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> {errors.scheduleStartTime.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Basic Scans */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              anyBasicChecked ? "border-blue-500/70 hover:border-blue-500/90" : "border-blue-500/30 hover:border-blue-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Shield className="h-5 w-5" />
                  Basic Reconnaissance
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={toggleBasicScans} className="border-border text-foreground hover:bg-muted/50">
                  {allBasicChecked ? <><Square className="h-4 w-4 mr-2" /> Deselect All</> : <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="siteInfo"
                      checked={formData.siteInfo}
                      onCheckedChange={(checked) => setValue('siteInfo', checked as boolean)}
                    />
                    <label htmlFor="siteInfo" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Site Information</span> - Basic website details
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="headers"
                      checked={formData.headers}
                      onCheckedChange={(checked) => setValue('headers', checked as boolean)}
                    />
                    <label htmlFor="headers" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">HTTP Headers</span> - Server response headers
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="techStack"
                      checked={formData.techStack}
                      onCheckedChange={(checked) => setValue('techStack', checked as boolean)}
                    />
                    <label htmlFor="techStack" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Tech Stack Fingerprinting</span> - Identify web technologies
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network & Domain Intelligence */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              anyNetworkChecked ? "border-green-500/70 hover:border-green-500/90" : "border-green-500/30 hover:border-green-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Network className="h-5 w-5" />
                  Network & Domain Intelligence
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={toggleNetworkIntelligence} className="border-border text-foreground hover:bg-muted/50">
                  {allNetworkChecked ? <><Square className="h-4 w-4 mr-2" /> Deselect All</> : <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whois"
                      checked={formData.whois}
                      onCheckedChange={(checked) => setValue('whois', checked as boolean)}
                    />
                    <label htmlFor="whois" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">WHOIS Lookup</span> - Domain registration info
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="geoip"
                      checked={formData.geoip}
                      onCheckedChange={(checked) => setValue('geoip', checked as boolean)}
                    />
                    <label htmlFor="geoip" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">GeoIP Location</span> - Server physical location
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dns"
                      checked={formData.dns}
                      onCheckedChange={(checked) => setValue('dns', checked as boolean)}
                    />
                    <label htmlFor="dns" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">DNS Records</span> - A, AAAA, CNAME, TXT records
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mx"
                      checked={formData.mx}
                      onCheckedChange={(checked) => setValue('mx', checked as boolean)}
                    />
                    <label htmlFor="mx" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">MX Records</span> - Mail server configuration
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subnet"
                      checked={formData.subnet}
                      onCheckedChange={(checked) => setValue('subnet', checked as boolean)}
                    />
                    <label htmlFor="subnet" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Subnet Scan</span> - Network range analysis
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ports"
                      checked={formData.ports}
                      onCheckedChange={(checked) => setValue('ports', checked as boolean)}
                    />
                    <label htmlFor="ports" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Port Scanning</span> - Open ports detection
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subdomains"
                      checked={formData.subdomains}
                      onCheckedChange={(checked) => setValue('subdomains', checked as boolean)}
                    />
                    <label htmlFor="subdomains" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Subdomain Enumeration</span> - Find subdomains
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reverseip"
                      checked={formData.reverseip}
                      onCheckedChange={(checked) => setValue('reverseip', checked as boolean)}
                    />
                    <label htmlFor="reverseip" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Reverse IP Lookup</span> - Sites on same server
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Scans */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              anyVulnChecked ? "border-orange-500/70 hover:border-orange-500/90" : "border-orange-500/30 hover:border-orange-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Vulnerability Assessment
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={toggleVulnerabilityAssessment} className="border-border text-foreground hover:bg-muted/50">
                  {allVulnChecked ? <><Square className="h-4 w-4 mr-2" /> Deselect All</> : <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sqlinjection"
                      checked={formData.sqlinjection}
                      onCheckedChange={(checked) => setValue('sqlinjection', checked as boolean)}
                    />
                    <label htmlFor="sqlinjection" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">SQL Injection Test</span> - Database vulnerability
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="xss"
                      checked={formData.xss}
                      onCheckedChange={(checked) => setValue('xss', checked as boolean)}
                    />
                    <label htmlFor="xss" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">XSS Detection</span> - Cross-site scripting test
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lfi"
                      checked={formData.lfi}
                      onCheckedChange={(checked) => setValue('lfi', checked as boolean)}
                    />
                    <label htmlFor="lfi" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">LFI Detection</span> - Local file inclusion test
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="virustotal"
                      checked={formData.virustotal}
                      onCheckedChange={(checked) => setValue('virustotal', checked as boolean)}
                    />
                    <label htmlFor="virustotal" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">VirusTotal Scan</span> - Domain reputation & malware
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="corsMisconfig"
                      checked={formData.corsMisconfig}
                      onCheckedChange={(checked) => setValue('corsMisconfig', checked as boolean)}
                    />
                    <label htmlFor="corsMisconfig" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">CORS Misconfiguration</span> - Cross-Origin Resource Sharing
                    </label>
                  </div>
                </div>
                {(formData.sqlinjection || formData.xss || formData.lfi) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sqliPayloads">SQLi Payloads ({formData.sqliPayloads} / {MAX_SQLI_PAYLOADS})</Label>
                      <Input
                        id="sqliPayloads"
                        type="range"
                        min="1"
                        max={MAX_SQLI_PAYLOADS}
                        value={formData.sqliPayloads}
                        onChange={(e) => setValue('sqliPayloads', parseInt(e.target.value))}
                        className="accent-primary"
                        disabled={!formData.sqlinjection}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="xssPayloads">XSS Payloads ({formData.xssPayloads} / {MAX_XSS_PAYLOADS})</Label>
                      <Input
                        id="xssPayloads"
                        type="range"
                        min="1"
                        max={MAX_XSS_PAYLOADS}
                        value={formData.xssPayloads}
                        onChange={(e) => setValue('xssPayloads', parseInt(e.target.value))}
                        className="accent-primary"
                        disabled={!formData.xss}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lfiPayloads">LFI Payloads ({formData.lfiPayloads} / {MAX_LFI_PAYLOADS})</Label>
                      <Input
                        id="lfiPayloads"
                        type="range"
                        min="1"
                        max={MAX_LFI_PAYLOADS}
                        value={formData.lfiPayloads}
                        onChange={(e) => setValue('lfiPayloads', parseInt(e.target.value))}
                        className="accent-primary"
                        disabled={!formData.lfi}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CMS Detection */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              anyCmsChecked ? "border-blue-500/70 hover:border-blue-500/90" : "border-blue-500/30 hover:border-blue-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Code className="h-5 w-5" />
                  CMS Detection
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={toggleCmsDetection} className="border-border text-foreground hover:bg-muted/50">
                  {allCmsChecked ? <><Square className="h-4 w-4 mr-2" /> Deselect All</> : <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wordpress"
                      checked={formData.wordpress}
                      onCheckedChange={(checked) => setValue('wordpress', checked as boolean)}
                    />
                    <label htmlFor="wordpress" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">WordPress Scan</span> - Plugins, themes, versions
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO & Analytics */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              anySeoChecked ? "border-pink-500/70 hover:border-pink-500/90" : "border-pink-500/30 hover:border-pink-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                  <TrendingUp className="h-5 w-5" />
                  SEO & Analytics
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={toggleSeoAnalytics} className="border-border text-foreground hover:bg-muted/50">
                  {allSeoChecked ? <><Square className="h-4 w-4 mr-2" /> Deselect All</> : <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seo"
                      checked={formData.seo}
                      onCheckedChange={(checked) => setValue('seo', checked as boolean)}
                    />
                    <label htmlFor="seo" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">SEO Analysis</span> - Meta tags, headings, links
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="brokenLinks"
                      checked={formData.brokenLinks}
                      onCheckedChange={(checked) => setValue('brokenLinks', checked as boolean)}
                    />
                    <label htmlFor="brokenLinks" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Broken Link Checker</span> - Find broken internal/external links
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Testing */}
            <Card className={cn(
              "bg-card/50 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl",
              anySecurityChecked ? "border-purple-500/70 hover:border-purple-500/90" : "border-purple-500/30 hover:border-purple-500/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Zap className="h-5 w-5" />
                  Security Testing
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={toggleSecurityTesting} className="border-border text-foreground hover:bg-muted/50">
                  {allSecurityChecked ? <><Square className="h-4 w-4 mr-2" /> Deselect All</> : <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ddosFirewall"
                      checked={formData.ddosFirewall}
                      onCheckedChange={(checked) => setValue('ddosFirewall', checked as boolean)}
                    />
                    <label htmlFor="ddosFirewall" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">DDoS Firewall Test</span> - Detect WAF/DDoS protection
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sslTls"
                      checked={formData.sslTls}
                      onCheckedChange={(checked) => setValue('sslTls', checked as boolean)}
                    />
                    <label htmlFor="sslTls" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">SSL/TLS Analysis</span> - Certificate details & expiry
                    </label>
                  </div>
                </div>
                {formData.ddosFirewall && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="ddosRequests">DDoS Test Requests ({formData.ddosRequests} / 100)</Label>
                    <Input
                      id="ddosRequests"
                      type="range"
                      min="1"
                      max="100"
                      value={formData.ddosRequests}
                      onChange={(e) => setValue('ddosRequests', parseInt(e.target.value))}
                      className="accent-primary"
                      disabled={!formData.ddosFirewall}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Settings2 className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Scan configuration and performance options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.useProxy && (
                  <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-4">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <AlertTitle className="text-yellow-600 dark:text-yellow-400 font-bold">
                      WARNING: Public CORS Proxy Risks
                    </AlertTitle>
                    <AlertDescription className="text-sm mt-2 text-yellow-600 dark:text-yellow-300">
                      You have enabled proxy usage. This will route your scan traffic through public CORS proxies.
                      Be aware of the privacy and security implications as these proxies may log your requests.
                      For sensitive operations, consider a self-hosted proxy.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useProxy"
                      checked={formData.useProxy}
                      onCheckedChange={(checked) => setValue('useProxy', checked as boolean)}
                    />
                    <label htmlFor="useProxy" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Use Proxy</span> - Route through proxy server
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threads">Concurrent Threads: {formData.threads} / 50</Label>
                    <Input
                      id="threads"
                      type="range"
                      min="1"
                      max="50"
                      value={formData.threads}
                      onChange={(e) => setValue('threads', parseInt(e.target.value))}
                      className="accent-primary"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
                      Higher thread counts can degrade browser performance and may trigger rate limiting on target servers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isScanning}
                className="border-border text-foreground hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isScanning}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] text-white font-semibold"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {formData.scheduleScan ? 'Scheduling...' : 'Starting Scan...'}
                  </>
                ) : (
                  <>
                    {formData.scheduleScan ? <CalendarDays className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />}
                    {formData.scheduleScan ? 'Schedule Scan' : 'Launch Scan'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewScan;