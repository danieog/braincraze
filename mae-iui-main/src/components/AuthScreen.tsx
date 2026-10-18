import React, { useState } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { VerificationProgressCard } from "./VerificationProgressCard";
import { signUpUser, logInUser } from "../lib/store";

interface Props {
  initialMode: "signup" | "login";
  onSuccess: () => void;
  onBack: () => void;
}

export function passwordStrength(password: string): string {
  if (!password) return "";
  if (password.length < 8) return "Password must be at least 8 characters.";
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return "Password strength: Weak";
  if (score === 2) return "Password strength: Fair";
  if (score === 3) return "Password strength: Good";
  return "Password strength: Strong";
}

export function signupError(email: string, pw: string, confirm: string): string | null {
  if (!email || !email.includes("@")) return "Enter a valid email address.";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw !== confirm) return "Passwords do not match.";
  return null;
}

export const AuthScreen: React.FC<Props> = ({ initialMode, onSuccess, onBack }) => {
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignup) {
      const err = signupError(email, password, confirmation);
      if (err) {
        setError(err);
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setError("Enter your email and password.");
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignup) {
        await signUpUser(email, password);
      } else {
        await logInUser(email);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("BrainCraze2026!");
    if (isSignup) setConfirmation("BrainCraze2026!");
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A4458] hover:text-[#2B2340] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to BrainCraze
      </button>

      <div className="bg-white rounded-3xl border border-[#E3D9FF] p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#3B2F5C]">
            {isSignup ? "Create your account" : "Log in"}
          </h2>
          <p className="text-sm text-[#4A4458] mt-1">
            {isSignup
              ? "Verification is optional. You can join now and verify your school later with a school ID."
              : "Welcome back! Enter your account details to access BrainCraze."}
          </p>
        </div>

        {isSignup && (
          <div className="scale-95 origin-top">
            <VerificationProgressCard
              progress={{
                emailVerified: false,
                humanVerified: false,
                schoolVerified: false,
                reviewStatus: null,
                method: null,
              }}
              signedIn={false}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3B2F5C] mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu or personal email"
                disabled={busy}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9D0E8] rounded-xl text-sm text-[#2B2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B4FBB]/30 focus:border-[#6B4FBB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B2F5C] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 characters)"
                disabled={busy}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#D9D0E8] rounded-xl text-sm text-[#2B2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B4FBB]/30 focus:border-[#6B4FBB]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isSignup && password && (
              <p className="text-[11px] text-[#6B4FBB] font-medium mt-1">
                {passwordStrength(password)}
              </p>
            )}
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-[#3B2F5C] mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Repeat your password"
                  disabled={busy}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9D0E8] rounded-xl text-sm text-[#2B2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B4FBB]/30 focus:border-[#6B4FBB]"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password || (isSignup && !confirmation)}
            className="w-full py-3 bg-[#222222] hover:bg-[#333333] disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : isSignup ? (
              "Sign up"
            ) : (
              "Log in"
            )}
          </button>
        </form>

        {/* Demo Fast-Fill */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4A4458]">
            <Sparkles className="w-3.5 h-3.5 text-[#6B4FBB]" />
            Or quick fill with sample credentials:
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill("sarah.miller@stanford.edu")}
              className="text-[11px] px-2.5 py-1 bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF] rounded-lg font-medium transition-colors cursor-pointer"
            >
              Sarah (Stanford)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("marcus.k@berkeley.edu")}
              className="text-[11px] px-2.5 py-1 bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF] rounded-lg font-medium transition-colors cursor-pointer"
            >
              Marcus (Berkeley TA)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("new.applicant@mit.edu")}
              className="text-[11px] px-2.5 py-1 bg-[#F3EEFF] text-[#3B2F5C] hover:bg-[#E3D9FF] rounded-lg font-medium transition-colors cursor-pointer"
            >
              New Student (MIT)
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setMode(isSignup ? "login" : "signup");
              setError(null);
              setMessage(null);
            }}
            className="text-xs font-semibold text-[#6B4FBB] hover:underline cursor-pointer"
          >
            {isSignup ? "Already have an account? Log in" : "New to BrainCraze? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
