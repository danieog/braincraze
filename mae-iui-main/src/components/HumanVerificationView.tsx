import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Bot,
} from "lucide-react";
import { Profile, VerificationProgress } from "../lib/types";
import { completeHumanVerification } from "../lib/store";

interface Props {
  user: Profile;
  progress: VerificationProgress;
  onSuccess: () => void;
  onNavigateTab: (tab: string) => void;
}

export const HumanVerificationView: React.FC<Props> = ({
  user: _user,
  progress,
  onSuccess,
  onNavigateTab,
}) => {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(progress.humanVerified);
  const [error, setError] = useState("");
  const [challengeSeed, setChallengeSeed] = useState(4821);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Simple math challenge as accessible fallback for turnstile
  const num1 = (challengeSeed % 7) + 3;
  const num2 = (challengeSeed % 5) + 2;
  const correctAnswer = num1 + num2;
  const choices = [correctAnswer - 2, correctAnswer, correctAnswer + 3, correctAnswer + 1].sort(
    (a, b) => a - b,
  );

  const handleSelectChoice = (val: number) => {
    setSelectedAnswer(val);
    if (val === correctAnswer) {
      setToken(`verified-human-token-${val}`);
      setError("");
    } else {
      setToken("");
      setError("Incorrect answer. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setBusy(true);
    setError("");

    try {
      await completeHumanVerification();
      setVerified(true);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = () => {
    setChallengeSeed(Math.floor(1000 + Math.random() * 9000));
    setSelectedAnswer(null);
    setToken("");
    setError("");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B2F5C]">
          Verify you are human
        </h1>
        <p className="text-sm sm:text-base text-[#4A4458] leading-relaxed">
          This check is optional. It shows you are a person and not a script.
          Continue only after the verification check is confirmed.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3D9FF] shadow-xs space-y-6">
        {verified ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#3B2F5C]">
                Human verification completed!
              </h2>
              <p className="text-sm text-[#4A4458] mt-1">
                Your account is confirmed as human-operated.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab("verify-id")}
              className="px-6 py-3 bg-[#6B4FBB] hover:bg-[#583da7] text-white rounded-xl font-semibold text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              Continue to school ID verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* CAPTCHA card */}
            <div className="p-4 bg-[#F3EEFF] border border-[#D9D0E8] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3B2F5C] uppercase tracking-wider">
                  <Bot className="w-4 h-4 text-[#6B4FBB]" />
                  Interactive Human Check
                </div>
                <button
                  onClick={handleRetry}
                  className="text-xs text-[#6B4FBB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> New check
                </button>
              </div>

              <div className="p-4 bg-white rounded-lg border border-[#D9D0E8] space-y-3">
                <p className="text-sm text-[#2B2340] font-medium">
                  What is <span className="font-bold text-[#6B4FBB]">{num1} + {num2}</span>?
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleSelectChoice(choice)}
                      className={`py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                        selectedAnswer === choice
                          ? choice === correctAnswer
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-500 text-white"
                          : "bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF]"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>

              {token && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Challenge passed! Click verify to confirm.
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={busy || !token}
              className="w-full min-h-[48px] px-6 py-3 bg-[#6B4FBB] hover:bg-[#583da7] disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {busy ? "Verifying..." : "Verify and continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
