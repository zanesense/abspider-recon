import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Globe, Network, AlertTriangle, Code, TrendingUp, Settings2, Loader2 } from 'lucide-react';
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
    banners: true,
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
    // SEO & Analytics
    seo: true,
    alexa: true,
    linkGrabber: true,
    // Settings
    useProxy: false,
    threads: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target URL or IP address",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    try {
      const scanId = await startScan(formData);
      toast({
        title: "Scan Started",
        description: `Scanning ${formData.target}...`,
      });
      navigate(`/scan/${scanId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scan",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4 shadow-lg">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-7 w-7 text-cyan-500" />
            New Reconnaissance Scan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure and launch a comprehensive security and intelligence scan</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Input */}
            <Card className="border-primary/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-primary/40">
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
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Scans */}
            <Card className="shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Shield className="h-5 w-5" />
                  Basic Reconnaissance
                </CardTitle>
                <CardDescription>
                  Fundamental information gathering modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="siteInfo"
                      checked={formData.siteInfo}
                      onCheckedChange={(checked) => setFormData({ ...formData, siteInfo: checked as boolean })}
                    />
                    <label htmlFor="siteInfo" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Site Information</span> - Basic website details
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="headers"
                      checked={formData.headers}
                      onCheckedChange={(checked) => setFormData({ ...formData, headers: checked as boolean })}
                    />
                    <label htmlFor="headers" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">HTTP Headers</span> - Server response headers
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="banners"
                      checked={formData.banners}
                      onCheckedChange={(checked) => setFormData({ ...formData, banners: checked as boolean })}
                    />
                    <label htmlFor="banners" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Banner Grabbing</span> - Service detection
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network & Domain Intelligence */}
            <Card className="shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Network className="h-5 w-5" />
                  Network & Domain Intelligence
                </CardTitle>
                <CardDescription>
                  DNS, domain registration, and network analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whois"
                      checked={formData.whois}
                      onCheckedChange={(checked) => setFormData({ ...formData, whois: checked as boolean })}
                    />
                    <label htmlFor="whois" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">WHOIS Lookup</span> - Domain registration info
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="geoip"
                      checked={formData.geoip}
                      onCheckedChange={(checked) => setFormData({ ...formData, geoip: checked as boolean })}
                    />
                    <label htmlFor="geoip" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">GeoIP Location</span> - Server physical location
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dns"
                      checked={formData.dns}
                      onCheckedChange={(checked) => setFormData({ ...formData, dns: checked as boolean })}
                    />
                    <label htmlFor="dns" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">DNS Records</span> - A, AAAA, CNAME, TXT records
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mx"
                      checked={formData.mx}
                      onCheckedChange={(checked) => setFormData({ ...formData, mx: checked as boolean })}
                    />
                    <label htmlFor="mx" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">MX Records</span> - Mail server configuration
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subnet"
                      checked={formData.subnet}
                      onCheckedChange={(checked) => setFormData({ ...formData, subnet: checked as boolean })}
                    />
                    <label htmlFor="subnet" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Subnet Scan</span> - Network range analysis
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ports"
                      checked={formData.ports}
                      onCheckedChange={(checked) => setFormData({ ...formData, ports: checked as boolean })}
                    />
                    <label htmlFor="ports" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Port Scanning</span> - Open ports detection
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subdomains"
                      checked={formData.subdomains}
                      onCheckedChange={(checked) => setFormData({ ...formData, subdomains: checked as boolean })}
                    />
                    <label htmlFor="subdomains" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Subdomain Enumeration</span> - Find subdomains
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reverseip"
                      checked={formData.reverseip}
                      onCheckedChange={(checked) => setFormData({ ...formData, reverseip: checked as boolean })}
                    />
                    <label htmlFor="reverseip" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Reverse IP Lookup</span> - Sites on same server
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Scans */}
            <Card className="shadow-lg border-orange-500/20 transition-all duration-300 hover:shadow-2xl hover:border-orange-500/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Vulnerability Assessment
                </CardTitle>
                <CardDescription>
                  Security vulnerability detection (use responsibly)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sqlinjection"
                      checked={formData.sqlinjection}
                      onCheckedChange={(checked) => setFormData({ ...formData, sqlinjection: checked as boolean })}
                    />
                    <label htmlFor="sqlinjection" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">SQL Injection Test</span> - Database vulnerability
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="xss"
                      checked={formData.xss}
                      onCheckedChange={(checked) => setFormData({ ...formData, xss: checked as boolean })}
                    />
                    <label htmlFor="xss" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">XSS Detection</span> - Cross-site scripting test
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CMS Detection */}
            <Card className="shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Code className="h-5 w-5" />
                  CMS Detection
                </CardTitle>
                <CardDescription>
                  Content Management System identification and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wordpress"
                      checked={formData.wordpress}
                      onCheckedChange={(checked) => setFormData({ ...formData, wordpress: checked as boolean })}
                    />
                    <label htmlFor="wordpress" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">WordPress Scan</span> - Plugins, themes, versions
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO & Analytics */}
            <Card className="shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-400">
                  <TrendingUp className="h-5 w-5" />
                  SEO & Analytics
                </CardTitle>
                <CardDescription>
                  Search engine optimization and web metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seo"
                      checked={formData.seo}
                      onCheckedChange={(checked) => setFormData({ ...formData, seo: checked as boolean })}
                    />
                    <label htmlFor="seo" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">SEO Analysis</span> - Meta tags, headings, links
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alexa"
                      checked={formData.alexa}
                      onCheckedChange={(checked) => setFormData({ ...formData, alexa: checked as boolean })}
                    />
                    <label htmlFor="alexa" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Alexa & Metrics</span> - Rankings and analytics
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="linkGrabber"
                      checked={formData.linkGrabber}
                      onCheckedChange={(checked) => setFormData({ ...formData, linkGrabber: checked as boolean })}
                    />
                    <label htmlFor="linkGrabber" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Link Grabber</span> - Extract all links
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-400">
                  <Settings2 className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Scan configuration and performance options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useProxy"
                      checked={formData.useProxy}
                      onCheckedChange={(checked) => setFormData({ ...formData, useProxy: checked as boolean })}
                    />
                    <label htmlFor="useProxy" className="text-sm text-foreground cursor-pointer">
                      <span className="font-medium">Use Proxy</span> - Route through proxy server
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threads">Concurrent Threads: {formData.threads}</Label>
                    <Input
                      id="threads"
                      type="range"
                      min="20"
                      max="100"
                      value={formData.threads}
                      onChange={(e) => setFormData({ ...formData, threads: parseInt(e.target.value) })}
                    />
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isScanning}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Scan...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Launch Scan
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
