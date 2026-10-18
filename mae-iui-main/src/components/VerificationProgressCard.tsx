import React from "react";
import { CheckCircle2, Circle, AlertCircle, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { onboardingCopy as copy } from "../content/onboarding";
import { VerificationProgress, ProgressStep } from "../lib/types";

interface Props {
  progress: VerificationProgress | null;
  signedIn: boolean;
  onNavigate?: (tab: string) => void;
  onRefresh?: () => void;
}

export function progressSteps(
  progress: VerificationProgress | null,
  signedIn: boolean,
): ProgressStep[] {
  if (!signedIn) {
    return [
      { key: "account", state: "current" },
      { key: "human", state: "locked" },
      { key: "submission", state: "locked" },
      { key: "review", state: "locked" },
    ];
  }
  const status = progress?.reviewStatus ?? "";
  const submitted = ["queued", "processing", "manual_review", "approved"].includes(status);
  const approved = status === "approved" && Boolean(progress?.schoolVerified);
  const needsEvidence = ["awaiting_upload", "needs_reupload", "rejected"].includes(status);

  return [
    { key: "account", state: "complete" },
    { key: "human", state: progress?.humanVerified ? "complete" : "optional" },
    {
      key: "submission",
      state: submitted ? "complete" : needsEvidence ? "current" : "optional",
    },
    { key: "review", state: approved ? "complete" : submitted ? "current" : "optional" },
  ];
}

export const VerificationProgressCard: React.FC<Props> = ({
  progress,
  signedIn,
  onNavigate,
  onRefresh,
}) => {
  const steps = progressSteps(progress, signedIn);
  const status = progress?.reviewStatus;

  return (
    <div className="bg-[#F3EEFF] border border-[#D9D0E8] rounded-2xl p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#6B4FBB]" />
          <h3 className="font-semibold text-base text-[#3B2F5C]">{copy.title}</h3>
        </div>
        {signedIn && onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs font-medium text-[#6B4FBB] hover:underline cursor-pointer"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {steps.map((step) => {
          const isComplete = step.state === "complete";
          const isCurrent = step.state === "current";
          const isLocked = step.state === "locked";

          let stepTarget = "signup";
          if (step.key === "human") stepTarget = "human";
          if (step.key === "submission") stepTarget = "verify-id";
          if (step.key === "review") stepTarget = "verify-id";

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                isCurrent
                  ? "bg-white/80 border border-[#6B4FBB]/20"
                  : isComplete
                  ? "bg-white/40"
                  : "bg-transparent opacity-85"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-[#6B4FBB] shrink-0 animate-pulse" />
                ) : isLocked ? (
                  <Circle className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#8A3B12] shrink-0" />
                )}
                <div>
                  <span className="text-sm font-medium text-[#3B2F5C]">
                    {copy.steps[step.key]}
                  </span>
                  <span className="text-xs text-[#4A4458] ml-2">
                    — {copy.states[step.state]}
                  </span>
                </div>
              </div>

              {(step.state === "current" || step.state === "optional") &&
                step.key !== "review" &&
                onNavigate && (
                  <button
                    onClick={() => onNavigate(stepTarget)}
                    className="text-xs font-semibold text-[#6B4FBB] hover:text-[#523A97] flex items-center gap-0.5 cursor-pointer"
                  >
                    Continue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
            </div>
          );
        })}
      </div>

      {["queued", "processing", "manual_review"].includes(status ?? "") && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-2 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{copy.pending}</span>
        </div>
      )}

      {status === "rejected" && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 mb-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{copy.rejected}</span>
        </div>
      )}

      {status === "needs_reupload" && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{copy.reupload}</span>
        </div>
      )}

      <p className="text-xs text-[#4A4458] leading-relaxed pt-1">
        {copy.notice}
      </p>
    </div>
  );
};
