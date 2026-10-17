// School ID check. Pure TypeScript with no Deno-only APIs, so it runs in the Edge Function and in Jest.
// The model only answers true/false questions. The pass/review decision is made here, in code.
// It never auto-rejects: every failure of any kind becomes "review" with a reason code.
// Privacy: the model is never asked for the ID number, and neither the image nor the model's output is logged.

import { SCHOOL_PROFILES, type SchoolProfile } from "./schoolProfiles.ts";

export const CHECK_KEYS = [
  "is_id_card",
  "image_clear_and_fully_visible",
  "school_name_matches_expected",
  "has_face_photo",
  "photo_background_is_solid_red",
  "id_number_present",
  "looks_like_screen_photo_or_photocopy",
] as const;

export type Checks = Record<(typeof CHECK_KEYS)[number], boolean>;

export type ReasonCode =
  | "all_checks_passed"
  | "checks_failed"
  | "no_school_profile"
  | "not_configured"
  | "timeout"
  | "server_unreachable"
  | "server_unavailable"
  | "http_error"
  | "invalid_json"
  | "invalid_schema"
  | "image_unavailable"
  | "internal_error";

export type IdCheckOutcome = {
  result: "pass" | "review";
  checks: Checks | null;
  reason: ReasonCode;
};

export const MODEL = "llava-llama3";
export const TIMEOUT_MS = 60_000;

export const CHECK_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(CHECK_KEYS.map((k) => [k, { type: "boolean" }])),
  required: [...CHECK_KEYS],
};

export function buildPrompt(profile: SchoolProfile): string {
  return `You are checking a photo that is supposed to be a school ID card.
Expected school: ${profile.schoolName}

What a genuine card from this school looks like:
${profile.description}

Look only at the image. Answer each question with true or false.
Do NOT read out or repeat any ID number. If you cannot tell, answer false.
Return only JSON.`;
}

// "pass" only if every positive check is true AND the screen/photocopy check is false.
export function decide(checks: Checks): "pass" | "review" {
  const passes =
    checks.is_id_card &&
    checks.image_clear_and_fully_visible &&
    checks.school_name_matches_expected &&
    checks.has_face_photo &&
    checks.photo_background_is_solid_red &&
    checks.id_number_present &&
    !checks.looks_like_screen_photo_or_photocopy;
  return passes ? "pass" : "review";
}

function parseChecks(content: unknown): Checks | null {
  if (typeof content !== "string") return null;
  const parsed = JSON.parse(content);
  if (typeof parsed !== "object" || parsed === null) return null;
  const out = {} as Record<string, boolean>;
  for (const key of CHECK_KEYS) {
    if (typeof parsed[key] !== "boolean") return null;
    out[key] = parsed[key];
  }
  return out as Checks;
}

const review = (reason: ReasonCode): IdCheckOutcome => ({ result: "review", checks: null, reason });

export type RunIdCheckOptions = {
  profileKey: string | null | undefined;
  imageBase64: string; // raw base64, no "data:" prefix
  ollamaUrl: string | undefined;
  ollamaToken: string | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  profiles?: Record<string, SchoolProfile>;
};

export async function runIdCheck(opts: RunIdCheckOptions): Promise<IdCheckOutcome> {
  const profile = opts.profileKey ? (opts.profiles ?? SCHOOL_PROFILES)[opts.profileKey] : undefined;
  if (!profile) return review("no_school_profile");
  if (!opts.ollamaUrl || !opts.ollamaToken) return review("not_configured");

  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await doFetch(`${opts.ollamaUrl.replace(/\/+$/, "")}/api/chat`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.ollamaToken}` },
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          options: { temperature: 0 },
          format: CHECK_SCHEMA,
          messages: [{ role: "user", content: buildPrompt(profile), images: [opts.imageBase64] }],
        }),
      });
    } catch {
      return review(controller.signal.aborted ? "timeout" : "server_unreachable");
    }

    if (!res.ok) return review([502, 503, 504].includes(res.status) ? "server_unavailable" : "http_error");

    let checks: Checks | null;
    try {
      const data = await res.json();
      checks = parseChecks(data?.message?.content);
    } catch {
      return review(controller.signal.aborted ? "timeout" : "invalid_json");
    }
    if (!checks) return review("invalid_schema");

    const result = decide(checks);
    return { result, checks, reason: result === "pass" ? "all_checks_passed" : "checks_failed" };
  } finally {
    clearTimeout(timer);
  }
}
