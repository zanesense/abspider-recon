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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CircleUser, LogOut, Settings, Loader2, Mail, Calendar, Shield, KeyRound, ChevronDown } from 'lucide-react'; // Added ChevronDown
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  createdAt: string;
  lastSignInAt: string;
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

          setUserProfile({
            id: user.id,
            email: user.email || 'N/A',
            firstName,
            lastName,
            initials,
            createdAt: user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A',
            lastSignInAt: user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'PPP p') : 'N/A',
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

  const displayName = userProfile.firstName || userProfile.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-2 flex items-center justify-between rounded-lg border border-transparent hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            {userProfile.initials.length > 1 ? (
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                {userProfile.initials}
              </div>
            ) : (
              <CircleUser className="h-9 w-9 text-primary flex-shrink-0" />
            )}
            <div className="flex flex-col items-start overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate w-full text-left">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate w-full text-left">{userProfile.email}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4 bg-card border-border shadow-2xl" align="end">
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <div className="flex items-center gap-3">
            {userProfile.initials.length > 1 ? (
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {userProfile.initials}
              </div>
            ) : (
              <CircleUser className="h-10 w-10 text-primary" />
            )}
            <div>
              <p className="text-lg font-bold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {userProfile.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-green-500" /> Status</span>
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Authenticated</Badge>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Joined</span>
            <span className="text-foreground">{userProfile.createdAt}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Last Login</span>
            <span className="text-foreground text-xs">{userProfile.lastSignInAt}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem asChild className="cursor-pointer p-0">
          <Link to="/account-settings" className="flex items-center w-full p-2 hover:bg-muted/50 rounded-md">
            <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-foreground">Manage Account Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem className="p-0">
          <Button
            onClick={handleLogout}
            disabled={loadingLogout}
            variant="destructive"
            size="sm"
            className="w-full justify-start gap-2"
          >
            {loadingLogout ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Logout</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileCardPopover;