import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2, Shield, QrCode, Trash2, ArrowLeft, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/SupabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import TwoFactorAuthEnroll from '@/components/TwoFactorAuthEnroll'; // Re-import TwoFactorAuthEnroll

const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loadingMfa, setLoadingMfa] = useState(true);
  const [unenrollLoading, setUnenrollLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndMfaFactors = async () => {
      setLoadingMfa(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
        }

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
    fetchUserAndMfaFactors();
  }, []);

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

  const is2FAEnabled = mfaFactors.length > 0;

  if (loadingMfa) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
        <SidebarTrigger />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
          className="text-muted-foreground hover:text-primary hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to App Settings
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your user profile and security settings</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Profile Info */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                User Profile
              </CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <UserCircle className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{userEmail || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">User ID: {supabase.auth.getUser().then(res => res.data.user?.id.substring(0, 8) + '...') || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;