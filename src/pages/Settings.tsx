import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, TestTube, Key, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSettings, saveSettings, testDiscordWebhook } from '@/services/settingsService';
import { getAPIKeys, saveAPIKeys, hasAPIKey } from '@/services/apiKeyService';

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(getSettings());
  const [apiKeys, setApiKeys] = useState(getAPIKeys());
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({});

  const handleSaveSettings = () => {
    try {
      saveSettings(settings);
      saveAPIKeys(apiKeys);
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      });
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

    setIsTesting(true);
    
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
      setIsTesting(false);
    }
  };

  const testAPIKey = async (service: string, key: string) => {
    setTestResults(prev => ({ ...prev, [service]: 'testing' }));
    
    try {
      let testUrl = '';
      
      switch (service) {
        case 'shodan':
          testUrl = `https://api.shodan.io/api-info?key=${key}`;
          break;
        case 'virustotal':
          testUrl = `https://www.virustotal.com/api/v3/users/${key}`;
          break;
        default:
          throw new Error('API test not implemented for this service');
      }

      const response = await fetch(testUrl);
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [service]: 'success' }));
        toast({
          title: "API Key Valid",
          description: `${service} API key is working correctly`,
        });
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [service]: 'error' }));
      toast({
        title: "API Key Invalid",
        description: `${service} API key test failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (service: string) => {
    const status = testResults[service];
    if (status === 'testing') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    if (hasAPIKey(service as any)) return <CheckCircle className="h-4 w-4 text-gray-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4 shadow-sm">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">Configure scanning preferences and API keys</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* General Settings */}
          <Card className="border-primary/20 shadow-lg">
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
                    max="20"
                    value={settings.defaultThreads}
                    onChange={(e) => setSettings({ ...settings, defaultThreads: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Concurrent scanning threads (1-20)</p>
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
                  />
                  <p className="text-xs text-muted-foreground">Maximum wait time for requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discord Webhook */}
          <Card className="border-primary/20 shadow-lg">
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
                />
              </div>
              <Button
                onClick={handleTestWebhook}
                disabled={isTesting}
                variant="outline"
              >
                {isTesting ? (
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
          <Card className="border-primary/20 shadow-lg">
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
                  onChange={(e) => setSettings({ ...settings, proxyList: e.target.value })}
                  className="font-mono text-sm min-h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Keys (Optional)
              </CardTitle>
              <CardDescription>
                Configure API keys for enhanced scanning capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Shodan */}
                <div className="space-y-2 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shodan" className="text-base font-semibold">Shodan API Key</Label>
                    {getStatusIcon('shodan')}
                  </div>
                  <Input
                    id="shodan"
                    type="password"
                    placeholder="Enter Shodan API key"
                    value={apiKeys.shodan || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, shodan: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Enhanced port scanning and banner grabbing</p>
                    {apiKeys.shodan && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testAPIKey('shodan', apiKeys.shodan!)}
                        disabled={testResults.shodan === 'testing'}
                      >
                        Test
                      </Button>
                    )}
                  </div>
                </div>

                {/* VirusTotal */}
                <div className="space-y-2 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="virustotal" className="text-base font-semibold">VirusTotal API Key</Label>
                    {getStatusIcon('virustotal')}
                  </div>
                  <Input
                    id="virustotal"
                    type="password"
                    placeholder="Enter VirusTotal API key"
                    value={apiKeys.virustotal || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, virustotal: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Domain reputation and malware scanning</p>
                    {apiKeys.virustotal && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testAPIKey('virustotal', apiKeys.virustotal!)}
                        disabled={testResults.virustotal === 'testing'}
                      >
                        Test
                      </Button>
                    )}
                  </div>
                </div>

                {/* SecurityTrails */}
                <div className="space-y-2 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="securitytrails" className="text-base font-semibold">SecurityTrails API Key</Label>
                    {getStatusIcon('securitytrails')}
                  </div>
                  <Input
                    id="securitytrails"
                    type="password"
                    placeholder="Enter SecurityTrails API key"
                    value={apiKeys.securitytrails || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, securitytrails: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Historical DNS data and subdomain discovery</p>
                </div>

                {/* BuiltWith */}
                <div className="space-y-2 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="builtwith" className="text-base font-semibold">BuiltWith API Key</Label>
                    {getStatusIcon('builtwith')}
                  </div>
                  <Input
                    id="builtwith"
                    type="password"
                    placeholder="Enter BuiltWith API key"
                    value={apiKeys.builtwith || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, builtwith: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Technology stack detection and analytics</p>
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