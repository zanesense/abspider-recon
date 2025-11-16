import { useState, useEffect } from "react";
import { supabase } from "../SupabaseClient";
import { Mail, Loader2, AlertCircle, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType('info');

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        throw error;
      }

      setMessage("Check your email for the magic link!");
      setMessageType('success');
      toast({
        title: "Magic Link Sent",
        description: "Check your email for the login link!",
      });
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans px-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            ABSpider Login
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in via magic link with your email below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <Input
                id="email"
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
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