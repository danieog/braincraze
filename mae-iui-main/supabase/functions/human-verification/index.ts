import { createClient } from "npm:@supabase/supabase-js@2";
import { humanVerificationHandler } from "../_shared/humanVerification.ts";
const csv = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
Deno.serve(
  humanVerificationHandler(
    {
      provider: Deno.env.get("HUMAN_CAPTCHA_PROVIDER") ?? "turnstile",
      secret: Deno.env.get("HUMAN_CAPTCHA_SECRET") ?? "",
      siteKey: Deno.env.get("HUMAN_CAPTCHA_SITE_KEY") ?? "",
      hostnames: csv(Deno.env.get("HUMAN_CAPTCHA_HOSTNAMES")).map((v) =>
        v.toLowerCase(),
      ),
      origins: csv(Deno.env.get("HUMAN_CAPTCHA_ORIGINS")),
    },
    (authorization) => {
      const url = Deno.env.get("SUPABASE_URL")!;
      const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authorization } },
      });
      const admin = createClient(
        url,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      async function rpc(name: string, args: Record<string, unknown>) {
        const { data, error } = await admin.rpc(name, args);
        if (error) throw new Error("Verification database operation failed");
        return data;
      }
      return {
        async authenticate() {
          const { data, error } = await client.auth.getUser();
          if (error || !data.user) return null;
          // Read the session claim only AFTER Supabase has validated this bearer token.
          try {
            const payload = authorization
              .split(" ")[1]
              .split(".")[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/");
            const claims = JSON.parse(
              atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")),
            );
            if (
              claims.sub !== data.user.id ||
              typeof claims.session_id !== "string" ||
              !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(
                claims.session_id,
              )
            )
              return null;
            return {
              id: data.user.id,
              sessionId: claims.session_id,
              emailConfirmed: Boolean(data.user.email_confirmed_at),
            };
          } catch {
            return null;
          }
        },
        async start() {
          const { data, error } = await client.rpc("begin_human_verification");
          if (error) throw new Error("Verification challenge unavailable");
          return data;
        },
        async consume(id, user, hash, provider) {
          return rpc("consume_human_verification", {
            p_id: id,
            p_user: user.id,
            p_session: user.sessionId,
            p_token_hash: hash,
            p_provider: provider,
          });
        },
        async complete(id, user) {
          await rpc("complete_human_verification", {
            p_id: id,
            p_user: user.id,
            p_session: user.sessionId,
          });
        },
      };
    },
  ),
);
