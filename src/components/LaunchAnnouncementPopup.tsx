import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Rocket, Star, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const LaunchAnnouncementPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen this announcement
    const hasSeenAnnouncement = localStorage.getItem('abspider-launch-announcement-seen');
    
    if (!hasSeenAnnouncement) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('abspider-launch-announcement-seen', 'true');
  };

  const handleVisitGitHub = () => {
    window.open('https://github.com/zanesense/netprobe', '_blank');
    handleClose();
  };

  const handleRemindLater = () => {
    setIsOpen(false);
    // Don't set the localStorage flag, so it shows again next time
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-2 right-2 text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">🚀 NetProbe is Live!</CardTitle>
                <p className="text-blue-100 text-sm mt-1">
                  Exciting news from the ABSpider team
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  New Release
                </Badge>
                <Badge variant="outline">Open Source</Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  Introducing NetProbe - Advanced Network Reconnaissance
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We're excited to announce the launch of <strong>NetProbe</strong>, our latest open-source 
                  network reconnaissance tool. Built with the same expertise behind ABSpider, NetProbe 
                  offers advanced network scanning and analysis capabilities.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <h4 className="font-medium text-sm">✨ Key Features:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                  <li>• Advanced port scanning and service detection</li>
                  <li>• Network topology mapping</li>
                  <li>• Vulnerability assessment integration</li>
                  <li>• Real-time monitoring capabilities</li>
                  <li>• Export reports in multiple formats</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={handleVisitGitHub}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRemindLater}
                    className="flex-1"
                  >
                    Remind me later
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Don't show again
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default LaunchAnnouncementPopup;