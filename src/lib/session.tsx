import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

type SessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "signedOut" }
  | { status: "ready"; userId: string; email: string | null };

const SessionContext = createContext<SessionState>({ status: "loading" });

// Restores the saved email session and keeps it current after sign up, log in and log out.
// There is no anonymous access: without a session the app shows the auth screen.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(
    isSupabaseConfigured
      ? { status: "loading" }
      : {
          status: "error",
          message: "Supabase is not configured. Fill in .env, then restart with: npx expo start -c",
        },
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    const apply = (user: { id: string; email?: string } | undefined) => {
      if (cancelled) return;
      setState(user ? { status: "ready", userId: user.id, email: user.email ?? null } : { status: "signedOut" });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user))
      .catch((e) => {
        if (!cancelled) setState({ status: "error", message: String(e?.message ?? e) });
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
