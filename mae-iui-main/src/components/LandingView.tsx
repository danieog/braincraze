import React from "react";
import {
  Users,
  ShieldCheck,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react";

interface Props {
  onOpenAuth: (mode: "login" | "signup") => void;
  onQuickDemo: (email: string) => void;
}

const STEPS = [
  {
    title: "Create an account",
    body: "Sign up with your email and a password. No ID or email confirmation is needed to join.",
    icon: Users,
  },
  {
    title: "Verify your school (optional)",
    body: "Photograph your school ID to earn a verified badge. A person reviews ID photos, then the photo is deleted.",
    icon: ShieldCheck,
  },
  {
    title: "Find people nearby",
    body: "Turn on location sharing to see students near you. It is off until you choose it, and you can stop any time.",
    icon: MapPin,
  },
];

export const LandingView: React.FC<Props> = ({ onOpenAuth, onQuickDemo }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3D9FF] text-[#3B2F5C] text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-[#6B4FBB]" />
          BrainCraze Community
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#3B2F5C] leading-tight tracking-tight">
          Meet verified students and teachers near you.
        </h1>
        <p className="text-base sm:text-lg text-[#4A4458] leading-relaxed">
          BrainCraze connects people at your school. Anyone can join. Members whose
          school ID a person has reviewed carry a badge showing they are a real student,
          faculty member, teaching assistant, staff member or tutor.
        </p>

        {/* Action CTA */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onOpenAuth("signup")}
            className="px-6 py-3.5 bg-[#222222] hover:bg-[#333333] text-white rounded-xl font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Sign up <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenAuth("login")}
            className="px-6 py-3.5 border border-[#222222] text-[#222222] hover:bg-black/5 rounded-xl font-semibold text-base transition-all text-center cursor-pointer"
          >
            Log in
          </button>
        </div>
      </div>

      {/* Quick Demo Selector for Reviewers */}
      <div className="p-4 bg-[#F3EEFF] border border-[#D9D0E8] rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#3B2F5C] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#6B4FBB]" />
          Instant Demo Mode — Try Any Persona
        </div>
        <p className="text-xs text-[#4A4458]">
          Reviewing or evaluating? Jump in instantly without typing passwords:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onQuickDemo("sarah.miller@stanford.edu")}
            className="p-2.5 bg-white hover:bg-[#E3D9FF] text-left rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer group"
          >
            <div className="text-xs font-bold text-[#3B2F5C] flex items-center justify-between">
              Sarah Miller
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Verified</span>
            </div>
            <div className="text-[11px] text-[#4A4458]">Stanford · Student</div>
          </button>

          <button
            onClick={() => onQuickDemo("marcus.k@berkeley.edu")}
            className="p-2.5 bg-white hover:bg-[#E3D9FF] text-left rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer group"
          >
            <div className="text-xs font-bold text-[#3B2F5C] flex items-center justify-between">
              Marcus Kim
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Verified</span>
            </div>
            <div className="text-[11px] text-[#4A4458]">Berkeley · Teaching Assistant</div>
          </button>

          <button
            onClick={() => onQuickDemo("liam.wright@uw.edu")}
            className="p-2.5 bg-white hover:bg-[#E3D9FF] text-left rounded-xl border border-[#D9D0E8] transition-colors cursor-pointer group"
          >
            <div className="text-xs font-bold text-[#3B2F5C] flex items-center justify-between">
              Liam Wright
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">In Review</span>
            </div>
            <div className="text-[11px] text-[#4A4458]">UW · Tutor (In Queue)</div>
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3B2F5C]">
          How it works
        </h2>
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex items-start gap-3.5 p-4 bg-white rounded-2xl border border-[#E3D9FF] shadow-xs"
              >
                <div className="w-8 h-8 rounded-full bg-[#222222] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#3B2F5C]">
                      {step.title}
                    </h3>
                    <Icon className="w-4 h-4 text-[#6B4FBB]" />
                  </div>
                  <p className="text-sm text-[#4A4458] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your privacy */}
      <div className="p-5 bg-white rounded-2xl border border-[#E3D9FF] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#6B4FBB]" />
          <h2 className="text-lg font-bold text-[#3B2F5C]">Your privacy</h2>
        </div>
        <p className="text-sm text-[#4A4458] leading-relaxed">
          Location sharing is opt-in and approximate. Your position is rounded to
          about 1 km so your exact home or classroom is never disclosed. Your ID photo is
          used only to verify your academic affiliation and is permanently deleted after human review.
        </p>
      </div>
    </div>
  );
};
