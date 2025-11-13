import { useEffect, useState } from "react";
import { supabase } from "@/SupabaseClient";
import Login from "@/components/Login"; // new login page we created

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!user) return <Login />;

  return <>{children}</>;
}
