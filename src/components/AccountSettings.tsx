import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2, Shield, Trash2, ArrowLeft, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/SupabaseClient';
import { useNavigate } from 'react-router-dom';

const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
          setUserId(user.id);
        }
      } catch (error: any) {
        console.error('Failed to fetch user info:', error.message);
        toast({
          title: "Account Error",
          description: "Failed to load user information.",
          variant: "destructive",
        });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  if (loadingUser) {
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
          <p className="text-sm text-muted-foreground mt-1">Manage your user profile</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Profile Info */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
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
                  <p className="text-sm text-muted-foreground">User ID: {userId ? `${userId.substring(0, 8)}...` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-blue-500/10 border-blue-500/50">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            <AlertTitle className="text-blue-600 dark:text-blue-400">2FA Disabled</AlertTitle>
            <AlertDescription className="text-sm text-blue-600 dark:text-blue-300">
              Two-Factor Authentication is currently disabled.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;