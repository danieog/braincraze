import {
  CHECK_KEYS,
  CHECK_SCHEMA,
  MODEL,
  buildPrompt,
  decide,
  runIdCheck,
  type Checks,
} from "../../supabase/functions/_shared/idCheck";
import { SCHOOL_PROFILES } from "../../supabase/functions/_shared/schoolProfiles";

const allGood: Checks = {
  is_id_card: true,
  image_clear_and_fully_visible: true,
  school_name_matches_expected: true,
  has_face_photo: true,
  photo_background_is_solid_red: true,
  id_number_present: true,
  looks_like_screen_photo_or_photocopy: false,
};

const base = {
  profileKey: "umd-college-park",
  imageBase64: "AAAA",
  ollamaUrl: "https://ollama.example.com/",
  ollamaToken: "secret-token",
};

const modelReply = (checks: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ message: { content: JSON.stringify(checks) } }),
});

describe("decide", () => {
  it("passes when everything is right", () => {
    expect(decide(allGood)).toBe("pass");
  });

  it.each(CHECK_KEYS)("goes to review when only %s is wrong", (key) => {
    const wrong = { ...allGood, [key]: !allGood[key] };
    expect(decide(wrong)).toBe("review");
  });
});

describe("runIdCheck", () => {
  it("passes and sends the documented request", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(modelReply(allGood));
    const out = await runIdCheck({ ...base, fetchImpl: fetchImpl as any });
    expect(out).toEqual({ result: "pass", checks: allGood, reason: "all_checks_passed" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://ollama.example.com/api/chat");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
    const body = JSON.parse(init.body);
    expect(body.model).toBe(MODEL);
    expect(body.stream).toBe(false);
    expect(body.options).toEqual({ temperature: 0 });
    expect(body.format).toEqual(CHECK_SCHEMA);
    expect(body.messages[0].images).toEqual(["AAAA"]);
    expect(body.messages[0].content).toContain(SCHOOL_PROFILES["umd-college-park"].description);
  });

  it("returns review with the failed checks when the model says so", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(modelReply({ ...allGood, has_face_photo: false }));
    const out = await runIdCheck({ ...base, fetchImpl: fetchImpl as any });
    expect(out.result).toBe("review");
    expect(out.reason).toBe("checks_failed");
    expect(out.checks?.has_face_photo).toBe(false);
  });

  it("returns review when the server is down", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    const out = await runIdCheck({ ...base, fetchImpl: fetchImpl as any });
    expect(out).toEqual({ result: "review", checks: null, reason: "server_unreachable" });
  });

  it("returns review when the proxy reports the upstream as down", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 502 });
    expect((await runIdCheck({ ...base, fetchImpl: fetchImpl as any })).reason).toBe("server_unavailable");
  });

  it("returns review on other HTTP errors", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    expect((await runIdCheck({ ...base, fetchImpl: fetchImpl as any })).reason).toBe("http_error");
  });

  it("returns review on invalid JSON", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "not json" } }),
    });
    expect((await runIdCheck({ ...base, fetchImpl: fetchImpl as any })).reason).toBe("invalid_json");
  });

  it("returns review when a field is missing or not a boolean", async () => {
    const { is_id_card: _omitted, ...missing } = allGood;
    for (const reply of [missing, { ...allGood, has_face_photo: "yes" }]) {
      const fetchImpl = jest.fn().mockResolvedValue(modelReply(reply));
      expect((await runIdCheck({ ...base, fetchImpl: fetchImpl as any })).reason).toBe("invalid_schema");
    }
  });

  it("times out after the configured time", async () => {
    jest.useFakeTimers();
    try {
      const fetchImpl = jest.fn(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      );
      const pending = runIdCheck({ ...base, fetchImpl: fetchImpl as any, timeoutMs: 60_000 });
      await jest.advanceTimersByTimeAsync(60_000);
      expect(await pending).toEqual({ result: "review", checks: null, reason: "timeout" });
    } finally {
      jest.useRealTimers();
    }
  });

  it("uses a 60 second timeout by default", async () => {
    const spy = jest.spyOn(global, "setTimeout");
    const fetchImpl = jest.fn().mockResolvedValue(modelReply(allGood));
    await runIdCheck({ ...base, fetchImpl: fetchImpl as any });
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 60_000);
    spy.mockRestore();
  });

  it.each([undefined, null, "not-a-school"])("returns review without calling the model for school %p", async (key) => {
    const fetchImpl = jest.fn();
    const out = await runIdCheck({ ...base, profileKey: key, fetchImpl: fetchImpl as any });
    expect(out).toEqual({ result: "review", checks: null, reason: "no_school_profile" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns review when the server is not configured", async () => {
    const fetchImpl = jest.fn();
    const out = await runIdCheck({ ...base, ollamaToken: undefined, fetchImpl: fetchImpl as any });
    expect(out.reason).toBe("not_configured");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("prompt and schema", () => {
  it("fills in the school and never asks for the ID number", () => {
    const prompt = buildPrompt(SCHOOL_PROFILES["umd-college-park"]);
    expect(prompt).toContain("Expected school: University of Maryland");
    expect(prompt).toContain("Do NOT read out or repeat any ID number.");
    expect(prompt.endsWith("Return only JSON.")).toBe(true);
  });

  it("requires exactly the seven boolean checks", () => {
    expect(CHECK_SCHEMA.required).toEqual([...CHECK_KEYS]);
    expect(CHECK_KEYS).toHaveLength(7);
    for (const key of CHECK_KEYS) expect(CHECK_SCHEMA.properties[key]).toEqual({ type: "boolean" });
  });
});
