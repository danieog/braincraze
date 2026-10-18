import {
  isCaptchaProvider,
  verifyCaptcha,
  type CaptchaProvider,
} from "./captcha.ts";
export type HumanUser = {
  id: string;
  sessionId: string;
  emailConfirmed: boolean;
};
export type HumanBackend = {
  authenticate(): Promise<HumanUser | null>;
  start(): Promise<{ id: string; nonce: string }>;
  consume(
    id: string,
    user: HumanUser,
    hash: string,
    provider: CaptchaProvider,
  ): Promise<{ nonce: string }>;
  complete(id: string, user: HumanUser): Promise<void>;
};
export type HumanConfig = {
  provider: string;
  secret: string;
  siteKey: string;
  hostnames: string[];
  origins: string[];
};
class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "A JSON body is required.");
  let size = 0,
    text = "";
  const decoder = new TextDecoder();
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new RequestError(413, "Request too large.");
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new RequestError(400, "Invalid JSON.");
  }
}
export function humanVerificationHandler(
  config: HumanConfig,
  backend: (authorization: string) => HumanBackend,
  fetcher: typeof fetch = fetch,
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    if (origin && config.origins.includes(origin))
      headers["Access-Control-Allow-Origin"] = origin;
    const json = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), { status, headers });
    try {
      if (origin && !config.origins.includes(origin))
        throw new RequestError(403, "Origin not allowed.");
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers });
      if (request.method !== "POST")
        throw new RequestError(405, "Method not allowed.");
      const authorization = request.headers.get("Authorization") ?? "";
      if (!/^Bearer \S+$/i.test(authorization))
        throw new RequestError(401, "Log in to continue.");
      const api = backend(authorization);
      const user = await api.authenticate();
      if (!user) throw new RequestError(401, "Log in to continue.");
      if (!user.emailConfirmed)
        throw new RequestError(
          403,
          "Confirm your email before human verification.",
        );
      if (
        !isCaptchaProvider(config.provider) ||
        !config.secret ||
        !config.siteKey ||
        !config.hostnames.length
      )
        throw new RequestError(
          503,
          "Human verification is not configured. Contact the team; verification remains locked.",
        );
      const body = await readBody(request);
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new RequestError(400, "Invalid request.");
      if (body.action === "start" && Object.keys(body).length === 1) {
        const challenge = await api.start();
        return json({
          challengeId: challenge.id,
          nonce: challenge.nonce,
          provider: config.provider,
          siteKey: config.siteKey,
        });
      }
      if (
        body.action !== "verify" ||
        Object.keys(body).some(
          (k) => !["action", "challengeId", "token"].includes(k),
        ) ||
        typeof body.challengeId !== "string" ||
        !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(
          body.challengeId,
        ) ||
        typeof body.token !== "string" ||
        !body.token.trim() ||
        body.token.length > 4096
      )
        throw new RequestError(400, "Invalid verification request.");
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(body.token),
      );
      const hash = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      // Consume BEFORE contacting the provider: failures require a fresh challenge, and proofs cannot be replayed.
      const challenge = await api.consume(
        body.challengeId,
        user,
        hash,
        config.provider,
      );
      const passed = await verifyCaptcha({
        provider: config.provider,
        secret: config.secret,
        siteKey: config.siteKey,
        token: body.token,
        nonce: challenge.nonce,
        hostnameAllowlist: config.hostnames,
        fetcher,
      });
      if (!passed)
        throw new RequestError(
          422,
          "Human verification failed or expired. Start a new check and try again.",
        );
      await api.complete(body.challengeId, user);
      return json({ verified: true });
    } catch (error) {
      if (error instanceof RequestError)
        return json({ error: error.message }, error.status);
      // Do not expose credentials, tokens, provider output, document paths or database details.
      return json(
        {
          error:
            "Verification could not be completed. Start a new check; if this continues, contact the team.",
        },
        409,
      );
    }
  };
}
