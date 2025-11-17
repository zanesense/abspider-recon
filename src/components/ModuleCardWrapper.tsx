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
  iconColorClass = 'text-primary',
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
    <Card className={cn("bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("h-5 w-5", iconColorClass)} />
            {title}
          </CardTitle>
          {headerActions}
        </div>
        {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading {title}...</p>
          </div>
        ) : moduleError ? (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-destructive dark:text-red-400">Error during {title} scan</AlertTitle>
            <AlertDescription className="text-sm mt-2 text-destructive-foreground dark:text-red-300">
              {moduleError}
            </AlertDescription>
          </Alert>
        ) : !hasData ? (
          <Alert className="bg-muted/10 border-border">
            <Info className="h-4 w-4 text-muted-foreground" />
            <AlertTitle className="text-foreground">No {title} data</AlertTitle>
            <AlertDescription className="text-sm mt-2 text-muted-foreground">
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