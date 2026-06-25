import { useState, useEffect } from "react";
import { supabase } from "../SupabaseClient";
import {
  Mail, Loader2, AlertCircle, CheckCircle, XCircle,
  Eye, EyeOff, Bug, ArrowRight, Zap, ShieldCheck, Link2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// SECURITY NOTE: Pure UI form. Auth delegated to Supabase via env vars. No secrets hardcoded.

const getPasswordStrength = (pw: string) => {
  let s = 0;
  if (pw.length > 7) s++;
  if (pw.match(/[a-z]/) && pw.match(/[A-Z]/)) s++;
  if (pw.match(/\d/)) s++;
  if (pw.match(/[^a-zA-Z0-9]/)) s++;
  return [
    { text: 'Very weak',   value: 0,   color: 'bg-red-500' },
    { text: 'Weak',        value: 25,  color: 'bg-orange-500' },
    { text: 'Medium',      value: 50,  color: 'bg-yellow-500' },
    { text: 'Strong',      value: 75,  color: 'bg-emerald-500' },
    { text: 'Very strong', value: 100, color: 'bg-emerald-600' },
  ][s];
};

interface Props {
  open: boolean;
  onClose: () => void;
}

interface EyeToggleProps {
  showPassword: boolean;
  onToggle: () => void;
}

const EyeToggle = ({ showPassword, onToggle }: EyeToggleProps) => (
  <button
    type="button"
    tabIndex={-1}
    onClick={onToggle}
    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-blue-200/70 transition-colors hover:text-white"
  >
    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  </button>
);

const REMEMBER_SESSION_KEY = 'abspider-remember-session';
const SESSION_ACTIVE_KEY = 'abspider-session-active';

export default function ModernLogin({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentTab, setCurrentTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(REMEMBER_SESSION_KEY) !== 'false');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const pwStrength = getPasswordStrength(password);
  const pwMatch = password === confirmPassword && password.length > 0;

  const reset = () => { setMessage(null); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        localStorage.setItem(REMEMBER_SESSION_KEY, rememberMe ? 'true' : 'false');
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        toast({ title: "Welcome back!" });
        navigate('/dashboard');
      }
    } catch (err: any) { setMessage(err.message); setMessageType('error'); }
    finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwStrength.value < 75) { setMessage("Use a stronger password (uppercase, numbers, symbols)."); setMessageType('error'); return; }
    if (!pwMatch) { setMessage("Passwords do not match."); setMessageType('error'); return; }
    setLoading(true); reset();
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        localStorage.setItem(REMEMBER_SESSION_KEY, rememberMe ? 'true' : 'false');
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        toast({ title: "Account created!" });
        navigate('/dashboard');
      }
      else { setMessage("Check your email to confirm your account."); setMessageType('info'); setCurrentTab("login"); }
    } catch (err: any) { setMessage(err.message); setMessageType('error'); }
    finally { setLoading(false); }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
      if (error) throw error;
      setMessage("Magic link sent. Check your inbox."); setMessageType('success');
    } catch (err: any) { setMessage(err.message); setMessageType('error'); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setMessage("Enter your email first."); setMessageType('error'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login?reset=true` });
      if (error) throw error;
      setMessage("Reset email sent. Check your inbox."); setMessageType('success');
    } catch (err: any) { setMessage(err.message); setMessageType('error'); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-[#030712]/95 backdrop-blur-sm" aria-hidden="true" />

      <div
        className="relative z-10 flex w-full max-w-5xl overflow-hidden rounded-2xl border border-white/5 bg-[#030712] shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "85vh" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-blue-200/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex w-full flex-col justify-center px-8 py-8 sm:w-[420px] sm:shrink-0">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-950/40">
              <Bug className="h-7 w-7 text-blue-100" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-blue-500">Welcome to ABSpider</h1>
            <p className="mt-2 text-sm text-blue-100/70">
              Sign in to your reconnaissance platform
            </p>
          </div>

          <Tabs value={currentTab} onValueChange={(t) => { setCurrentTab(t); reset(); }} className="mt-4">
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-slate-900/95 p-1">
              <TabsTrigger value="login" className="rounded-lg text-sm font-semibold text-blue-200/70 data-[state=active]:bg-[#030712] data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-sm font-semibold text-blue-200/70 data-[state=active]:bg-[#030712] data-[state=active]:text-white">Sign Up</TabsTrigger>
              <TabsTrigger value="magic-link" className="rounded-lg text-sm font-semibold text-blue-200/70 data-[state=active]:bg-[#030712] data-[state=active]:text-white">Magic Link</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4 space-y-3">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lp-email-login" className="text-sm font-semibold text-white">Email address</Label>
                  <Input id="lp-email-login" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl border-slate-700 bg-transparent text-base text-blue-100 placeholder:text-blue-200/60 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp-password-login" className="text-sm font-semibold text-white">Password</Label>
                  <div className="relative">
                    <Input id="lp-password-login" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl border-slate-700 bg-transparent pr-12 text-base text-blue-100 placeholder:text-blue-200/60 focus-visible:ring-blue-500" />
                    <EyeToggle showPassword={showPassword} onToggle={() => setShowPassword(v => !v)} />
                  </div>
                </div>
                <label htmlFor="lp-remember-login" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-100/80">
                  <Checkbox
                    id="lp-remember-login"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-blue-200/40 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  Remember me
                </label>
                <Button type="submit" disabled={loading} className="h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-base font-semibold text-white shadow-xl shadow-blue-950/40 hover:from-blue-500 hover:to-cyan-500">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : <>Sign in<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
                <button type="button" onClick={handleForgotPassword} disabled={loading}
                  className="w-full cursor-pointer pt-4 text-center text-sm font-semibold text-blue-200/80 transition-colors hover:text-white">
                  Forgot your password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-3">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lp-email-signup" className="text-sm font-semibold text-white">Email address</Label>
                  <Input id="lp-email-signup" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl border-slate-700 bg-transparent text-base text-blue-100 placeholder:text-blue-200/60 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp-pw-signup" className="text-sm font-semibold text-white">Password</Label>
                  <div className="relative">
                    <Input id="lp-pw-signup" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl border-slate-700 bg-transparent pr-12 text-base text-blue-100 placeholder:text-blue-200/60 focus-visible:ring-blue-500" />
                    <EyeToggle showPassword={showPassword} onToggle={() => setShowPassword(v => !v)} />
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full transition-all duration-300", pwStrength.color)} style={{ width: `${pwStrength.value}%` }} />
                      </div>
                      <p className="text-xs text-blue-200/70">{pwStrength.text}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp-confirm-pw" className="text-sm font-semibold text-white">Confirm password</Label>
                  <div className="relative">
                    <Input id="lp-confirm-pw" type={showPassword ? "text" : "password"} placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-12 rounded-xl border-slate-700 bg-transparent pr-12 text-base text-blue-100 placeholder:text-blue-200/60 focus-visible:ring-blue-500" />
                    {confirmPassword.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {pwMatch ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                      </span>
                    )}
                  </div>
                </div>
                <label htmlFor="lp-remember-signup" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-100/80">
                  <Checkbox
                    id="lp-remember-signup"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-blue-200/40 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  Remember me
                </label>
                <Button type="submit" disabled={loading || !pwMatch || pwStrength.value < 75} className="h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-base font-semibold text-white shadow-xl shadow-blue-950/40 hover:from-blue-500 hover:to-cyan-500">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <>Create account<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="magic-link" className="mt-4 space-y-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <p className="text-sm leading-relaxed text-blue-100/70">
                    <span className="font-medium text-white">Passwordless sign-in.</span>{' '}
                    We'll email you a one-click link. No password needed.
                  </p>
                </div>
              </div>
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lp-email-ml" className="text-sm font-semibold text-white">Email address</Label>
                  <Input id="lp-email-ml" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl border-slate-700 bg-transparent text-base text-blue-100 placeholder:text-blue-200/60 focus-visible:ring-blue-500" />
                </div>
                <Button type="submit" disabled={loading || !email} className="h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-base font-semibold text-white shadow-xl shadow-blue-950/40 hover:from-blue-500 hover:to-cyan-500">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Mail className="mr-2 h-4 w-4" />Send magic link</>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {message && (
            <div className={cn("mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm",
              messageType === 'success' && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              messageType === 'error'   && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
              messageType === 'info'    && "border-primary/20 bg-primary/10 text-primary",
            )}>
              {messageType === 'success' && <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {messageType === 'error'   && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {messageType === 'info'    && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <p>{message}</p>
            </div>
          )}
        </div>

        <div className="relative hidden flex-1 overflow-hidden bg-[#071121] sm:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#071121] via-[#0b1b31] to-[#182042]" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage: `
                radial-gradient(circle at 72% 34%, rgba(59,130,246,0.18), transparent 36%),
                radial-gradient(circle at 28% 100%, rgba(99,102,241,0.26), transparent 34%),
                radial-gradient(circle at 90% 8%, rgba(6,182,212,0.16), transparent 22%)
              `,
            }}
            aria-hidden="true"
          />
          <div className="absolute right-20 top-56 h-20 w-20 rotate-[-12deg] rounded-2xl bg-indigo-600/20" aria-hidden="true" />
          <div className="absolute bottom-24 right-44 h-28 w-28 rounded-full bg-cyan-500/15" aria-hidden="true" />
          <div className="absolute right-14 top-16 h-5 w-5 rounded-full bg-blue-500/30" aria-hidden="true" />
          <div className="absolute left-56 top-52 h-2.5 w-2.5 rounded-full bg-purple-500/70" aria-hidden="true" />

          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-400 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4" />
              Secure Authentication
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
                  Advanced Web<br /><span className="text-blue-500">Reconnaissance</span>
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-blue-100/70">
                  Discover hidden intelligence with our comprehensive security platform. From subdomain enumeration to vulnerability assessment.
                </p>
              </div>

              <div className="space-y-3.5">
                {[
                  { icon: ShieldCheck, text: 'Enterprise-grade security' },
                  { icon: Zap,         text: 'Lightning-fast scanning' },
                  { icon: Bug,         text: 'Advanced vulnerability detection' },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 backdrop-blur-sm">
                      <f.icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-blue-100/70">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <div className="grid grid-cols-3 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-blue-500">35</div>
                  <div className="mt-1 text-xs text-blue-100/70">Modules</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-blue-500">3</div>
                  <div className="mt-1 text-xs text-blue-100/70">Scan styles</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-blue-500">3</div>
                  <div className="mt-1 text-xs text-blue-100/70">Export formats</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
