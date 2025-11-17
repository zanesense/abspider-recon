import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, TestTube, Key, CheckCircle, XCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSettings, saveSettings, testDiscordWebhook, isValidDiscordWebhookUrl, Settings } from '@/services/settingsService'; // Import Settings interface
import { getAPIKeys, saveAPIKeys, APIKeys } from '@/services/apiKeyService';
import {
  testShodanAPI,
  testVirusTotalAPI,
  testSecurityTrailsAPI,
  testBuiltWithAPI,
  testHunterAPI,
  testClearbitAPI,
  testOpenCageAPI,
} from '@/services/apiTestService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

type APIKeyService = keyof APIKeys;

const AppSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [apiKeyTestStatus, setApiKeyTestStatus] = useState<Record<APIKeyService, 'success' | 'error' | 'testing' | undefined>>({});

  // Fetch general settings using react-query
  const { data: settings = { discordWebhook: '', proxyList: '', defaultThreads: 20, timeout: 30 }, isLoading: isLoadingSettings, isError: isErrorSettings } = useQuery<Settings>({
    queryKey: ['appSettings'],
    queryFn: getSettings,
  });

  // Mutation for saving general settings
  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      toast({
        title: "Settings Saved",
        description: "Your general settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save general settings.",
        variant: "destructive",
      });
    },
  });

  // Fetch API keys using react-query
  const { data: apiKeys = {}, isLoading: isLoadingApiKeys, isError: isErrorApiKeys } = useQuery<APIKeys>({
    queryKey: ['apiKeys'],
    queryFn: getAPIKeys,
  });

  // Mutation for saving API keys
  const saveApiKeysMutation = useMutation({
    mutationFn: saveAPIKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save API keys.",
        variant: "destructive",
      });
    },
  });

  const handleSaveAllSettings = async () => {
    try {
      // Validate Discord webhook before saving
      if (settings.discordWebhook && !isValidDiscordWebhookUrl(settings.discordWebhook)) {
        toast({
          title: "Validation Error",
          description: "Invalid Discord webhook URL format. Please correct it before saving.",
          variant: "destructive",
        });
        return;
      }

      // Trigger both mutations
      await Promise.all([
        saveSettingsMutation.mutateAsync(settings),
        saveApiKeysMutation.mutateAsync(apiKeys),
      ]);

      toast({
        title: "All Settings Saved",
        description: "All your application settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save all settings.",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = async () => {
    if (!settings.discordWebhook) {
      toast({
        title: "Error",
        description: "Please enter a Discord webhook URL",
        variant: "destructive",
      });
      return;
    }

    // Validate the URL before testing
    if (!isValidDiscordWebhookUrl(settings.discordWebhook)) {
      toast({
        title: "Validation Error",
        description: "Invalid Discord webhook URL format. Please correct it.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    
    try {
      await testDiscordWebhook(settings.discordWebhook);
      toast({
        title: "Webhook Test Successful",
        description: "Check your Discord channel for the test message",
      });
    } catch (error: any) {
      toast({
        title: "Webhook Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleTestAPIKey = async (service: APIKeyService) => {
    const key = apiKeys[service];
    if (!key) {
      toast({
        title: "Error",
        description: `Please enter a ${service} API key first.`,
        variant: "destructive",
      });
      return;
    }

    setApiKeyTestStatus(prev => ({ ...prev, [service]: 'testing' }));

    try {
      let result;
      switch (service) {
        case 'shodan': result = await testShodanAPI(key); break;
        case 'virustotal': result = await testVirusTotalAPI(key); break;
        case 'securitytrails': result = await testSecurityTrailsAPI(key); break;
        case 'builtwith': result = await testBuiltWithAPI(key); break;
        case 'hunter': result = await testHunterAPI(key); break;
        case 'clearbit': result = await testClearbitAPI(key); break;
        case 'opencage': result = await testOpenCageAPI(key); break;
        default: throw new Error('Unknown API service');
      }

      if (result.success) {
        setApiKeyTestStatus(prev => ({ ...prev, [service]: 'success' }));
        toast({
          title: `${service} API Test Successful`,
          description: result.message || 'API key is valid.',
        });
      } else {
        setApiKeyTestStatus(prev => ({ ...prev, [service]: 'error' }));
        toast({
          title: `${service} API Test Failed`,
          description: result.message || 'API key is invalid or an error occurred.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setApiKeyTestStatus(prev => ({ ...prev, [service]: 'error' }));
      toast({
        title: `${service} API Test Failed`,
        description: error.message || 'An unexpected error occurred during the test.',
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (service: APIKeyService) => {
    const status = apiKeyTestStatus[service];
    if (status === 'testing') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    if (apiKeys[service]) return <CheckCircle className="h-4 w-4 text-muted-foreground/70" />; // Key is present but not tested
    return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />; // Key is missing
  };

  const isTestingAPI = (service: APIKeyService) => apiKeyTestStatus[service] === 'testing';

  const totalApiKeys = 7; // Shodan, VirusTotal, SecurityTrails, BuiltWith, OpenCage, Hunter.io, Clearbit
  const configuredApiKeys = Object.values(apiKeys).filter(key => typeof key === 'string' && key.trim().length > 0).length;


  if (isLoadingSettings || isLoadingApiKeys) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading app settings...</p>
      </div>
    );
  }

  if (isErrorSettings || isErrorApiKeys) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load settings. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            App Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure application-wide preferences</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* General Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure default scanning parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultThreads">Default Threads</Label>
                  <Input
                    id="defaultThreads"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.defaultThreads}
                    onChange={(e) => queryClient.setQueryData(['appSettings'], { ...settings, defaultThreads: parseInt(e.target.value) })}
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Concurrent scanning threads (1-50)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.timeout}
                    onChange={(e) => queryClient.setQueryData(['appSettings'], { ...settings, timeout: parseInt(e.target.value) })}
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Maximum wait time for requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discord Webhook */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <CardHeader>
              <CardTitle>Discord Webhook</CardTitle>
              <CardDescription>
                Receive scan notifications in Discord
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discordWebhook">Webhook URL</Label>
                <Input
                  id="discordWebhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.discordWebhook}
                  onChange={(e) => queryClient.setQueryData(['appSettings'], { ...settings, discordWebhook: e.target.value })}
                  className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
                {settings.discordWebhook && !isValidDiscordWebhookUrl(settings.discordWebhook) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Invalid Discord webhook URL format.
                  </p>
                )}
              </div>
              <Button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || (settings.discordWebhook && !isValidDiscordWebhookUrl(settings.discordWebhook))}
                variant="outline"
                className="border-border text-foreground hover:bg-muted/50"
              >
                {isTestingWebhook ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Webhook
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Proxy Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <CardHeader>
              <CardTitle>Proxy Configuration</CardTitle>
              <CardDescription>
                Configure proxy servers for scanning (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proxyList">Proxy List</Label>
                <Textarea
                  id="proxyList"
                  placeholder="http://proxy1.example.com:8080&#10;http://proxy2.example.com:8080"
                  value={settings.proxyList}
                  onChange={(e) => queryClient.setQueryData(['appSettings'], { ...settings, proxyList: e.target.value })}
                  className="font-mono text-sm min-h-32 bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Keys (Optional - For Enhanced Results)
              </CardTitle>
              <CardDescription>
                Configure API keys for enhanced scanning capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-destructive/50 bg-destructive/10">
                <Shield className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive dark:text-red-400 font-bold">
                  CRITICAL WARNING: Client-Side Accessible API Key Storage
                </AlertTitle>
                <AlertDescription className="text-sm mt-2 text-destructive-foreground dark:text-red-300">
                  <p><strong>API keys are stored in your Supabase database, but are still accessible client-side.</strong> This means any Cross-Site Scripting (XSS) vulnerability or physical access to your browser could expose these keys.</p>
                  <p><strong>DO NOT store sensitive, paid, or production API keys here.</strong> This feature is intended for testing with non-critical keys only.</p>
                  <p>For production use, a secure backend for API key management is strongly recommended.</p>
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 gap-4">
                {/* Shodan */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shodan" className="text-base font-semibold">Shodan API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('shodan')}
                      <Button
                        onClick={() => handleTestAPIKey('shodan')}
                        disabled={isTestingAPI('shodan')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('shodan') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="shodan"
                    type="password"
                    placeholder="Enter Shodan API key"
                    value={apiKeys.shodan || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, shodan: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Enhanced port scanning, banner grabbing, and vulnerability detection</p>
                </div>

                {/* VirusTotal */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="virustotal" className="text-base font-semibold">VirusTotal API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('virustotal')}
                      <Button
                        onClick={() => handleTestAPIKey('virustotal')}
                        disabled={isTestingAPI('virustotal')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('virustotal') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="virustotal"
                    type="password"
                    placeholder="Enter VirusTotal API key"
                    value={apiKeys.virustotal || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, virustotal: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Domain reputation, malware scanning, and threat intelligence</p>
                </div>

                {/* SecurityTrails */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="securitytrails" className="text-base font-semibold">SecurityTrails API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('securitytrails')}
                      <Button
                        onClick={() => handleTestAPIKey('securitytrails')}
                        disabled={isTestingAPI('securitytrails')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('securitytrails') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="securitytrails"
                    type="password"
                    placeholder="Enter SecurityTrails API key"
                    value={apiKeys.securitytrails || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, securitytrails: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Historical DNS data, subdomain discovery, and WHOIS history</p>
                </div>

                {/* BuiltWith */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="builtwith" className="text-base font-semibold">BuiltWith API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('builtwith')}
                      <Button
                        onClick={() => handleTestAPIKey('builtwith')}
                        disabled={isTestingAPI('builtwith')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('builtwith') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="builtwith"
                    type="password"
                    placeholder="Enter BuiltWith API key"
                    value={apiKeys.builtwith || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, builtwith: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Technology stack detection, analytics, and framework identification</p>
                </div>

                {/* OpenCage */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="opencage" className="text-base font-semibold">OpenCage API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('opencage')}
                      <Button
                        onClick={() => handleTestAPIKey('opencage')}
                        disabled={isTestingAPI('opencage')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('opencage') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="opencage"
                    type="password"
                    placeholder="Enter OpenCage API key"
                    value={apiKeys.opencage || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, opencage: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Enhanced geocoding, reverse geocoding, and detailed location data</p>
                </div>

                {/* Hunter.io */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hunter" className="text-base font-semibold">Hunter.io API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('hunter')}
                      <Button
                        onClick={() => handleTestAPIKey('hunter')}
                        disabled={isTestingAPI('hunter')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('hunter') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="hunter"
                    type="password"
                    placeholder="Enter Hunter.io API key"
                    value={apiKeys.hunter || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, hunter: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Email discovery, domain search, and email verification</p>
                </div>

                {/* Clearbit */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="clearbit" className="text-base font-semibold">Clearbit API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('clearbit')}
                      <Button
                        onClick={() => handleTestAPIKey('clearbit')}
                        disabled={isTestingAPI('clearbit')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('clearbit') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="clearbit"
                    type="password"
                    placeholder="Enter Clearbit API key"
                    value={apiKeys.clearbit || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, clearbit: e.target.value as string })}
                    className="bg-background border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Company data enrichment, logo API, and business intelligence</p>
                </div>
              </div>
              
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveAllSettings}
            size="lg"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AppSettings;