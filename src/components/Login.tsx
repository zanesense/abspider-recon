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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Main login card */}
      <Card className="w-full max-w-md border border-slate-800/50 shadow-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 rounded-lg"></div>
        <CardHeader className="text-center relative z-10 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg shadow-blue-600/25">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ABSpider Auth
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2 text-base">
            Secure access to your reconnaissance platform
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/25 transition-all duration-200"
              >
                <Mail className="mr-2 h-4 w-4" /> Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/25 transition-all duration-200"
              >
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </TabsTrigger>
              <TabsTrigger 
                value="magic-link" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/25 transition-all duration-200"
              >
                <Link className="mr-2 h-4 w-4" /> Magic Link
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email-login" className="text-slate-200 font-medium">Email Address</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="your@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-slate-400 h-12 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password-login" className="text-slate-200 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-slate-400 h-12 pr-12 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/25 font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Login
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  className="w-full text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email-signup" className="text-slate-200 font-medium">Email Address</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="your@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-slate-400 h-12 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password-signup" className="text-slate-200 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-slate-400 h-12 pr-12 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                        <span>Password Strength: <span className={cn("font-semibold", 
                          passwordStrength.value >= 75 ? 'text-green-400' :
                          passwordStrength.value >= 50 ? 'text-yellow-400' :
                          passwordStrength.value >= 25 ? 'text-orange-400' : 'text-red-400'
                        )}>{passwordStrength.text}</span></span>
                        <span className="text-slate-400">{passwordStrength.value}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div 
                          className={cn("h-2 rounded-full transition-all duration-300", 
                            passwordStrength.value >= 75 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                            passwordStrength.value >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                            passwordStrength.value >= 25 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                          )}
                          style={{ width: `${passwordStrength.value}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="confirm-password-signup" className="text-slate-200 font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-slate-400 h-12 pr-12 transition-all duration-200"
                    />
                    {confirmPassword.length > 0 && (
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        {passwordsMatch ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-sm text-red-400 flex items-center gap-2 mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      <AlertCircle className="h-4 w-4" /> Passwords do not match.
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading || !passwordsMatch || passwordStrength.value < 75}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/25 font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing Up...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="magic-link" className="mt-8">
              <form onSubmit={handleMagicLinkLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email-magiclink" className="text-slate-200 font-medium">Email Address</Label>
                  <Input
                    id="email-magiclink"
                    type="email"
                    placeholder="your@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-slate-400 h-12 transition-all duration-200"
                  />
                </div>
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-slate-200 font-medium mb-1">Magic Link Authentication</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        We'll send you a secure login link via email. Click the link to instantly access your account without entering a password.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/25 font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-5 w-5" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          {message && (
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 border backdrop-blur-sm ${
              messageType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
              messageType === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              <div className={`p-1 rounded-full ${
                messageType === 'success' ? 'bg-green-500/20' :
                messageType === 'error' ? 'bg-red-500/20' :
                'bg-blue-500/20'
              }`}>
                {messageType === 'success' && <CheckCircle className="h-4 w-4" />}
                {messageType === 'error' && <XCircle className="h-4 w-4" />}
                {messageType === 'info' && <AlertCircle className="h-4 w-4" />}
              </div>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}