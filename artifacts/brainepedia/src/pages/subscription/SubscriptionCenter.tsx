import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Crown, Zap, Shield, Star, CheckCircle2, XCircle, Loader2,
  Map, Trophy, Activity, CreditCard, User as UserIcon,
  LayoutDashboard, Compass, TrendingUp, Sparkles, ArrowRight,
  Lock, Brain, ChevronRight, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getUserId, getUserRole } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";

/* ─── Tier data ─────────────────────────────────────────────────────────── */
const SUB_NAMES: Record<number, string> = { 0: "Initiate", 1: "Architect", 2: "Grandmaster" };

const TIERS = [
  {
    key: "Initiate",
    numericTier: 0,
    price: "Free",
    priceNote: "Forever",
    icon: Shield,
    tagline: "Begin your journey",
    color: "border-slate-700/60",
    glow: "",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    buttonClass: "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed",
    headerBg: "from-slate-900 to-slate-800",
    iconColor: "text-slate-400",
    features: [
      { label: "3 missions per month", included: true },
      { label: "Limited Brainiac hints", included: true },
      { label: "Basic XP progression", included: true },
      { label: "Community leaderboard access", included: true },
      { label: "Unlimited challenges", included: false },
      { label: "Premium district access", included: false },
      { label: "GPT-4o evaluations", included: false },
    ],
  },
  {
    key: "Architect",
    numericTier: 1,
    price: "$19.99",
    priceNote: "per month",
    icon: Zap,
    tagline: "Unlock the city's full power",
    color: "border-[#7C3AED]/50",
    glow: "shadow-[0_0_30px_rgba(124,58,237,0.3)]",
    badge: "bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/40",
    buttonClass: "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]",
    headerBg: "from-[#7C3AED]/20 to-[#4C1D95]/20",
    iconColor: "text-[#A78BFA]",
    features: [
      { label: "Unlimited challenges", included: true },
      { label: "Increased Brainiac hints", included: true },
      { label: "Faster XP growth", included: true },
      { label: "Premium district access", included: true },
      { label: "Advanced AI evaluations", included: true },
      { label: "Community leaderboard access", included: true },
      { label: "GPT-4o evaluations", included: false },
    ],
    popular: true,
  },
  {
    key: "Grandmaster",
    numericTier: 2,
    price: "$49.99",
    priceNote: "per month",
    icon: Crown,
    tagline: "Elite Member status",
    color: "border-[#FFD700]/50",
    glow: "shadow-[0_0_35px_rgba(255,215,0,0.35)]",
    badge: "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40",
    buttonClass: "bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.5)]",
    headerBg: "from-[#FFD700]/15 to-[#F59E0B]/10",
    iconColor: "text-[#FFD700]",
    features: [
      { label: "Unlimited everything", included: true },
      { label: "GPT-4o evaluations", included: true },
      { label: "Unlimited Brainiac guidance", included: true },
      { label: "Elite leaderboard badge", included: true },
      { label: "Elite Member badge", included: true },
      { label: "Priority AI evaluation", included: true },
      { label: "Legendary status visuals", included: true },
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: "Challenges / month", initiate: "3", architect: "Unlimited", grandmaster: "Unlimited" },
  { label: "AI evaluations", initiate: "Basic", architect: "Advanced", grandmaster: "GPT-4o" },
  { label: "Brainiac hints", initiate: "Limited", architect: "More", grandmaster: "Unlimited" },
  { label: "XP boost", initiate: "1×", architect: "1.5×", grandmaster: "2×" },
  { label: "Leaderboard", initiate: "✓", architect: "✓", grandmaster: "Elite badge" },
  { label: "Premium districts", initiate: "✗", architect: "✓", grandmaster: "✓" },
  { label: "GPT-4o support", initiate: "✗", architect: "✗", grandmaster: "✓" },
];

const BRAINIAC_TIPS = [
  "Architect Tier increases your challenge access and XP growth by 50% — a solid investment for active learners.",
  "Grandmaster unlocks GPT-4o evaluations — the most accurate feedback available.",
  "Upgrading to Architect removes the monthly challenge cap and opens premium districts.",
  "Grandmaster members receive priority AI evaluation and legendary visual effects.",
  "The XP boost from Architect or Grandmaster accelerates your climb to the top of the leaderboard.",
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function SubscriptionCenter() {
  usePageTitle("Subscription");
  const [, navigate] = useLocation();
  const userId = getUserId();
  const role = getUserRole();
  const isEmployer = role === "Employer";
  const { toast } = useToast();

  const [currentTier, setCurrentTier] = useState<number>(0);
  const [employerPlan, setEmployerPlan] = useState("Grandmaster");
  const [loading, setLoading] = useState(true);
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!userId) { navigate("/auth/login"); return; }
    (async () => {
      if (isEmployer) {
        const res = await api.employers.myCompanyProfile();
        if (res.ok && res.data) setEmployerPlan(String((res.data as any).subscriptionLevel ?? "Grandmaster"));
        setLoading(false);
        return;
      }
      const res = await api.profiles.stats(userId);
      if (res.ok && res.data) {
        setCurrentTier(Number(res.data.currentSubscription ?? 0));
      }
      setLoading(false);
    })();
  }, [userId, navigate, isEmployer]);

  // Rotate Brainiac tips
  useEffect(() => {
    const id = setInterval(() => setTipIndex(i => (i + 1) % BRAINIAC_TIPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const handleUpgrade = async () => {
    if (!upgradeTarget || !userId) return;
    setUpgradeLoading(true);
    const tierDef = TIERS.find(t => t.key === upgradeTarget);
    const newTier = isEmployer ? 2 : (tierDef?.numericTier ?? 1);
    const res = isEmployer
      ? await api.subscriptions.initializeEmployerUpgrade({ userId, newTier })
      : await api.subscriptions.initializeUpgrade({ userId, newTier, currency: "NGN", source: "paystack" });
    setUpgradeLoading(false);
    const data = res.data as { checkoutUrl?: string; authorization_url?: string } | null;
    const url = data?.checkoutUrl || data?.authorization_url;
    if (res.ok && url) {
      setUpgradeTarget(null);
      if (userId) {
        api.activityLogs.create({ userId, activity: `Initiated upgrade to ${upgradeTarget} tier` });
      }
      window.location.href = url;
    } else {
      toast({
        title: "Upgrade failed",
        description: res.error || "Could not start the payment. Please try again.",
        variant: "destructive",
      });
      setUpgradeTarget(null);
    }
  };

  const currentTierName = isEmployer ? employerPlan : (SUB_NAMES[currentTier] ?? "Initiate");

  const headerRight = (
    <div className="hidden sm:flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${
        currentTierName === "Grandmaster"
          ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40"
          : currentTierName === "Architect"
          ? "bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/40"
          : "bg-slate-800 text-slate-400 border-slate-700"
      }`}>
        {currentTierName}
      </span>
    </div>
  );

  return (
    <DashboardShell
      nav={isEmployer ? EMPLOYER_NAV : USER_NAV}
      title={isEmployer ? "Employer Subscription" : "Subscription Center"}
      subtitle={isEmployer ? "// grandmaster.employer.plan" : "// tier.management.system"}
      headerRight={headerRight}
      theme={isEmployer ? "employer" : "user"}
      showBrainiac={!isEmployer}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-[#A78BFA] animate-spin" />
            <p className="text-xs font-mono text-white/30 uppercase tracking-widest">Loading subscription data…</p>
          </div>
        </div>
      ) : (
        isEmployer ? (
        <div className="max-w-5xl space-y-6">
          <section className="rounded-2xl border border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700]/15 via-[#0d1119] to-[#00D2FF]/10 p-8 shadow-[0_0_35px_rgba(255,215,0,0.18)]">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#FFD700]">Grandmaster Corporate Plan</p>
                <h2 className="mt-2 text-3xl font-black">Built for talent discovery, team provisioning, and candidate assessment.</h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  Employers use one premium plan for recruitment workflows, private training, and team analytics.
                </p>
                <Button onClick={() => setUpgradeTarget("Grandmaster")} disabled={upgradeLoading} className="mt-5 bg-[#FFD700] text-black hover:bg-[#F3C800]">
                  {upgradeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                  Upgrade to Grandmaster
                </Button>
              </div>
              <span className="rounded-full border border-[#FFD700]/40 bg-[#FFD700]/15 px-4 py-2 text-sm font-bold text-[#FFD700]">
                Current: {employerPlan}
              </span>
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              "Unlimited Job Listings",
              "Team Provisioning",
              "Candidate Assessments",
              "Team Training Challenges",
              "Recruitment Pipeline",
              "Corporate Talent Analytics",
              "Private Team Challenges",
              "Candidate Discovery",
            ].map((feature) => (
              <div key={feature} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400" />
                <h3 className="font-bold">{feature}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Included in the employer Grandmaster plan.</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
            <h3 className="text-lg font-bold">Billing Information</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Seat billing and team activation remain available under Billing and Team Members.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]"><Link href="/employer/billing">Open Billing</Link></Button>
              <Button asChild variant="outline"><Link href="/employer/team">Manage Team Seats</Link></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
            <h3 className="text-lg font-bold">Subscription History</h3>
            <p className="mt-2 text-sm text-muted-foreground">Detailed employer payment history is not exposed by the current Swagger contract.</p>
          </div>
        </div>
        ) : (
        <div className="space-y-8 max-w-6xl">

          {/* ── CURRENT TIER HERO ── */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border p-6 ${
              currentTierName === "Grandmaster"
                ? "border-[#FFD700]/40 shadow-[0_0_40px_rgba(255,215,0,0.2)]"
                : currentTierName === "Architect"
                ? "border-[#7C3AED]/40 shadow-[0_0_30px_rgba(124,58,237,0.2)]"
                : "border-white/8"
            }`}>
            <div className={`absolute inset-0 bg-gradient-to-br pointer-events-none ${
              currentTierName === "Grandmaster" ? "from-[#FFD700]/10 via-transparent to-[#F59E0B]/5"
              : currentTierName === "Architect" ? "from-[#7C3AED]/12 via-transparent to-[#00D2FF]/5"
              : "from-white/3 to-transparent"
            }`} />
            {currentTierName === "Grandmaster" && (
              <GrandmasterParticles />
            )}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                currentTierName === "Grandmaster" ? "bg-[#FFD700]/15"
                : currentTierName === "Architect" ? "bg-[#7C3AED]/20"
                : "bg-white/5"
              }`}>
                {currentTierName === "Grandmaster" ? <Crown className="h-7 w-7 text-[#FFD700]" />
                : currentTierName === "Architect" ? <Zap className="h-7 w-7 text-[#A78BFA]" />
                : <Shield className="h-7 w-7 text-slate-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30">Current Tier</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                    currentTierName === "Grandmaster" ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30"
                    : currentTierName === "Architect" ? "bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30"
                    : "bg-slate-800/60 text-slate-400 border-slate-700"
                  }`}>Active</span>
                </div>
                <h2 className={`text-3xl font-black mt-1 ${
                  currentTierName === "Grandmaster" ? "text-[#FFD700]"
                  : currentTierName === "Architect" ? "text-[#A78BFA]"
                  : "text-white"
                }`}>{currentTierName}</h2>
                <p className="text-sm text-white/40 mt-0.5">
                  {currentTierName === "Grandmaster"
                    ? "You hold Elite Member status. Unlimited access across all systems."
                    : currentTierName === "Architect"
                    ? "Advanced challenge access and enhanced Brainiac guidance active."
                    : "Upgrade to unlock Architect or Grandmaster abilities."}
                </p>
              </div>
              {currentTierName !== "Grandmaster" && (
                <Button
                  onClick={() => setUpgradeTarget(currentTierName === "Initiate" ? "Architect" : "Grandmaster")}
                  className="shrink-0 bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                >
                  {currentTierName === "Initiate" ? "Upgrade to Architect" : "Upgrade to Grandmaster"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>

          {/* ── TIER CARDS ── */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Choose Your Tier</h2>
              <p className="text-xs text-white/30 font-mono mt-0.5">Select the plan that matches your ambition</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TIERS.map((tier, i) => {
                const Icon = tier.icon;
                const isCurrent = currentTier === tier.numericTier;
                const isLocked = tier.numericTier < currentTier;
                const isGrandmaster = tier.key === "Grandmaster";
                return (
                  <motion.div key={tier.key}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`relative rounded-2xl border flex flex-col overflow-hidden ${tier.color} ${tier.glow} ${
                      isCurrent ? "ring-2 ring-offset-2 ring-offset-[#0A0E14] ring-white/20" : ""
                    }`}>
                    {tier.popular && !isCurrent && (
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-mono uppercase tracking-wider">
                        Popular
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-mono uppercase tracking-wider border border-white/20">
                        Current
                      </div>
                    )}
                    {isGrandmaster && <GrandmasterBorderAnimation />}
                    {/* Card header */}
                    <div className={`bg-gradient-to-br ${tier.headerBg} p-5 pb-4 border-b border-white/8`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${
                        isGrandmaster ? "bg-[#FFD700]/20" : tier.key === "Architect" ? "bg-[#7C3AED]/20" : "bg-slate-800"
                      }`}>
                        <Icon className={`h-5 w-5 ${tier.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-bold text-white">{tier.key}</h3>
                      <p className="text-xs text-white/40 mt-0.5">{tier.tagline}</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className={`text-3xl font-black ${tier.iconColor}`}>{tier.price}</span>
                        <span className="text-xs text-white/30 font-mono">{tier.priceNote}</span>
                      </div>
                    </div>
                    {/* Features */}
                    <div className="flex-1 p-5 space-y-2.5 bg-[#0d1117]">
                      {tier.features.map((f) => (
                        <div key={f.label} className="flex items-center gap-2.5">
                          {f.included
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            : <XCircle className="h-4 w-4 text-white/15 shrink-0" />}
                          <span className={`text-xs ${f.included ? "text-white/70" : "text-white/25 line-through"}`}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                    {/* CTA */}
                    <div className="p-4 bg-[#0d1117] border-t border-white/5">
                      {isCurrent ? (
                        <button disabled className="w-full py-2.5 rounded-xl text-sm font-mono text-white/30 border border-white/10 cursor-not-allowed">
                          Current Plan
                        </button>
                      ) : isLocked ? (
                        <button disabled className="w-full py-2.5 rounded-xl text-sm font-mono text-white/20 border border-white/5 cursor-not-allowed flex items-center justify-center gap-2">
                          <Lock className="h-3.5 w-3.5" /> Downgrade not available
                        </button>
                      ) : (
                        <button
                          onClick={() => setUpgradeTarget(tier.key)}
                          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${tier.buttonClass}`}
                        >
                          Upgrade to {tier.key}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── COMPARISON TABLE + BRAINIAC ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Comparison table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="lg:col-span-2 bg-[#0d1117] border border-white/6 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/6">
                <h3 className="text-base font-bold text-white">Feature Comparison</h3>
                <p className="text-xs text-white/30 font-mono mt-0.5">All tiers side by side</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-5 text-xs font-mono text-white/30 uppercase tracking-wider">Feature</th>
                      <th className="py-3 px-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Initiate</th>
                      <th className="py-3 px-4 text-xs font-mono text-[#A78BFA] uppercase tracking-wider">Architect</th>
                      <th className="py-3 px-4 text-xs font-mono text-[#FFD700] uppercase tracking-wider">Grandmaster</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((f, i) => (
                      <tr key={f.label} className={`border-b border-white/4 ${i % 2 === 0 ? "bg-white/1" : ""}`}>
                        <td className="py-3 px-5 text-sm text-white/60">{f.label}</td>
                        <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">{f.initiate}</td>
                        <td className="py-3 px-4 text-center text-xs font-mono text-[#A78BFA]">{f.architect}</td>
                        <td className="py-3 px-4 text-center text-xs font-mono text-[#FFD700]">{f.grandmaster}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Brainiac recommendation */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="flex flex-col gap-4">
              <div className="bg-gradient-to-br from-[#7C3AED]/15 to-[#0d1117] border border-[#7C3AED]/30 rounded-2xl p-5 shadow-[0_0_25px_rgba(124,58,237,0.2)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-[#7C3AED]/30 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-[#A78BFA]" />
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-[#A78BFA]">Brainiac</p>
                    <p className="text-[10px] text-white/30">AI Recommendation</p>
                  </div>
                  <div className="ml-auto">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-[#A78BFA]" />
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p key={tipIndex}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm text-white/70 leading-relaxed">
                    {BRAINIAC_TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
                <div className="flex gap-1 mt-3">
                  {BRAINIAC_TIPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === tipIndex ? "bg-[#A78BFA]" : "bg-white/10"}`} />
                  ))}
                </div>
              </div>

              {/* Quick upgrade CTA */}
              {currentTier === 0 && (
                <div className="bg-[#0d1117] border border-[#FFD700]/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-[#FFD700]" />
                    <p className="text-sm font-bold text-[#FFD700]">Most Popular</p>
                  </div>
                  <p className="text-xs text-white/40 mb-4">Architect is the most popular choice for active learners</p>
                  <Button onClick={() => setUpgradeTarget("Architect")}
                    className="w-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                    Upgrade to Architect <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Info card */}
              <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
                <p className="text-xs text-white/30 leading-relaxed">
                  Payments are processed securely via Paystack. Your subscription is active immediately after payment confirmation.
                </p>
              </div>
            </motion.div>
          </div>

        </div>
        )
      )}

      {/* ── UPGRADE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {upgradeTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => !upgradeLoading && setUpgradeTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className={`pointer-events-auto w-full max-w-md bg-[#0d1119] border rounded-2xl p-8 text-center ${
                upgradeTarget === "Grandmaster"
                  ? "border-[#FFD700]/40 shadow-[0_0_50px_rgba(255,215,0,0.25)]"
                  : "border-[#7C3AED]/40 shadow-[0_0_50px_rgba(124,58,237,0.25)]"
              }`}>
                {upgradeLoading ? (
                  <>
                    <div className="relative mx-auto mb-6 w-16 h-16">
                      <div className={`absolute inset-0 rounded-full animate-ping ${upgradeTarget === "Grandmaster" ? "bg-[#FFD700]/20" : "bg-[#7C3AED]/20"}`} />
                      <div className="relative flex items-center justify-center h-full">
                        <Loader2 className={`h-10 w-10 animate-spin ${upgradeTarget === "Grandmaster" ? "text-[#FFD700]" : "text-[#A78BFA]"}`} />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Initializing secure payment…</h2>
                    <p className="text-sm text-white/40">Connecting to Paystack. Do not close this window.</p>
                  </>
                ) : (
                  <>
                    <div className={`mx-auto mb-5 h-16 w-16 rounded-2xl flex items-center justify-center ${
                      upgradeTarget === "Grandmaster" ? "bg-[#FFD700]/15" : "bg-[#7C3AED]/20"
                    }`}>
                      {upgradeTarget === "Grandmaster"
                        ? <Crown className="h-8 w-8 text-[#FFD700]" />
                        : <Zap className="h-8 w-8 text-[#A78BFA]" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upgrade to {upgradeTarget}?</h2>
                    <p className="text-sm text-white/50 mb-1">
                      {upgradeTarget === "Architect" ? "$19.99/month" : "$49.99/month"}
                    </p>
                    <p className="text-sm text-white/40 mb-7">
                      You will be redirected securely to Paystack to complete your payment.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 border-white/15 text-white/60 hover:bg-white/5 hover:text-white"
                        onClick={() => setUpgradeTarget(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpgrade}
                        className={`flex-1 font-bold ${upgradeTarget === "Grandmaster"
                          ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                          : "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]"}`}>
                        Continue Payment <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] font-mono text-white/20 mt-4 flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" /> Secured by Paystack
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

/* ─── Decorative sub-components ─────────────────────────────────────────── */
function GrandmasterBorderAnimation() {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{ boxShadow: "inset 0 0 20px rgba(255,215,0,0.12)" }}
    />
  );
}

function GrandmasterParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          className="absolute h-1 w-1 rounded-full bg-[#FFD700]"
          style={{ left: `${10 + i * 12}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </div>
  );
}
