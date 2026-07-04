import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/SupabaseClient";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const session = data?.session ?? null;
        setSession(session);
        setLoading(false);
        if (!session) {
          navigate("/login");
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          navigate("/login");
        }
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen surface-main">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Redirect handled by useEffect
  }

  return <>{children}</>;
}