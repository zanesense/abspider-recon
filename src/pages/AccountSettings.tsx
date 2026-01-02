import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Shield, ArrowLeft, UserCircle, Zap, Save, KeyRound, CheckCircle, XCircle, Mail, Calendar, Activity, Trash2, Download, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/SupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import AppHeader from '@/components/AppHeader';
import { format, formatDistanceToNow } from 'date-fns';

const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [lastSignIn, setLastSignIn] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);
  const [loadingPasswordChange, setLoadingPasswordChange] = useState(false);
  const [loadingAvatarUpload, setLoadingAvatarUpload] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [scanNotifications, setScanNotifications] = useState(true);

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
          setBio(user.user_metadata.bio || '');
          setAvatarUrl(user.user_metadata.avatar_url || '');
          setRole(user.user_metadata.role || 'Security Analyst');
          setCreatedAt(user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A');
          setLastSignIn(user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : 'Never');
          setEmailNotifications(user.user_metadata.email_notifications !== false);
          setScanNotifications(user.user_metadata.scan_notifications !== false);

          // Get scan count
          const { data: scans } = await supabase
            .from('scans')
            .select('id')
            .eq('user_id', user.id);
          setScanCount(scans?.length || 0);
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
        data: { 
          first_name: firstName, 
          last_name: lastName,
          bio: bio,
          role: role,
          email_notifications: emailNotifications,
          scan_notifications: scanNotifications
        },
      });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Avatar image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setLoadingAvatarUpload(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Avatar Upload Failed",
        description: error.message || "Could not upload avatar.",
        variant: "destructive",
      });
    } finally {
      setLoadingAvatarUpload(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete user scans first
      const { error: scanError } = await supabase
        .from('scans')
        .delete()
        .eq('user_id', userId);

      if (scanError) throw scanError;

      // Note: Supabase doesn't allow direct user deletion from client
      // This would typically be handled by an admin function
      toast({
        title: "Account Deletion Requested",
        description: "Please contact support to complete account deletion.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      const { data: scans } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId);

      const userData = {
        profile: {
          email: userEmail,
          firstName,
          lastName,
          bio,
          role,
          createdAt,
          lastSignIn
        },
        scans: scans || [],
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `abspider-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
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

  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : firstName || userEmail?.split('@')[0] || 'User';

  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : userEmail?.charAt(0).toUpperCase() || 'U';

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
      <AppHeader 
        title="Account Settings" 
        subtitle="Manage your profile and security preferences"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          App Settings
        </Button>
      </AppHeader>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Overview */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                    disabled={loadingAvatarUpload}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {loadingAvatarUpload ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {userEmail}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      <Activity className="h-3 w-3 mr-1" />
                      {role}
                    </Badge>
                    <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                      <Shield className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{scanCount}</div>
                    <div className="text-xs text-muted-foreground">Total Scans</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member since
                  </span>
                  <span className="font-medium">{createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Last active
                  </span>
                  <span className="font-medium">{lastSignIn}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-emerald-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
              
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Security Analyst, Penetration Tester"
                  className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="bg-muted/30 border-border focus:border-primary focus:ring-primary min-h-[100px]"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive scan updates via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="scan-notifications">Scan Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified when scans complete</p>
                    </div>
                    <Switch
                      id="scan-notifications"
                      checked={scanNotifications}
                      onCheckedChange={setScanNotifications}
                    />
                  </div>
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
          <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-amber-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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

          {/* Data Management */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/5 via-emerald-500/10 to-green-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export your data or manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground">Download all your scan data and profile information</p>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Coming Soon */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-indigo-500/10 to-blue-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
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