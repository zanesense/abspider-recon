import React, { useState, useEffect } from 'react';
import { supabase } from '@/SupabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, XCircle, AlertCircle } from 'lucide-react';

const TwoFactorAuthVerify: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { factorId, challengeId } = location.state || {};

  useEffect(() => {
    if (!factorId || !challengeId) {
      toast({
        title: "Authentication Error",
        description: "Missing 2FA challenge details. Please try logging in again.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [factorId, challengeId, navigate, toast]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setVerificationError('Please enter the 6-digit code.');
      setOtpCode(''); // Clear OTP on invalid input length
      return;
    }
    if (!factorId || !challengeId) {
      setVerificationError('Missing 2FA challenge details. Please try logging in again.');
      setOtpCode(''); // Clear OTP on missing challenge details
      return;
    }

    setLoading(true);
    setVerificationError(null);

    console.log('[2FA Verify] Attempting verification with:', {
      factorId,
      challengeId,
      otpCode,
    });

    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: otpCode,
      });

      if (error) {
        console.error('[2FA Verify] Supabase verification error:', error);
        throw error;
      }

      if (data.session) {
        toast({
          title: "2FA Verified",
          description: "You have successfully logged in.",
        });
        navigate('/dashboard');
      } else {
        console.warn('[2FA Verify] Verification failed, but no explicit error from Supabase. Data:', data);
        setVerificationError('Invalid 2FA code. Please try again.');
        setOtpCode(''); // Clear OTP on verification failure
        toast({
          title: "2FA Verification Failed",
          description: "The code was incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[2FA Verify] Caught error during verification:', error);
      setVerificationError(error.message || 'Failed to verify 2FA code.');
      setOtpCode(''); // Clear OTP on any caught error
      toast({
        title: "2FA Verification Failed",
        description: error.message || "Could not verify 2FA code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!factorId || !challengeId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="ml-4 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans px-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {verificationError && (
            <div className="p-4 rounded-lg flex items-center gap-3 bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 border">
              <XCircle className="h-5 w-5" />
              <p className="text-sm">{verificationError}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <Label htmlFor="otp-code" className="text-foreground text-center block">
              Authenticator Code:
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
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verify Code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorAuthVerify;