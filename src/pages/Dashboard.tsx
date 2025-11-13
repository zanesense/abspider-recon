import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";

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

  if (!user) return <p style={{ textAlign: "center", marginTop: "50px" }}>Please login to view this page.</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
      <h1>Welcome, {user.email}</h1>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          padding: "10px 20px",
          marginTop: "20px",
          borderRadius: "8px",
          border: "none",
          background: "#667eea",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
