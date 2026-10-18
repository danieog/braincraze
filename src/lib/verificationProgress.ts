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
export type VerificationProgress = {
  emailVerified: boolean;
  humanVerified: boolean;
  schoolVerified: boolean;
  reviewStatus: ReviewStatus | null;
};
export type ProgressStep = {
  key: "account" | "email" | "human" | "submission" | "review";
  state: "complete" | "current" | "locked";
};

export function progressSteps(
  progress: VerificationProgress | null,
  signedIn: boolean,
): ProgressStep[] {
  const email = signedIn && Boolean(progress?.emailVerified);
  const human = email && Boolean(progress?.humanVerified);
  const submitted =
    human &&
    ["queued", "processing", "manual_review", "approved"].includes(
      progress?.reviewStatus ?? "",
    );
  const approved =
    submitted &&
    progress?.reviewStatus === "approved" &&
    Boolean(progress.schoolVerified);
  const steps = [
    { key: "account" as const, done: signedIn },
    { key: "email" as const, done: email },
    { key: "human" as const, done: human },
    { key: "submission" as const, done: submitted },
    { key: "review" as const, done: approved },
  ];
  let locked = false;
  return steps.map(({ key, done }) => {
    const state = locked ? "locked" : done ? "complete" : "current";
    if (!done) locked = true;
    return { key, state };
  });
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
  };
}
