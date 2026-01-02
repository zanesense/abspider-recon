import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/SupabaseClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleUser, LogOut, Settings, Loader2, Mail, Calendar, Shield, KeyRound, ChevronDown, User, Activity, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarUrl?: string;
  createdAt: string;
  lastSignInAt: string;
  role: string;
  scanCount: number;
}

const ProfileCardPopover = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const firstName = user.user_metadata.first_name || '';
          const lastName = user.user_metadata.last_name || '';
          const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';

          // Get scan count from scans table
          const { data: scans, error: scanError } = await supabase
            .from('scans')
            .select('id')
            .eq('user_id', user.id);

          const scanCount = scans?.length || 0;

          setUserProfile({
            id: user.id,
            email: user.email || 'N/A',
            firstName,
            lastName,
            initials,
            avatarUrl: user.user_metadata.avatar_url,
            createdAt: user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A',
            lastSignInAt: user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : 'Never',
            role: user.user_metadata.role || 'Security Analyst',
            scanCount,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Logout Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingLogout(false);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Button>
    );
  }

  if (!userProfile) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/login">
          <LogOut className="h-4 w-4 mr-2" /> Login
        </Link>
      </Button>
    );
  }

  const displayName = userProfile.firstName && userProfile.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}` 
    : userProfile.firstName || userProfile.email.split('@')[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-3 flex items-center justify-between rounded-lg border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                {userProfile.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate w-full text-left">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate w-full text-left flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {userProfile.role}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0 bg-card border-border shadow-2xl" align="end">
        <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
          <DropdownMenuLabel className="flex flex-col space-y-3 p-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xl">
                  {userProfile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" />
                  {userProfile.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    <User className="h-3 w-3 mr-1" />
                    {userProfile.role}
                  </Badge>
                  <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                    <Shield className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{userProfile.scanCount}</div>
              <div className="text-xs text-muted-foreground">Total Scans</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Active</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> 
                Member since
              </span>
              <span className="text-foreground font-medium">{userProfile.createdAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> 
                Last active
              </span>
              <span className="text-foreground font-medium">{userProfile.lastSignInAt}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <DropdownMenuItem asChild className="cursor-pointer p-0">
            <Link to="/account-settings" className="flex items-center w-full p-3 hover:bg-muted/50 rounded-md transition-colors">
              <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
              <span className="text-foreground font-medium">Account Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-0">
            <Button
              onClick={handleLogout}
              disabled={loadingLogout}
              variant="destructive"
              size="sm"
              className="w-full justify-start gap-3 h-12"
            >
              {loadingLogout ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>Sign Out</span>
            </Button>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileCardPopover;