export type CaptchaProvider = "turnstile" | "hcaptcha" | "recaptcha";
export const captchaEndpoints: Record<CaptchaProvider, string> = {
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  hcaptcha: "https://api.hcaptcha.com/siteverify",
  recaptcha: "https://www.google.com/recaptcha/api/siteverify",
};
export function isCaptchaProvider(value: unknown): value is CaptchaProvider {
  return typeof value === "string" && Object.hasOwn(captchaEndpoints, value);
}
export async function verifyCaptcha(args: {
  provider: CaptchaProvider;
  secret: string;
  token: string;
  hostnameAllowlist: string[];
  nonce: string;
  siteKey: string;
  now?: number;
  fetcher?: typeof fetch;
}): Promise<boolean> {
  if (
    !args.secret ||
    !args.hostnameAllowlist.length ||
    !args.token ||
    args.token.length > 4096
  )
    return false;
  const body = new URLSearchParams({
    secret: args.secret,
    response: args.token,
  });
  if (args.provider === "hcaptcha") body.set("sitekey", args.siteKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await (args.fetcher ?? fetch)(
      captchaEndpoints[args.provider],
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
        redirect: "error",
      },
    );
    if (!response.ok) return false;
    const result = await response.json();
    if (
      result?.success !== true ||
      typeof result.hostname !== "string" ||
      !args.hostnameAllowlist.includes(result.hostname.toLowerCase()) ||
      typeof result.challenge_ts !== "string"
    )
      return false;
    const timestamp = Date.parse(result.challenge_ts);
    const age = (args.now ?? Date.now()) - timestamp;
    if (!Number.isFinite(timestamp) || age < -30000 || age > 300000)
      return false;
    if (
      args.provider === "turnstile" &&
      (result.action !== "braincraze_human" || result.cdata !== args.nonce)
    )
      return false;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
