import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X, ChevronRight, ChevronLeft, Map, Trophy, User, Sparkles, LayoutDashboard } from "lucide-react";
import { getToken, getUserRole } from "@/lib/auth";

const STORAGE_KEY = "brainepedia.onboarding.v1.done";

type Step = {
  title: string;
  body: string;
  icon: React.ReactNode;
  cta?: string;
  href?: string;
};

const USER_STEPS: Step[] = [
  {
    title: "Welcome to Brainepedia",
    body: "This is your command centre. Track your XP, streaks, and earned badges right from your dashboard.",
    icon: <LayoutDashboard className="w-6 h-6 text-[#00D2FF]" />,
  },
  {
    title: "Choose Your Profession",
    body: "Start by selecting a profession. This unlocks your personalised Imperial Map filled with districts to conquer.",
    icon: <Map className="w-6 h-6 text-[#9D4EDD]" />,
    cta: "Select Profession",
    href: "/profession/select",
  },
  {
    title: "Conquer Districts",
    body: "Each district contains problem nodes — real-world coding challenges. Solve them to earn XP and climb the ranks.",
    icon: <Sparkles className="w-6 h-6 text-[#FFD700]" />,
  },
  {
    title: "Earn Badges",
    body: "Complete milestones to unlock Bronze, Silver, Gold and Platinum badges. Visit your Trophy Case to see them all.",
    icon: <Trophy className="w-6 h-6 text-amber-400" />,
    cta: "View Badges",
    href: "/user/badges",
  },
  {
    title: "Keep Your Profile Updated",
    body: "A complete dossier helps employers discover you. Add your bio, socials and a profile photo from Edit Profile.",
    icon: <User className="w-6 h-6 text-[#00D2FF]" />,
    cta: "Edit Profile",
    href: "/profile/edit",
  },
];

export function OnboardingGuide() {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const token = getToken();
    const role = getUserRole();
    const done = localStorage.getItem(STORAGE_KEY);
    if (token && role === "User" && !done) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    setStep(s => Math.max(0, s - 1));
  }

  function handleCta(href?: string) {
    dismiss();
    if (href) navigate(href);
  }

  const steps = USER_STEPS;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[61] w-[min(420px,calc(100vw-32px))] rounded-2xl border border-[#9D4EDD]/30 bg-[#0a0d16] shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-0.5 w-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-[#9D4EDD] to-[#00D2FF]"
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            <div className="p-6">
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                title="Skip guide"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Step indicator */}
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-4">
                Step {step + 1} of {steps.length}
              </p>

              {/* Icon + title */}
              <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
                  {current.icon}
                </div>
                <h3 className="text-base font-bold text-white mt-1.5 leading-snug">{current.title}</h3>
              </div>

              {/* Body */}
              <p className="text-sm text-white/50 leading-relaxed mb-6">{current.body}</p>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5 mb-5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="transition-all"
                  >
                    <div
                      className={`rounded-full transition-all ${
                        i === step
                          ? "w-5 h-1.5 bg-[#9D4EDD]"
                          : "w-1.5 h-1.5 bg-white/15"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-mono text-white/40 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <div className="flex-1" />
                {current.cta && current.href && (
                  <button
                    onClick={() => handleCta(current.href)}
                    className="px-3 py-2 text-xs font-mono rounded-lg border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
                  >
                    {current.cta}
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-mono rounded-xl bg-gradient-to-r from-[#9D4EDD] to-[#00D2FF] text-white hover:opacity-90 transition-opacity"
                >
                  {isLast ? "Get Started" : "Next"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Skip link */}
              <button
                onClick={dismiss}
                className="mt-3 w-full text-center text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors"
              >
                Skip guide
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
