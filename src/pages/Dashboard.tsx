import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import { Button } from "@/components/ui/button"; // Import Button component

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // RequireAuth component now handles the login state, so user should always be present here
  if (!user) return null; 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans px-4">
      <div className="bg-card rounded-xl shadow-xl p-8 w-full max-w-md border border-border text-center">
        <h1 className="text-3xl font-bold text-foreground mb-6">Welcome, {user.email}</h1>
        <Button
          onClick={() => supabase.auth.signOut()}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-primary/30"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}