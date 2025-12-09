import { useState, useEffect } from "react";
import { supabase } from "../SupabaseClient";
import { Mail, Loader2, AlertCircle, CheckCircle, XCircle, Shield, UserPlus, Link, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Helper function to determine password strength
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length > 7) strength += 1; // Minimum length
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1; // Mixed case
  if (password.match(/\d/)) strength += 1; // Numbers
  if (password.match(/[^a-zA-Z0-9]/)) strength += 1; // Special characters

  switch (strength) {
    case 0: return { text: 'Very Weak', value: 0, color: 'bg-red-500' };
    case 1: return { text: 'Weak', value: 25, color: 'bg-orange-500' };
    case 2: return { text: 'Medium', value: 50, color: 'bg-yellow-500' };
    case 3: return { text: 'Strong', value: 75, color: 'bg-green-500' };
    case 4: return { text: 'Very Strong', value: 100, color: 'bg-green-600' };
    default: return { text: 'Very Weak', value: 0, color: 'bg-red-500' };
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentTab, setCurrentTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false); // New state for showing/hiding password
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType('info');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      if (data.session) {
        setMessage("Logged in successfully!");
        setMessageType('success');
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
        });
        navigate('/dashboard');
      } else {
        setMessage("An unexpected authentication state occurred.");
        setMessageType('error');
        toast({
          title: "Login Error",
          description: "An unexpected authentication state occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType('info');

    // Client-side validation for strong password and matching
    if (password.length < 8 || passwordStrength.value < 75) { // Enforce minimum length and 'Strong' strength
      setMessage("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.");
      setMessageType('error');
      toast({
        title: "Sign Up Error",
        description: "Password is not strong enough.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType('error');
      toast({
        title: "Sign Up Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        setMessage("Signed up and logged in successfully!");
        setMessageType('success');
        toast({
          title: "Sign Up Successful",
          description: "You have been successfully signed up and logged in.",
        });
        navigate('/dashboard');
      } else {
        setMessage("Please check your email to confirm your account before logging in.");
        setMessageType('info');
        toast({
          title: "Sign Up Successful",
          description: "Please check your email to confirm your account before logging in.",
        });
        setCurrentTab("login"); // Switch to login tab after signup
      }
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType('info');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setMessage("Magic link sent! Check your email to log in.");
      setMessageType('success');
      toast({
        title: "Magic Link Sent",
        description: "Check your email for the login link.",
      });
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      toast({
          title: "Magic Link Error",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setMessage(null);
    setMessageType('info');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });
      if (error) throw error;
      setMessage("Password reset email sent. Check your inbox!");
      setMessageType('success');
      toast({
        title: "Password Reset",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      toast({
          title: "Password Reset Error",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans px-4">
      <Card className="w-full max-w-md border-border shadow-xl dark:shadow-lg dark:shadow-primary/20 dark:bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            <Shield className="w-7 h-7 text-primary" />
            ABSpider Auth
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50 border border-border">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                <Mail className="mr-2 h-4 w-4" /> Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </TabsTrigger>
              <TabsTrigger value="magic-link" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                <Link className="mr-2 h-4 w-4" /> Magic Link
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="text-foreground">Email Address</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="your@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-border focus:border-primary focus:ring-primary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-foreground">Email Address</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="your@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-border focus:border-primary focus:ring-primary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Strength: <span className={cn("font-semibold", passwordStrength.color.replace('bg-', 'text-'))}>{passwordStrength.text}</span></span>
                        <span>{passwordStrength.value}%</span>
                      </div>
                      <Progress value={passwordStrength.value} className="h-1 mt-1" indicatorClassName={passwordStrength.color} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password-signup" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-border focus:border-primary focus:ring-primary pr-10"
                    />
                    {confirmPassword.length > 0 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {passwordsMatch ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> Passwords do not match.
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading || !passwordsMatch || passwordStrength.value < 75}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing Up...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="magic-link" className="mt-6"> {/* New tab content */}
              <form onSubmit={handleMagicLinkLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-magiclink" className="text-foreground">Email Address</Label>
                  <Input
                    id="email-magiclink"
                    type="email"
                    placeholder="your@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted/30 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          {message && (
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
              messageType === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400' :
              messageType === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400' :
              'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
            } border`}>
              {messageType === 'success' && <CheckCircle className="h-5 w-5" />}
              {messageType === 'error' && <XCircle className="h-5 w-5" />}
              {messageType === 'info' && <AlertCircle className="h-5 w-5" />}
              <p className="text-sm">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}