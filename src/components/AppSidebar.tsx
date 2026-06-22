import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { Home, Scan, Settings, Sun, Moon, History, LogIn, FileText, Bug } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/SupabaseClient';
import { useToast } from '@/hooks/use-toast';
import ProfileCardPopover from './ProfileCardPopover';
import { getScanHistory } from '@/services/scanService';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);

  // Fetch scan data for stats
  const { data: scans = [] } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && _event === 'SIGNED_OUT') {
          navigate('/login');
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
    { title: 'Reports', icon: FileText, href: '/reports' },
    { title: 'App Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Bug className="text-primary-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              ABSpider
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">Recon Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-4 py-2">Navigation</SidebarGroupLabel>
          <SidebarMenu className="px-3 space-y-0.5">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                               transition-colors duration-150
                               text-muted-foreground hover:text-foreground hover:bg-muted/30
                               data-[active=true]:text-primary data-[active=true]:bg-primary/10"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-4 py-2">Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-1 space-y-0">
              {[
                { label: 'Online', value: 'Active', color: 'text-green-500' },
                { label: 'Active Scans', value: scans.filter(s => s.status === 'running').length, color: 'text-primary' },
                { label: 'Total Scans', value: scans.length, color: 'text-foreground' },
                { label: 'Completed', value: scans.filter(s => s.status === 'completed').length, color: 'text-green-500' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 px-1 rounded-md transition-colors duration-150 hover:bg-muted/20"
                >
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={`text-xs font-semibold ${row.color}`}>
                    {row.value}
                  </span>
                </div>
              ))}
              {scans.length > 0 && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Success Rate</span>
                    <span className="text-xs font-semibold text-green-500">
                      {Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${scans.length > 0 ? Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 space-y-1">
        <ProfileCardPopover />
        {!session && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-9 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <Link to="/login">
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </Link>
          </Button>
        )}
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-3.5 w-3.5" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5" />
              <span>Light Mode</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}