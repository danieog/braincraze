export type Role = "student" | "faculty" | "teaching_assistant" | "tutor" | "staff";

export const ROLES: Role[] = [
  "student",
  "faculty",
  "teaching_assistant",
  "tutor",
  "staff",
];

export type School = {
  id: string;
  name: string;
  domain: string;
  location: string;
};

export const INITIAL_SCHOOLS: School[] = [
  { id: "stanford", name: "Stanford University", domain: "stanford.edu", location: "Stanford, CA" },
  { id: "berkeley", name: "UC Berkeley", domain: "berkeley.edu", location: "Berkeley, CA" },
  { id: "mit", name: "Massachusetts Institute of Technology", domain: "mit.edu", location: "Cambridge, MA" },
  { id: "harvard", name: "Harvard University", domain: "harvard.edu", location: "Cambridge, MA" },
  { id: "ucla", name: "UCLA", domain: "ucla.edu", location: "Los Angeles, CA" },
  { id: "columbia", name: "Columbia University", domain: "columbia.edu", location: "New York, NY" },
  { id: "uw", name: "University of Washington", domain: "uw.edu", location: "Seattle, WA" },
  { id: "cmu", name: "Carnegie Mellon University", domain: "cmu.edu", location: "Pittsburgh, PA" },
];

export type ReviewStatus =
  | "pending_email"
  | "awaiting_upload"
  | "queued"
  | "processing"
  | "manual_review"
  | "needs_reupload"
  | "approved"
  | "rejected";

export type VerificationMethod = "school_email" | "id_upload" | "id_camera";

export type VerificationProgress = {
  emailVerified: boolean;
  humanVerified: boolean;
  schoolVerified: boolean;
  reviewStatus: ReviewStatus | null;
  method: VerificationMethod | null;
};

export type ProgressStep = {
  key: "account" | "human" | "submission" | "review";
  state: "complete" | "current" | "optional" | "locked";
};

// Study Buddy Avatar (Mii / Animal Crossing / Tomodachi Life inspired)
export interface BuddyAvatar {
  faceShape: "round" | "chibi" | "heart" | "oval";
  skinColor: string;
  hairStyle: "mii_short" | "ac_wavy" | "tomodachi_bob" | "spiky" | "curly" | "twintails" | "slick" | "afro" | "cap";
  hairColor: string;
  eyeStyle: "ac_dot" | "mii_oval" | "anime_sparkle" | "chill" | "glasses_round" | "glasses_nerd";
  eyeColor: string;
  mouthStyle: "smile" | "cat_w" | "grin" | "open" | "blush_smile";
  outfit: "hoodie" | "school_uniform" | "sweater_vest" | "faculty_robe" | "cardigan" | "athletic";
  outfitColor: string;
  accessory: "none" | "grad_cap" | "cat_ears" | "headband" | "star_pin" | "pencil_ear" | "coffee_mug";
  mood: "happy" | "thinking" | "alarmed" | "celebrating" | "sleeping";
}

export interface BuddySettings {
  name: string;
  cursorFollow: boolean; // cursor location follow (can be turned off manually)
  notificationsEnabled: boolean;
  forcedMode: boolean; // bypasses user choices, sends automated email/SMS, can freeze/block screen
  phoneNumber?: string;
  screenBlockLevel: "mini" | "freeze_tab"; // blocking small portion or freezing window until opened
}

export type NotificationCategory =
  | "missing_assignment"
  | "upcoming_assignment"
  | "past_due_assignment"
  | "schedule_change"
  | "nearby_study"
  | "faculty_message";

export interface BuddyNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  urgency: "low" | "medium" | "high" | "critical";
  timestamp: string;
  courseOrSender?: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  isDismissed: boolean;
  isForcedBypass?: boolean; // Sent via forced email/SMS bypass
  dispatchedChannels?: ("in_app" | "email" | "sms")[];
}

export interface MediaPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface MediaVideo {
  id: string;
  url: string;
  title: string;
  durationMinutes: number; // Max 10 min for free, 60 min for premium
  uploadedAt: string;
}

export interface TumblrSticker {
  id: string;
  label: string;
  iconName: string;
  animated: boolean; // only premium can use animated
  x: number;
  y: number;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  share_location: boolean;
  latitude?: number;
  longitude?: number;
  last_active?: string;
  role?: Role;
  school_id?: string;
  school_name?: string;
  verified_badge?: boolean;

  // New Avatar & Profile features:
  avatarSource: "buddy" | "selfie"; // flip profile picture between selfie and buddy
  selfieUrl?: string;
  buddyAvatar: BuddyAvatar;
  buddySettings: BuddySettings;

  // Profile Blog Customization:
  isPremium: boolean;
  bio: string;
  headerBanner?: string; // custom gradient or image URL for profile header
  customHtml: string;
  theme: "cream_minimal" | "retro_tumblr" | "y2k_sparkle" | "vaporwave" | "dark_academia" | "lofi_study";
  animatedBackground?: string; // only available if isPremium
  stickers: TumblrSticker[];
  photos: MediaPhoto[];
  videos: MediaVideo[];
}

export const UPLOAD_LIMITS = {
  free: {
    maxPhotos: 10,
    maxVideos: 3,
    maxVideoDurationMinutes: 10,
  },
  premium: {
    maxPhotos: 25,
    maxVideos: 10,
    maxVideoDurationMinutes: 60,
  },
} as const;

export type NearbyUser = {
  id: string;
  display_name: string;
  role?: Role;
  school_name?: string;
  verified_badge?: boolean;
  distance_bucket: string;
  distance_miles: number;
  avatarSource?: "buddy" | "selfie";
  selfieUrl?: string;
  buddyAvatar?: BuddyAvatar;
};

export type QueueItem = {
  request_id: string;
  user_id: string;
  display_name: string | null;
  role: Role;
  school_name: string;
  school_email: string | null;
  status: ReviewStatus;
  id_check_result: "pass" | "review" | null;
  id_check_reason: string | null;
  id_check_checks: Record<string, boolean> | null;
  id_path: string | null;
  submitted_at: string;
};
