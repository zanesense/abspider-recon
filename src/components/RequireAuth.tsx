import { useEffect, useState } from "react";
import { supabase } from "@/SupabaseClient";
import Login from "@/components/Login";

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  // The authentication logic is commented out to disable the login page.
  // You can uncomment this section and the return statement below to re-enable authentication.
  /*
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
  */

  return <>{children}</>;
}