import React from "react";
import {
  MapPin,
  ShieldCheck,
  CheckCircle,
  LogOut,
  UserCheck,
  Bot,
  Bell,
  Sparkles,
  User,
  Crown,
} from "lucide-react";
import { Profile, VerificationProgress } from "../lib/types";
import { switchUser } from "../lib/store";

interface Props {
  user: Profile | null;
  progress: VerificationProgress | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogOut: () => void;
  onOpenAuth: (mode: "login" | "signup") => void;
  adminQueueCount: number;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
  onOpenAvatarStudio: () => void;
}

export const Header: React.FC<Props> = ({
  user,
  currentTab,
  onSelectTab,
  onLogOut,
  onOpenAuth,
  adminQueueCount,
  unreadNotificationCount,
  onOpenNotifications,
  onOpenAvatarStudio,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFF8F0]/95 backdrop-blur-md border-b border-[#E3D9FF] px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={() => onSelectTab("landing")}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#2B2340] flex items-center justify-center text-white font-fredoka font-bold text-xl shadow-xs group-hover:bg-[#6B4FBB] transition-colors">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-fredoka text-lg font-bold tracking-tight text-[#2B2340]">
                BrainCraze
              </span>
              {user?.isPremium && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-400 text-amber-950 border border-amber-300">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              )}
              {user?.verified_badge && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#4A4458] font-medium hidden sm:block">
              Study Buddy · My Profile · Nearby
            </p>
          </div>
        </div>

        {/* Navigation tabs if signed in */}
        {user ? (
          <nav className="hidden lg:flex items-center gap-1 bg-[#F3EEFF] p-1 rounded-2xl border border-[#D9D0E8]">
            <button
              onClick={() => onSelectTab("profile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "profile"
                  ? "bg-[#6B4FBB] text-white shadow-xs"
                  : "text-[#3B2F5C] hover:bg-white/60"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              My Profile
            </button>

            <button
              onClick={() => onSelectTab("location")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "location"
                  ? "bg-[#6B4FBB] text-white shadow-xs"
                  : "text-[#3B2F5C] hover:bg-white/60"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Nearby (<span className="text-[10px]">25mi</span>)
            </button>

            <button
              onClick={() => onSelectTab("verify-id")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "verify-id"
                  ? "bg-[#6B4FBB] text-white shadow-xs"
                  : "text-[#3B2F5C] hover:bg-white/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify ID
            </button>

            <button
              onClick={() => onSelectTab("human")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "human"
                  ? "bg-[#6B4FBB] text-white shadow-xs"
                  : "text-[#3B2F5C] hover:bg-white/60"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Human Check
            </button>

            <button
              onClick={() => onSelectTab("admin-review")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                currentTab === "admin-review"
                  ? "bg-[#6B4FBB] text-white shadow-xs"
                  : "text-[#3B2F5C] hover:bg-white/60"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              ID Review
              {adminQueueCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {adminQueueCount}
                </span>
              )}
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth("login")}
              className="text-xs font-bold text-[#2B2340] hover:text-[#6B4FBB] px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={() => onOpenAuth("signup")}
              className="bg-[#2B2340] hover:bg-[#6B4FBB] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sign up
            </button>
          </div>
        )}

        {/* Right Action Icons: Study Buddy Button, Notifications, Avatar studio, Switch persona */}
        {user && (
          <div className="flex items-center gap-2">
            {/* Customize Study Buddy button */}
            <button
              onClick={onOpenAvatarStudio}
              title="Customize Buddy Closet"
              className="p-2 rounded-xl bg-[#F3EEFF] text-[#6B4FBB] hover:bg-[#E3D9FF] border border-[#D9D0E8] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Buddy Closet</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              title="Study Buddy Notifications"
              className="relative p-2 rounded-xl bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF] border border-[#D9D0E8] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Switch Persona Dropdown */}
            <div className="hidden sm:block">
              <select
                aria-label="Switch demo persona"
                value={user.id}
                onChange={(e) => switchUser(e.target.value)}
                className="text-xs font-bold bg-[#F3EEFF] text-[#3B2F5C] border border-[#D9D0E8] rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="user-student-1">👤 Sarah (Student · Stanford)</option>
                <option value="user-ta-1">🎓 Marcus (TA · Berkeley)</option>
                <option value="user-faculty-1">🦉 Dr. Chen (Faculty · Stanford)</option>
              </select>
            </div>

            <button
              onClick={onLogOut}
              title="Log out"
              className="p-2 rounded-xl text-[#4A4458] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile nav bar */}
      {user && (
        <div className="lg:hidden flex items-center justify-around gap-1 pt-2 mt-2 border-t border-[#E3D9FF] text-center">
          <button
            onClick={() => onSelectTab("profile")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold ${
              currentTab === "profile" ? "bg-[#6B4FBB] text-white" : "text-[#3B2F5C]"
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => onSelectTab("location")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold ${
              currentTab === "location" ? "bg-[#6B4FBB] text-white" : "text-[#3B2F5C]"
            }`}
          >
            Nearby
          </button>
          <button
            onClick={() => onSelectTab("verify-id")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold ${
              currentTab === "verify-id" ? "bg-[#6B4FBB] text-white" : "text-[#3B2F5C]"
            }`}
          >
            Verify ID
          </button>
          <button
            onClick={() => onSelectTab("human")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold ${
              currentTab === "human" ? "bg-[#6B4FBB] text-white" : "text-[#3B2F5C]"
            }`}
          >
            Human
          </button>
          <button
            onClick={() => onSelectTab("admin-review")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold relative ${
              currentTab === "admin-review" ? "bg-[#6B4FBB] text-white" : "text-[#3B2F5C]"
            }`}
          >
            Review {adminQueueCount > 0 ? `(${adminQueueCount})` : ""}
          </button>
        </div>
      )}
    </header>
  );
};
