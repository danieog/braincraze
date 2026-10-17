import { supabase } from "./supabase";

// Confirmation emails send people here, not to the Supabase default (localhost).
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || "https://braincraze.study";

// Creates an email account. Supabase sends a confirmation email; the account counts as verified once it is confirmed.
export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: siteUrl } });
  if (error) throw error;
}

export async function logIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
