import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bug } from 'lucide-react';
import CurrentDateTime from '@/components/CurrentDateTime';
import NotificationCenter from '@/components/NotificationCenter';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
          <Bug className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <CurrentDateTime className="hidden md:flex" />
        {children}
      </div>
    </header>
  );
};

export default AppHeader;