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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 font-sans px-4">
      <div className="bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md border border-gray-700">
        {/* Welcome Back with Alert Icon */}
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-100 flex items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6 text-yellow-400 animate-bounce" />
          Welcome Back
        </h2>

        <p className="text-gray-400 text-center mb-6">Login with your email</p>

        {/* Email Input with Icon */}
        <div className="flex items-center mb-4 bg-gray-700 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <Mail className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-700 text-gray-100 placeholder-gray-400 w-full outline-none"
          />
        </div>

        {/* Magic Link Button */}
        <button
          onClick={handleMagicLinkLogin}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 rounded-md py-2 mt-4 flex items-center justify-center font-medium"
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
        <div className="flex items-start bg-gray-700 border-l-4 border-yellow-400 text-yellow-400 mt-6 p-4 rounded-md gap-3">
          <Shield className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm">
            This step is crucial! Verifying your email helps prevent unauthorized access to the tool and to prevent illegal activities.
          </p>
        </div>
      </div>
    </div>
  );
}
