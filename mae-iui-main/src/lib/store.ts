import {
  Profile,
  QueueItem,
  Role,
  School,
  INITIAL_SCHOOLS,
  VerificationProgress,
  NearbyUser,
  BuddyAvatar,
  BuddySettings,
  BuddyNotification,
  NotificationCategory,
  MediaPhoto,
  MediaVideo,
} from "./types";

const STORAGE_KEY = "braincraze_state_v2";

export const DEFAULT_BUDDY_AVATAR: BuddyAvatar = {
  faceShape: "round",
  skinColor: "#fcd5b4",
  hairStyle: "ac_wavy",
  hairColor: "#5a3d28",
  eyeStyle: "ac_dot",
  eyeColor: "#2b2340",
  mouthStyle: "smile",
  outfit: "hoodie",
  outfitColor: "#6b4fbb",
  accessory: "star_pin",
  mood: "happy",
};

export const DEFAULT_BUDDY_SETTINGS: BuddySettings = {
  name: "Pippin",
  cursorFollow: true,
  notificationsEnabled: true,
  forcedMode: false,
  screenBlockLevel: "freeze_tab",
};

const DEFAULT_SAMPLE_PHOTOS: MediaPhoto[] = [
  {
    id: "p-1",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
    caption: "Late night library cram session with the CS study group ☕",
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "p-2",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80",
    caption: "Sunny afternoon between lectures on the campus quad ☀️",
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const DEFAULT_SAMPLE_VIDEOS: MediaVideo[] = [
  {
    id: "v-1",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
    title: "Linear Algebra Eigenvalues Speedrun (Part 1)",
    durationMinutes: 7,
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: BuddyNotification[] = [
  {
    id: "notif-1",
    category: "past_due_assignment",
    title: "PAST DUE: CS106B Priority Queue Assignment",
    body: "The assignment was due yesterday at 11:59 PM. Submit immediately to minimize late penalty!",
    urgency: "critical",
    courseOrSender: "CS 106B · Prof. Elena Chen",
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
    isRead: false,
    isDismissed: false,
    actionLabel: "Submit Solution",
    dispatchedChannels: ["in_app", "email", "sms"],
  },
  {
    id: "notif-2",
    category: "missing_assignment",
    title: "Missing Submission: Chem 31A Lab Report 3",
    body: "No submission recorded on Canvas/portal. Verify upload receipt with your teaching assistant.",
    urgency: "high",
    courseOrSender: "Chemistry 31A · Marcus Kim (TA)",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    isRead: false,
    isDismissed: false,
    actionLabel: "Check Portal",
  },
  {
    id: "notif-3",
    category: "upcoming_assignment",
    title: "Upcoming: Math 51 Problem Set 6 Due Tomorrow",
    body: "Multivariable calculus p-set due tomorrow at 5:00 PM. 4 problems remaining.",
    urgency: "medium",
    courseOrSender: "Math 51 · Linear Algebra & Calc",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    isDismissed: false,
    actionLabel: "Open PDF",
  },
  {
    id: "notif-4",
    category: "schedule_change",
    title: "Class Location Change: Physics 21",
    body: "Today's lecture moved from Hewlett 200 to Cubberley Auditorium at 2:15 PM.",
    urgency: "medium",
    courseOrSender: "Google Calendar Sync",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    isRead: false,
    isDismissed: false,
    actionLabel: "View Calendar",
  },
  {
    id: "notif-5",
    category: "nearby_study",
    title: "Study Partner Nearby: Green Library (0.4 mi)",
    body: "Marcus Kim (TA) and 2 verified classmates are studying CS Algorithms at 2nd floor quiet room.",
    urgency: "low",
    courseOrSender: "Nearby Campus Radar (<25 mi)",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: false,
    isDismissed: false,
    actionLabel: "Join Group",
  },
  {
    id: "notif-6",
    category: "faculty_message",
    title: "Faculty Mail: Extra Office Hours Today",
    body: "Dr. Chen: 'I am extending office hours until 5:00 PM today in Gates Hall 210 for project questions.'",
    urgency: "medium",
    courseOrSender: "Prof. Elena Chen (Faculty Buddy)",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    isRead: false,
    isDismissed: false,
    actionLabel: "Reply to Prof",
  },
];

const DEFAULT_USERS: Record<string, Profile> = {
  "user-student-1": {
    id: "user-student-1",
    email: "sarah.miller@stanford.edu",
    display_name: "Sarah Miller",
    share_location: true,
    latitude: 37.4275,
    longitude: -122.1697,
    role: "student",
    school_id: "stanford",
    school_name: "Stanford University",
    verified_badge: true,
    avatarSource: "buddy",
    selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    buddyAvatar: {
      faceShape: "round",
      skinColor: "#fcd5b4",
      hairStyle: "ac_wavy",
      hairColor: "#5a3d28",
      eyeStyle: "ac_dot",
      eyeColor: "#2b2340",
      mouthStyle: "smile",
      outfit: "hoodie",
      outfitColor: "#6b4fbb",
      accessory: "star_pin",
      mood: "happy",
    },
    buddySettings: {
      name: "Pippin",
      cursorFollow: true,
      notificationsEnabled: true,
      forcedMode: true, // showcase forced mode by default
      screenBlockLevel: "freeze_tab",
    },
    isPremium: true,
    bio: "Computer Science & Cognitive Systems @ Stanford '27 · Always in Green Library · Studying algorithms & AI ethics",
    customHtml: `<div style="padding: 16px; background: rgba(255,255,255,0.9); border-radius: 18px; border: 2px solid #D9D0E8;">
  <marquee behavior="scroll" direction="left" style="font-weight: bold; color: #6B4FBB; font-size: 13px;">
    ★ Welcome to Sarah's BrainCraze Tumblr! CS106B study notes & campus photography below ★
  </marquee>
  <div style="display: flex; gap: 14px; margin-top: 10px; font-size: 12px; color: #4A4458;">
    <span>💻 Project: Binary Search Trees</span> • <span>📍 Location: Stanford, CA</span>
  </div>
</div>`,
    theme: "y2k_sparkle",
    animatedBackground: "animate-rainbow bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400",
    stickers: [
      { id: "s-1", label: "Twinkling Star", iconName: "✨", animated: true, x: 20, y: 10 },
      { id: "s-2", label: "Study Streak", iconName: "🔥", animated: true, x: 70, y: 30 },
      { id: "s-3", label: "Coffee", iconName: "☕", animated: false, x: 45, y: 50 },
    ],
    photos: [...DEFAULT_SAMPLE_PHOTOS],
    videos: [...DEFAULT_SAMPLE_VIDEOS],
  },
  "user-ta-1": {
    id: "user-ta-1",
    email: "marcus.k@berkeley.edu",
    display_name: "Marcus Kim",
    share_location: true,
    latitude: 37.432,
    longitude: -122.175,
    role: "teaching_assistant",
    school_id: "berkeley",
    school_name: "UC Berkeley",
    verified_badge: true,
    avatarSource: "buddy",
    selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    buddyAvatar: {
      faceShape: "chibi",
      skinColor: "#fee3d4",
      hairStyle: "tomodachi_bob",
      hairColor: "#2c221e",
      eyeStyle: "glasses_round",
      eyeColor: "#1e1b4b",
      mouthStyle: "cat_w",
      outfit: "school_uniform",
      outfitColor: "#3b82f6",
      accessory: "pencil_ear",
      mood: "happy",
    },
    buddySettings: {
      name: "Mochi",
      cursorFollow: true,
      notificationsEnabled: true,
      forcedMode: false,
      screenBlockLevel: "freeze_tab",
    },
    isPremium: false,
    bio: "Teaching Assistant for EECS 126 @ UC Berkeley. Check out my study notes & review problem sets!",
    customHtml: `<div style="padding: 14px; background: #FFF8F0; border-left: 4px solid #6B4FBB; border-radius: 8px;">
  <p style="font-style: italic; margin: 0; font-size: 13px;">"If you can't explain it simply, you don't understand it well enough."</p>
</div>`,
    theme: "cream_minimal",
    stickers: [
      { id: "s-4", label: "Textbook", iconName: "📚", animated: false, x: 20, y: 15 },
    ],
    photos: [],
    videos: [],
  },
  "user-faculty-1": {
    id: "user-faculty-1",
    email: "dr.chen@stanford.edu",
    display_name: "Prof. Elena Chen",
    share_location: true,
    latitude: 37.424,
    longitude: -122.162,
    role: "faculty",
    school_id: "stanford",
    school_name: "Stanford University",
    verified_badge: true,
    avatarSource: "buddy",
    buddyAvatar: {
      faceShape: "oval",
      skinColor: "#c68642",
      hairStyle: "curly",
      hairColor: "#94a3b8",
      eyeStyle: "glasses_nerd",
      eyeColor: "#1f2937",
      mouthStyle: "smile",
      outfit: "faculty_robe",
      outfitColor: "#18181b",
      accessory: "grad_cap",
      mood: "happy",
    },
    buddySettings: {
      name: "Prof. Owl",
      cursorFollow: true,
      notificationsEnabled: true,
      forcedMode: false,
      screenBlockLevel: "freeze_tab",
    },
    isPremium: true,
    bio: "Associate Professor of Computer Science. Research: Distributed Algorithms, Verification & Academic Mentorship.",
    customHtml: `<div style="padding: 16px; background: #1a102f; color: #67e8f9; border-radius: 16px; border: 2px dashed #8b5cf6;">
  <h4 style="margin: 0 0 6px 0; color: #f472b6;">[FACULTY PORTAL: DR. CHEN]</h4>
  <p style="margin: 0; font-size: 12px;">Office Hours: Mon/Wed 3:30 - 5:00 PM @ Gates Hall 210. Automated reminders pushed to student buddies.</p>
</div>`,
    theme: "dark_academia",
    stickers: [
      { id: "s-5", label: "Cap", iconName: "🎓", animated: false, x: 10, y: 10 },
      { id: "s-6", label: "Lightning", iconName: "⚡", animated: true, x: 80, y: 20 },
    ],
    photos: [],
    videos: [],
  },
};

const DEFAULT_VERIFICATION: Record<string, VerificationProgress> = {
  "user-student-1": {
    emailVerified: true,
    humanVerified: true,
    schoolVerified: true,
    reviewStatus: "approved",
    method: "id_upload",
  },
  "user-ta-1": {
    emailVerified: true,
    humanVerified: true,
    schoolVerified: true,
    reviewStatus: "approved",
    method: "id_upload",
  },
  "user-faculty-1": {
    emailVerified: true,
    humanVerified: true,
    schoolVerified: true,
    reviewStatus: "approved",
    method: "id_upload",
  },
};

const SAMPLE_ID_IMAGE = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";

const DEFAULT_QUEUE: QueueItem[] = [
  {
    request_id: "req-101",
    user_id: "user-ta-1",
    display_name: "Marcus Kim",
    role: "teaching_assistant",
    school_name: "UC Berkeley",
    school_email: "marcus.k@berkeley.edu",
    status: "queued",
    id_check_result: "pass",
    id_check_reason: "High OCR confidence on student ID badge",
    id_check_checks: {
      name_match: true,
      school_seal_detected: true,
      valid_expiration: true,
      unedited_photo: true,
    },
    id_path: SAMPLE_ID_IMAGE,
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

interface AppState {
  currentUser: Profile | null;
  users: Record<string, Profile>;
  verificationProgress: Record<string, VerificationProgress>;
  adminQueue: QueueItem[];
  notifications: BuddyNotification[];
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentUser: parsed.currentUser || DEFAULT_USERS["user-student-1"],
        users: { ...DEFAULT_USERS, ...(parsed.users || {}) },
        verificationProgress: { ...DEFAULT_VERIFICATION, ...(parsed.verificationProgress || {}) },
        adminQueue: Array.isArray(parsed.adminQueue) ? parsed.adminQueue : DEFAULT_QUEUE,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : DEFAULT_NOTIFICATIONS,
      };
    }
  } catch {
    // ignore
  }
  return {
    currentUser: DEFAULT_USERS["user-student-1"],
    users: { ...DEFAULT_USERS },
    verificationProgress: { ...DEFAULT_VERIFICATION },
    adminQueue: [...DEFAULT_QUEUE],
    notifications: [...DEFAULT_NOTIFICATIONS],
  };
}

let state: AppState = loadState();
type Listener = () => void;
const listeners = new Set<Listener>();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota
  }
  listeners.forEach((l) => l());
}

export const subscribeToStore = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getCurrentUser = () => state.currentUser;

export const getVerificationProgress = (userId?: string): VerificationProgress => {
  const uid = userId || state.currentUser?.id;
  if (!uid) {
    return {
      emailVerified: false,
      humanVerified: false,
      schoolVerified: false,
      reviewStatus: null,
      method: null,
    };
  }
  return (
    state.verificationProgress[uid] || {
      emailVerified: true,
      humanVerified: false,
      schoolVerified: false,
      reviewStatus: null,
      method: null,
    }
  );
};

export const listSchools = (): School[] => INITIAL_SCHOOLS;

export const signUpUser = async (email: string, _password?: string): Promise<Profile> => {
  const id = `user-${Date.now()}`;
  const adjectives = ["Sleepy", "Curious", "Brave", "Cozy", "Sunny", "Gentle", "Clever"];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomName = `${randomAdj} Possum ${Math.floor(10 + Math.random() * 90)}`;

  const profile: Profile = {
    id,
    email: email.trim(),
    display_name: randomName,
    share_location: false,
    verified_badge: false,
    avatarSource: "buddy",
    buddyAvatar: { ...DEFAULT_BUDDY_AVATAR },
    buddySettings: { ...DEFAULT_BUDDY_SETTINGS },
    isPremium: false,
    bio: "New student on BrainCraze! Exploring study groups nearby.",
    customHtml: `<div style="padding: 14px; background: rgba(255,255,255,0.85); border-radius: 14px;">
  <p style="margin: 0; font-weight: bold; color: #6B4FBB;">★ Welcome to my new BrainCraze study profile! ★</p>
</div>`,
    theme: "cream_minimal",
    stickers: [],
    photos: [],
    videos: [],
  };

  state.users[id] = profile;
  state.currentUser = profile;
  state.verificationProgress[id] = {
    emailVerified: true,
    humanVerified: false,
    schoolVerified: false,
    reviewStatus: null,
    method: null,
  };

  saveState();
  return profile;
};

export const logInUser = async (email: string): Promise<Profile> => {
  const existing = Object.values(state.users).find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (existing) {
    state.currentUser = existing;
    saveState();
    return existing;
  }

  return signUpUser(email);
};

export const logOutUser = async () => {
  state.currentUser = null;
  saveState();
};

export const switchUser = (userId: string) => {
  if (state.users[userId]) {
    state.currentUser = state.users[userId];
    saveState();
  }
};

export const updateDisplayName = async (name: string) => {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;
  state.currentUser.display_name = name.trim();
  if (state.users[uid]) {
    state.users[uid].display_name = name.trim();
  }
  saveState();
};

export const updateLocation = async (lat: number, lng: number, enabled: boolean) => {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;
  state.currentUser.share_location = enabled;
  state.currentUser.latitude = lat;
  state.currentUser.longitude = lng;
  state.currentUser.last_active = new Date().toISOString();

  if (state.users[uid]) {
    state.users[uid].share_location = enabled;
    state.users[uid].latitude = lat;
    state.users[uid].longitude = lng;
    state.users[uid].last_active = new Date().toISOString();
  }
  saveState();
};

export const stopLocationSharing = async () => {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;
  state.currentUser.share_location = false;
  state.currentUser.latitude = undefined;
  state.currentUser.longitude = undefined;

  if (state.users[uid]) {
    state.users[uid].share_location = false;
    delete state.users[uid].latitude;
    delete state.users[uid].longitude;
  }
  saveState();
};

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getNearbyUsers = (): NearbyUser[] => {
  const current = state.currentUser;
  if (!current || !current.share_location || current.latitude == null || current.longitude == null) {
    return [];
  }

  const result: NearbyUser[] = [];
  const MAX_RADIUS = 25; // no more than 25 miles as required!

  for (const user of Object.values(state.users)) {
    if (user.id === current.id) continue;
    if (!user.share_location || user.latitude == null || user.longitude == null) continue;

    const dist = getDistanceMiles(current.latitude, current.longitude, user.latitude, user.longitude);
    if (dist <= MAX_RADIUS) {
      let bucket = "< 0.5 miles away";
      if (dist >= 0.5 && dist < 1) bucket = "~0.8 miles away";
      else if (dist >= 1 && dist < 3) bucket = `~${Math.round(dist)} miles away`;
      else if (dist >= 3 && dist < 10) bucket = `~${Math.round(dist)} miles away`;
      else bucket = `Within ${Math.ceil(dist / 5) * 5} miles`;

      result.push({
        id: user.id,
        display_name: user.display_name,
        role: user.role,
        school_name: user.school_name,
        verified_badge: user.verified_badge,
        distance_bucket: bucket,
        distance_miles: Number(dist.toFixed(1)),
        avatarSource: user.avatarSource,
        selfieUrl: user.selfieUrl,
        buddyAvatar: user.buddyAvatar,
      });
    }
  }

  return result.sort((a, b) => a.distance_miles - b.distance_miles);
};

export const completeHumanVerification = async () => {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;
  const currentProg = getVerificationProgress(uid);
  state.verificationProgress[uid] = {
    ...currentProg,
    humanVerified: true,
  };
  saveState();
};

export const submitSchoolId = async (params: {
  schoolId: string;
  role: Role;
  imageDataUri: string;
}) => {
  if (!state.currentUser) throw new Error("Must be logged in");
  const uid = state.currentUser.id;
  const school = INITIAL_SCHOOLS.find((s) => s.id === params.schoolId);
  const schoolName = school ? school.name : "Academic Institution";

  const requestId = `req-${Date.now()}`;
  const newQueueItem: QueueItem = {
    request_id: requestId,
    user_id: uid,
    display_name: state.currentUser.display_name,
    role: params.role,
    school_name: schoolName,
    school_email: state.currentUser.email,
    status: "queued",
    id_check_result: "pass",
    id_check_reason: "Student ID photo uploaded. OCR matched name and institution seal.",
    id_check_checks: {
      name_match: true,
      school_seal_detected: true,
      valid_expiration: true,
      unedited_photo: true,
    },
    id_path: params.imageDataUri,
    submitted_at: new Date().toISOString(),
  };

  state.adminQueue.unshift(newQueueItem);

  const currentProg = getVerificationProgress(uid);
  state.verificationProgress[uid] = {
    ...currentProg,
    reviewStatus: "queued",
    method: "id_upload",
  };

  if (state.users[uid]) {
    state.users[uid].role = params.role;
    state.users[uid].school_id = params.schoolId;
    state.users[uid].school_name = schoolName;
  }
  if (state.currentUser.id === uid) {
    state.currentUser.role = params.role;
    state.currentUser.school_id = params.schoolId;
    state.currentUser.school_name = schoolName;
  }

  saveState();
  return requestId;
};

export const getAdminQueue = (): QueueItem[] => {
  return state.adminQueue;
};

export const adminDecide = async (
  requestId: string,
  decision: "approved" | "rejected",
  _note?: string,
) => {
  const itemIndex = state.adminQueue.findIndex((q) => q.request_id === requestId);
  if (itemIndex === -1) return;
  const item = state.adminQueue[itemIndex];

  item.status = decision;
  item.id_path = null;

  const uid = item.user_id;
  const currentProg = getVerificationProgress(uid);
  state.verificationProgress[uid] = {
    ...currentProg,
    reviewStatus: decision,
    schoolVerified: decision === "approved",
  };

  const hasBadge = decision === "approved";
  if (state.users[uid]) state.users[uid].verified_badge = hasBadge;
  if (state.currentUser && state.currentUser.id === uid) state.currentUser.verified_badge = hasBadge;

  state.adminQueue.splice(itemIndex, 1);
  saveState();
};

export const adminRequestReupload = async (requestId: string, _note?: string) => {
  const itemIndex = state.adminQueue.findIndex((q) => q.request_id === requestId);
  if (itemIndex === -1) return;
  const item = state.adminQueue[itemIndex];

  item.status = "needs_reupload";
  item.id_path = null;

  const uid = item.user_id;
  const currentProg = getVerificationProgress(uid);
  state.verificationProgress[uid] = {
    ...currentProg,
    reviewStatus: "needs_reupload",
    schoolVerified: false,
  };

  state.adminQueue.splice(itemIndex, 1);
  saveState();
};

/* --- Profile & Buddy Store Methods --- */

export const updateUserProfile = (updates: Partial<Profile>) => {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;

  state.currentUser = {
    ...state.currentUser,
    ...updates,
  };

  if (state.users[uid]) {
    state.users[uid] = {
      ...state.users[uid],
      ...updates,
    };
  }

  saveState();
};

export const updateBuddyCustomization = (
  avatar: BuddyAvatar,
  settings: BuddySettings,
  selfieUrl?: string,
) => {
  if (!state.currentUser) return;

  const updates: Partial<Profile> = {
    buddyAvatar: avatar,
    buddySettings: settings,
  };
  if (selfieUrl) {
    updates.selfieUrl = selfieUrl;
  }

  updateUserProfile(updates);
};

/* --- Notification Store Methods --- */

export const getNotifications = (): BuddyNotification[] => {
  return state.notifications;
};

export const markNotificationRead = (id: string) => {
  const notif = state.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    saveState();
  }
};

export const markAllNotificationsRead = () => {
  state.notifications.forEach((n) => {
    n.isRead = true;
  });
  saveState();
};

export const dismissNotification = (id: string) => {
  const notif = state.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isDismissed = true;
    saveState();
  }
};

export const addNotification = (notif: Omit<BuddyNotification, "id" | "timestamp" | "isRead" | "isDismissed">) => {
  const newNotif: BuddyNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    isRead: false,
    isDismissed: false,
  };
  state.notifications.unshift(newNotif);
  saveState();
};

export const triggerSimulatedNotification = (category: NotificationCategory) => {
  const forced = state.currentUser?.buddySettings.forcedMode ?? false;

  switch (category) {
    case "past_due_assignment":
      addNotification({
        category: "past_due_assignment",
        title: "PAST DUE: Bio 101 Genetics Problem Set",
        body: "Deadline elapsed 3 hours ago! Forced Study Buddy lockdown activated until addressed.",
        urgency: "critical",
        courseOrSender: "Biology 101 · Dr. Rodriguez",
        actionLabel: "Submit Now",
        dispatchedChannels: forced ? ["in_app", "email", "sms"] : ["in_app"],
      });
      break;

    case "missing_assignment":
      addNotification({
        category: "missing_assignment",
        title: "Missing Assignment: Stats 110 Homework 4",
        body: "Your instructor marked this assignment as missing in gradebook. Check your submission portal.",
        urgency: "high",
        courseOrSender: "Stats 110 · TA Office Hours",
        actionLabel: "View Assignment",
        dispatchedChannels: forced ? ["in_app", "email"] : ["in_app"],
      });
      break;

    case "upcoming_assignment":
      addNotification({
        category: "upcoming_assignment",
        title: "Upcoming: Psych 1 Term Paper Outline",
        body: "Due in 6 hours (5:00 PM). Complete references section before submitting.",
        urgency: "medium",
        courseOrSender: "Psychology 1 · Canvas",
        actionLabel: "Open Editor",
        dispatchedChannels: ["in_app"],
      });
      break;

    case "schedule_change":
      addNotification({
        category: "schedule_change",
        title: "Schedule Alert: Chemistry Discussion Rescheduled",
        body: "Friday discussion moved from 10:00 AM to 1:15 PM in Chem Building 120.",
        urgency: "medium",
        courseOrSender: "Google Calendar & Canvas Sync",
        actionLabel: "Update Calendar",
        dispatchedChannels: ["in_app"],
      });
      break;

    case "nearby_study":
      addNotification({
        category: "nearby_study",
        title: "Nearby Study Partner Found: Student Union (0.6 mi)",
        body: "Alex Rivera & Jordan T. are reviewing CS 106B past midterms on the 3rd floor lounge.",
        urgency: "low",
        courseOrSender: "Nearby Radar (<25 miles)",
        actionLabel: "Ping Group",
        dispatchedChannels: ["in_app"],
      });
      break;

    case "faculty_message":
      addNotification({
        category: "faculty_message",
        title: "Faculty Message: 'Midterm Study Guide Posted'",
        body: "Prof. Elena Chen: 'I have uploaded the practice exam and answer keys. Good luck studying!'",
        urgency: "medium",
        courseOrSender: "Prof. Elena Chen · Faculty Buddy",
        actionLabel: "Download Guide",
        dispatchedChannels: forced ? ["in_app", "email"] : ["in_app"],
      });
      break;
  }
};

export const sendFacultyBroadcast = (message: string, course: string) => {
  addNotification({
    category: "faculty_message",
    title: `Faculty Broadcast: ${course}`,
    body: message,
    urgency: "high",
    courseOrSender: `${state.currentUser?.display_name || "Faculty Member"} (${state.currentUser?.school_name || "University"})`,
    actionLabel: "View Message",
    dispatchedChannels: ["in_app", "email"],
  });
};
