import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, TestTube, Key, CheckCircle, XCircle, AlertCircle, Loader2, Shield, Settings, Palette, Globe, Clock, Database, Zap, User, Bell, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSettings, saveSettings, testDiscordWebhook, isValidDiscordWebhookUrl, Settings as BaseSettings } from '@/services/settingsService';
import { getAPIKeys, saveAPIKeys, APIKeys } from '@/services/apiKeyService';
import {
  testShodanAPI,
  testVirusTotalAPI,
  testSecurityTrailsAPI,
  testBuiltWithAPI,
  testClearbitAPI,
  testOpenCageAPI,
  testHunterAPI,
} from '@/services/apiTestService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/SupabaseClient';
import AppHeader from '@/components/AppHeader';
import { getUserPreferences, saveUserPreferences, getDefaultPreferences, UserPreferences as DBUserPreferences } from '@/services/userPreferencesService';

interface ExtendedSettings {
  discordWebhook: string;
  proxyList: string;
  defaultThreads: number;
  timeout: number;
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSave: boolean;
  scanHistory: number;
  maxConcurrentScans: number;
  enableNotifications: boolean;
  enableSounds: boolean;
  defaultScanProfile: string;
  exportFormat: 'json' | 'csv' | 'pdf';
  retryAttempts: number;
  userAgent: string;
}

interface UserPreferences {
  id?: string;
  user_id: string;
  theme: string;
  language: string;
  auto_save: boolean;
  scan_history_limit: number;
  max_concurrent_scans: number;
  enable_notifications: boolean;
  enable_sounds: boolean;
  default_scan_profile: string;
  export_format: string;
  retry_attempts: number;
  user_agent: string;
  created_at?: string;
  updated_at?: string;
}

type APIKeyService = keyof APIKeys;

const AppSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [apiKeyTestStatus, setApiKeyTestStatus] = useState<Record<APIKeyService, 'success' | 'error' | 'testing' | undefined>>({} as Record<APIKeyService, 'success' | 'error' | 'testing' | undefined>);
  const [userPreferences, setUserPreferences] = useState<ExtendedSettings>({
    discordWebhook: '',
    proxyList: '',
    defaultThreads: 20,
    timeout: 30,
    theme: 'system',
    language: 'en',
    autoSave: true,
    scanHistory: 100,
    maxConcurrentScans: 3,
    enableNotifications: true,
    enableSounds: false,
    defaultScanProfile: 'balanced',
    exportFormat: 'json',
    retryAttempts: 3,
    userAgent: 'ABSpider/1.0 (Security Scanner)'
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadUserPreferences(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load user preferences from database
  const loadUserPreferences = async (userId: string) => {
    try {
      const data = await getUserPreferences(userId);
      
      if (data) {
        setUserPreferences(prev => ({
          ...prev,
          theme: data.theme,
          language: data.language,
          autoSave: data.auto_save,
          scanHistory: data.scan_history_limit,
          maxConcurrentScans: data.max_concurrent_scans,
          enableNotifications: data.enable_notifications,
          enableSounds: data.enable_sounds,
          defaultScanProfile: data.default_scan_profile,
          exportFormat: data.export_format,
          retryAttempts: data.retry_attempts,
          userAgent: data.user_agent
        }));
      }
    } catch (error: any) {
      console.error('Failed to load user preferences:', error);
    }
  };

  // Save user preferences to database
  const saveUserPreferencesHandler = async () => {
    if (!userId) return;

    try {
      const preferencesData: Omit<DBUserPreferences, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        theme: userPreferences.theme,
        language: userPreferences.language,
        auto_save: userPreferences.autoSave,
        scan_history_limit: userPreferences.scanHistory,
        max_concurrent_scans: userPreferences.maxConcurrentScans,
        enable_notifications: userPreferences.enableNotifications,
        enable_sounds: userPreferences.enableSounds,
        default_scan_profile: userPreferences.defaultScanProfile as 'quick' | 'balanced' | 'comprehensive' | 'stealth',
        export_format: userPreferences.exportFormat,
        retry_attempts: userPreferences.retryAttempts,
        user_agent: userPreferences.userAgent
      };

      await saveUserPreferences(preferencesData);

      toast({
        title: "Preferences Saved",
        description: "Your user preferences have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save user preferences.",
        variant: "destructive",
      });
    }
  };

  const handleResetPreferences = async () => {
    if (!confirm("Are you sure you want to reset all preferences to default values?")) {
      return;
    }

    setUserPreferences({
      discordWebhook: '',
      proxyList: '',
      defaultThreads: 20,
      timeout: 30,
      theme: 'system',
      language: 'en',
      autoSave: true,
      scanHistory: 100,
      maxConcurrentScans: 3,
      enableNotifications: true,
      enableSounds: false,
      defaultScanProfile: 'balanced',
      exportFormat: 'json',
      retryAttempts: 3,
      userAgent: 'ABSpider/1.0 (Security Scanner)'
    });

    await saveUserPreferencesHandler();
  };

  const handleExportSettings = () => {
    const settingsData = {
      userPreferences,
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
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.userPreferences) {
          setUserPreferences(prev => ({ ...prev, ...importedData.userPreferences }));
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
  };
  // Fetch general settings using react-query
  const { data: settings = userPreferences, isLoading: isLoadingSettings, isError: isErrorSettings } = useQuery<ExtendedSettings>({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const baseSettings = await getSettings();
      return { ...userPreferences, ...baseSettings };
    },
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
      if (userPreferences.discordWebhook && !isValidDiscordWebhookUrl(userPreferences.discordWebhook)) {
        toast({
          title: "Validation Error",
          description: "Invalid Discord webhook URL format. Please correct it before saving.",
          variant: "destructive",
        });
        return;
      }

      // Save general settings
      await saveSettingsMutation.mutateAsync({
        discordWebhook: userPreferences.discordWebhook,
        proxyList: userPreferences.proxyList,
        defaultThreads: userPreferences.defaultThreads,
        timeout: userPreferences.timeout
      } as BaseSettings);

      // Save API keys
      await saveApiKeysMutation.mutateAsync(apiKeys);

      // Save user preferences
      await saveUserPreferencesHandler();

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
    if (!userPreferences.discordWebhook) {
      toast({
        title: "Error",
        description: "Please enter a Discord webhook URL",
        variant: "destructive",
      });
      return;
    }

    // Validate the URL before testing
    if (!isValidDiscordWebhookUrl(userPreferences.discordWebhook)) {
      toast({
        title: "Validation Error",
        description: "Invalid Discord webhook URL format. Please correct it.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    
    try {
      await testDiscordWebhook(userPreferences.discordWebhook);
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
        case 'clearbit': result = await testClearbitAPI(key); break;
        case 'opencage': result = await testOpenCageAPI(key); break;
        case 'hunterio': result = await testHunterAPI(key); break; // Add Hunter.io test
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
      <AppHeader 
        title="App Settings" 
        subtitle="Configure application-wide preferences and integrations"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSettings}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-settings')?.click()}
            className="gap-2"
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
          <Link to="/account-settings">
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              Account
            </Button>
          </Link>
        </div>
      </AppHeader>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Preferences */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold">User Preferences</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                Customize your ABSpider experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={userPreferences.theme}
                      onValueChange={(value: 'light' | 'dark' | 'system') => 
                        setUserPreferences(prev => ({ ...prev, theme: value }))
                      }
                    >
                      <SelectTrigger className="bg-muted/30 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={userPreferences.language}
                      onValueChange={(value) => 
                        setUserPreferences(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger className="bg-muted/30 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultScanProfile">Default Scan Profile</Label>
                    <Select
                      value={userPreferences.defaultScanProfile}
                      onValueChange={(value) => 
                        setUserPreferences(prev => ({ ...prev, defaultScanProfile: value }))
                      }
                    >
                      <SelectTrigger className="bg-muted/30 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">Quick Scan</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="stealth">Stealth Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Default Export Format</Label>
                    <Select
                      value={userPreferences.exportFormat}
                      onValueChange={(value: 'json' | 'csv' | 'pdf') => 
                        setUserPreferences(prev => ({ ...prev, exportFormat: value }))
                      }
                    >
                      <SelectTrigger className="bg-muted/30 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scanHistory">Scan History Limit</Label>
                    <Input
                      id="scanHistory"
                      type="number"
                      min="10"
                      max="1000"
                      value={userPreferences.scanHistory}
                      onChange={(e) => setUserPreferences(prev => ({ 
                        ...prev, 
                        scanHistory: parseInt(e.target.value) || 100 
                      }))}
                      className="bg-muted/30 border-border focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of scans to keep in history</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentScans">Max Concurrent Scans</Label>
                    <Input
                      id="maxConcurrentScans"
                      type="number"
                      min="1"
                      max="10"
                      value={userPreferences.maxConcurrentScans}
                      onChange={(e) => setUserPreferences(prev => ({ 
                        ...prev, 
                        maxConcurrentScans: parseInt(e.target.value) || 3 
                      }))}
                      className="bg-muted/30 border-border focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of simultaneous scans</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      min="0"
                      max="10"
                      value={userPreferences.retryAttempts}
                      onChange={(e) => setUserPreferences(prev => ({ 
                        ...prev, 
                        retryAttempts: parseInt(e.target.value) || 3 
                      }))}
                      className="bg-muted/30 border-border focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Number of retry attempts for failed requests</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoSave">Auto-save Settings</Label>
                        <p className="text-xs text-muted-foreground">Automatically save changes</p>
                      </div>
                      <Switch
                        id="autoSave"
                        checked={userPreferences.autoSave}
                        onCheckedChange={(checked) => 
                          setUserPreferences(prev => ({ ...prev, autoSave: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableNotifications">Enable Notifications</Label>
                        <p className="text-xs text-muted-foreground">Show scan completion notifications</p>
                      </div>
                      <Switch
                        id="enableNotifications"
                        checked={userPreferences.enableNotifications}
                        onCheckedChange={(checked) => 
                          setUserPreferences(prev => ({ ...prev, enableNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableSounds">Enable Sounds</Label>
                        <p className="text-xs text-muted-foreground">Play notification sounds</p>
                      </div>
                      <Switch
                        id="enableSounds"
                        checked={userPreferences.enableSounds}
                        onCheckedChange={(checked) => 
                          setUserPreferences(prev => ({ ...prev, enableSounds: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="userAgent">Custom User Agent</Label>
                <Input
                  id="userAgent"
                  type="text"
                  value={userPreferences.userAgent}
                  onChange={(e) => setUserPreferences(prev => ({ 
                    ...prev, 
                    userAgent: e.target.value 
                  }))}
                  className="bg-muted/30 border-border focus:border-primary"
                  placeholder="ABSpider/1.0 (Security Scanner)"
                />
                <p className="text-xs text-muted-foreground">Custom user agent string for HTTP requests</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveUserPreferencesHandler}
                  variant="outline"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
                <Button
                  onClick={handleResetPreferences}
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-emerald-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-semibold">Scanning Configuration</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                Configure default scanning parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultThreads">Default Threads</Label>
                  <Input
                    id="defaultThreads"
                    type="number"
                    min="1"
                    max="50"
                    value={userPreferences.defaultThreads}
                    onChange={(e) => setUserPreferences(prev => ({ 
                      ...prev, 
                      defaultThreads: parseInt(e.target.value) || 20 
                    }))}
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
                    value={userPreferences.timeout}
                    onChange={(e) => setUserPreferences(prev => ({ 
                      ...prev, 
                      timeout: parseInt(e.target.value) || 30 
                    }))}
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Maximum wait time for requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discord Webhook */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-500/5 via-purple-500/10 to-indigo-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
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
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="discordWebhook">Webhook URL</Label>
                <Input
                  id="discordWebhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={userPreferences.discordWebhook}
                  onChange={(e) => setUserPreferences(prev => ({ 
                    ...prev, 
                    discordWebhook: e.target.value 
                  }))}
                  className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
                {userPreferences.discordWebhook && !isValidDiscordWebhookUrl(userPreferences.discordWebhook) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Invalid Discord webhook URL format.
                  </p>
                )}
              </div>
              <Button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || (userPreferences.discordWebhook && !isValidDiscordWebhookUrl(userPreferences.discordWebhook))}
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
          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-yellow-500/10 to-orange-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
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
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="proxyList">Proxy List</Label>
                <Textarea
                  id="proxyList"
                  placeholder="http://proxy1.example.com:8080&#10;http://proxy2.example.com:8080"
                  value={userPreferences.proxyList}
                  onChange={(e) => setUserPreferences(prev => ({ 
                    ...prev, 
                    proxyList: e.target.value 
                  }))}
                  className="font-mono text-sm min-h-32 bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-rose-500/5 via-red-500/10 to-pink-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
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
                    <Label htmlFor="hunterio" className="text-base font-semibold">Hunter.io API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('hunterio')}
                      <Button
                        onClick={() => handleTestAPIKey('hunterio')}
                        disabled={isTestingAPI('hunterio')}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted/50"
                      >
                        {isTestingAPI('hunterio') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="hunterio"
                    type="password"
                    placeholder="Enter Hunter.io API key"
                    value={apiKeys.hunterio || ''}
                    onChange={(e) => queryClient.setQueryData(['apiKeys'], { ...apiKeys, hunterio: e.target.value as string })}
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

          <div className="flex gap-2">
            <Button
              onClick={handleSaveAllSettings}
              size="lg"
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppSettings;