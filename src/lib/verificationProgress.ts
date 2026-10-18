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
  schoolVerified: boolean;
  reviewStatus: ReviewStatus | null;
  // How the latest request was made. Absent or null before migration 005 or before any request exists.
  method?: VerificationMethod | null;
};
export type ProgressStep = {
  key: "account" | "email" | "school" | "submission" | "review";
  state: "complete" | "current" | "locked";
};

// A school-email signup is verified by confirming the email, so the ID steps do not apply to it.
export function verifiedBySchoolEmail(
  progress: VerificationProgress | null,
): boolean {
  return Boolean(
    progress?.emailVerified &&
      progress.schoolVerified &&
      progress.reviewStatus === "approved" &&
      progress.method === "school_email",
  );
}

export function progressSteps(
  progress: VerificationProgress | null,
  signedIn: boolean,
): ProgressStep[] {
  const email = signedIn && Boolean(progress?.emailVerified);
  if (signedIn && verifiedBySchoolEmail(progress)) {
    return [
      { key: "account", state: "complete" },
      { key: "email", state: "complete" },
      { key: "school", state: "complete" },
    ];
  }
  const submitted =
    email &&
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
    !(
      data.review_status === null || reviewStatuses.includes(data.review_status)
    ) ||
    // Before migration 005 the RPC has no method field; treat that as unknown, not as an error.
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
    schoolVerified: data.school_verified,
    reviewStatus: data.review_status,
    method: data.method ?? null,
  };
}
