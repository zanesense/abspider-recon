import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, TestTube, Key, CheckCircle, XCircle, AlertCircle, Loader2, Globe, User, Bell, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSettings, saveSettings, testDiscordWebhook, isValidDiscordWebhookUrl, Settings } from '@/services/settingsService';
import { getAPIKeys, saveAPIKeys, APIKeys } from '@/services/apiKeyService';
import {
  testShodanAPI,
  testVirusTotalAPI,
  testSecurityTrailsAPI,
  testBuiltWithAPI,
  testOpenCageAPI,
} from '@/services/apiTestService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { parseSettingsImport } from '@/services/settingsImportService';

type APIKeyService = 'shodan' | 'virustotal' | 'securitytrails' | 'builtwith' | 'opencage';
const DEFAULT_SETTINGS: Settings = { discordWebhook: '', proxyList: '' };
const AppSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [apiKeyTestStatus, setApiKeyTestStatus] = useState<Record<APIKeyService, 'success' | 'error' | 'testing' | undefined>>({} as Record<APIKeyService, 'success' | 'error' | 'testing' | undefined>);
  const handleExportSettings = () => {
    const settingsData = {
      settings,
      apiKeys,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abspider-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Your settings have been exported successfully.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = parseSettingsImport(e.target?.result as string);
        
        if (importedData.settings) {
          queryClient.setQueryData(['appSettings'], { ...settings, ...importedData.settings });
        }
        
        if (importedData.apiKeys) {
          queryClient.setQueryData(['apiKeys'], importedData.apiKeys);
        }

        toast({
          title: "Settings Imported",
          description: "Settings have been imported successfully. Don't forget to save!",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.currentTarget.value = '';
  };
  // Fetch general settings using react-query
  const { data: settings = DEFAULT_SETTINGS, isLoading: isLoadingSettings, isError: isErrorSettings } = useQuery<Settings>({
    queryKey: ['appSettings'],
    queryFn: getSettings,
  });

  // Mutation for saving general settings
  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
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

      // Save general settings
      await saveSettingsMutation.mutateAsync(settings);

      // Save API keys
      await saveApiKeysMutation.mutateAsync(apiKeys);

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
        description: `Please enter a ${String(service)} API key first.`,
        variant: "destructive",
      });
      return;
    }

    setApiKeyTestStatus(prev => ({ ...prev, [service]: 'testing' as const })); // Explicitly cast

    try {
      let result;
      switch (service) {
        case 'shodan': result = await testShodanAPI(key); break;
        case 'virustotal': result = await testVirusTotalAPI(key); break;
        case 'securitytrails': result = await testSecurityTrailsAPI(key); break;
        case 'builtwith': result = await testBuiltWithAPI(key); break;
        case 'opencage': result = await testOpenCageAPI(key); break;
        default: throw new Error('Unknown API service');
      }

      if (result.success) {
        setApiKeyTestStatus(prev => ({ ...prev, [service]: 'success' as const })); // Explicitly cast
        toast({
          title: `${String(service)} API Test Successful`,
          description: result.message || 'API key is valid.',
        });
      } else {
        setApiKeyTestStatus(prev => ({ ...prev, [service]: 'error' as const })); // Explicitly cast
        toast({
          title: `${String(service)} API Test Failed`,
          description: result.message || 'API key is invalid or an error occurred.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setApiKeyTestStatus(prev => ({ ...prev, [service]: 'error' as const })); // Explicitly cast
      toast({
        title: `${String(service)} API Test Failed`,
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
    if (apiKeys[service]) return <CheckCircle className="h-4 w-4 text-muted-foreground/70" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />;
  };

  const isTestingAPI = (service: APIKeyService) => apiKeyTestStatus[service] === 'testing';

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
      <AppHeader 
        title="App Settings" 
        subtitle="Configure application-wide preferences and integrations"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSettings}
            className="gap-2 bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-settings')?.click()}
            className="gap-2 bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportSettings}
          />
          <Button asChild variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Link to="/account-settings">
              <User className="h-4 w-4" />
              Account
            </Link>
          </Button>
        </div>
      </AppHeader>
      
      <main className="flex-1 overflow-auto p-4 sm:p-6 surface-main">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Discord Webhook */}
          <SurfaceCard color="violet">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-violet-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="font-semibold">Discord Webhook</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
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
                disabled={isTestingWebhook || Boolean(settings.discordWebhook && !isValidDiscordWebhookUrl(settings.discordWebhook))}
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
          </SurfaceCard>

          {/* Proxy Settings */}
          <SurfaceCard color="amber">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-semibold">Proxy Configuration</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
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
          </SurfaceCard>

          {/* API Keys */}
          <SurfaceCard color="rose">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-rose-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Key className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="font-semibold">API Keys (Optional - For Enhanced Results)</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                Configure API keys for enhanced scanning capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Shodan */}
                <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shodan" className="text-base font-semibold">Shodan API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('shodan')}
                      <Button
                        aria-label="Test Shodan API key"
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
                        aria-label="Test VirusTotal API key"
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
                        aria-label="Test SecurityTrails API key"
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
                        aria-label="Test BuiltWith API key"
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
                        aria-label="Test OpenCage API key"
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

              </div>
              
            </CardContent>
          </SurfaceCard>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveAllSettings}
              disabled={saveSettingsMutation.isPending || saveApiKeysMutation.isPending}
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-primary-foreground"
            >
              {saveSettingsMutation.isPending || saveApiKeysMutation.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Save className="h-4 w-4 mr-2" />}
              {saveSettingsMutation.isPending || saveApiKeysMutation.isPending ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppSettings;
