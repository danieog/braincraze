// School profiles for the ID check. The profile for the school the user claimed is injected into the
// model prompt, so adding a school = adding one entry here (plus setting schools.profile_key in the DB).
// Describe only what you have verified on a real card. Never ask the model to read the ID number.

export type SchoolProfile = {
  schoolName: string;
  description: string;
};

export const SCHOOL_PROFILES: Record<string, SchoolProfile> = {
  "umd-college-park": {
    schoolName: "University of Maryland",
    // TODO [VERIFY]: the red-background rule below comes from the original spec, but the card description
    // supplied later only says the photo sits on the white card. Check a real card.
    // TODO [VERIFY]: confirm the exact classification/status wording printed in red, and whether faculty,
    // staff and affiliates get the same card layout.
    // No expiry date is required: UMD cards are used for the whole enrollment.
    description: [
      "- A horizontally oriented rectangular card with rounded corners, a thin black border, and a mostly white background, using red, black, white and gold.",
      "- The words UNIVERSITY OF MARYLAND run vertically in narrow black serif lettering along the far left edge, with a small round university seal (red, gold, black, white) in the bottom-left corner.",
      "- The cardholder's name is across the top in black, with a thin red line under it.",
      "- A rectangular color head-and-shoulders photo of the cardholder on a SOLID RED background, in the middle-left, taking up much of the card's height.",
      "- To the right of the photo: the cardholder's classification or status in red sans-serif text on one or two lines, and a signature area in black below it.",
      "- In the lower right: the label \"U ID:\" followed by a 9-digit ID number (never read it out), and a smaller issue-date line underneath.",
      "- A large, bold, red collegiate letter M in the bottom-right corner.",
      "- The back of the card has a barcode.",
    ].join("\n"),
  },
};
