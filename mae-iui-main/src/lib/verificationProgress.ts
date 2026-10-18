import { supabase } from "./supabase";

export const reviewStatuses = [
  "pending_email",
  "awaiting_upload",
  "queued",
  "processing",
  "manual_review",
  "needs_reupload",
  "approved",
  "rejected",
] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];
export const verificationMethods = [
  "school_email",
  "id_upload",
  "id_camera",
] as const;
export type VerificationMethod = (typeof verificationMethods)[number];
export type VerificationProgress = {
  emailVerified: boolean;
  humanVerified: boolean;
  schoolVerified: boolean;
  reviewStatus: ReviewStatus | null;
  // How the latest request was made. Null before any request exists.
  method?: VerificationMethod | null;
};
// "optional" steps can be skipped; nothing in the app is locked behind them.
export type ProgressStep = {
  key: "account" | "human" | "submission" | "review";
  state: "complete" | "current" | "optional" | "locked";
};

export function progressSteps(
  progress: VerificationProgress | null,
  signedIn: boolean,
): ProgressStep[] {
  if (!signedIn) {
    return [
      { key: "account", state: "current" },
      { key: "human", state: "locked" },
      { key: "submission", state: "locked" },
      { key: "review", state: "locked" },
    ];
  }
  const status = progress?.reviewStatus ?? "";
  const submitted = ["queued", "processing", "manual_review", "approved"].includes(status);
  // Both an approved request and the saved affiliation are required; neither alone counts.
  const approved = status === "approved" && Boolean(progress?.schoolVerified);
  const needsEvidence = ["awaiting_upload", "needs_reupload", "rejected"].includes(status);
  return [
    { key: "account", state: "complete" },
    { key: "human", state: progress?.humanVerified ? "complete" : "optional" },
    {
      key: "submission",
      state: submitted ? "complete" : needsEvidence ? "current" : "optional",
    },
    { key: "review", state: approved ? "complete" : submitted ? "current" : "optional" },
  ];
}

// No user ID parameter: the database chooses auth.uid(), not a client-supplied owner.
export async function loadVerificationProgress(): Promise<VerificationProgress> {
  const { data, error } = await supabase.rpc("my_verification_progress");
  if (error) throw error;
  if (
    !data ||
    typeof data.email_verified !== "boolean" ||
    typeof data.school_verified !== "boolean" ||
    typeof data.human_verified !== "boolean" ||
    !(
      data.review_status === null || reviewStatuses.includes(data.review_status)
    ) ||
    !(
      data.method === undefined ||
      data.method === null ||
      verificationMethods.includes(data.method)
    )
  ) {
    throw new Error(
      "The verification status could not be validated. Please retry.",
    );
  }
  return {
    emailVerified: data.email_verified,
    humanVerified: data.human_verified,
    schoolVerified: data.school_verified,
    reviewStatus: data.review_status,
    method: data.method ?? null,
  };
}
