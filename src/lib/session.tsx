import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

type SessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; userId: string; isAnonymous: boolean; email: string | null };

function readyState(user: User): SessionState {
  return { status: "ready", userId: user.id, isAnonymous: Boolean(user.is_anonymous), email: user.email ?? null };
}

const SessionContext = createContext<SessionState>({ status: "loading" });

// Restores the saved session, or silently signs in anonymously. The auth screen upgrades it to an email account.
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
      let user = data.session?.user;
      if (!user) {
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
        user = anon.user;
      }
      if (!cancelled) setState(readyState(user));
    }

    start().catch((e) => {
      if (!cancelled) setState({ status: "error", message: String(e?.message ?? e) });
    });

    // Keeps the state current after sign up, log in, email confirmation and log out.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session?.user) setState(readyState(session.user));
    });
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
