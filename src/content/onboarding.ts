// English source copy for the Expo port. Full multilingual parity is not part of this port.
export const onboardingCopy = {
  title: "Signup and verification progress",
  steps: {
    account: "Create account",
    email: "Verify email",
    school: "School verified by your school email",
    submission: "Submit school ID",
    review: "School affiliation review",
  },
  states: {
    complete: "Completed",
    current: "Next step",
    locked: "Complete earlier steps first",
  },
  schoolEmail:
    "Your school email is confirmed, so you are verified as a student. No ID is needed.",
  pending: "Your ID is awaiting a human decision. Submission is not approval.",
  rejected:
    "Your submission was rejected. Submit replacement evidence to request another review.",
  reupload:
    "A reviewer requested a new image. Choose or capture a replacement to continue.",
  notice:
    "Email confirmation proves mailbox ownership. It is not a separate CAPTCHA or automated identity check.",
  privacy:
    "Images are private. After a review decision, the app attempts to delete the image; failed deletion requires administrator follow-up.",
} as const;
