import { supabase } from "./supabase";

// Turns the current anonymous user into an email account, keeping their profile and location data.
// Supabase sends a confirmation email; the account counts as verified once it is confirmed.
export async function signUp(email: string, password: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const { error } = data.session?.user.is_anonymous
    ? await supabase.auth.updateUser({ email, password })
    : await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

// Replaces the anonymous session with an existing account.
export async function logIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// The session provider signs in anonymously again on the next launch.
export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
