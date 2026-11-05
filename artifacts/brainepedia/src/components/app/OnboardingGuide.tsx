import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X, ChevronRight, ChevronLeft, Map, Trophy, User, Sparkles, LayoutDashboard, BriefcaseBusiness, Shield } from "lucide-react";
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
    body: "Learn by solving real-world missions. Your dashboard turns practical problem solving into visible career evidence.",
    icon: <LayoutDashboard className="w-6 h-6 text-[#7d4ccc]" />,
  },
  {
    title: "Complete your Profile",
    body: "Add your identity, title, avatar, and professional details so your dossier represents you accurately.",
    icon: <User className="w-6 h-6 text-[#7d4ccc]" />,
    cta: "Complete Profile",
    href: "/profile/edit",
  },
  {
    title: "Build your Portfolio",
    body: "Create your CV-style Portfolio with a personal statement, education, experience, skills, services, projects, and interests.",
    icon: <BriefcaseBusiness className="w-6 h-6 text-[#d88c1b]" />,
    cta: "Build Portfolio",
    href: "/user/portfolio",
  },
  {
    title: "Choose Your Profession",
    body: "Select a profession to unlock your personalised Learning Map filled with districts to explore.",
    icon: <Map className="w-6 h-6 text-[#7d4ccc]" />,
    cta: "Select Profession",
    href: "/profession/select",
  },
  {
    title: "Start your first Mission",
    body: "Each mission is a practical challenge. Complete one to begin building verified proof of skill.",
    icon: <Sparkles className="w-6 h-6 text-[#d88c1b]" />,
  },
  {
    title: "Earn XP",
    body: "Successful missions award XP. XP shows progress, consistency, and practical problem-solving momentum.",
    icon: <Trophy className="w-6 h-6 text-amber-400" />,
  },
  {
    title: "Unlock VX",
    body: "Verified Experience (VX) converts mission performance into a career-ready evidence signal.",
    icon: <Shield className="w-6 h-6 text-[#7d4ccc]" />,
    cta: "View VX",
    href: "/user/vx-progress",
  },
  {
    title: "Become discoverable by employers",
    body: "A complete profile and portfolio make your public dossier more recruiter friendly and easier to share.",
    icon: <BriefcaseBusiness className="w-6 h-6 text-[#7d4ccc]" />,
    cta: "Open Portfolio",
    href: "/user/portfolio",
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
            className="fixed inset-0 z-[60] bg-[rgba(21,24,40,0.45)] backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-6 left-1/2 z-[61] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#e6e8ef] bg-white text-[#182137] shadow-[0_18px_50px_rgba(28,33,54,0.16)]"
          >
            {/* Progress bar */}
            <div className="h-0.5 w-full bg-[#efe8f8]">
              <motion.div
                className="h-full bg-[#7d4ccc]"
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            <div className="p-6">
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute right-4 top-4 rounded-lg p-1 text-[#8c93a2] transition-colors hover:bg-[#f5f0fc] hover:text-[#7d4ccc]"
                title="Skip guide"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Step indicator */}
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7d4ccc]">
                Step {step + 1} of {steps.length}
              </p>

              {/* Icon + title */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#efe8f8] bg-[#f5f0fc] text-[#7d4ccc]">
                  {current.icon}
                </div>
                <h3 className="mt-1.5 text-base font-extrabold leading-snug text-[#182137]">{current.title}</h3>
              </div>

              {/* Body */}
              <p className="mb-6 text-sm leading-relaxed text-[#60697b]">{current.body}</p>

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
                          ? "h-1.5 w-5 bg-[#7d4ccc]"
                          : "h-1.5 w-1.5 bg-[#e6e8ef]"
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
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-[#70798d] transition-colors hover:bg-[#f5f0fc] hover:text-[#7d4ccc]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <div className="flex-1" />
                {current.cta && current.href && (
                  <button
                    onClick={() => handleCta(current.href)}
                    className="rounded-lg border border-[#e6e8ef] px-3 py-2 text-xs font-bold text-[#182137] transition-colors hover:bg-[#f7f8fb]"
                  >
                    {current.cta}
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 rounded-[10px] bg-[#7d4ccc] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#6538ad]"
                >
                  {isLast ? "Start Now" : "Next"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Skip link */}
              <button
                onClick={dismiss}
                className="mt-3 w-full text-center text-[11px] font-bold text-[#8c93a2] transition-colors hover:text-[#7d4ccc]"
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
