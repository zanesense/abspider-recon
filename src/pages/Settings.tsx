import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, TestTube, Key, CheckCircle, XCircle, AlertCircle, Loader2, Shield, QrCode, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSettings, saveSettings, testDiscordWebhook, isValidDiscordWebhookUrl } from '@/services/settingsService';
import { getAPIKeys, saveAPIKeys, APIKeys } from '@/services/apiKeyService'; // Import APIKeys interface
import {
  testShodanAPI,
  testVirusTotalAPI,
  testSecurityTrailsAPI,
  testBuiltWithAPI,
  testHunterAPI,
  testClearbitAPI,
  testOpenCageAPI,
} from '@/services/apiTestService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import react-query hooks
import { supabase } from '@/SupabaseClient';
import { Link } from 'react-router-dom';

type APIKeyService = keyof APIKeys; // Use keyof APIKeys for type safety

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(getSettings());
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [apiKeyTestStatus, setApiKeyTestStatus] = useState<Record<APIKeyService, 'success' | 'error' | 'testing' | undefined>>({});
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loadingMfa, setLoadingMfa] = useState(true);
  const [unenrollLoading, setUnenrollLoading] = useState(false);

  // Fetch API keys using react-query
  const { data: apiKeys = {}, isLoading: isLoadingApiKeys, isError: isErrorApiKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: getAPIKeys,
    // Removed staleTime: Infinity to allow real-time updates
  });

  // Mutation for saving API keys
  const saveApiKeysMutation = useMutation({
    mutationFn: saveAPIKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] }); // Invalidate to refetch updated keys
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save API keys",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const fetchMfaFactors = async () => {
      setLoadingMfa(true);
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        setMfaFactors(data.totp || []);
      } catch (error: any) {
        console.error('Failed to fetch MFA factors:', error.message);
        toast({
          title: "MFA Error",
          description: "Failed to load 2FA status.",
          variant: "destructive",
        });
      } finally {
        setLoadingMfa(false);
      }
    };
    fetchMfaFactors();
  }, []);

  const handleSaveSettings = () => {
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

      saveSettings(settings); // Save general settings to localStorage
      saveApiKeysMutation.mutate(apiKeys); // Save API keys to Supabase via mutation
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
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

  const handleUnenroll2FA = async (factorId: string) => {
    setUnenrollLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setMfaFactors(prev => prev.filter(f => f.id !== factorId));
      toast({
        title: "2FA Disabled",
        description: "Two-Factor Authentication has been successfully disabled.",
      });
    } catch (error: any) {
      console.error('Failed to unenroll 2FA factor:', error.message);
      toast({
        title: "2FA Unenrollment Failed",
        description: error.message || "Could not disable 2FA.",
        variant: "destructive",
      });
    } finally {
      setUnenrollLoading(false);
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

  if (isLoadingApiKeys || loadingMfa) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (isErrorApiKeys) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load API keys. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const is2FAEnabled = mfaFactors.length > 0;

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure scanning preferences and API keys</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 2FA Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {is2FAEnabled ? (
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <AlertTitle className="text-green-600 dark:text-green-400">2FA is Enabled</AlertTitle>
                  <AlertDescription className="text-sm text-green-600 dark:text-green-400">
                    Your account is protected with 2FA. You have {mfaFactors.length} active factor(s).
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <AlertTitle className="text-yellow-600 dark:text-yellow-400">2FA is Not Enabled</AlertTitle>
                  <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-300">
                    Enhance your account security by enabling Two-Factor Authentication.
                  </AlertDescription>
                </Alert>
              )}

              {is2FAEnabled ? (
                <div className="space-y-2">
                  {mfaFactors.map((factor) => (
                    <div key={factor.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{factor.friendly_name || `Authenticator App (${factor.id.substring(0, 4)}...)`}</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnenroll2FA(factor.id)}
                        disabled={unenrollLoading}
                      >
                        {unenrollLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="ml-2">Disable</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
                  <Link to="/enroll-2fa">
                    <QrCode className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
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
                    onChange={(e) => setSettings({ ...settings, defaultThreads: parseInt(e.target.value) })}
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
                    onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Maximum wait time for requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discord Webhook */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
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
                  onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
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
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle>Proxy Configuration</CardTitle>
              <CardDescription>
                Configure proxy servers for scanning (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <AlertTitle className="text-yellow-600 dark:text-yellow-400 font-bold">
                  WARNING: Public CORS Proxy Risks
                </AlertTitle>
                <AlertDescription className="text-sm mt-2 text-yellow-600 dark:text-yellow-300">
                  Using public CORS proxies can expose your target URLs, headers, and response content to the proxy operators.
                  For sensitive operations, consider setting up a self-hosted, trusted CORS proxy or using a direct fetch only mode.
                  The security and reliability of these third-party services are not guaranteed.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="proxyList">Proxy List</Label>
                <Textarea
                  id="proxyList"
                  placeholder="http://proxy1.example.com:8080&#10;http://proxy2.example.com:8080"
                  value={settings.proxyList}
                  onChange={(e) => setSettings({ ...settings, proxyList: e.target.value })}
                  className="font-mono text-sm min-h-32 bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
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
              
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  API keys are stored locally in your browser and never sent to external servers except the respective API providers
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveSettings}
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

export default Settings;