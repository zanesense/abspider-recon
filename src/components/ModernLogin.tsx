import { useState, useEffect } from "react";
import { supabase } from "../SupabaseClient";
import { Mail, Loader2, AlertCircle, CheckCircle, XCircle, Shield, Eye, EyeOff, Bug, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Helper function to determine password strength
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length > 7) strength += 1;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
  if (password.match(/\d/)) strength += 1;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

  switch (strength) {
    case 0: return { text: 'Very Weak', value: 0, color: 'bg-red-500' };
    case 1: return { text: 'Weak', value: 25, color: 'bg-orange-500' };
    case 2: return { text: 'Medium', value: 50, color: 'bg-yellow-500' };
    case 3: return { text: 'Strong', value: 75, color: 'bg-green-500' };
    case 4: return { text: 'Very Strong', value: 100, color: 'bg-green-600' };
    default: return { text: 'Very Weak', value: 0, color: 'bg-red-500' };
  }
};

export default function ModernLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentTab, setCurrentTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (data.session) {
        setMessage("Welcome back!");
        setMessageType('success');
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
        });
        navigate('/dashboard');
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

    if (password.length < 8 || passwordStrength.value < 75) {
      setMessage("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.");
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.user && data.session) {
        setMessage("Account created successfully!");
        setMessageType('success');
        toast({
          title: "Sign Up Successful",
          description: "You have been successfully signed up and logged in.",
        });
        navigate('/dashboard');
      } else {
        setMessage("Please check your email to confirm your account before logging in.");
        setMessageType('info');
        setCurrentTab("login");
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
    if (!email) {
      setMessage("Please enter your email address first.");
      setMessageType('error');
      return;
    }

    setLoading(true);
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
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Form Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                  <Bug className="h-8 w-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-lg opacity-30 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Welcome to ABSpider
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your reconnaissance platform
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11 bg-muted/50 p-1">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger 
                value="magic-link" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Magic Link
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-8 space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-login" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Forgot your password?
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mt-8 space-y-6">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {password.length > 0 && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Password strength:</span>
                        <span className={cn("font-medium", 
                          passwordStrength.value >= 75 ? 'text-emerald-600' :
                          passwordStrength.value >= 50 ? 'text-yellow-600' :
                          passwordStrength.value >= 25 ? 'text-orange-600' : 'text-red-600'
                        )}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={cn("h-2 rounded-full transition-all duration-300", 
                            passwordStrength.value >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                            passwordStrength.value >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                            passwordStrength.value >= 25 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                          )}
                          style={{ width: `${passwordStrength.value}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password-signup" className="text-sm font-medium">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {confirmPassword.length > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {passwordsMatch ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <AlertCircle className="h-4 w-4" />
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !passwordsMatch || passwordStrength.value < 75}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Magic Link Tab */}
            <TabsContent value="magic-link" className="mt-8 space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Passwordless Authentication
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      We'll send you a secure login link via email. Click the link to instantly access your account.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleMagicLinkLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-magiclink" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email-magiclink"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Message Display */}
          {message && (
            <div className={cn(
              "p-4 rounded-lg flex items-center gap-3 border transition-all duration-200",
              messageType === 'success' && "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-200",
              messageType === 'error' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200",
              messageType === 'info' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-200"
            )}>
              <div className={cn(
                "p-1 rounded-full",
                messageType === 'success' && "bg-emerald-100 dark:bg-emerald-900/30",
                messageType === 'error' && "bg-red-100 dark:bg-red-900/30",
                messageType === 'info' && "bg-blue-100 dark:bg-blue-900/30"
              )}>
                {messageType === 'success' && <CheckCircle className="h-4 w-4" />}
                {messageType === 'error' && <XCircle className="h-4 w-4" />}
                {messageType === 'info' && <AlertCircle className="h-4 w-4" />}
              </div>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Themed Visual Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Animated gradient orbs */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* Geometric shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl rotate-12 animate-pulse" />
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-20 w-16 h-16 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-lg -rotate-12 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          <div className="max-w-lg">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-6">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Secure Authentication
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
                Advanced Web
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Reconnaissance
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover hidden intelligence with our comprehensive security platform. 
                From subdomain enumeration to vulnerability assessment.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Enterprise-grade security" },
                { icon: Zap, text: "Lightning-fast scanning" },
                { icon: Bug, text: "Advanced vulnerability detection" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/10 to-cyan-600/10 group-hover:from-blue-600/20 group-hover:to-cyan-600/20 transition-all duration-200">
                    <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: "99.9%", label: "Uptime" },
                  { value: "50K+", label: "Scans" },
                  { value: "24/7", label: "Support" }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-16 right-16 w-4 h-4 bg-blue-500/20 rounded-full animate-bounce" />
        <div className="absolute bottom-24 left-16 w-3 h-3 bg-cyan-500/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-purple-500/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}