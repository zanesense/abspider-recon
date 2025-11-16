import { useState } from "react";
// import { supabase } from "../SupabaseClient"; // Not actively used when disabled
import { Mail, Loader2, AlertCircle, CheckCircle, XCircle, Shield } from "lucide-react";

export default function Login() {
  // Login feature is disabled. This component is not actively used for authentication.
  // It now renders a message indicating it's disabled.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans px-4">
      <div className="bg-card rounded-xl shadow-xl p-8 w-full max-w-md border border-border text-center">
        <h2 className="text-2xl font-semibold text-center mb-4 text-foreground flex items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          Login Disabled
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          The login feature is currently disabled. You can access all features directly.
        </p>
        <p className="text-sm text-muted-foreground">
          If you wish to re-enable it, please contact support or modify the application code.
        </p>
      </div>
    </div>
  );
}