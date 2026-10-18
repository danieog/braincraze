import { webcrypto } from "node:crypto";
import {
  captchaEndpoints,
  verifyCaptcha,
  type CaptchaProvider,
} from "../../supabase/functions/_shared/captcha";
import {
  humanVerificationHandler,
  type HumanBackend,
  type HumanConfig,
} from "../../supabase/functions/_shared/humanVerification";
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});
const nonce = "00000000-0000-0000-0000-000000000123";
const challengeId = "00000000-0000-0000-0000-000000000456";
const proof = () => ({
  success: true,
  hostname: "braincraze.study",
  challenge_ts: new Date().toISOString(),
  action: "braincraze_human",
  cdata: nonce,
});
function mockFetch(value: unknown = proof(), status = 200) {
  return jest.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(value), { status }),
  );
}
const args = {
  secret: "fixture-only-secret",
  token: "fixture-only-token",
  hostnameAllowlist: ["braincraze.study"],
  nonce,
  siteKey: "fixture-only-sitekey",
};
it.each(["turnstile", "hcaptcha", "recaptcha"] as CaptchaProvider[])(
  "%s posts only to the fixed verification service",
  async (provider) => {
    const fetcher = mockFetch();
    expect(await verifyCaptcha({ ...args, provider, fetcher })).toBe(true);
    expect(fetcher.mock.calls[0][0]).toBe(captchaEndpoints[provider]);
    const request = fetcher.mock.calls[0][1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(request.redirect).toBe("error");
    expect(String(request.body)).toContain("response=fixture-only-token");
  },
);
it.each([
  { success: false },
  { success: "true" },
  { hostname: "attacker.example" },
  { challenge_ts: "invalid" },
  { challenge_ts: new Date(Date.now() - 301000).toISOString() },
  { challenge_ts: new Date(Date.now() + 60000).toISOString() },
  { action: "wrong" },
  { cdata: "another-account-challenge" },
])("rejects invalid provider proof %j", async (override) => {
  expect(
    await verifyCaptcha({
      ...args,
      provider: "turnstile",
      fetcher: mockFetch({ ...proof(), ...override }),
    }),
  ).toBe(false);
});
it("fails closed on HTTP errors, invalid JSON, network errors and timeouts", async () => {
  expect(
    await verifyCaptcha({
      ...args,
      provider: "turnstile",
      fetcher: mockFetch(proof(), 503),
    }),
  ).toBe(false);
  expect(
    await verifyCaptcha({
      ...args,
      provider: "turnstile",
      fetcher: jest.fn(async () => new Response("not json")),
    }),
  ).toBe(false);
  expect(
    await verifyCaptcha({
      ...args,
      provider: "turnstile",
      fetcher: jest.fn(async () => {
        throw new Error("offline");
      }),
    }),
  ).toBe(false);
  jest.useFakeTimers();
  try {
    const fetcher: typeof fetch = jest.fn(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("timeout")),
          ),
        ),
    );
    const pending = verifyCaptcha({ ...args, provider: "turnstile", fetcher });
    jest.advanceTimersByTime(8001);
    expect(await pending).toBe(false);
  } finally {
    jest.useRealTimers();
  }
});
const config: HumanConfig = {
  provider: "turnstile",
  secret: args.secret,
  siteKey: args.siteKey,
  hostnames: args.hostnameAllowlist,
  origins: ["https://braincraze.study"],
};
function fixture() {
  const api: jest.Mocked<HumanBackend> = {
    authenticate: jest.fn(async () => ({
      id: "fixture-user",
      sessionId: "fixture-session",
      emailConfirmed: true,
    })),
    start: jest.fn(async () => ({ id: challengeId, nonce })),
    consume: jest
      .fn<
        ReturnType<HumanBackend["consume"]>,
        Parameters<HumanBackend["consume"]>
      >()
      .mockResolvedValue({ nonce }),
    complete: jest
      .fn<
        ReturnType<HumanBackend["complete"]>,
        Parameters<HumanBackend["complete"]>
      >()
      .mockResolvedValue(undefined),
  };
  const fetcher = mockFetch();
  return {
    api,
    fetcher,
    handler: humanVerificationHandler(config, () => api, fetcher),
  };
}
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(
    "https://fixture.supabase.co/functions/v1/human-verification",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer fixture",
        Origin: "https://braincraze.study",
        ...headers,
      },
      body: JSON.stringify(body),
    },
  );
}
const tokenBody = { action: "verify", challengeId, token: "fixture-token" };
it("returns only public challenge configuration and does not expose the server secret", async () => {
  const { handler, api, fetcher } = fixture();
  const response = await handler(request({ action: "start" }));
  expect(response.status).toBe(200);
  expect(await response.text()).not.toContain(args.secret);
  expect(api.start).toHaveBeenCalledTimes(1);
  expect(fetcher).not.toHaveBeenCalled();
});
it("rejects unauthenticated, email-unconfirmed and unconfigured requests before consuming proofs", async () => {
  const { handler, api, fetcher } = fixture();
  expect(
    (await handler(request(tokenBody, { Authorization: "" }))).status,
  ).toBe(401);
  api.authenticate.mockResolvedValueOnce(null);
  expect((await handler(request(tokenBody))).status).toBe(401);
  api.authenticate.mockResolvedValueOnce({
    id: "u",
    sessionId: "s",
    emailConfirmed: false,
  });
  expect((await handler(request(tokenBody))).status).toBe(403);
  const unavailable = humanVerificationHandler(
    { ...config, secret: "" },
    () => api,
    fetcher,
  );
  expect((await unavailable(request(tokenBody))).status).toBe(503);
  expect(api.consume).not.toHaveBeenCalled();
  expect(api.complete).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});
it("consumes a hashed, owner/session-bound proof before contacting the provider, and grants only after provider validation", async () => {
  const { handler, api } = fixture();
  const response = await handler(request(tokenBody));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ verified: true });
  expect(api.consume).toHaveBeenCalledWith(
    challengeId,
    { id: "fixture-user", sessionId: "fixture-session", emailConfirmed: true },
    expect.stringMatching(/^[a-f0-9]{64}$/),
    "turnstile",
  );
  expect(api.complete).toHaveBeenCalledTimes(1);
  expect(api.consume.mock.invocationCallOrder[0]).toBeLessThan(
    api.complete.mock.invocationCallOrder[0],
  );
});
it("does not grant after provider rejection or expired/replayed/mismatched challenge", async () => {
  const { api } = fixture();
  const fetcher = mockFetch({ ...proof(), success: false });
  const handler = humanVerificationHandler(config, () => api, fetcher);
  expect((await handler(request(tokenBody))).status).toBe(422);
  expect(api.complete).not.toHaveBeenCalled();
  api.consume.mockRejectedValueOnce(new Error("expired or replayed"));
  fetcher.mockClear();
  expect((await handler(request(tokenBody))).status).toBe(409);
  expect(fetcher).not.toHaveBeenCalled();
});
it("does not report success when the session was revoked during provider verification", async () => {
  const { handler, api } = fixture();
  api.complete.mockRejectedValueOnce(new Error("session unavailable"));
  const response = await handler(request(tokenBody));
  expect(response.status).toBe(409);
  expect(await response.text()).not.toContain('"verified":true');
});
it("rejects forged user IDs, cross-origin requests and oversized payloads", async () => {
  const { handler, api } = fixture();
  expect(
    (await handler(request({ ...tokenBody, userId: "someone-else" }))).status,
  ).toBe(400);
  expect(
    (await handler(request(tokenBody, { Origin: "https://attacker.example" })))
      .status,
  ).toBe(403);
  expect(
    (await handler(request({ action: "start", padding: "x".repeat(9000) })))
      .status,
  ).toBe(413);
  expect(api.complete).not.toHaveBeenCalled();
});
