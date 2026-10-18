// English source copy for the Expo port. Full multilingual parity is not part of this port.
export const onboardingCopy = {
  title: "Your account and optional verification",
  steps: {
    account: "Create account",
    submission: "Submit school ID",
    review: "School affiliation review",
  },
  states: {
    complete: "Completed",
    current: "Next step",
    optional: "Optional",
    locked: "Complete earlier steps first",
  },
  pending: "Your ID is awaiting a human decision. Submission is not approval.",
  rejected:
    "Your submission was rejected. Submit replacement evidence to request another review.",
  reupload:
    "A reviewer requested a new image. Choose or capture a replacement to continue.",
  notice:
    "Verification is optional. You can use BrainCraze without it. A school ID reviewed by a person earns a verified badge;",
  privacy:
    "Images are private. After a review decision, the app attempts to delete the image; failed deletion requires administrator follow-up.",
} as const;
