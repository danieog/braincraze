// Edge Function: runs the school ID check on an uploaded image and records the result.
// Deploy: supabase functions deploy verify-id
// Secrets: supabase secrets set OLLAMA_URL=https://... OLLAMA_TOKEN=...
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.)
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { runIdCheck, type IdCheckOutcome } from "../_shared/idCheck.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: "not authenticated" }, 401);

  let requestId: unknown;
  try {
    requestId = (await req.json()).request_id;
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if (typeof requestId !== "string") return json({ error: "request_id required" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Claim the request atomically: only a queued request owned by the caller can be processed (once).
  const { data: claimed } = await admin
    .from("verification_requests")
    .update({ status: "processing" })
    .eq("id", requestId)
    .eq("user_id", userData.user.id)
    .eq("status", "queued")
    .select("id_path, schools(profile_key)")
    .maybeSingle();
  if (!claimed?.id_path) return json({ error: "request not found or not queued" }, 404);

  let outcome: IdCheckOutcome = { result: "review", checks: null, reason: "internal_error" };
  try {
    const file = await admin.storage.from("id-documents").download(claimed.id_path);
    if (file.error || !file.data) {
      outcome = { result: "review", checks: null, reason: "image_unavailable" };
    } else {
      const imageBase64 = encodeBase64(new Uint8Array(await file.data.arrayBuffer()));
      outcome = await runIdCheck({
        profileKey: (claimed.schools as { profile_key: string | null } | null)?.profile_key,
        imageBase64,
        ollamaUrl: Deno.env.get("OLLAMA_URL"),
        ollamaToken: Deno.env.get("OLLAMA_TOKEN"),
      });
    }
  } catch {
    // Never log the image or model output. Anything unexpected still ends in human review.
  }

  const now = new Date().toISOString();
  await admin
    .from("verification_requests")
    .update({
      status: "manual_review",
      id_check_result: outcome.result,
      id_check_checks: outcome.checks,
      id_check_reason: outcome.reason,
      id_check_at: now,
    })
    .eq("id", requestId);
  await admin
    .from("verification_events")
    .insert({ request_id: requestId, actor: null, event: "id_checked", detail: `${outcome.result}:${outcome.reason}` });

  return json({ result: outcome.result, reason: outcome.reason });
});
