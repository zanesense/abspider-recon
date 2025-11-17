import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Shield, ArrowLeft, UserCircle, Zap, Save, KeyRound, CheckCircle, XCircle } from 'lucide-react'; // Added CheckCircle, XCircle
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/SupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);
  const [loadingPasswordChange, setLoadingPasswordChange] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false); // New state for real-time password match

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
          setUserId(user.id);
          setFirstName(user.user_metadata.first_name || '');
          setLastName(user.user_metadata.last_name || '');
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

  // Effect to update password match status in real-time
  useEffect(() => {
    setPasswordsMatch(newPassword === confirmPassword && newPassword.length > 0);
  }, [newPassword, confirmPassword]);

  const handleProfileUpdate = async () => {
    setLoadingProfileUpdate(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName },
      });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your first name and last name have been updated.",
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error.message);
      toast({
        title: "Profile Update Failed",
        description: error.message || "Could not update profile information.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfileUpdate(false);
    }
  };

  const handleChangePassword = async () => {
    // Client-side validations
    if (!currentPassword) {
      toast({
        title: "Password Error",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    if (currentPassword === newPassword) {
      toast({
        title: "Password Error",
        description: "New password cannot be the same as the current password.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPasswordChange(true);
    try {
      if (!userEmail) {
        throw new Error("User email not found. Please log in again.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect. Please try again.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password:', error.message);
      toast({
        title: "Password Change Failed",
        description: error.message || "Could not change password.",
        variant: "destructive",
      });
    } finally {
      setLoadingPasswordChange(false);
    }
  };

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
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <UserCircle className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{userEmail || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">User ID: {userId ? `${userId.substring(0, 8)}...` : 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
              <Button
                onClick={handleProfileUpdate}
                disabled={loadingProfileUpdate}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
              >
                {loadingProfileUpdate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-card/50 backdrop-blur-sm border border-orange-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-orange-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <KeyRound className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary pr-10" // Added pr-10 for icon
                  />
                  {confirmPassword.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {passwordsMatch ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={loadingPasswordChange || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/30"
              >
                {loadingPasswordChange ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 2FA Coming Soon */}
          <Card className="bg-card/50 backdrop-blur-sm border border-blue-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <AlertTitle className="text-blue-600 dark:text-blue-400">Coming Soon!</AlertTitle>
                <AlertDescription className="text-sm text-blue-600 dark:text-blue-300">
                  Two-Factor Authentication will be available in a future update to enhance your account security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;