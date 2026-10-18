import { supabase } from "./supabase";
export type CaptchaChallenge = {
  challengeId: string;
  nonce: string;
  provider: "turnstile" | "hcaptcha" | "recaptcha";
  siteKey: string;
};
async function invoke(body: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke(
    "human-verification",
    { body },
  );
  if (error) {
    // FunctionsHttpError exposes a Response. Read only the server's bounded public error message.
    const response = (error as { context?: unknown }).context;
    if (response instanceof Response) {
      try {
        const value = await response.json();
        if (typeof value?.error === "string") throw new Error(value.error);
      } catch (e) {
        if (e instanceof Error && e.name === "Error") throw e;
      }
    }
    throw new Error(
      "Human verification is unavailable. Retry or contact the team.",
    );
  }
  return data;
}
export async function startHumanVerification(): Promise<CaptchaChallenge> {
  const data = await invoke({ action: "start" });
  if (
    !data ||
    typeof data.challengeId !== "string" ||
    typeof data.nonce !== "string" ||
    typeof data.siteKey !== "string" ||
    !["turnstile", "hcaptcha", "recaptcha"].includes(data.provider)
  )
    throw new Error("Invalid challenge response.");
  return data;
}
export async function submitHumanVerification(
  challengeId: string,
  token: string,
): Promise<void> {
  const data = await invoke({ action: "verify", challengeId, token });
  if (data?.verified !== true)
    throw new Error("Human verification did not pass. Start a new check.");
}
