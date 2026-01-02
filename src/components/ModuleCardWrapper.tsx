import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCardWrapperProps {
  title: string;
  icon: React.ElementType;
  iconColorClass?: string;
  description?: string;
  isLoading?: boolean;
  moduleError?: string;
  noDataMessage?: string;
  children: React.ReactNode;
  hasData: boolean; // New prop to indicate if children contain actual data
  className?: string;
  headerActions?: React.ReactNode; // For things like CORSBypassIndicator
}

const ModuleCardWrapper: React.FC<ModuleCardWrapperProps> = ({
  title,
  icon: Icon,
  iconColorClass = 'text-blue-600 dark:text-blue-400',
  description,
  isLoading = false,
  moduleError,
  noDataMessage,
  children,
  hasData,
  className,
  headerActions,
}) => {
  return (
    <Card className={cn("group relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Icon className={cn("h-5 w-5", iconColorClass)} />
            </div>
            <span className="font-semibold">{title}</span>
          </CardTitle>
          {headerActions}
        </div>
        {description && <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="ml-4 text-slate-600 dark:text-slate-400">Loading {title}...</p>
          </div>
        ) : moduleError ? (
          <Alert className="border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-700 dark:text-red-300">Error during {title} scan</AlertTitle>
            <AlertDescription className="text-sm mt-2 text-red-600 dark:text-red-400">
              {moduleError}
            </AlertDescription>
          </Alert>
        ) : !hasData ? (
          <Alert className="border-slate-200/30 bg-slate-50/10 dark:border-slate-700/30 dark:bg-slate-800/10">
            <Info className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <AlertTitle className="text-slate-700 dark:text-slate-300">No {title} data</AlertTitle>
            <AlertDescription className="text-sm mt-2 text-slate-600 dark:text-slate-400">
              {noDataMessage || `No relevant ${title.toLowerCase()} information found.`}
            </AlertDescription>
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCardWrapper;