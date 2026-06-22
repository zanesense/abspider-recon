import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bug } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <header className="flex items-center sticky top-0 z-10 gap-2 sm:gap-4 bg-gradient-to-r from-primary/8 via-background to-primary/5 backdrop-blur-sm shadow-sm px-3 sm:px-6 py-2 sm:py-3">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <Bug className="h-5 w-5 text-primary/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground hidden sm:block truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  );
};

export default AppHeader;