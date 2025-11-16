import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Shield, Scale } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LegalDisclaimer = () => {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const hasAgreed = localStorage.getItem('abspider-legal-agreed');
    if (!hasAgreed) {
      setOpen(true);
    }
  }, []);

  const handleAgree = () => {
    if (agreed) {
      localStorage.setItem('abspider-legal-agreed', 'true');
      setOpen(false);
    }
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Scale className="h-6 w-6 text-red-500" />
            Legal Disclaimer & Terms of Use
          </CardTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Please read and accept these terms before using ABSpider
          </CardDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-600 dark:text-red-400 font-bold">
              IMPORTANT: AUTHORIZED USE ONLY
            </AlertTitle>
            <AlertDescription className="text-sm mt-2 text-red-500 dark:text-red-300">
              This tool is designed for security professionals, penetration testers, and website owners
              to test their OWN systems or systems they have EXPLICIT WRITTEN PERMISSION to test.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Authorized Use
              </h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>You may ONLY scan websites and systems you own or have explicit written authorization to test</li>
                <li>Unauthorized scanning may be illegal in your jurisdiction</li>
                <li>You are solely responsible for ensuring you have proper authorization</li>
                <li>Keep documentation of authorization for all scans performed</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold text-base mb-2 text-foreground">Legal Compliance</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Comply with all applicable laws including Computer Fraud and Abuse Act (CFAA), GDPR, and local regulations</li>
                <li>Unauthorized access to computer systems is a criminal offense in most jurisdictions</li>
                <li>Penalties may include fines, imprisonment, and civil liability</li>
                <li>This tool does not grant permission to scan any system</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold text-base mb-2 text-foreground">Disclaimer of Liability</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>This tool is provided "AS IS" without warranty of any kind</li>
                <li>The developers are not responsible for any misuse or damage caused by this tool</li>
                <li>You assume all risks associated with using this tool</li>
                <li>The developers are not liable for any legal consequences of your actions</li>
                <li>Results may contain false positives or false negatives</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold text-base mb-2 text-foreground">Ethical Use</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Use this tool responsibly and ethically</li>
                <li>Report vulnerabilities to website owners through responsible disclosure</li>
                <li>Do not exploit discovered vulnerabilities</li>
                <li>Respect privacy and data protection laws</li>
                <li>Do not use for malicious purposes or unauthorized access</li>
              </ul>
            </div>
          </div>

          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <AlertDescription className="text-sm text-yellow-500 dark:text-yellow-300">
              <strong>By using this tool, you acknowledge that:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You have read and understood this disclaimer</li>
                <li>You will only scan systems you are authorized to test</li>
                <li>You accept full responsibility for your actions</li>
                <li>You will comply with all applicable laws and regulations</li>
                <li>The developers are not liable for any consequences of your use</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2 mb-3 sm:mb-0">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label
              htmlFor="agree"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
            >
              I have read, understood, and agree to these terms
            </label>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 sm:flex-none border-border text-foreground hover:bg-muted/50"
            >
              Decline
            </Button>
            <Button
              onClick={handleAgree}
              disabled={!agreed}
              className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-primary/30"
            >
              Accept & Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalDisclaimer;