import React, { useState, useEffect } from 'react';
import { supabase } from '@/SupabaseClient';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, CheckCircle, XCircle, AlertCircle, KeyRound, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorAuthEnrollProps {
  onEnrollSuccess?: () => void;
}

const TwoFactorAuthEnroll: React.FC<TwoFactorAuthEnrollProps> = ({ onEnrollSuccess }) => {
  const [loading, setLoading] = useState(true); // Set to true initially to load factors
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [isDeletingAllFactors, setIsDeletingAllFactors] = useState(false); // New state for deleting all
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAndEnrollFactor = async () => {
    setLoading(true);
    setEnrollmentError(null);
    try {
      // First, check if 2FA is already enabled
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error('Error listing MFA factors:', listError);
        throw new Error(`Failed to check existing 2FA factors: ${listError.message}`);
      }

      const existingTotpFactors = data?.totp || [];
      const existingWebauthnFactors = data?.webauthn || [];
      const allExistingFactors = [...existingTotpFactors, ...existingWebauthnFactors];

      console.log('Existing MFA factors:', allExistingFactors);

      if (allExistingFactors.length > 0) {
        toast({
          title: "2FA Already Enabled",
          description: "You already have Two-Factor Authentication set up. Redirecting to settings.",
          variant: "default",
        });
        navigate('/settings');
        return; // IMPORTANT: Return here to stop further execution
      }

      // If no existing factors, proceed with enrollment
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'ABSpider Recon',
        friendlyName: 'ABSpider Authenticator', // Provide a unique friendly name
      });

      if (enrollError) throw enrollError;

      setSecret(enrollData.totp.secret);
      setQrCodeUrl(enrollData.totp.qrCode);
      setFactorId(enrollData.id);
      toast({
        title: "2FA Enrollment Started",
        description: "Scan the QR code with your authenticator app.",
      });
    } catch (error: any) {
      console.error('2FA Enrollment Error:', error);
      setEnrollmentError(error.message || 'Failed to enroll 2FA factor.');
      toast({
        title: "2FA Enrollment Failed",
        description: error.message || "Could not start 2FA enrollment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAndEnrollFactor();
  }, [navigate, toast]);

  const handleVerifyEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !otpCode) {
      setEnrollmentError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setEnrollmentError(null);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: otpCode,
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "2FA Enabled Successfully",
          description: "Your account is now protected with 2FA.",
        });
        onEnrollSuccess?.(); // Call callback if provided
        navigate('/settings'); // Redirect to settings or dashboard
      } else {
        setEnrollmentError('Verification failed. Please try again.');
        toast({
          title: "2FA Verification Failed",
          description: "The code was incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('2FA Verification Error:', error);
      setEnrollmentError(error.message || 'Failed to verify 2FA enrollment.');
      toast({
          title: "2FA Verification Failed",
          description: error.message || "Could not verify 2FA enrollment.",
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllFactors = async () => {
    setIsDeletingAllFactors(true);
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const allFactorsToDelete = [...(data?.totp || []), ...(data?.webauthn || [])];
      
      if (allFactorsToDelete.length === 0) {
        toast({
          title: "No 2FA Factors Found",
          description: "There are no 2FA factors to delete for this account.",
          variant: "default",
        });
        return;
      }

      const unenrollPromises = allFactorsToDelete.map(async (factor) => {
        try {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (unenrollError) throw unenrollError;
          toast({
            title: "Factor Deleted",
            description: `Successfully deleted 2FA factor: ${factor.friendly_name || factor.id}`,
            variant: "default",
          });
        } catch (unenrollError: any) {
          toast({
            title: "Deletion Failed",
            description: `Failed to delete factor ${factor.friendly_name || factor.id}: ${unenrollError.message}`,
            variant: "destructive",
          });
        }
      });

      await Promise.allSettled(unenrollPromises);
      toast({
        title: "All Factors Processed",
        description: "Attempted to delete all 2FA factors. Refreshing...",
        variant: "default",
      });
      window.location.reload(); // Reload to re-evaluate 2FA status
    } catch (error: any) {
      console.error('Error deleting all factors:', error);
      toast({
        title: "Error Deleting Factors",
        description: error.message || "An unexpected error occurred while deleting factors.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAllFactors(false);
    }
  };

  if (loading) { // Show loading state while checking for existing factors or enrolling
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading 2FA enrollment...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans px-4">
      <Card className="w-full max-w-lg border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <KeyRound className="w-7 h-7 text-primary" />
            Enable Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Protect your account with an extra layer of security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {enrollmentError && (
            <div className="p-4 rounded-lg flex items-center gap-3 bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 border">
              <XCircle className="h-5 w-5" />
              <p className="text-sm">{enrollmentError}</p>
            </div>
          )}

          {secret && qrCodeUrl ? (
            <>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy).
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg shadow-inner">
                  <QRCodeSVG value={qrCodeUrl} size={200} level="H" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Alternatively, enter the secret key manually: <code className="font-mono text-foreground bg-muted px-2 py-1 rounded">{secret}</code>
                </p>
              </div>

              <form onSubmit={handleVerifyEnrollment} className="space-y-4">
                <Label htmlFor="otp-code" className="text-foreground text-center block">
                  Enter the 6-digit code from your authenticator app to verify:
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => setOtpCode(value)}
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} {...slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify & Enable 2FA
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="p-4 rounded-lg flex items-center gap-3 bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 border">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Failed to load 2FA enrollment details. Please try again.</p>
            </div>
          )}

          {enrollmentError && ( // Show delete button only if there's an enrollment error
            <Button
              onClick={handleDeleteAllFactors}
              disabled={isDeletingAllFactors}
              variant="destructive"
              className="w-full mt-4"
            >
              {isDeletingAllFactors ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting All Factors...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All 2FA Factors
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorAuthEnroll;