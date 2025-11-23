import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Code, FileWarning, Info } from 'lucide-react';
import React from 'react';

interface PayloadCountDisplayProps {
  maxSqli: number;
  maxXss: number;
  maxLfi: number;
}

const PayloadCountDisplay: React.FC<PayloadCountDisplayProps> = ({ maxSqli, maxXss, maxLfi }) => {
  return (
    <Card className="bg-muted/30 border-border shadow-inner">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Available Payloads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <Database className="h-5 w-5 text-red-500 mx-auto" />
            <p className="text-xs text-muted-foreground">SQLi</p>
            <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 font-bold text-sm">
              {maxSqli}
            </Badge>
          </div>
          <div className="space-y-1">
            <Code className="h-5 w-5 text-orange-500 mx-auto" />
            <p className="text-xs text-muted-foreground">XSS</p>
            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 font-bold text-sm">
              {maxXss}
            </Badge>
          </div>
          <div className="space-y-1">
            <FileWarning className="h-5 w-5 text-yellow-500 mx-auto" />
            <p className="text-xs text-muted-foreground">LFI</p>
            <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 font-bold text-sm">
              {maxLfi}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayloadCountDisplay;