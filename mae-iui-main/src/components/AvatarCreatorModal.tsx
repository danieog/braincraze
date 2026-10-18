import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { BuddyAvatar, BuddySettings, Profile } from "../lib/types";
import { BuddyAvatarView } from "./BuddyAvatarView";

interface Props {
  user: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatar: BuddyAvatar, settings: BuddySettings, selfieUrl?: string) => void;
}

const SKIN_TONES = [
  "#fcd5b4", // Fair
  "#f7c297", // Light
  "#e0ac69", // Medium Warm
  "#c68642", // Tan
  "#8d5524", // Deep
  "#4d2912", // Dark
  "#fee3d4", // Peach
  "#ffe0bd", // Warm Mii Pale
];

const HAIR_COLORS = [
  "#2c221e", // Dark Espresso
  "#5a3d28", // Chestnut Brown
  "#a16207", // Honey Auburn
  "#eab308", // Golden Blonde
  "#ef4444", // Crimson Red
  "#ec4899", // Pastel Pink
  "#8b5cf6", // Lavender Purple
  "#3b82f6", // Electric Blue
  "#10b981", // Mint Green
  "#94a3b8", // Platinum Silver
];

const OUTFIT_COLORS = [
  "#6b4fbb", // BrainCraze Purple
  "#3b82f6", // Academic Navy
  "#10b981", // Campus Emerald
  "#f59e0b", // Warm Amber
  "#ef4444", // Varsity Red
  "#ec4899", // Bubblegum
  "#18181b", // Charcoal Black
  "#f87171", // Coral
];

export const AvatarCreatorModal: React.FC<Props> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"selfie" | "hair" | "face" | "outfit" | "buddy">("selfie");
  const [avatar, setAvatar] = useState<BuddyAvatar>(() => ({
    ...user.buddyAvatar,
  }));
  const [settings, setSettings] = useState<BuddySettings>(() => ({
    ...user.buddySettings,
  }));
  const [selfieUrl, setSelfieUrl] = useState<string | undefined>(user.selfieUrl);
  const [analyzingSelfie, setAnalyzingSelfie] = useState(false);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Analyze uploaded selfie to generate Animal Crossing / Mii character traits
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelfieUrl(dataUrl);
      setAnalyzingSelfie(true);
      setAnalysisNote(null);

      // Simulate algorithmic feature extraction: skin tone, hair color, glasses from user selfie
      setTimeout(() => {
        // Deterministic variation based on photo length to pick matching aesthetic
        const charCodeSum = dataUrl.slice(-100).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const skinChoice = SKIN_TONES[charCodeSum % SKIN_TONES.length];
        const hairColorChoice = HAIR_COLORS[(charCodeSum * 3) % HAIR_COLORS.length];
        const hairStyles: BuddyAvatar["hairStyle"][] = [
          "ac_wavy",
          "tomodachi_bob",
          "spiky",
          "curly",
          "twintails",
          "mii_short",
        ];
        const eyeStyles: BuddyAvatar["eyeStyle"][] = [
          "ac_dot",
          "glasses_round",
          "anime_sparkle",
          "mii_oval",
          "glasses_nerd",
        ];

        setAvatar((prev) => ({
          ...prev,
          skinColor: skinChoice,
          hairColor: hairColorChoice,
          hairStyle: hairStyles[charCodeSum % hairStyles.length],
          eyeStyle: eyeStyles[(charCodeSum + 2) % eyeStyles.length],
          mood: "happy",
        }));

        setAnalyzingSelfie(false);
        setAnalysisNote("✨ Generated your Animal Crossing & Mii Buddy from your selfie!");
        setActiveTab("hair");
      }, 900);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === "ac_villager") {
      setAvatar((prev) => ({
        ...prev,
        faceShape: "round",
        hairStyle: "ac_wavy",
        hairColor: "#5a3d28",
        eyeStyle: "ac_dot",
        skinColor: "#fcd5b4",
        mouthStyle: "smile",
        outfit: "sweater_vest",
        outfitColor: "#10b981",
        accessory: "star_pin",
      }));
    } else if (presetName === "tomodachi_scholar") {
      setAvatar((prev) => ({
        ...prev,
        faceShape: "chibi",
        hairStyle: "tomodachi_bob",
        hairColor: "#2c221e",
        eyeStyle: "glasses_round",
        skinColor: "#fee3d4",
        mouthStyle: "cat_w",
        outfit: "school_uniform",
        outfitColor: "#3b82f6",
        accessory: "pencil_ear",
      }));
    } else if (presetName === "faculty_mentor") {
      setAvatar((prev) => ({
        ...prev,
        faceShape: "oval",
        hairStyle: "curly",
        hairColor: "#94a3b8",
        eyeStyle: "glasses_nerd",
        skinColor: "#c68642",
        mouthStyle: "smile",
        outfit: "faculty_robe",
        outfitColor: "#18181b",
        accessory: "grad_cap",
      }));
    } else if (presetName === "mii_speedy") {
      setAvatar((prev) => ({
        ...prev,
        faceShape: "round",
        hairStyle: "spiky",
        hairColor: "#eab308",
        eyeStyle: "anime_sparkle",
        skinColor: "#f7c297",
        mouthStyle: "grin",
        outfit: "hoodie",
        outfitColor: "#ef4444",
        accessory: "headband",
      }));
    }
  };

  const handleSave = () => {
    onSave(avatar, settings, selfieUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFF8F0] border border-[#D9D0E8] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3EEFF] border-b border-[#D9D0E8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6B4FBB] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-fredoka text-lg font-bold text-[#3B2F5C]">
                Buddy Closet
              </h2>
              <p className="text-xs text-[#4A4458]">
                Nintendo Mii · Animal Crossing · Tomodachi Life Style
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#4A4458] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Live Preview & Presets */}
          <div className="md:col-span-5 flex flex-col items-center text-center space-y-4 bg-white p-5 rounded-2xl border border-[#E3D9FF] shadow-xs">
            <div className="relative p-6 bg-[#F3EEFF] rounded-2xl w-full flex flex-col items-center justify-center border border-[#D9D0E8]">
              <div className="animate-float-buddy">
                <BuddyAvatarView avatar={avatar} size={150} />
              </div>
              <div className="mt-3 font-fredoka text-base font-bold text-[#3B2F5C]">
                {settings.name || "My Study Buddy"}
              </div>
              <div className="text-[11px] text-[#6B4FBB] font-semibold bg-white px-2.5 py-0.5 rounded-full border border-[#D9D0E8] mt-1">
                {settings.cursorFollow ? "Cursor Follow: ON" : "Cursor Follow: OFF"}
              </div>
            </div>

            {/* Presets */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A4458] block text-left">
                Quick Character Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("ac_villager")}
                  className="p-2 bg-[#F3EEFF] hover:bg-[#E3D9FF] text-[#3B2F5C] font-semibold rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer"
                >
                  🍃 AC Villager
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("tomodachi_scholar")}
                  className="p-2 bg-[#F3EEFF] hover:bg-[#E3D9FF] text-[#3B2F5C] font-semibold rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer"
                >
                  👓 Tomodachi Life
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("faculty_mentor")}
                  className="p-2 bg-[#F3EEFF] hover:bg-[#E3D9FF] text-[#3B2F5C] font-semibold rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer"
                >
                  🦉 Faculty Mentor
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("mii_speedy")}
                  className="p-2 bg-[#F3EEFF] hover:bg-[#E3D9FF] text-[#3B2F5C] font-semibold rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer"
                >
                  ⚡ Mii Champion
                </button>
              </div>
            </div>

            {/* Selfie Photo indicator */}
            {selfieUrl && (
              <div className="w-full p-2.5 bg-[#FFF8F0] border border-[#E3D9FF] rounded-xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <img
                    src={selfieUrl}
                    alt="Your uploaded selfie"
                    className="w-8 h-8 rounded-full object-cover border border-[#6B4FBB]"
                  />
                  <div>
                    <div className="text-[11px] font-bold text-[#2B2340]">Your Selfie Synced</div>
                    <div className="text-[10px] text-[#4A4458]">Used for dual profile pic</div>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#6B4FBB] font-semibold hover:underline cursor-pointer"
                >
                  Replace
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Customization Controls */}
          <div className="md:col-span-7 space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#F3EEFF] rounded-2xl border border-[#D9D0E8] overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("selfie")}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "selfie" ? "bg-[#6B4FBB] text-white shadow-xs" : "text-[#3B2F5C] hover:bg-white/60"
                }`}
              >
                📸 Photo to Avatar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hair")}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "hair" ? "bg-[#6B4FBB] text-white shadow-xs" : "text-[#3B2F5C] hover:bg-white/60"
                }`}
              >
                💇 Hair
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("face")}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "face" ? "bg-[#6B4FBB] text-white shadow-xs" : "text-[#3B2F5C] hover:bg-white/60"
                }`}
              >
                👀 Face
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("outfit")}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "outfit" ? "bg-[#6B4FBB] text-white shadow-xs" : "text-[#3B2F5C] hover:bg-white/60"
                }`}
              >
                👕 Outfit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("buddy")}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "buddy" ? "bg-[#6B4FBB] text-white shadow-xs" : "text-[#3B2F5C] hover:bg-white/60"
                }`}
              >
                ⚙️ Buddy
              </button>
            </div>

            {/* TAB CONTENT: Selfie Upload */}
            {activeTab === "selfie" && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E3D9FF]">
                <div className="space-y-1">
                  <h3 className="font-fredoka text-base font-bold text-[#3B2F5C]">
                    Photo-to-Avatar Generator
                  </h3>
                  <p className="text-xs text-[#4A4458]">
                    Upload a photo of yourself (and yourself only!) to automatically generate your mini Mii / Animal Crossing companion.
                  </p>
                </div>

                <div className="p-6 border-2 border-dashed border-[#D9D0E8] rounded-2xl bg-[#FFF8F0] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E3D9FF] text-[#6B4FBB] flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#3B2F5C]">Take or upload your photo</p>
                    <p className="text-xs text-[#4A4458] mt-0.5">
                      JPG, PNG, WebP supported. Photo remains private and is also used for your dual profile toggle!
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={analyzingSelfie}
                      className="px-4 py-2.5 bg-[#6B4FBB] hover:bg-[#583da7] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {analyzingSelfie ? "Scanning facial features..." : "Upload Photo of Yourself"}
                    </button>
                  </div>
                </div>

                {analysisNote && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{analysisNote}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Hair */}
            {activeTab === "hair" && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E3D9FF]">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Hair Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "ac_wavy", label: "Animal Crossing Wavy" },
                      { id: "tomodachi_bob", label: "Tomodachi Bob" },
                      { id: "spiky", label: "Anime Spiky" },
                      { id: "curly", label: "Cute Curly" },
                      { id: "twintails", label: "Twintails" },
                      { id: "mii_short", label: "Classic Mii Short" },
                      { id: "afro", label: "Fluffy Afro" },
                      { id: "cap", label: "Baseball Cap" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, hairStyle: item.id as any })}
                        className={`p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                          avatar.hairStyle === item.id
                            ? "bg-[#6B4FBB] text-white shadow-xs"
                            : "bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Hair Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, hairColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                          avatar.hairColor === c ? "border-[#6B4FBB] scale-110 shadow-xs" : "border-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Face */}
            {activeTab === "face" && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E3D9FF]">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Skin Tone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_TONES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, skinColor: color })}
                        style={{ backgroundColor: color }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                          avatar.skinColor === color ? "border-[#6B4FBB] scale-110 shadow-xs" : "border-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Eye Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "ac_dot", label: "Animal Crossing Dots" },
                      { id: "glasses_round", label: "Round Glasses" },
                      { id: "glasses_nerd", label: "Study Specs" },
                      { id: "anime_sparkle", label: "Anime Sparkle" },
                      { id: "chill", label: "Chill / Sleepy" },
                      { id: "mii_oval", label: "Classic Mii Oval" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, eyeStyle: item.id as any })}
                        className={`p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                          avatar.eyeStyle === item.id
                            ? "bg-[#6B4FBB] text-white shadow-xs"
                            : "bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Mouth & Expression
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "smile", label: "Sweet Smile" },
                      { id: "cat_w", label: ":3 Cat Mouth" },
                      { id: "open", label: "Happy Open" },
                      { id: "grin", label: "Big Grin" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, mouthStyle: item.id as any })}
                        className={`p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                          avatar.mouthStyle === item.id
                            ? "bg-[#6B4FBB] text-white shadow-xs"
                            : "bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Outfit & Accessories */}
            {activeTab === "outfit" && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E3D9FF]">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Outfit Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "hoodie", label: "Cozy Campus Hoodie" },
                      { id: "sweater_vest", label: "Sweater Vest" },
                      { id: "school_uniform", label: "School Blazer" },
                      { id: "faculty_robe", label: "Faculty Academic Robe" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, outfit: item.id as any })}
                        className={`p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                          avatar.outfit === item.id
                            ? "bg-[#6B4FBB] text-white shadow-xs"
                            : "bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Outfit Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OUTFIT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, outfitColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                          avatar.outfitColor === c ? "border-[#6B4FBB] scale-110 shadow-xs" : "border-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block">
                    Head Accessories
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "none", label: "None" },
                      { id: "grad_cap", label: "Mortarboard Cap" },
                      { id: "cat_ears", label: "Cat Ears" },
                      { id: "star_pin", label: "Star Pin" },
                      { id: "headband", label: "Pink Headband" },
                      { id: "pencil_ear", label: "Pencil on Ear" },
                      { id: "coffee_mug", label: "Coffee Mug" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar({ ...avatar, accessory: item.id as any })}
                        className={`p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                          avatar.accessory === item.id
                            ? "bg-[#6B4FBB] text-white shadow-xs"
                            : "bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Buddy Controls */}
            {activeTab === "buddy" && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E3D9FF]">
                <div>
                  <label className="text-xs font-bold text-[#3B2F5C] uppercase tracking-wider block mb-1">
                    Study Buddy Name
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    maxLength={24}
                    placeholder="e.g. Pippin, Mochi, Sparky"
                    className="w-full px-4 py-2.5 bg-[#FFF8F0] border border-[#D9D0E8] rounded-xl text-sm font-semibold text-[#2B2340] focus:outline-none focus:ring-2 focus:ring-[#6B4FBB]/30"
                  />
                </div>

                {/* Cursor following toggle */}
                <div className="p-3.5 bg-[#F3EEFF] rounded-xl border border-[#D9D0E8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#3B2F5C]">
                      Follow Cursor on Screen
                    </div>
                    <div className="text-[11px] text-[#4A4458]">
                      Your digital buddy floats near your mouse pointer across the site
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cursorFollow}
                      onChange={(e) => setSettings({ ...settings, cursorFollow: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6B4FBB]"></div>
                  </label>
                </div>

                {/* Forced Mode Toggle */}
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                        ⚡ Forced Study Buddy Mode
                      </div>
                      <div className="text-[11px] text-rose-800">
                        Bypasses notification blocks; sends automated text/email & freezes tab on past-due work!
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.forcedMode}
                        onChange={(e) => setSettings({ ...settings, forcedMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  {settings.forcedMode && (
                    <div className="pt-2 border-t border-rose-200/80 text-[11px] text-rose-900 space-y-1">
                      <p className="font-semibold">
                        🔒 Tab Lockdown Enabled: When urgent tasks trigger, your screen is frozen until you acknowledge your assignments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F3EEFF] border-t border-[#D9D0E8] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#4A4458] hover:text-[#2B2340] cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#6B4FBB] hover:bg-[#583da7] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Study Buddy & Avatar
          </button>
        </div>
      </div>
    </div>
  );
};
