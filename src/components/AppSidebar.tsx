import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import { Shield, Home, Scan, Settings, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const menuItems = [
    { title: 'Dashboard', icon: Home, href: '/' },
    { title: 'New Scan', icon: Scan, href: '/new-scan' },
    { title: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              ABSpider
            </h1>
            <p className="text-xs text-muted-foreground">Recon Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link to={item.href} className="flex items-center gap-3 transition-all hover:translate-x-1">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
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
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border p-4">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
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