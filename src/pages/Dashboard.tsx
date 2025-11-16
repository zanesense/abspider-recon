// import { useEffect, useState } from "react"; // Not actively used when disabled
// import { supabase } from "../SupabaseClient"; // Not actively used when disabled
import { Button } from "@/components/ui/button"; // Import Button component
import { AlertCircle } from "lucide-react";

export default function Dashboard() {
  // Dashboard functionality is disabled as login is disabled.
  // This component will render a message indicating it's disabled.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans px-4">
      <div className="bg-card rounded-xl shadow-xl p-8 w-full max-w-md border border-border text-center">
        <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center justify-center gap-2">
          <AlertCircle className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
          Dashboard Disabled
        </h1>
        <p className="text-muted-foreground mb-4">
          The user dashboard is currently disabled as the login feature is inactive.
        </p>
        <p className="text-sm text-muted-foreground">
          All application features are accessible without authentication.
        </p>
        <Button
          onClick={() => window.location.href = '/'} // Redirect to home
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-primary/30 mt-6"
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}