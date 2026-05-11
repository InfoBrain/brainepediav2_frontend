import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  Home,
  Trophy,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Brain,
  Sparkles,
  Map,
  Shield,
  Gem,
  Crown,
} from "lucide-react";
import { api } from "@/lib/api";
import { getDashboardPath, isAuthenticated, getUserId } from "@/lib/auth";
import { useDifficulties, buildDifficultyLookup, getDifficultyStyle } from "@/hooks/useDifficulties";

type Evaluation = {
  evaluationId?: string;
  score: number;
  isPassed: boolean;
  strengths: string[];
  weaknesses: string[];
  positiveFeedback: string[];
  improvementAreas: string[];
  rawAiReasoning?: string;
};

type Submission = {
  submissionId: string;
  problemNodeId?: string;
  sessionId?: string;
  approachExplanation?: string;
  codeSnippet?: string;
  submittedAt?: string;
  netXpGained?: number;
  xpPenalty?: number;
  missionTitle?: string;
  difficultyName?: string;
  difficultyId?: string;
  districtId?: string;
  evaluation?: Evaluation;
};

type Badge = {
  userBadgeId: string;
  name?: string;
  description?: string;
  iconUrl?: string;
  rarity?: number;
  dateCreated?: string;
};

function parseArr(v: any): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return v ? [v] : []; }
  }
  return [];
}

function normSubmission(d: any): Submission {
  const evalData = d?.evaluation || d?.evaluationResult || {};
  const session = d?.experienceSession || d?.session || {};
  const pNode = d?.problemNode || session?.problemNode || {};
  return {
    submissionId: d?.submissionId || d?.id || "",
    problemNodeId: d?.problemNodeId || pNode?.problemNodeId || pNode?.id || "",
    sessionId: d?.sessionId || d?.experienceSessionId || session?.sessionId || session?.experienceSessionId || session?.id || "",
    approachExplanation: d?.approachExplanation || "",
    codeSnippet: d?.codeSnippet || "",
    submittedAt: d?.submittedAt || d?.createdAt || d?.dateCreated,
    netXpGained: Number(d?.netXpGained ?? d?.xpGained ?? evalData?.netXpGained ?? 0),
    xpPenalty: Number(d?.xpPenalty ?? evalData?.xpPenalty ?? 0),
    missionTitle: d?.missionTitle || pNode?.title || d?.problemNode?.title || "Mission",
    difficultyName: d?.difficultyName || pNode?.difficultyName || d?.problemNode?.difficultyName || "",
    difficultyId: d?.difficultyId || pNode?.difficultyId || d?.problemNode?.difficultyId || "",
    districtId: d?.districtId || pNode?.districtId || session?.districtId || "",
    evaluation: {
      evaluationId: evalData?.evaluationId,
      score: Number(evalData?.score ?? 0),
      isPassed: Boolean(evalData?.isPassed ?? (Number(evalData?.score ?? 0) >= 70)),
      strengths: parseArr(evalData?.strengths),
      weaknesses: parseArr(evalData?.weaknesses),
      positiveFeedback: parseArr(evalData?.positiveFeedback),
      improvementAreas: parseArr(evalData?.improvementAreas),
      rawAiReasoning: evalData?.rawAiReasoning || "",
    },
  };
}

const RARITY_CONFIG: Record<number, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  0: { label: "Common",     color: "text-white/60",   bg: "bg-white/5",       border: "border-white/10",    icon: <Shield className="w-3.5 h-3.5" /> },
  1: { label: "Rare",       color: "text-[#00D2FF]",  bg: "bg-[#00D2FF]/10",  border: "border-[#00D2FF]/30", icon: <Gem className="w-3.5 h-3.5" /> },
  2: { label: "Epic",       color: "text-[#9D4EDD]",  bg: "bg-[#9D4EDD]/10",  border: "border-[#9D4EDD]/30", icon: <Sparkles className="w-3.5 h-3.5" /> },
  3: { label: "Legendary",  color: "text-[#FFD700]",  bg: "bg-[#FFD700]/10",  border: "border-[#FFD700]/30", icon: <Crown className="w-3.5 h-3.5" /> },
};

function getRarityConfig(rarity?: number) {
  return RARITY_CONFIG[rarity ?? 0] ?? RARITY_CONFIG[0];
}

function ConfettiPiece({ i }: { i: number }) {
  const colors = ["#00D2FF", "#FFD700", "#9D4EDD", "#00FF88", "#FF6B6B"];
  const color = colors[i % colors.length];
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color, left: `${10 + (i * 7) % 80}%`, top: -10 }}
      animate={{ y: ["0vh", "110vh"], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)], opacity: [1, 0] }}
      transition={{ duration: 2 + (i % 3) * 0.5, delay: i * 0.08, ease: "easeIn" }}
    />
  );
}

function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const stroke = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="68" cy="68" r={radius}
          stroke={passed ? "#00D2FF" : "#FF6B6B"}
          strokeWidth="8" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - stroke }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${passed ? "#00D2FF" : "#FF6B6B"})` }}
        />
      </svg>
      <div className="text-center">
        <motion.p
          className={`text-3xl font-black font-mono ${passed ? "text-[#00D2FF]" : "text-red-400"}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
        >
          {score}%
        </motion.p>
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Score</p>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0d1117] overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors">
        <div className="flex items-center gap-2.5">{icon}<span className="text-sm font-bold font-mono text-white/80">{title}</span></div>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const cfg = getRarityConfig(badge.rarity);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative flex items-center gap-4 rounded-2xl border px-5 py-4 overflow-hidden ${cfg.bg} ${cfg.border}`}
    >
      <div className={`absolute inset-0 opacity-20 blur-2xl pointer-events-none ${cfg.bg}`} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${cfg.border} ${cfg.bg}`}>
        {badge.iconUrl ? (
          <img src={badge.iconUrl} alt={badge.name} className="w-8 h-8 object-contain" />
        ) : (
          <Trophy className={`w-6 h-6 ${cfg.color}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-1.5 text-xs font-mono mb-0.5 ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </div>
        <p className="text-sm font-bold text-white truncate">{badge.name || "Achievement Unlocked"}</p>
        {badge.description && (
          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{badge.description}</p>
        )}
      </div>
    </motion.div>
  );
}

function SkillInsightSection({ strengths }: { strengths: string[] }) {
  if (!strengths.length) return null;
  const skills = strengths.slice(0, 3).map(s => {
    const words = s.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 3);
    return words.slice(0, 3).join(" ") || s.slice(0, 30);
  }).filter(Boolean);
  if (!skills.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
      <div className="rounded-2xl border border-[#9D4EDD]/20 bg-[#9D4EDD]/5 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#9D4EDD]" />
          <span className="text-sm font-bold font-mono text-white/80">Skill Insight</span>
        </div>
        <p className="text-xs font-mono text-white/40 mb-3 uppercase tracking-wider">You're improving in:</p>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 text-[#9D4EDD]"
            >
              <CheckCircle2 className="w-3 h-3" />
              {skill}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ResultPage() {
  const params = useParams<{ submissionId: string }>();
  const submissionId = params.submissionId || "";
  const [, navigate] = useLocation();
  const dashPath = isAuthenticated() ? getDashboardPath() : "/";
  const userId = getUserId();
  const [codeTab, setCodeTab] = useState<"approach" | "code">("approach");

  const { data: difficulties } = useDifficulties();
  const difficultyLookup = buildDifficultyLookup(difficulties);

  const { data: submission, isLoading, isError, refetch } = useQuery<Submission>({
    queryKey: ["submission-result", submissionId],
    queryFn: async () => {
      // Fetch both endpoints in parallel
      const [evalRes, subRes] = await Promise.all([
        api.evaluations.getResult(submissionId),
        api.submissions.get(submissionId),
      ]);

      if (!evalRes.ok && !subRes.ok) {
        throw new Error(evalRes.error || subRes.error || "Failed to load result");
      }

      // Merge: evaluation data from evalRes (primary), submission metadata from subRes
      const evalData = evalRes.ok ? (evalRes.data as Record<string, any>) : {};
      const subData = subRes.ok ? (subRes.data as Record<string, any>) : {};

      // Build merged object — evalRes fields are PascalCase, normSubmission handles both
      const merged = {
        ...subData,
        evaluation: {
          score: evalData?.Score ?? evalData?.score ?? subData?.evaluation?.score ?? 0,
          isPassed: evalData?.IsPassed ?? evalData?.isPassed ?? subData?.evaluation?.isPassed ?? false,
          strengths: evalData?.Strengths ?? evalData?.strengths ?? subData?.evaluation?.strengths ?? [],
          weaknesses: evalData?.Weaknesses ?? evalData?.weaknesses ?? subData?.evaluation?.weaknesses ?? [],
          positiveFeedback: evalData?.PositiveFeedback ?? evalData?.positiveFeedback ?? subData?.evaluation?.positiveFeedback ?? [],
          improvementAreas: evalData?.ImprovementAreas ?? evalData?.improvementAreas ?? subData?.evaluation?.improvementAreas ?? [],
          rawAiReasoning: evalData?.RawAiReasoning ?? evalData?.rawAiReasoning ?? subData?.evaluation?.rawAiReasoning ?? "",
        },
        missionTitle: evalData?.MissionTitle ?? evalData?.missionTitle ?? subData?.experienceSession?.problemNode?.title ?? subData?.missionTitle,
      };

      return normSubmission(merged);
    },
    enabled: Boolean(submissionId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const eval_ = submission?.evaluation;
  const passed = eval_?.isPassed ?? false;
  const score = eval_?.score ?? 0;

  const needsSessionFallback = !passed && submission && !submission.problemNodeId && Boolean(submission.sessionId);
  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: ["experienceSession", submission?.sessionId],
    queryFn: async () => {
      const res = await api.experienceSessions.get(submission!.sessionId!);
      if (!res.ok) return null;
      return res.data;
    },
    enabled: Boolean(needsSessionFallback),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const resolvedProblemNodeId =
    submission?.problemNodeId ||
    sessionData?.problemNodeId ||
    sessionData?.problemNode?.problemNodeId ||
    sessionData?.problemNode?.id ||
    "";

  const resolvedDistrictId =
    submission?.districtId ||
    sessionData?.districtId ||
    sessionData?.problemNode?.districtId ||
    "";

  const { data: recentBadge } = useQuery<Badge | null>({
    queryKey: ["recentBadge", userId, submission?.submittedAt],
    queryFn: async () => {
      if (!userId) return null;
      const res = await api.userBadges.forUser(userId);
      if (!res.ok) return null;
      const badges: any[] = Array.isArray(res.data) ? res.data : (res.data?.badges || res.data?.items || []);
      if (!badges.length) return null;
      const submittedMs = submission?.submittedAt ? new Date(submission.submittedAt).getTime() : Date.now();
      const windowMs = 15 * 60 * 1000;
      const newBadge = badges
        .filter(b => {
          const created = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
          return Math.abs(created - submittedMs) < windowMs || (Date.now() - created < windowMs);
        })
        .sort((a, b) => new Date(b.dateCreated || 0).getTime() - new Date(a.dateCreated || 0).getTime())[0];
      if (!newBadge) return null;
      return {
        userBadgeId: newBadge.userBadgeId || newBadge.id || "",
        name: newBadge.name,
        description: newBadge.description,
        iconUrl: newBadge.iconUrl,
        rarity: newBadge.rarity,
        dateCreated: newBadge.dateCreated,
      };
    },
    enabled: Boolean(submission),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#00D2FF] animate-spin" />
          <p className="text-sm font-mono text-white/40">Loading your results…</p>
        </div>
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div className="min-h-screen bg-[#060a10] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400/60" />
        <p className="text-sm font-mono text-white/50">Unable to load results</p>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-sm border border-white/20 rounded-lg px-4 py-2 text-white/50 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-white relative overflow-x-hidden ${passed ? "bg-[#060a10]" : "bg-[#080608]"}`}>
      {passed && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 18 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
        </div>
      )}

      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none
        ${passed ? "bg-[#00D2FF]/5" : "bg-red-500/4"}`} />

      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/5">
        <Link href={dashPath} className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white transition-colors">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <p className="text-xs font-mono text-white/20 truncate max-w-xs">{submission.missionTitle}</p>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-6">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative rounded-3xl border p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden
            ${passed
              ? "border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/5 to-[#9D4EDD]/5"
              : "border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5"}`}
        >
          <ScoreRing score={score} passed={passed} />
          <div className="flex-1 text-center md:text-left">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold font-mono mb-3 border
                ${passed ? "text-[#00D2FF] border-[#00D2FF]/30 bg-[#00D2FF]/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
                {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {passed ? "Mission Passed" : "Needs Improvement"}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1">{submission.missionTitle}</h1>
              {(submission.difficultyName || submission.difficultyId) && (() => {
                const diffMeta = difficultyLookup[submission.difficultyId || ""];
                const label = diffMeta?.name || submission.difficultyName;
                const style = getDifficultyStyle(diffMeta?.rankColorHex || "");
                return label ? (
                  <span className="inline-flex items-center text-[11px] font-mono px-2.5 py-1 rounded-full border mb-4" style={style}>
                    {label}
                  </span>
                ) : null;
              })()}
              {!passed && (
                <p className="text-sm text-white/50 italic mt-2">You're close. Review the feedback below and try again — you've got this.</p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* ── XP BANNER ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-mono font-bold text-sm
            ${passed && (submission.netXpGained ?? 0) > 0
              ? "border-[#FFD700]/30 bg-[#FFD700]/8 text-[#FFD700]"
              : "border-white/10 bg-white/3 text-white/40"}`}>
            <Star className="w-4 h-4" />
            {(submission.netXpGained ?? 0) > 0 ? `+${submission.netXpGained} XP Earned` : "0 XP"}
          </div>
          {(submission.xpPenalty ?? 0) > 0 && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 text-amber-400 font-mono text-sm">
              <AlertTriangle className="w-4 h-4" />
              -{submission.xpPenalty} XP (Hints Used)
            </div>
          )}
          {submission.submittedAt && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/8 bg-white/2 text-white/30 font-mono text-sm">
              <Clock className="w-4 h-4" />
              {new Date(submission.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}
        </motion.div>

        {/* ── NEW BADGE UNLOCKED ── */}
        <AnimatePresence>
          {recentBadge && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.35 }}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-mono font-bold text-[#FFD700] uppercase tracking-widest">New Badge Unlocked</span>
              </div>
              <BadgeCard badge={recentBadge} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SKILL INSIGHT ── */}
        {eval_?.strengths && eval_.strengths.length > 0 && (
          <SkillInsightSection strengths={eval_.strengths} />
        )}

        {/* ── STRENGTHS ── */}
        {eval_?.strengths && eval_.strengths.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
            <CollapsibleSection title="Strengths" icon={<Trophy className="w-4 h-4 text-emerald-400" />}>
              <ul className="space-y-2.5">
                {eval_.strengths.map((s, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{s}
                  </motion.li>
                ))}
              </ul>
            </CollapsibleSection>
          </motion.div>
        )}

        {/* ── POSITIVE FEEDBACK ── */}
        {eval_?.positiveFeedback && eval_.positiveFeedback.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
            <CollapsibleSection title="Positive Feedback" icon={<ThumbsUp className="w-4 h-4 text-[#00D2FF]" />}>
              <ul className="space-y-2.5">
                {eval_.positiveFeedback.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                    <span className="text-[#00D2FF] mt-0.5 shrink-0">›</span>{f}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          </motion.div>
        )}

        {/* ── WEAKNESSES + IMPROVEMENTS ── */}
        {((eval_?.weaknesses?.length ?? 0) > 0 || (eval_?.improvementAreas?.length ?? 0) > 0) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }} className="grid md:grid-cols-2 gap-4">
            {(eval_?.weaknesses?.length ?? 0) > 0 && (
              <CollapsibleSection title="Weaknesses" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
                <ul className="space-y-2">
                  {eval_!.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/50 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />{w}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}
            {(eval_?.improvementAreas?.length ?? 0) > 0 && (
              <CollapsibleSection title="Improvement Areas" icon={<Lightbulb className="w-4 h-4 text-[#9D4EDD]" />}>
                <ul className="space-y-2">
                  {eval_!.improvementAreas.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/50 leading-relaxed">
                      <TrendingUp className="w-3.5 h-3.5 text-[#9D4EDD] shrink-0 mt-0.5" />{a}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}
          </motion.div>
        )}

        {/* ── CODE / APPROACH VIEWER ── */}
        {(submission.approachExplanation || submission.codeSnippet) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
            <CollapsibleSection title="Your Submission" icon={<Target className="w-4 h-4 text-white/40" />} defaultOpen={false}>
              <div className="flex gap-1 mb-4 p-1 bg-white/3 rounded-xl w-fit">
                {[{ id: "approach" as const, label: "Approach" }, { id: "code" as const, label: "Code" }].map(t => (
                  <button key={t.id} onClick={() => setCodeTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${codeTab === t.id ? "bg-[#00D2FF]/20 text-[#00D2FF]" : "text-white/30 hover:text-white/60"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {codeTab === "approach" ? (
                <div className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap bg-white/2 rounded-xl p-4 border border-white/5">
                  {submission.approachExplanation || "No approach explanation provided."}
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <Editor
                    height="240px"
                    defaultLanguage="javascript"
                    value={submission.codeSnippet || "// No code submitted"}
                    theme="vs-dark"
                    options={{ readOnly: true, fontSize: 12, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: "on", padding: { top: 12, bottom: 12 }, automaticLayout: true }}
                  />
                </div>
              )}
            </CollapsibleSection>
          </motion.div>
        )}

        {/* ── RAW AI REASONING ── */}
        {eval_?.rawAiReasoning && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <CollapsibleSection title="AI Reasoning" icon={<Brain className="w-4 h-4 text-[#9D4EDD]/70" />} defaultOpen={false}>
              <div className="text-xs text-white/40 leading-relaxed whitespace-pre-wrap bg-white/2 rounded-xl p-4 border border-white/5 font-mono">
                {eval_.rawAiReasoning}
              </div>
            </CollapsibleSection>
          </motion.div>
        )}

        {/* ── ACTIONS ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(resolvedDistrictId ? `/app/district/${resolvedDistrictId}/missions` : "/profession/select")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] text-white font-bold font-mono text-sm hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-[#00D2FF]/15"
          >
            <ArrowRight className="w-4 h-4" /> Continue Learning
          </button>

          {!passed && (
            <div className="flex-1 flex flex-col items-stretch gap-1">
              <button
                onClick={() => resolvedProblemNodeId ? navigate(`/app/mission/${resolvedProblemNodeId}`) : undefined}
                disabled={isSessionLoading || !resolvedProblemNodeId}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-white/50 font-mono text-sm hover:bg-white/5 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSessionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Try Again
              </button>
              {!isSessionLoading && !resolvedProblemNodeId && (
                <p className="text-center text-[11px] font-mono text-white/30">Mission no longer available</p>
              )}
            </div>
          )}

          <button
            onClick={() => navigate("/profession/select")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-white/40 font-mono text-sm hover:bg-white/5 hover:text-white transition-colors"
          >
            <Map className="w-4 h-4" /> Back to Map
          </button>

          <Link href={dashPath}>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-white/40 font-mono text-sm hover:bg-white/5 hover:text-white transition-colors">
              <Home className="w-4 h-4" /> Dashboard
            </button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
