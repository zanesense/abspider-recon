import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Scan, Loader2, AlertTriangle, Globe, Network, Shield, Code, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startScan } from '@/services/scanService';

const NewScan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    target: '',
    // Basic Scans
    siteInfo: true,
    headers: true,
    // Network & Domain Intelligence
    whois: true,
    geoip: true,
    dns: true,
    mx: true,
    subnet: false,
    ports: false,
    // Advanced Scans
    subdomains: true,
    reverseip: false,
    // Vulnerability Scans
    sqlinjection: false,
    xss: false,
    // CMS Specific
    wordpress: false,
    // SEO & Blogger
    seo: false,
    // Settings
    useProxy: false,
    threads: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.target) {
      toast({
        title: "Error",
        description: "Please enter a target URL or domain",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    console.log('[UI] Starting comprehensive scan with config:', formData);

    const scan = await startScan(formData);
    
    toast({
      title: "Scan Started",
      description: `Comprehensive reconnaissance scan initiated for ${formData.target}`,
    });

    setIsScanning(false);
    navigate(`/scan/${scan.id}`);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4">
        <SidebarTrigger className="text-slate-300" />
        <div>
          <h1 className="text-2xl font-semibold text-white">New Comprehensive Scan</h1>
          <p className="text-sm text-slate-400">Configure professional reconnaissance parameters</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Scan Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Select modules for comprehensive web reconnaissance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-slate-300 text-base">Target URL or Domain</Label>
                  <Input
                    id="target"
                    type="text"
                    placeholder="example.com or https://example.com"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12 text-base"
                  />
                  <p className="text-xs text-slate-500">Enter a domain name or full URL to scan</p>
                </div>

                <Separator className="bg-slate-800" />

                {/* Basic Scans */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    <Label className="text-slate-200 text-base font-semibold">Basic Reconnaissance</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="siteInfo"
                        checked={formData.siteInfo}
                        onCheckedChange={(checked) => setFormData({ ...formData, siteInfo: checked as boolean })}
                      />
                      <label htmlFor="siteInfo" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">Site Information</span> - Title, IP, Server, CMS, Cloudflare, robots.txt
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="headers"
                        checked={formData.headers}
                        onCheckedChange={(checked) => setFormData({ ...formData, headers: checked as boolean })}
                      />
                      <label htmlFor="headers" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">HTTP Headers</span> - Security headers, technologies, banner grabbing
                      </label>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Network & Domain Intelligence */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-purple-400" />
                    <Label className="text-slate-200 text-base font-semibold">Network & Domain Intelligence</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="whois"
                        checked={formData.whois}
                        onCheckedChange={(checked) => setFormData({ ...formData, whois: checked as boolean })}
                      />
                      <label htmlFor="whois" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">WHOIS Lookup</span> - Domain registration, nameservers, registrar
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="geoip"
                        checked={formData.geoip}
                        onCheckedChange={(checked) => setFormData({ ...formData, geoip: checked as boolean })}
                      />
                      <label htmlFor="geoip" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">GeoIP Lookup</span> - IP location, ISP, timezone, coordinates
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dns"
                        checked={formData.dns}
                        onCheckedChange={(checked) => setFormData({ ...formData, dns: checked as boolean })}
                      />
                      <label htmlFor="dns" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">DNS Lookup</span> - A, AAAA, MX, NS, TXT, CNAME, SOA records
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mx"
                        checked={formData.mx}
                        onCheckedChange={(checked) => setFormData({ ...formData, mx: checked as boolean })}
                      />
                      <label htmlFor="mx" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">MX Lookup</span> - Mail servers, SPF, DMARC records
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subnet"
                        checked={formData.subnet}
                        onCheckedChange={(checked) => setFormData({ ...formData, subnet: checked as boolean })}
                      />
                      <label htmlFor="subnet" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">Subnet Calculator</span> - Network range, usable hosts, CIDR
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ports"
                        checked={formData.ports}
                        onCheckedChange={(checked) => setFormData({ ...formData, ports: checked as boolean })}
                      />
                      <label htmlFor="ports" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">Port Scanning</span> - 26 common ports with service detection
                      </label>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Advanced Scans */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-blue-400" />
                    <Label className="text-slate-200 text-base font-semibold">Advanced Reconnaissance</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subdomains"
                        checked={formData.subdomains}
                        onCheckedChange={(checked) => setFormData({ ...formData, subdomains: checked as boolean })}
                      />
                      <label htmlFor="subdomains" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">Subdomain Enumeration</span> - DNS + Certificate Transparency
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reverseip"
                        checked={formData.reverseip}
                        onCheckedChange={(checked) => setFormData({ ...formData, reverseip: checked as boolean })}
                      />
                      <label htmlFor="reverseip" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">Reverse IP Lookup</span> - Domains on same IP with CMS detection
                      </label>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Vulnerability Scans */}
                <div className="space-y-4 border border-yellow-900/30 rounded-lg p-4 bg-yellow-900/5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    <Label className="text-yellow-400 text-base font-semibold">Vulnerability Assessment</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sqlinjection"
                        checked={formData.sqlinjection}
                        onCheckedChange={(checked) => setFormData({ ...formData, sqlinjection: checked as boolean })}
                      />
                      <label htmlFor="sqlinjection" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">SQL Injection</span> - Error, time, boolean, union-based testing
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="xss"
                        checked={formData.xss}
                        onCheckedChange={(checked) => setFormData({ ...formData, xss: checked as boolean })}
                      />
                      <label htmlFor="xss" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">XSS Testing</span> - Cross-site scripting vulnerability detection
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-500 pl-7 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Only test on domains you own or have explicit permission to test
                  </p>
                </div>

                <Separator className="bg-slate-800" />

                {/* CMS Specific */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-green-400" />
                    <Label className="text-slate-200 text-base font-semibold">CMS-Specific Scanning</Label>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pl-7">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wordpress"
                        checked={formData.wordpress}
                        onCheckedChange={(checked) => setFormData({ ...formData, wordpress: checked as boolean })}
                      />
                      <label htmlFor="wordpress" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">WordPress Scanner</span> - Version, plugins, themes, sensitive files, vulnerabilities
                      </label>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* SEO & Blogger */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pink-400" />
                    <Label className="text-slate-200 text-base font-semibold">SEO & Content Analysis</Label>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pl-7">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seo"
                        checked={formData.seo}
                        onCheckedChange={(checked) => setFormData({ ...formData, seo: checked as boolean })}
                      />
                      <label htmlFor="seo" className="text-sm text-slate-300 cursor-pointer">
                        <span className="font-medium">SEO Analysis</span> - Meta tags, headings, links, social media, page metrics
                      </label>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threads" className="text-slate-300">Concurrent Threads</Label>
                    <Input
                      id="threads"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.threads}
                      onChange={(e) => setFormData({ ...formData, threads: parseInt(e.target.value) })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500">Higher = faster but more aggressive (1-20)</p>
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useProxy"
                        checked={formData.useProxy}
                        onCheckedChange={(checked) => setFormData({ ...formData, useProxy: checked as boolean })}
                      />
                      <label htmlFor="useProxy" className="text-sm text-slate-300 cursor-pointer">
                        Use Proxy Rotation (configure in Settings)
                      </label>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isScanning}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white h-12 text-base font-semibold"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initializing Comprehensive Scan...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-5 w-5" />
                      Start Comprehensive Reconnaissance
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewScan;