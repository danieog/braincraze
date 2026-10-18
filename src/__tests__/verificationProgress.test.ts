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
it("locks all verification steps for visitors and does not trust inconsistent approval flags", () => {
  expect(progressSteps(null, false).map((s) => s.state)).toEqual([
    "current",
    "locked",
    "locked",
    "locked",
    "locked",
  ]);
  expect(
    progressSteps(
      {
        emailVerified: false,
        humanVerified: false,
        schoolVerified: true,
        reviewStatus: "approved",
      },
      true,
    ).map((s) => s.state),
  ).toEqual(["complete", "current", "locked", "locked", "locked"]);
});
it.each(["queued", "processing", "manual_review"] as const)(
  "%s means review pending, never affiliation approved",
  (reviewStatus) => {
    const p = {
      emailVerified: true,
      humanVerified: true,
      schoolVerified: false,
      reviewStatus,
    };
    expect(progressSteps(p, true).map((s) => s.state)).toEqual([
      "complete",
      "complete",
      "complete",
      "complete",
      "current",
    ]);
  },
);
it.each(["rejected", "needs_reupload", "awaiting_upload"] as const)(
  "%s resumes evidence collection",
  (reviewStatus) => {
    expect(
      progressSteps(
        {
          emailVerified: true,
          humanVerified: true,
          schoolVerified: false,
          reviewStatus,
        },
        true,
      ).map((s) => s.state),
    ).toEqual(["complete", "complete", "complete", "current", "locked"]);
  },
);
it("requires both an approved request and saved affiliation for complete status", () => {
  const p: VerificationProgress = {
    emailVerified: true,
    humanVerified: true,
    schoolVerified: false,
    reviewStatus: "approved",
  };
  expect(progressSteps(p, true)[4].state).toBe("current");
  expect(
    progressSteps({ ...p, schoolVerified: true }, true).every(
      (s) => s.state === "complete",
    ),
  ).toBe(true);
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
  });
  expect(mockRpc).toHaveBeenCalledWith("my_verification_progress");
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

it("email confirmation and legacy school approval cannot substitute for human verification", () => {
  expect(
    progressSteps(
      {
        emailVerified: true,
        humanVerified: false,
        schoolVerified: true,
        reviewStatus: "approved",
      },
      true,
    ).map((s) => s.state),
  ).toEqual(["complete", "complete", "current", "locked", "locked"]);
});
