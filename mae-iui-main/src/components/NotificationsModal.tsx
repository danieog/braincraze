import React, { useState } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  X,
  Send,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";
import { BuddyNotification, NotificationCategory, Profile } from "../lib/types";

interface Props {
  user: Profile;
  isOpen: boolean;
  notifications: BuddyNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onTriggerTestNotification: (category: NotificationCategory) => void;
  onToggleForcedMode: (enabled: boolean) => void;
  onSendFacultyBroadcast?: (message: string, course: string) => void;
}

export const NotificationsModal: React.FC<Props> = ({
  user,
  isOpen,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onTriggerTestNotification,
  onToggleForcedMode,
  onSendFacultyBroadcast,
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "assignments" | "schedule" | "nearby" | "faculty">("all");
  const [facultyMsg, setFacultyMsg] = useState("");
  const [facultyCourse, setFacultyCourse] = useState("CS 106B");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (n.isDismissed) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "assignments") {
      return (
        n.category === "missing_assignment" ||
        n.category === "upcoming_assignment" ||
        n.category === "past_due_assignment"
      );
    }
    if (activeFilter === "schedule") return n.category === "schedule_change";
    if (activeFilter === "nearby") return n.category === "nearby_study";
    if (activeFilter === "faculty") return n.category === "faculty_message";
    return true;
  });

  const isFacultyOrTa = user.role === "faculty" || user.role === "teaching_assistant";

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyMsg.trim() || !onSendFacultyBroadcast) return;
    onSendFacultyBroadcast(facultyMsg.trim(), facultyCourse);
    setFacultyMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFF8F0] border border-[#D9D0E8] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F3EEFF] border-b border-[#D9D0E8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6B4FBB] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-fredoka text-lg font-bold text-[#3B2F5C]">
                {user.buddySettings.name}&apos;s Notification Hub
              </h2>
              <p className="text-xs text-[#4A4458]">
                Deadlines, calendar changes, nearby study partners, and faculty mail
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

        {/* Forced Mode Banner & Quick Simulators */}
        <div className="px-6 py-3 bg-[#E3D9FF]/60 border-b border-[#D9D0E8] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#6B4FBB]" />
            <span className="font-bold text-[#3B2F5C]">
              Forced Mode: {user.buddySettings.forcedMode ? "ACTIVE (Bypasses snoozes)" : "Standard"}
            </span>
            <button
              onClick={() => onToggleForcedMode(!user.buddySettings.forcedMode)}
              className="px-2 py-0.5 bg-white text-[#6B4FBB] hover:bg-[#F3EEFF] rounded-lg font-semibold border border-[#D9D0E8] cursor-pointer"
            >
              Toggle
            </button>
          </div>

          <button
            onClick={onMarkAllRead}
            className="text-[#6B4FBB] hover:underline font-bold cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="px-6 pt-3 pb-2 flex gap-1.5 overflow-x-auto border-b border-[#E3D9FF]">
          {[
            { id: "all", label: "All Alerts" },
            { id: "assignments", label: "📚 Assignments" },
            { id: "schedule", label: "📅 Schedule" },
            { id: "nearby", label: "📍 Nearby (<25 mi)" },
            { id: "faculty", label: "🎓 Faculty Mail" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-[#6B4FBB] text-white shadow-xs"
                  : "bg-white text-[#4A4458] hover:bg-[#F3EEFF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E3D9FF] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm text-[#3B2F5C]">All caught up!</p>
              <p className="text-xs text-[#4A4458]">
                No pending notifications in this category. Use the test triggers below to try out alerts.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isCritical = item.urgency === "critical" || item.category === "past_due_assignment";
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 shadow-xs ${
                    isCritical
                      ? "bg-rose-50 border-rose-300"
                      : item.isRead
                      ? "bg-white/70 border-[#E3D9FF] opacity-80"
                      : "bg-white border-[#D9D0E8]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {item.category === "past_due_assignment" && (
                        <span className="p-1 rounded-lg bg-rose-200 text-rose-800">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      {item.category === "missing_assignment" && (
                        <span className="p-1 rounded-lg bg-amber-200 text-amber-800">
                          <Clock className="w-4 h-4" />
                        </span>
                      )}
                      {item.category === "upcoming_assignment" && (
                        <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                          <Clock className="w-4 h-4" />
                        </span>
                      )}
                      {item.category === "schedule_change" && (
                        <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
                          <Calendar className="w-4 h-4" />
                        </span>
                      )}
                      {item.category === "nearby_study" && (
                        <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                          <Users className="w-4 h-4" />
                        </span>
                      )}
                      {item.category === "faculty_message" && (
                        <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                          <GraduationCap className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-[#2B2340]">{item.title}</h4>
                        {item.courseOrSender && (
                          <span className="text-[11px] font-semibold text-[#6B4FBB]">
                            {item.courseOrSender}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[#4A4458]">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => onDismiss(item.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A4458] leading-relaxed">{item.body}</p>

                  {/* Dispatched channel indicators for forced mode */}
                  {item.dispatchedChannels && item.dispatchedChannels.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-[#4A4458]">
                      <span className="font-bold text-rose-700">Forced Channels:</span>
                      {item.dispatchedChannels.map((c) => (
                        <span key={c} className="px-1.5 py-0.2 bg-white rounded border border-gray-200 uppercase font-mono">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {!item.isRead ? (
                      <button
                        onClick={() => onMarkRead(item.id)}
                        className="text-xs font-semibold text-[#6B4FBB] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark completed
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium">✓ Completed</span>
                    )}

                    {item.actionLabel && (
                      <button
                        onClick={() => {
                          onMarkRead(item.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#6B4FBB] text-white text-[11px] font-bold rounded-lg hover:bg-[#583da7] cursor-pointer"
                      >
                        {item.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Faculty Broadcast Box (Faculty get buddies too!) */}
          {isFacultyOrTa && onSendFacultyBroadcast && (
            <div className="p-4 bg-[#F3EEFF] border border-[#D9D0E8] rounded-2xl space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3B2F5C]">
                <GraduationCap className="w-4 h-4 text-[#6B4FBB]" />
                Faculty Broadcast — Send Direct Message to Student Buddies
              </div>
              <form onSubmit={handleBroadcast} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={facultyCourse}
                    onChange={(e) => setFacultyCourse(e.target.value)}
                    placeholder="Course (e.g. CS 106B)"
                    className="w-32 px-3 py-2 bg-white border border-[#D9D0E8] rounded-xl text-xs text-[#2B2340] focus:outline-none focus:ring-1 focus:ring-[#6B4FBB]"
                  />
                  <input
                    type="text"
                    value={facultyMsg}
                    onChange={(e) => setFacultyMsg(e.target.value)}
                    placeholder="e.g. Midterm review session today at 4:30 PM in Hall B"
                    className="flex-1 px-3 py-2 bg-white border border-[#D9D0E8] rounded-xl text-xs text-[#2B2340] focus:outline-none focus:ring-1 focus:ring-[#6B4FBB]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!facultyMsg.trim()}
                  className="px-4 py-1.5 bg-[#6B4FBB] hover:bg-[#583da7] disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" /> Broadcast to Course
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Test Dispatch Triggers */}
        <div className="px-6 py-3 bg-[#F3EEFF] border-t border-[#D9D0E8] space-y-1.5">
          <span className="text-[11px] font-bold text-[#4A4458] block">
            ⚡ Test Notification Dispatchers (Simulate Study Buddy Alerts):
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onTriggerTestNotification("past_due_assignment")}
              className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold rounded-lg border border-rose-300 cursor-pointer"
            >
              🚨 Past Due (Trigger Freeze)
            </button>
            <button
              onClick={() => onTriggerTestNotification("missing_assignment")}
              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-300 cursor-pointer"
            >
              ⚠️ Missing Work
            </button>
            <button
              onClick={() => onTriggerTestNotification("schedule_change")}
              className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold rounded-lg border border-purple-300 cursor-pointer"
            >
              📅 Schedule Change
            </button>
            <button
              onClick={() => onTriggerTestNotification("nearby_study")}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 cursor-pointer"
            >
              📍 Nearby Partner (&lt;25 mi)
            </button>
            <button
              onClick={() => onTriggerTestNotification("faculty_message")}
              className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-bold rounded-lg border border-indigo-300 cursor-pointer"
            >
              🎓 Faculty Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
