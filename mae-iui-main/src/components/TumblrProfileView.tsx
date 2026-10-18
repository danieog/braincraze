import React, { useState, useRef } from "react";
import {
  Sparkles,
  Code,
  Image as ImageIcon,
  Video,
  Crown,
  RefreshCw,
  Edit3,
  Check,
  AlertCircle,
  Play,
  Clock,
  Trash2,
  Camera,
  Palette,
} from "lucide-react";
import {
  Profile,
  UPLOAD_LIMITS,
  MediaPhoto,
  MediaVideo,
  TumblrSticker,
} from "../lib/types";
import { BuddyAvatarView } from "./BuddyAvatarView";

interface Props {
  user: Profile;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  onOpenCustomizer: () => void;
}

export const HEADER_BANNER_PRESETS = [
  { id: "lavender", name: "Lavender Dream", style: "bg-gradient-to-r from-[#6B4FBB] via-[#906fe2] to-[#E3D9FF]" },
  { id: "sunset", name: "Sunset Campus", style: "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600" },
  { id: "midnight", name: "Midnight Scholar", style: "bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900" },
  { id: "emerald", name: "Academic Quad", style: "bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-500" },
  { id: "lofi", name: "Lo-Fi Study Beats", style: "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-indigo-600" },
  { id: "cherry", name: "Cherry Blossom", style: "bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200" },
];

const STATIC_STICKERS = [
  { id: "st-star", label: "Gold Star", icon: "⭐", animated: false },
  { id: "st-book", label: "Textbook", icon: "📚", animated: false },
  { id: "st-coffee", label: "Coffee", icon: "☕", animated: false },
  { id: "st-pencil", label: "Pencil", icon: "✏️", animated: false },
  { id: "st-grad", label: "Cap", icon: "🎓", animated: false },
  { id: "st-cat", label: "Campus Cat", icon: "🐱", animated: false },
];

const ANIMATED_STICKERS = [
  { id: "ast-sparkle", label: "Twinkling Star", icon: "✨", animated: true },
  { id: "ast-fire", label: "Study Streak", icon: "🔥", animated: true },
  { id: "ast-rainbow", label: "Rainbow Glow", icon: "🌈", animated: true },
  { id: "ast-heart", label: "Beating Heart", icon: "💖", animated: true },
  { id: "ast-alien", label: "Cosmic Orb", icon: "👾", animated: true },
  { id: "ast-bolt", label: "Lightning", icon: "⚡", animated: true },
];

const ANIMATED_BACKGROUNDS = [
  { id: "bg-rainbow", label: "Rainbow Gradient Waves", className: "animate-rainbow bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400" },
  { id: "bg-stars", label: "Starlit Night Sky", className: "bg-slate-900 bg-[radial-gradient(#ffffff33_1px,#0f172a_1px)] bg-[size:20px_20px]" },
  { id: "bg-lofi", label: "Lo-Fi Purple Glow", className: "animate-rainbow bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" },
  { id: "bg-matrix", label: "Cyber Emerald Grid", className: "bg-emerald-950 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:24px_24px]" },
];

const HTML_PRESETS = [
  {
    name: "Classic Tumblr Scholar",
    html: `<div style="padding: 16px; background: rgba(255,255,255,0.85); border-radius: 16px; border: 2px solid #D9D0E8;">
  <marquee behavior="scroll" direction="left" style="font-weight: bold; color: #6B4FBB;">
    ★ Welcome to my BrainCraze study blog! Grab a coffee and review notes with me! ★
  </marquee>
  <div style="display: flex; gap: 12px; margin-top: 12px; font-size: 13px;">
    <span>📖 Current Focus: Final Exams</span> • <span>🎧 Listening to: Lo-Fi Beats</span>
  </div>
</div>`,
  },
  {
    name: "Y2K Cyber Desk",
    html: `<div style="padding: 18px; background: #1a102f; color: #f472b6; border-radius: 18px; border: 2px dashed #ec4899; font-family: monospace;">
  <h3 style="color: #67e8f9; margin-bottom: 6px;">[SYSTEM: BRAINCRAZE_V2.0]</h3>
  <p>Status: Online & Crushing Deadlines. Click my study buddy to initiate focus session!</p>
  <div style="margin-top: 10px; padding: 8px; background: rgba(0,0,0,0.5); border-radius: 8px;">
    <span>⚡ CPU: 100% Academic Power</span>
  </div>
</div>`,
  },
  {
    name: "Minimalist Campus Card",
    html: `<div style="padding: 14px; background: #FFF8F0; border-left: 4px solid #6B4FBB; border-radius: 8px; color: #3B2F5C;">
  <p style="font-style: italic; margin: 0;">"Education is the passport to the future, for tomorrow belongs to those who prepare for it today."</p>
  <p style="text-align: right; font-weight: bold; margin-top: 6px; font-size: 12px;">— Malcolm X</p>
</div>`,
  },
];

export const TumblrProfileView: React.FC<Props> = ({
  user,
  onUpdateProfile,
  onOpenCustomizer,
}) => {
  const isPremium = user.isPremium;
  const limits = isPremium ? UPLOAD_LIMITS.premium : UPLOAD_LIMITS.free;

  const [avatarSource, setAvatarSource] = useState<"buddy" | "selfie">(user.avatarSource || "buddy");
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [htmlCode, setHtmlCode] = useState(user.customHtml || HTML_PRESETS[0].html);
  const [bioText, setBioText] = useState(user.bio || "Studying, connecting, and meeting verified academic peers nearby!");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload modal states
  const [uploadType, setUploadType] = useState<"photo" | "video" | null>(null);
  const [captionInput, setCaptionInput] = useState("");
  const [videoDurationInput, setVideoDurationInput] = useState(5);
  const [mediaFileUrl, setMediaFileUrl] = useState<string | null>(null);

  // Header Banner Editing
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerBannerChoice, setHeaderBannerChoice] = useState(user.headerBanner || HEADER_BANNER_PRESETS[0].style);
  const [customHeaderUrl, setCustomHeaderUrl] = useState("");

  // Sticker picker
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Handle switching between selfie and buddy
  const handleToggleAvatarSource = () => {
    if (avatarSource === "buddy") {
      if (!user.selfieUrl) {
        setErrorMsg("Upload a photo of yourself in the Avatar Studio first to toggle selfie view!");
        return;
      }
      setAvatarSource("selfie");
      onUpdateProfile({ avatarSource: "selfie" });
    } else {
      setAvatarSource("buddy");
      onUpdateProfile({ avatarSource: "buddy" });
    }
  };

  // Save customized HTML sequence
  const handleSaveHtml = () => {
    onUpdateProfile({ customHtml: htmlCode });
    setIsEditingHtml(false);
    setSuccessMsg("Custom Tumblr HTML theme applied successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Apply animated background (Premium only)
  const handleSetBackground = (bgClass?: string) => {
    if (!isPremium && bgClass) {
      setErrorMsg("Animated backgrounds require a Premium subscription! Upgrade to unlock.");
      return;
    }
    onUpdateProfile({ animatedBackground: bgClass });
    setSuccessMsg(bgClass ? "Animated background applied!" : "Background reset to classic cream.");
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Add sticker (Animated stickers require Premium)
  const handleAddSticker = (sticker: typeof STATIC_STICKERS[0] | typeof ANIMATED_STICKERS[0]) => {
    if (sticker.animated && !isPremium) {
      setErrorMsg("Animated stickers require a Premium subscription! Upgrade to unlock.");
      return;
    }

    const currentCount = user.stickers?.length || 0;
    const newSticker: TumblrSticker = {
      id: `stk-${currentCount + 1}-${sticker.id}`,
      label: sticker.label,
      iconName: sticker.icon,
      animated: sticker.animated,
      x: 20 + ((currentCount * 18) % 60),
      y: 15 + ((currentCount * 15) % 65),
    };

    onUpdateProfile({ stickers: [...(user.stickers || []), newSticker] });
    setShowStickerPicker(false);
  };

  const handleRemoveSticker = (id: string) => {
    onUpdateProfile({ stickers: (user.stickers || []).filter((s) => s.id !== id) });
  };

  // Handle Photo Upload with strict limit enforcement
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict limit check: user cannot get around these limits!
    const currentPhotoCount = user.photos?.length || 0;
    if (currentPhotoCount >= limits.maxPhotos) {
      setErrorMsg(
        `Upload limit reached! ${isPremium ? "Premium" : "Free"} accounts can have at most ${limits.maxPhotos} photos. ${
          !isPremium ? "Upgrade to Premium to upload up to 25 photos!" : "Delete older photos to upload new ones."
        }`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaFileUrl(reader.result as string);
      setUploadType("photo");
    };
    reader.readAsDataURL(file);
  };

  // Handle Video Upload with strict duration and count enforcement
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const currentVideoCount = user.videos?.length || 0;
    if (currentVideoCount >= limits.maxVideos) {
      setErrorMsg(
        `Video upload limit reached! ${isPremium ? "Premium" : "Free"} accounts can have at most ${limits.maxVideos} videos. ${
          !isPremium ? "Upgrade to Premium for 10 videos up to 60 minutes!" : ""
        }`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaFileUrl(reader.result as string);
      setUploadType("video");
    };
    reader.readAsDataURL(file);
  };

  const handleCommitMedia = () => {
    if (!mediaFileUrl) return;

    if (uploadType === "photo") {
      const currentPhotoCount = user.photos?.length || 0;
      const newPhoto: MediaPhoto = {
        id: `photo-${currentPhotoCount + 1}-${captionInput.length}`,
        url: mediaFileUrl,
        caption: captionInput.trim() || "Campus moment",
        uploadedAt: new Date().toISOString(),
      };
      onUpdateProfile({ photos: [newPhoto, ...(user.photos || [])] });
      setSuccessMsg("Photo published to your Tumblr study feed!");
    } else if (uploadType === "video") {
      // Hard check duration limit: Free up to 10 min, Premium up to 60 min
      if (videoDurationInput > limits.maxVideoDurationMinutes) {
        setErrorMsg(
          `Video exceeds max length! ${isPremium ? "Premium" : "Free"} accounts are limited to ${limits.maxVideoDurationMinutes} minutes per video.`
        );
        return;
      }

      const currentVideoCount = user.videos?.length || 0;
      const newVideo: MediaVideo = {
        id: `vid-${currentVideoCount + 1}-${captionInput.length}`,
        url: mediaFileUrl,
        title: captionInput.trim() || "Study stream session",
        durationMinutes: videoDurationInput,
        uploadedAt: new Date().toISOString(),
      };
      onUpdateProfile({ videos: [newVideo, ...(user.videos || [])] });
      setSuccessMsg("Video published to your Tumblr study feed!");
    }

    setUploadType(null);
    setMediaFileUrl(null);
    setCaptionInput("");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeletePhoto = (id: string) => {
    onUpdateProfile({ photos: (user.photos || []).filter((p) => p.id !== id) });
  };

  const handleDeleteVideo = (id: string) => {
    onUpdateProfile({ videos: (user.videos || []).filter((v) => v.id !== id) });
  };

  const handleTogglePremium = () => {
    const nextStatus = !isPremium;
    onUpdateProfile({ isPremium: nextStatus });
    setSuccessMsg(nextStatus ? "🎉 Premium Subscription Activated!" : "Subscription reverted to Free.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div
      className={`min-h-screen py-8 px-4 transition-all duration-300 ${
        user.animatedBackground || "bg-[#FFF8F0]"
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-100 rounded">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- TUMBLR HEADER & PROFILE BANNER --- */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#D9D0E8] overflow-hidden shadow-sm relative">
          {/* Banner Graphic */}
          <div className="h-36 sm:h-44 bg-gradient-to-r from-[#6B4FBB] via-[#906fe2] to-[#E3D9FF] relative p-4 flex items-end justify-between">
            <div className="text-white/80 font-fredoka text-xs sm:text-sm font-semibold tracking-wider">
              {user.display_name.toLowerCase().replace(/\s+/g, "")}.braincraze.tumblr
            </div>

            {/* Premium Badge & Upgrade Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePremium}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  isPremium
                    ? "bg-amber-400 text-amber-950 border border-amber-300"
                    : "bg-white/90 hover:bg-white text-[#3B2F5C]"
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isPremium ? "text-amber-800" : "text-gray-400"}`} />
                {isPremium ? "BrainCraze Premium" : "Upgrade to Premium"}
              </button>
            </div>
          </div>

          {/* Profile Card Body */}
          <div className="px-6 pb-6 pt-3 relative">
            {/* Interactive Flip Avatar (Selfie vs. Mii Buddy) */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              <div className="flex items-end gap-4">
                <div className="relative group select-none">
                  <div
                    onClick={handleToggleAvatarSource}
                    title="Click to flip between Real Selfie and Mii Study Buddy!"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#F3EEFF] border-4 border-white shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:rotate-3 transition-transform duration-300"
                  >
                    {avatarSource === "selfie" && user.selfieUrl ? (
                      <img
                        src={user.selfieUrl}
                        alt="Your selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BuddyAvatarView avatar={user.buddyAvatar} size={110} />
                    )}
                  </div>

                  {/* Flip Badge button */}
                  <button
                    type="button"
                    onClick={handleToggleAvatarSource}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-[#2B2340] hover:bg-[#6B4FBB] text-white rounded-xl shadow-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {avatarSource === "selfie" ? "Selfie" : "Buddy"}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-fredoka text-xl sm:text-2xl font-bold text-[#3B2F5C]">
                      {user.display_name}
                    </h1>
                    {user.verified_badge && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4A4458]">
                    {user.school_name ? `${user.school_name} · ` : ""}
                    <span className="capitalize">{user.role?.replace("_", " ") || "Student"}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Edit HTML, Style Mii, Add Sticker */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsEditingHtml(true)}
                  className="px-3.5 py-2 bg-[#F3EEFF] hover:bg-[#E3D9FF] text-[#3B2F5C] text-xs font-bold rounded-xl border border-[#D9D0E8] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-4 h-4 text-[#6B4FBB]" /> Edit Theme HTML
                </button>
                <button
                  onClick={onOpenCustomizer}
                  className="px-3.5 py-2 bg-[#F3EEFF] hover:bg-[#E3D9FF] text-[#3B2F5C] text-xs font-bold rounded-xl border border-[#D9D0E8] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#6B4FBB]" /> Customize Buddy
                </button>
                <button
                  onClick={() => setShowStickerPicker(!showStickerPicker)}
                  className="px-3.5 py-2 bg-[#6B4FBB] hover:bg-[#583da7] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  ✨ Add Sticker
                </button>
              </div>
            </div>

            {/* Bio */}
            <div className="pt-2">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    maxLength={200}
                    rows={2}
                    className="w-full p-2.5 bg-[#FFF8F0] border border-[#D9D0E8] rounded-xl text-xs text-[#2B2340] focus:outline-none focus:ring-1 focus:ring-[#6B4FBB]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingBio(false)}
                      className="text-xs text-[#4A4458] hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onUpdateProfile({ bio: bioText });
                        setIsEditingBio(false);
                      }}
                      className="px-3 py-1 bg-[#6B4FBB] text-white text-xs font-bold rounded-lg"
                    >
                      Save Bio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[#4A4458] italic max-w-xl">
                    &ldquo;{user.bio || bioText}&rdquo;
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-xs text-[#6B4FBB] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit bio
                  </button>
                </div>
              )}
            </div>

            {/* Stickers Area */}
            {user.stickers && user.stickers.length > 0 && (
              <div className="pt-3 flex flex-wrap gap-2 items-center">
                <span className="text-[11px] font-bold text-[#4A4458] uppercase tracking-wider">
                  Profile Badges & Stickers:
                </span>
                {user.stickers.map((s) => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs border ${
                      s.animated
                        ? "animate-twinkle bg-gradient-to-r from-purple-200 to-pink-200 border-purple-300 text-purple-950"
                        : "bg-[#F3EEFF] border-[#D9D0E8] text-[#3B2F5C]"
                    }`}
                  >
                    <span>{s.iconName}</span>
                    <span>{s.label}</span>
                    <button
                      onClick={() => handleRemoveSticker(s.id)}
                      className="text-gray-400 hover:text-rose-600 ml-1"
                      title="Remove sticker"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticker Picker Drawer */}
        {showStickerPicker && (
          <div className="p-5 bg-white rounded-3xl border border-[#D9D0E8] shadow-md space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6B4FBB]" />
                <h3 className="font-fredoka text-sm font-bold text-[#3B2F5C]">
                  Choose Stickers for Your Profile
                </h3>
              </div>
              <button
                onClick={() => setShowStickerPicker(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Static Stickers */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A4458]">
                  Classic Stickers (Free for Everyone)
                </span>
                <div className="flex flex-wrap gap-2">
                  {STATIC_STICKERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAddSticker(s)}
                      className="px-3 py-1.5 bg-[#F3EEFF] hover:bg-[#E3D9FF] rounded-xl text-xs font-semibold text-[#3B2F5C] flex items-center gap-1.5 border border-[#D9D0E8] transition-colors cursor-pointer"
                    >
                      <span>{s.icon}</span> <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated Stickers (Premium Only) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Animated Stickers (Premium Only)
                  </span>
                  {!isPremium && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                      Locked
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ANIMATED_STICKERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAddSticker(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isPremium
                          ? "animate-twinkle bg-gradient-to-r from-amber-100 to-pink-100 border-amber-300 text-amber-950"
                          : "bg-gray-100 border-gray-200 text-gray-400 opacity-75"
                      }`}
                    >
                      <span>{s.icon}</span> <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Theme Selector */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A4458]">
                Background Themes (Animated for Premium):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetBackground(undefined)}
                  className="px-3 py-1.5 bg-white border border-[#D9D0E8] rounded-xl text-xs font-semibold text-[#3B2F5C] cursor-pointer"
                >
                  Classic Cream
                </button>
                {ANIMATED_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleSetBackground(bg.className)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isPremium
                        ? "bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    }`}
                  >
                    ✨ {bg.label} {!isPremium && "(Premium)"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- CUSTOM TUMBLR HTML LIVE RENDER --- */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#D9D0E8] p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#6B4FBB]" />
              <h3 className="font-fredoka text-base font-bold text-[#3B2F5C]">
                Custom HTML Theme Output
              </h3>
            </div>
            <button
              onClick={() => setIsEditingHtml(true)}
              className="text-xs font-semibold text-[#6B4FBB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit HTML Code
            </button>
          </div>

          {/* Render the user's custom HTML sequence */}
          <div
            className="w-full overflow-hidden rounded-2xl"
            dangerouslySetInnerHTML={{ __html: user.customHtml || htmlCode }}
          />
        </div>

        {/* --- UPLOAD LIMITS & MEDIA DASHBOARD --- */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#D9D0E8] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3D9FF] pb-4">
            <div>
              <h3 className="font-fredoka text-lg font-bold text-[#3B2F5C]">
                Study Feed & Media Vault
              </h3>
              <p className="text-xs text-[#4A4458]">
                Share study sessions, problem sets, and campus moments
              </p>
            </div>

            {/* Strict Limits Indicators */}
            <div className="flex items-center gap-3 text-xs bg-[#F3EEFF] px-3.5 py-2 rounded-2xl border border-[#D9D0E8]">
              <div>
                <span className="font-bold text-[#3B2F5C]">Photos: </span>
                <span className="font-mono text-[#6B4FBB]">
                  {user.photos?.length || 0} / {limits.maxPhotos}
                </span>
              </div>
              <span>•</span>
              <div>
                <span className="font-bold text-[#3B2F5C]">Videos: </span>
                <span className="font-mono text-[#6B4FBB]">
                  {user.videos?.length || 0} / {limits.maxVideos}
                </span>
                <span className="text-[10px] text-[#4A4458] ml-1">
                  (max {limits.maxVideoDurationMinutes} min)
                </span>
              </div>
            </div>
          </div>

          {/* Upload Action Triggers */}
          <div className="flex flex-wrap gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />

            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={(user.photos?.length || 0) >= limits.maxPhotos}
              className="px-4 py-2 bg-[#E3D9FF] hover:bg-[#d6c7fc] disabled:opacity-50 text-[#3B2F5C] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#6B4FBB]" /> Upload Photo ({user.photos?.length || 0}/{limits.maxPhotos})
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={(user.videos?.length || 0) >= limits.maxVideos}
              className="px-4 py-2 bg-[#E3D9FF] hover:bg-[#d6c7fc] disabled:opacity-50 text-[#3B2F5C] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Video className="w-4 h-4 text-[#6B4FBB]" /> Upload Video ({user.videos?.length || 0}/{limits.maxVideos})
            </button>
          </div>

          {/* Photos Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A4458]">
              Photos ({user.photos?.length || 0})
            </h4>
            {(!user.photos || user.photos.length === 0) ? (
              <p className="text-xs text-[#4A4458] italic py-2">
                No photos uploaded yet. (Max {limits.maxPhotos} photos allowed)
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {user.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-2xl overflow-hidden border border-[#D9D0E8] bg-black/5 aspect-square"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                      <p className="text-xs font-semibold line-clamp-1">{photo.caption}</p>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="self-end p-1 text-white/80 hover:text-rose-400"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos Grid */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A4458]">
              Videos ({user.videos?.length || 0})
            </h4>
            {(!user.videos || user.videos.length === 0) ? (
              <p className="text-xs text-[#4A4458] italic py-2">
                No videos uploaded yet. (Max {limits.maxVideos} videos, up to {limits.maxVideoDurationMinutes} min each)
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3.5 bg-[#F3EEFF] border border-[#D9D0E8] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#6B4FBB] text-white flex items-center justify-center shrink-0">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[#2B2340] line-clamp-1">{vid.title}</h5>
                        <p className="text-[11px] text-[#4A4458] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#6B4FBB]" />
                          {vid.durationMinutes} min runtime
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL: EDIT THEME HTML --- */}
      {isEditingHtml && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F0] border border-[#D9D0E8] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#6B4FBB]" />
                <h3 className="font-fredoka text-lg font-bold text-[#3B2F5C]">
                  Tumblr Custom HTML Editor
                </h3>
              </div>
              <button onClick={() => setIsEditingHtml(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#4A4458]">
              Insert custom HTML sequences, marquee banners, styles, or bio blocks to personalize your blog:
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="font-bold text-[#3B2F5C] self-center mr-1">Templates:</span>
              {HTML_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setHtmlCode(p.html)}
                  className="px-2.5 py-1 bg-[#F3EEFF] hover:bg-[#E3D9FF] rounded-lg font-semibold text-[#3B2F5C] border border-[#D9D0E8] cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              rows={9}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6B4FBB]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingHtml(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4A4458] hover:text-[#2B2340]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHtml}
                className="px-5 py-2.5 bg-[#6B4FBB] hover:bg-[#583da7] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Apply Custom HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: COMMIT MEDIA WITH CAPTION & DURATION --- */}
      {uploadType && mediaFileUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#D9D0E8]">
            <h3 className="font-fredoka text-lg font-bold text-[#3B2F5C]">
              Publish {uploadType === "photo" ? "Photo" : "Video"}
            </h3>

            {uploadType === "photo" ? (
              <div className="aspect-video rounded-xl overflow-hidden border border-[#D9D0E8]">
                <img src={mediaFileUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="p-4 bg-[#F3EEFF] rounded-xl text-center space-y-2">
                <Video className="w-8 h-8 text-[#6B4FBB] mx-auto" />
                <p className="text-xs font-semibold text-[#3B2F5C]">Video ready for publishing</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B2F5C]">
                {uploadType === "photo" ? "Caption" : "Video Title"}
              </label>
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Add a title or thoughts..."
                className="w-full px-3 py-2 bg-[#FFF8F0] border border-[#D9D0E8] rounded-xl text-xs text-[#2B2340] focus:outline-none focus:ring-1 focus:ring-[#6B4FBB]"
              />
            </div>

            {uploadType === "video" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#3B2F5C]">
                  <span>Video Duration (Minutes):</span>
                  <span className="text-[#6B4FBB]">{videoDurationInput} min</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={limits.maxVideoDurationMinutes}
                  value={videoDurationInput}
                  onChange={(e) => setVideoDurationInput(Number(e.target.value))}
                  className="w-full accent-[#6B4FBB]"
                />
                <span className="text-[10px] text-[#4A4458]">
                  Max allowed: {limits.maxVideoDurationMinutes} minutes ({isPremium ? "Premium" : "Free Tier"})
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setUploadType(null);
                  setMediaFileUrl(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#4A4458]"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitMedia}
                className="px-5 py-2.5 bg-[#6B4FBB] hover:bg-[#583da7] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Publish to Blog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
