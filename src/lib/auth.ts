import { supabase } from "./supabase";

// Confirmation emails send people here, not to the Supabase default (localhost).
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || "https://braincraze.study";

// Creates an email account. Resolves true when the user is signed in straight away (Supabase "Confirm email" is
// off, which is what lets people join without verifying), false when Supabase still wants the email confirmed first.
export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: siteUrl },
  });
  if (error) throw error;
  return Boolean(data?.session);
}

export async function logIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Supabase enforces confirmation and resend limits; this does not grant verification.
export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: siteUrl },
  });
  if (error) throw error;
}
