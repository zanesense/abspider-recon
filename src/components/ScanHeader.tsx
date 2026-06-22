import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Upload, 
  History, 
  Settings, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Brain,
  Shield,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';

interface ScanHeaderProps {
  isScanning: boolean;
  onSave?: () => void;
  onLoad?: () => void;
  onSmartScan?: (mode: 'adaptive' | 'conservative' | 'aggressive') => void;
  selectedModules?: number;
  totalModules?: number;
  smartScanMode?: 'adaptive' | 'conservative' | 'aggressive';
  onSmartScanModeChange?: (mode: 'adaptive' | 'conservative' | 'aggressive') => void;
}

const ScanHeader: React.FC<ScanHeaderProps> = ({
  isScanning,
  onSave,
  onLoad,
  onSmartScan,
  selectedModules = 0,
  totalModules = 0,
  smartScanMode = 'adaptive',
  onSmartScanModeChange
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleSaveTemplate = () => {
    onSave?.();
    toast({
      title: "Template Saved",
      description: "Scan configuration saved successfully.",
    });
  };

  const handleLoadTemplate = () => {
    onLoad?.();
    toast({
      title: "Template Loaded",
      description: "Scan configuration loaded successfully.",
    });
  };

  const handleSmartScan = (mode: 'adaptive' | 'conservative' | 'aggressive') => {
    onSmartScan?.(mode);
    toast({
      title: "Smart Scan Started",
      description: `Initiating ${mode} scan with intelligent payload management.`,
    });
  };

  const getModuleStatus = () => {
    if (selectedModules === 0) return { color: 'text-muted-foreground', icon: AlertTriangle };
    if (selectedModules < totalModules / 2) return { color: 'text-yellow-600', icon: Info };
    return { color: 'text-green-600', icon: CheckCircle };
  };

  const getSmartScanModeInfo = (mode: 'adaptive' | 'conservative' | 'aggressive') => {
    switch (mode) {
      case 'conservative':
        return {
          icon: Shield,
          color: 'text-blue-600',
          description: 'Minimal payloads, longer delays, stealth-focused'
        };
      case 'adaptive':
        return {
          icon: Brain,
          color: 'text-green-600',
          description: 'AI-powered payload adjustment based on response'
        };
      case 'aggressive':
        return {
          icon: Zap,
          color: 'text-orange-600',
          description: 'Maximum payloads, faster scanning, comprehensive'
        };
    }
  };

  const moduleStatus = getModuleStatus();
  const StatusIcon = moduleStatus.icon;
  const smartModeInfo = getSmartScanModeInfo(smartScanMode);
  const SmartModeIcon = smartModeInfo.icon;

  return (
    <AppHeader 
      title="New Scan" 
      subtitle="Configure and launch intelligent security reconnaissance"
    >
      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
        {/* Module Status */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/30 rounded-md border border-border/50">
          <StatusIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${moduleStatus.color}`} />
          <span className="font-medium">{selectedModules}/{totalModules}</span>
          <span className="text-muted-foreground hidden sm:inline">modules</span>
        </div>

        {/* Smart Scan Mode Selector */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md border border-border/50">
          <SmartModeIcon className={`h-3.5 w-3.5 ${smartModeInfo.color}`} />
          <Select
            value={smartScanMode}
            onValueChange={onSmartScanModeChange}
          >
            <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="adaptive">Adaptive</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <Popover open={showQuickActions} onOpenChange={setShowQuickActions}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Template Management</h4>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveTemplate}
                    className="w-full justify-start gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Template
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadTemplate}
                    className="w-full justify-start gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Load Template
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm mb-2">Smart Scan Modes</h4>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSmartScan('conservative')}
                    className="w-full justify-start gap-2"
                    disabled={isScanning}
                  >
                    <Shield className="h-4 w-4" />
                    Conservative
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSmartScan('adaptive')}
                    className="w-full justify-start gap-2"
                    disabled={isScanning}
                  >
                    <Brain className="h-4 w-4" />
                    Adaptive
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSmartScan('aggressive')}
                    className="w-full justify-start gap-2"
                    disabled={isScanning}
                  >
                    <Zap className="h-4 w-4" />
                    Aggressive
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/all-scans')}
                className="w-full justify-start gap-2"
              >
                <History className="h-4 w-4" />
                Recent Scans
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Main Action Button */}
        <Button 
          className="bg-gradient-to-r from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-primary-foreground gap-2"
          disabled={isScanning || selectedModules === 0}
        >
          {isScanning ? (
            <>
              <Timer className="h-4 w-4" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Start Scan
            </>
          )}
        </Button>

        {/* Dashboard Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="gap-1 sm:gap-2"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </div>
    </AppHeader>
  );
};

export default ScanHeader;