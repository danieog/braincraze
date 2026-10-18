import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Smartphone,
  ShieldAlert,
} from "lucide-react";
import { Profile, BuddyNotification } from "../lib/types";
import { BuddyAvatarView, BuddyPose } from "./BuddyAvatarView";

interface Props {
  user: Profile;
  notifications: BuddyNotification[];
  onOpenNotifications: () => void;
  onOpenCustomizer: () => void;
  onDismissNotification: (id: string) => void;
}

export const FloatingStudyBuddy: React.FC<Props> = ({
  user,
  notifications,
  onOpenNotifications,
  onOpenCustomizer,
  onDismissNotification: _onDismissNotification,
}) => {
  const { buddyAvatar, buddySettings } = user;
  const cursorFollow = buddySettings.cursorFollow;
  const forcedMode = buddySettings.forcedMode;

  const [mousePos, setMousePos] = useState({ x: 120, y: 220 });
  const [buddyPos, setBuddyPos] = useState({ x: 100, y: 400 });
  const [pose, setPose] = useState<BuddyPose>("idle");
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  // References for animation loop
  const posRef = useRef(buddyPos);
  const lastMousePosRef = useRef(mousePos);
  const isJoggingToClickRef = useRef(false);
  const clickTargetRef = useRef<{ x: number; y: number } | null>(null);
  const isPointingRef = useRef(false);

  useEffect(() => {
    posRef.current = buddyPos;
  }, [buddyPos]);

  // Check for critical / past due notifications
  const unreadNotifications = notifications.filter((n) => !n.isRead && !n.isDismissed);
  const criticalNotifications = unreadNotifications.filter(
    (n) => n.urgency === "critical" || n.category === "past_due_assignment",
  );

  // Screen freeze derived if forced mode is ON and critical tasks are pending
  const isFrozen = forcedMode && criticalNotifications.length > 0;

  // Periodic speech bubble tips
  useEffect(() => {
    const tips = [
      `Hi ${user.display_name.split(" ")[0]}! I'm ${buddySettings.name}, your cursor buddy.`,
      unreadNotifications.length > 0
        ? `You have ${unreadNotifications.length} updates waiting!`
        : `Ready to study! Hover over any button and I'll point.`,
      forcedMode
        ? `⚡ Forced Mode is active. I will freeze the window if tasks are past due!`
        : `Tip: Turn on Forced Mode if you want strict accountability!`,
    ];

    let tipIndex = 0;
    const interval = setInterval(() => {
      if (!isFrozen && !isPointingRef.current && !isJoggingToClickRef.current) {
        tipIndex = (tipIndex + 1) % tips.length;
        setSpeechBubble(tips[tipIndex]);
        setTimeout(() => setSpeechBubble(null), 4000);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [user.display_name, buddySettings.name, unreadNotifications.length, forcedMode, isFrozen]);

  // Main Cursor Tracker, Hover Pointing, and Click Jogging Engine
  useEffect(() => {
    if (!cursorFollow) return;

    // Mouse Move & Hover detection
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Determine facing direction from mouse velocity
      if (Math.abs(e.clientX - lastMousePosRef.current.x) > 3) {
        setFacing(e.clientX > lastMousePosRef.current.x ? "right" : "left");
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (isJoggingToClickRef.current) return;

      // Check if hovering over an interactive button or option
      const interactiveEl = (e.target as HTMLElement)?.closest(
        'button, a, input, select, textarea, [role="button"], [role="tab"], .cursor-pointer'
      ) as HTMLElement | null;

      if (interactiveEl) {
        isPointingRef.current = true;
        const rect = interactiveEl.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;

        // Point arms towards the button
        setFacing(elementCenterX >= posRef.current.x ? "right" : "left");
        setPose("pointing");
      } else {
        isPointingRef.current = false;
      }
    };

    // Global Click Handler: Buddy jogs / walks eagerly to any button or option clicked!
    const handleGlobalClick = (e: MouseEvent) => {
      const interactiveEl = (e.target as HTMLElement)?.closest(
        'button, a, input, select, [role="button"], [role="tab"], .cursor-pointer'
      );

      if (interactiveEl) {
        const rect = (interactiveEl as HTMLElement).getBoundingClientRect();
        const targetX = Math.max(10, rect.left + rect.width / 2 - 25);
        const targetY = Math.max(10, rect.top - 55);

        clickTargetRef.current = { x: targetX, y: targetY };
        isJoggingToClickRef.current = true;
        setFacing(targetX >= posRef.current.x ? "right" : "left");
        setPose("jogging");

        // When it reaches, show clicking tap animation
        setTimeout(() => {
          setPose("clicking");
          setTimeout(() => {
            isJoggingToClickRef.current = false;
            clickTargetRef.current = null;
            setPose("idle");
          }, 350);
        }, 320);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, [cursorFollow]);

  // Animation Loop: Smooth limb-walking interpolation towards cursor or click target
  useEffect(() => {
    if (!cursorFollow) return;

    const timer = setInterval(() => {
      setBuddyPos((prev) => {
        let destX: number;
        let destY: number;

        if (isJoggingToClickRef.current && clickTargetRef.current) {
          // Sprint to clicked option!
          destX = clickTargetRef.current.x;
          destY = clickTargetRef.current.y;
        } else {
          // Cursor follow offset
          destX = Math.min(Math.max(10, mousePos.x + 20), window.innerWidth - 80);
          destY = Math.min(Math.max(10, mousePos.y + 15), window.innerHeight - 90);
        }

        const dx = destX - prev.x;
        const dy = destY - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Dynamic Pose selection based on speed if not pointing or clicking
        if (!isPointingRef.current && !isJoggingToClickRef.current) {
          if (dist > 28) {
            setPose("jogging");
          } else if (dist > 5) {
            setPose("walking");
          } else {
            setPose("idle");
          }
        }

        const speed = isJoggingToClickRef.current ? 0.35 : 0.18;
        const nextX = prev.x + dx * speed;
        const nextY = prev.y + dy * speed;

        return { x: nextX, y: nextY };
      });
    }, 24);

    return () => clearInterval(timer);
  }, [cursorFollow, mousePos]);

  // Click handler on the buddy itself
  const handleBuddyClick = () => {
    if (unreadNotifications.length > 0) {
      onOpenNotifications();
    } else {
      setPose("waving");
      setSpeechBubble(`Need a break? Customize my limbs or style in Buddy Closet!`);
      setTimeout(() => {
        setSpeechBubble(null);
        setPose("idle");
      }, 3500);
    }
  };

  return (
    <>
      {/* --- FORCED MODE SCREEN FREEZE / LOCKDOWN OVERLAY --- */}
      {isFrozen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#FFF8F0] border-4 border-rose-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-freeze-pulse">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-2 border-rose-300">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-full">
                🚨 Study Buddy Screen Freeze Active
              </span>
              <h2 className="font-fredoka text-2xl font-bold text-[#3B2F5C] pt-2">
                Window Locked by {buddySettings.name}
              </h2>
              <p className="text-sm text-[#4A4458]">
                Forced Mode is ON: You have urgent or past-due academic assignments!
                Your screen is frozen until you acknowledge your tasks.
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-left space-y-2 text-xs text-rose-950">
              <div className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-rose-600" /> Automated Forced Dispatch Log:
              </div>
              <p className="text-[11px] leading-relaxed">
                • SMS Text alert dispatched to linked student mobile phone.<br />
                • Automated reminder email routed to <strong>{user.email}</strong>.<br />
                • Faculty & TA advisory flagged in BrainCraze academic records.
              </p>
            </div>

            <div className="space-y-2 text-left">
              {criticalNotifications.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-rose-300 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-900">{item.title}</div>
                    <div className="text-[11px] text-[#4A4458]">{item.body}</div>
                  </div>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded">
                    PAST DUE
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onOpenNotifications}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" /> Open Notifications & Unfreeze Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- THE CURSOR-FOLLOWING BUDDY WITH LIMBS --- */}
      <div
        style={{
          transform: cursorFollow
            ? `translate3d(${buddyPos.x}px, ${buddyPos.y}px, 0)`
            : "translate3d(calc(100vw - 90px), calc(100vh - 120px), 0)",
          transition: cursorFollow ? "none" : "transform 0.5s ease-out",
        }}
        className="fixed top-0 left-0 z-40 pointer-events-none select-none"
      >
        <div className="relative group pointer-events-auto">
          {/* Speech Bubble / Hover Tooltip */}
          {speechBubble && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 min-w-[170px] max-w-[230px] bg-white text-[#2B2340] px-3 py-1.5 rounded-2xl shadow-lg border border-[#D9D0E8] text-xs font-semibold animate-in fade-in z-50 text-center">
              {speechBubble}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#D9D0E8] rotate-45" />
            </div>
          )}

          {/* Full-Body Buddy with Limb Animations */}
          <div
            onClick={handleBuddyClick}
            title={`${buddySettings.name} (Your Cursor Study Buddy)`}
            className="cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            <BuddyAvatarView
              avatar={{
                ...buddyAvatar,
                mood: criticalNotifications.length > 0 ? "alarmed" : buddyAvatar.mood,
              }}
              size={56}
              pose={pose}
              facing={facing}
              isFullBody={true}
            />

            {/* Notification Badge on Buddy */}
            {unreadNotifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                {unreadNotifications.length}
              </div>
            )}
          </div>

          {/* Quick Hover Controls */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#2B2340] text-white px-2 py-0.5 rounded-full shadow-md text-[10px] whitespace-nowrap">
            <button
              onClick={onOpenNotifications}
              className="hover:text-emerald-400 font-bold px-1 cursor-pointer"
            >
              Alerts ({unreadNotifications.length})
            </button>
            <span>•</span>
            <button
              onClick={onOpenCustomizer}
              className="hover:text-[#E3D9FF] px-1 cursor-pointer"
            >
              Buddy Closet
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
