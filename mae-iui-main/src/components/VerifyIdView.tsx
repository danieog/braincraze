import React, { useState } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { Profile, Role, ROLES, VerificationProgress } from "../lib/types";
import { listSchools, submitSchoolId } from "../lib/store";
import { VerificationProgressCard } from "./VerificationProgressCard";
import { onboardingCopy } from "../content/onboarding";

interface Props {
  user: Profile;
  progress: VerificationProgress;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

const SAMPLE_STUDENT_ID =
  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";

export const VerifyIdView: React.FC<Props> = ({
  user,
  progress,
  onRefresh,
  onNavigateTab,
}) => {
  const schools = listSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    user.school_id || schools[0]?.id || "",
  );
  const [selectedRole, setSelectedRole] = useState<Role>(user.role || "student");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const status = progress.reviewStatus;
  const isPending = ["queued", "processing", "manual_review"].includes(status || "");
  const isApproved = status === "approved" && progress.schoolVerified;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUri(reader.result as string);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSample = () => {
    setImageUri(SAMPLE_STUDENT_ID);
    setMessage("Sample university ID loaded. Ready to submit.");
  };

  const handleSubmit = async () => {
    if (!selectedSchoolId || !imageUri) return;
    setBusy(true);
    setMessage(null);

    try {
      await submitSchoolId({
        schoolId: selectedSchoolId,
        role: selectedRole,
        imageDataUri: imageUri,
      });
      setMessage("Your ID upload was queued for human review. Photo will be deleted after review.");
      onRefresh();
    } catch (err: any) {
      setMessage(err?.message || "Failed to submit ID.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B2F5C]">
          Verify your school ID
        </h1>
        <p className="text-sm sm:text-base text-[#4A4458] leading-relaxed">
          This is optional. Upload a clear photo of your school ID to earn a verified badge.
          A person reviews every submission, and the photo is permanently deleted after their decision.
        </p>
      </div>

      {/* Progress card */}
      <VerificationProgressCard
        progress={progress}
        signedIn={true}
        onRefresh={onRefresh}
        onNavigate={onNavigateTab}
      />

      {/* If Approved or Pending */}
      {isApproved ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-emerald-950">
            Your school affiliation has been approved!
          </h2>
          <p className="text-sm text-emerald-800 max-w-md mx-auto">
            You now carry the verified academic badge for{" "}
            <span className="font-semibold">{user.school_name || "your school"}</span>.
            Your submitted ID photo was securely deleted from our storage.
          </p>
        </div>
      ) : isPending ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-amber-950">
            Awaiting Human Review
          </h2>
          <p className="text-sm text-amber-800 max-w-md mx-auto">
            {onboardingCopy.pending} {onboardingCopy.privacy}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateTab("admin-review")}
              className="text-xs font-semibold text-[#6B4FBB] hover:underline cursor-pointer"
            >
              Switch to ID Review Queue to test reviewer approval →
            </button>
          </div>
        </div>
      ) : (
        /* Submission form */
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#E3D9FF] shadow-xs">
          {/* School selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#3B2F5C] uppercase tracking-wider">
              School
            </label>
            <div className="flex flex-wrap gap-2">
              {schools.map((school) => {
                const selected = selectedSchoolId === school.id;
                return (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => setSelectedSchoolId(school.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? "bg-[#6B4FBB] text-white shadow-xs"
                        : "bg-[#E3D9FF] text-[#3B2F5C] hover:bg-[#d6c7fc]"
                    }`}
                  >
                    {school.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#3B2F5C] uppercase tracking-wider">
              I am a
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const selected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                      selected
                        ? "bg-[#6B4FBB] text-white shadow-xs"
                        : "bg-[#E3D9FF] text-[#3B2F5C] hover:bg-[#d6c7fc]"
                    }`}
                  >
                    {r.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#3B2F5C] uppercase tracking-wider">
              ID Card Photo
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E3D9FF] hover:bg-[#d6c7fc] text-[#3B2F5C] rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" /> Choose photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleUseSample}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#D9D0E8] hover:bg-[#F3EEFF] text-[#3B2F5C] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#6B4FBB]" /> Use sample student ID
              </button>
            </div>
          </div>

          {/* Preview */}
          {imageUri && (
            <div className="relative rounded-xl overflow-hidden border border-[#D9D0E8] bg-gray-50">
              <img
                src={imageUri}
                alt="ID preview"
                className="w-full max-h-64 object-contain mx-auto"
              />
              <button
                onClick={() => setImageUri(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {message && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={busy || !selectedSchoolId || !imageUri}
            className="w-full min-h-[48px] px-6 py-3 bg-[#6B4FBB] hover:bg-[#583da7] disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {busy ? "Submitting for review..." : "Submit for review"}
          </button>
        </div>
      )}
    </div>
  );
};
