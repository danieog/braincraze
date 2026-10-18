import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LandingView } from "./components/LandingView";
import { AuthScreen } from "./components/AuthScreen";
import { LocationView } from "./components/LocationView";
import { VerifyIdView } from "./components/VerifyIdView";
import { HumanVerificationView } from "./components/HumanVerificationView";
import { AdminReviewView } from "./components/AdminReviewView";
import { TumblrProfileView } from "./components/TumblrProfileView";
import { FloatingStudyBuddy } from "./components/FloatingStudyBuddy";
import { AvatarCreatorModal } from "./components/AvatarCreatorModal";
import { NotificationsModal } from "./components/NotificationsModal";
import {
  getCurrentUser,
  getVerificationProgress,
  getAdminQueue,
  getNotifications,
  logInUser,
  logOutUser,
  subscribeToStore,
  updateUserProfile,
  updateBuddyCustomization,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  triggerSimulatedNotification,
  sendFacultyBroadcast,
} from "./lib/store";

export function App() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [progress, setProgress] = useState(getVerificationProgress());
  const [adminQueueCount, setAdminQueueCount] = useState(getAdminQueue().length);
  const [notifications, setNotifications] = useState(getNotifications());
  const [currentTab, setCurrentTab] = useState<string>("profile");
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

  // Modals
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToStore(() => {
      const u = getCurrentUser();
      setCurrentUser(u);
      setProgress(getVerificationProgress(u?.id));
      setAdminQueueCount(getAdminQueue().length);
      setNotifications([...getNotifications()]);
    });
    return unsub;
  }, []);

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
  };

  const handleAuthSuccess = () => {
    setAuthMode(null);
    setCurrentTab("profile");
  };

  const handleLogOut = async () => {
    await logOutUser();
    setCurrentTab("landing");
  };

  const handleQuickDemo = async (email: string) => {
    await logInUser(email);
    setCurrentTab("profile");
  };

  const refreshState = () => {
    const u = getCurrentUser();
    setCurrentUser(u);
    setProgress(getVerificationProgress(u?.id));
    setAdminQueueCount(getAdminQueue().length);
    setNotifications([...getNotifications()]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead && !n.isDismissed).length;

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#2B2340] flex flex-col font-sans relative selection:bg-[#E3D9FF]">
      <Header
        user={currentUser}
        progress={progress}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setAuthMode(null);
          setCurrentTab(tab);
        }}
        onLogOut={handleLogOut}
        onOpenAuth={handleOpenAuth}
        adminQueueCount={adminQueueCount}
        unreadNotificationCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAvatarStudio={() => setIsAvatarStudioOpen(true)}
      />

      <main className="flex-1 pb-16">
        {authMode ? (
          <AuthScreen
            initialMode={authMode}
            onSuccess={handleAuthSuccess}
            onBack={() => setAuthMode(null)}
          />
        ) : !currentUser || currentTab === "landing" ? (
          <LandingView
            onOpenAuth={handleOpenAuth}
            onQuickDemo={handleQuickDemo}
          />
        ) : currentTab === "profile" ? (
          <TumblrProfileView
            user={currentUser}
            onUpdateProfile={updateUserProfile}
            onOpenCustomizer={() => setIsAvatarStudioOpen(true)}
          />
        ) : currentTab === "location" ? (
          <LocationView user={currentUser} />
        ) : currentTab === "verify-id" ? (
          <VerifyIdView
            user={currentUser}
            progress={progress}
            onRefresh={refreshState}
            onNavigateTab={setCurrentTab}
          />
        ) : currentTab === "human" ? (
          <HumanVerificationView
            user={currentUser}
            progress={progress}
            onSuccess={refreshState}
            onNavigateTab={setCurrentTab}
          />
        ) : currentTab === "admin-review" ? (
          <AdminReviewView onRefresh={refreshState} />
        ) : (
          <TumblrProfileView
            user={currentUser}
            onUpdateProfile={updateUserProfile}
            onOpenCustomizer={() => setIsAvatarStudioOpen(true)}
          />
        )}
      </main>

      {/* Interactive Floating Study Buddy on Screen */}
      {currentUser && (
        <FloatingStudyBuddy
          user={currentUser}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenCustomizer={() => setIsAvatarStudioOpen(true)}
          onDismissNotification={dismissNotification}
        />
      )}

      {/* Mii & Animal Crossing Avatar Creator Studio Modal */}
      {currentUser && (
        <AvatarCreatorModal
          user={currentUser}
          isOpen={isAvatarStudioOpen}
          onClose={() => setIsAvatarStudioOpen(false)}
          onSave={updateBuddyCustomization}
        />
      )}

      {/* Study Buddy Notifications Modal */}
      {currentUser && (
        <NotificationsModal
          user={currentUser}
          isOpen={isNotificationsOpen}
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
          onDismiss={dismissNotification}
          onTriggerTestNotification={triggerSimulatedNotification}
          onToggleForcedMode={(enabled) =>
            updateUserProfile({
              buddySettings: {
                ...currentUser.buddySettings,
                forcedMode: enabled,
              },
            })
          }
          onSendFacultyBroadcast={sendFacultyBroadcast}
        />
      )}

      <footer className="border-t border-[#E3D9FF] py-6 px-4 text-center text-xs text-[#4A4458] bg-[#FFF8F0]/90">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-fredoka">
            © {new Date().getFullYear()} BrainCraze. Digital Study Buddy · Tumblr Blog · Academic Network.
          </p>
          <p className="text-[11px] text-[#4A4458]/80">
            Mii & Animal Crossing avatar companion · Strict upload limits enforced · &lt;25 mi study radar
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
