import {
  loadVerificationProgress,
  progressSteps,
  type VerificationProgress,
} from "../lib/verificationProgress";
const mockRpc = jest.fn();
jest.mock("../lib/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));
beforeEach(() => jest.resetAllMocks());
const base: VerificationProgress = {
  emailVerified: true,
  humanVerified: false,
  schoolVerified: false,
  reviewStatus: null,
};
const states = (p: VerificationProgress | null, signedIn = true) =>
  progressSteps(p, signedIn).map((s) => s.state);

it("locks the optional steps for visitors and offers sign up first", () => {
  expect(states(null, false)).toEqual(["current", "locked", "locked", "locked"]);
});
it("a new account has every verification step optional and nothing locked", () => {
  expect(states(base)).toEqual(["complete", "optional", "optional", "optional"]);
  expect(states(null)).toEqual(["complete", "optional", "optional", "optional"]);
});
it("does not need a confirmed email for anything", () => {
  expect(states({ ...base, emailVerified: false })).toEqual(states(base));
});
it("the human check is independent of the school ID", () => {
  expect(states({ ...base, humanVerified: true })).toEqual([
    "complete",
    "complete",
    "optional",
    "optional",
  ]);
});
it.each(["queued", "processing", "manual_review"] as const)(
  "%s means review pending, never affiliation approved",
  (reviewStatus) => {
    expect(states({ ...base, reviewStatus })).toEqual([
      "complete",
      "optional",
      "complete",
      "current",
    ]);
  },
);
it.each(["rejected", "needs_reupload", "awaiting_upload"] as const)(
  "%s resumes evidence collection",
  (reviewStatus) => {
    expect(states({ ...base, reviewStatus })).toEqual([
      "complete",
      "optional",
      "current",
      "optional",
    ]);
  },
);
it("requires both an approved request and saved affiliation for complete status", () => {
  const p = { ...base, reviewStatus: "approved" as const };
  expect(progressSteps(p, true)[3].state).toBe("current");
  expect(
    progressSteps({ ...p, schoolVerified: true }, true)[3].state,
  ).toBe("complete");
  // An affiliation flag with no approved request is not trusted either.
  expect(states({ ...base, schoolVerified: true })).toEqual([
    "complete",
    "optional",
    "optional",
    "optional",
  ]);
});
it("uses an owner-selected database RPC without accepting a client-supplied user ID", async () => {
  mockRpc.mockResolvedValue({
    data: {
      email_verified: true,
      human_verified: true,
      school_verified: false,
      review_status: "manual_review",
    },
    error: null,
  });
  await expect(loadVerificationProgress()).resolves.toEqual({
    emailVerified: true,
    humanVerified: true,
    schoolVerified: false,
    reviewStatus: "manual_review",
    method: null,
  });
  expect(mockRpc).toHaveBeenCalledWith("my_verification_progress");
});
it("accepts a known method and rejects an unknown one", async () => {
  const data = {
    email_verified: true,
    human_verified: false,
    school_verified: true,
    review_status: "approved",
  };
  mockRpc.mockResolvedValueOnce({ data: { ...data, method: "id_upload" }, error: null });
  await expect(loadVerificationProgress()).resolves.toMatchObject({
    method: "id_upload",
  });
  mockRpc.mockResolvedValueOnce({ data: { ...data, method: "made_up" }, error: null });
  await expect(loadVerificationProgress()).rejects.toThrow(/validated/);
});
it("fails closed on missing migration, unknown states and forged boolean strings", async () => {
  mockRpc.mockResolvedValueOnce({
    data: null,
    error: new Error("function missing"),
  });
  await expect(loadVerificationProgress()).rejects.toThrow("function missing");
  for (const data of [
    null,
    {
      email_verified: "true",
      human_verified: true,
      school_verified: true,
      review_status: "approved",
    },
    {
      email_verified: true,
      school_verified: true,
      review_status: "approved",
    },
    {
      email_verified: true,
      human_verified: true,
      school_verified: true,
      review_status: "fake_approval",
    },
  ]) {
    mockRpc.mockResolvedValueOnce({ data, error: null });
    await expect(loadVerificationProgress()).rejects.toThrow(/validated/);
  }
});
