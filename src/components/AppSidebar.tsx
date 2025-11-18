import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Scan, Settings, Activity, Sun, Moon, History, LogIn, LogOut, User, Loader2, CircleUser, Spider, FileText } from 'lucide-react'; // Changed Shield to Spider
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/SupabaseClient'; // Import supabase
import { useToast } from '@/hooks/use-toast'; // Import useToast

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const menuItems = [
    { title: 'Dashboard', icon: Home, href: '/dashboard' },
    { title: 'New Scan', icon: Scan, href: '/new-scan' },
    { title: 'All Scans', icon: History, href: '/all-scans' },
    { title: 'Reports', icon: FileText, href: '/reports' }, // New Reports tab
    { title: 'App Settings', icon: Settings, href: '/settings' }, // Updated text
  ];

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

  return (
    <Sidebar className="border-r border-border bg-sidebar shadow-xl">
      <SidebarHeader className="border-b border-border bg-sidebar-accent">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
            <Spider className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={28} /> {/* Changed icon to Spider */}
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> {/* Increased font size and weight */}
              ABSpider
            </h1>
            <p className="text-sm text-gray-400">Recon Dashboard</p> {/* Adjusted font size and color */}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                  <Link 
                    to={item.href} 
                    className="flex items-center gap-3 transition-all hover:translate-x-1 
                               hover:text-primary data-[active=true]:text-primary 
                               data-[active=true]:bg-primary/10 data-[active=true]:border-l-4 
                               data-[active=true]:border-primary data-[active=true]:font-semibold"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                  <span className="text-green-500 font-medium">Online</span>
                </div>
              </div >
            </div >
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border p-4 space-y-2">
        {session ? (
          <Link 
            to="/account-settings" 
            className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <CircleUser className="h-5 w-5 text-primary" /> {/* Default PFP */}
            <span className="truncate font-medium">{userEmail || 'Guest User'}</span>
          </Link>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-muted/30 hover:bg-muted/50 border-border text-foreground"
          >
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
          </Button>
        )}
        {session && (
          <Button
            onClick={handleLogout}
            disabled={loadingLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-muted/30 hover:bg-muted/50 border-border text-foreground"
          >
            {loadingLogout ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Logout</span>
          </Button>
        )}
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 bg-muted/30 hover:bg-muted/50 border-border text-foreground"
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}