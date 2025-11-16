import { useState } from "react";
import { supabase } from "../SupabaseClient";
import { Mail, Loader2, AlertCircle, CheckCircle, XCircle, Shield } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleMagicLinkLogin = async () => {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
      setSuccess(false);
    } else {
      setMessage("Check your email! A login link has been sent.");
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans px-4">
      <div className="bg-card rounded-xl shadow-xl p-8 w-full max-w-md border border-border">
        {/* Welcome Back with Alert Icon */}
        <h2 className="text-2xl font-semibold text-center mb-4 text-foreground flex items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6 text-yellow-400 animate-bounce" />
          Welcome Back
        </h2>

        <p className="text-muted-foreground text-center mb-6">Login with your email</p>

        {/* Email Input with Icon */}
        <div className="flex items-center mb-4 bg-muted/30 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition border border-border">
          <Mail className="w-5 h-5 text-muted-foreground mr-2" />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent text-foreground placeholder-muted-foreground w-full outline-none"
          />
        </div>

        {/* Magic Link Button */}
        <button
          onClick={handleMagicLinkLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-colors duration-200 rounded-md py-2 mt-4 flex items-center justify-center font-medium text-white shadow-lg shadow-primary/30"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          {loading ? "Sending..." : "Send Link"}
        </button>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 text-center flex items-center justify-center gap-2 ${
              success ? "text-green-400" : "text-red-500"
            }`}
          >
            {success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {message}
          </p>
        )}

        {/* Alert Card Below Form */}
        <div className="flex items-start bg-muted/30 border-l-4 border-yellow-400 text-yellow-400 mt-6 p-4 rounded-md gap-3 border border-border">
          <Shield className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            This step is crucial! Verifying your email helps prevent unauthorized access to the tool and to prevent illegal activities.
          </p>
        </div>
      </div>
    </div>
  );
}