import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

type SessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; userId: string };

const SessionContext = createContext<SessionState>({ status: "loading" });

// Restores the saved session, or silently signs in anonymously. No login screen needed.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!isSupabaseConfigured) {
        setState({
          status: "error",
          message: "Supabase is not configured. Fill in .env, then restart with: npx expo start -c",
        });
        return;
      }
      const { data } = await supabase.auth.getSession();
      let userId = data.session?.user.id;
      if (!userId) {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error || !anon.user) {
          if (!cancelled) {
            setState({
              status: "error",
              message: `Could not start a session: ${error?.message ?? "unknown error"}. Check that anonymous sign-ins are enabled in Supabase.`,
            });
          }
          return;
        }
        userId = anon.user.id;
      }
      if (!cancelled) setState({ status: "ready", userId });
    }

    start().catch((e) => {
      if (!cancelled) setState({ status: "error", message: String(e?.message ?? e) });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
