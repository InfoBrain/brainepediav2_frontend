import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, ArrowLeft, Zap, Home, RotateCcw,
  ChevronRight, Star, TrendingUp, AlertTriangle, Brain,
  Trophy, Loader2, AlertCircle, RefreshCw, Map,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUserId, getDashboardPath, isAuthenticated } from "@/lib/auth";
import { CopyrightBar } from "@/components/ui/CopyrightBar";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface NodeResult {
  missionTitle: string;
  score: number;
  isPassed: boolean;
  positiveFeedback: string[];
  improvementAreas: string[];
  strengths: string[];
  weaknesses: string[];
  rawAiReasoning: string;
  netXpGained: number;
  districtId?: string;
  districtName?: string;
}

/* ── Normaliser ─────────────────────────────────────────────────────────── */
function normNodeResult(d: any): NodeResult {
  const toArr = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v];
    return [];
  };
  return {
    missionTitle: d?.missionTitle || d?.MissionTitle || d?.title || d?.Title || "Mission",
    score: Math.min(100, Math.max(0, Number(d?.score ?? d?.Score ?? 0))),
    isPassed: Boolean(d?.isPassed ?? d?.IsPassed ?? false),
    positiveFeedback: toArr(d?.positiveFeedback ?? d?.PositiveFeedback),
    improvementAreas: toArr(d?.improvementAreas ?? d?.ImprovementAreas),
    strengths: toArr(d?.strengths ?? d?.Strengths),
    weaknesses: toArr(d?.weaknesses ?? d?.Weaknesses),
    rawAiReasoning: String(d?.rawAiReasoning ?? d?.RawAiReasoning ?? ""),
    netXpGained: Number(d?.netXpGained ?? d?.NetXpGained ?? d?.xpGained ?? 0),
    districtId: d?.districtId || d?.DistrictId || "",
    districtName: d?.districtName || d?.DistrictName || "",
  };
}

/* ── Score Ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score, isPassed }: { score: number; isPassed: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const size = 160;
  const r = 64;
  const circ = 2 * Math.PI * r;
  const dash = (displayed / 100) * circ;

  useEffect(() => {
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const ringColor = isPassed
    ? displayed >= 80 ? "#FFD700" : "#00D2FF"
    : "#EF4444";
  const glowColor = isPassed
    ? displayed >= 80 ? "rgba(255,215,0,0.5)" : "rgba(0,210,255,0.4)"
    : "rgba(239,68,68,0.4)";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size} height={size}
        style={{ filter: `drop-shadow(0 0 18px ${glowColor})` }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={ringColor} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle"
          fontSize="32" fontWeight="900" fontFamily="monospace" fill={ringColor}>
          {displayed}
        </text>
        <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle"
          fontSize="12" fontFamily="monospace" fill="rgba(255,255,255,0.35)">
          / 100
        </text>
      </svg>
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold font-mono ${
        isPassed
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          : "bg-red-500/15 border-red-500/40 text-red-400"
      }`}>
        {isPassed
          ? <><CheckCircle2 className="w-4 h-4" /> MISSION PASSED</>
          : <><XCircle className="w-4 h-4" /> MISSION FAILED</>
        }
      </div>
    </div>
  );
}

/* ── XP Count-up ─────────────────────────────────────────────────────────── */
function XPCounter({ xp }: { xp: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (xp <= 0) return;
    const start = performance.now();
    const dur = 1800;
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(eased * xp));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [xp]);

  if (xp <= 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 shadow-[0_0_20px_rgba(255,215,0,0.15)]"
    >
      <Zap className="w-4 h-4 text-[#FFD700]" />
      <span className="text-[#FFD700] font-black font-mono text-lg">
        +{count.toLocaleString()} XP
      </span>
    </motion.div>
  );
}

/* ── Feedback Card ─────────────────────────────────────────────────────────── */
function FeedbackCard({
  title, icon, items, accent, bg, border, delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: string;
  bg: string;
  border: string;
  delay?: number;
}) {
  if (items.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-2xl border ${border} ${bg} p-5`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className={`text-xs font-mono uppercase tracking-widest ${accent}`}>{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-white/65 leading-relaxed">
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${accent}`} />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ── Brainiac Terminal ─────────────────────────────────────────────────────── */
function BrainiacPanel({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!text) return;
    let i = 0;
    const max = Math.min(text.length, 900);
    const id = setInterval(() => {
      i += 6;
      setShown(text.slice(0, Math.min(i, max)));
      if (i >= max) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [text]);

  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="rounded-2xl border border-[#9D4EDD]/30 bg-[#0d1117] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#9D4EDD]/20 bg-[#9D4EDD]/8">
        <Brain className="w-4 h-4 text-[#A78BFA]" />
        <span className="text-xs font-mono text-[#A78BFA] uppercase tracking-widest">Brainiac Analysis</span>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="ml-auto h-2 w-2 rounded-full bg-[#A78BFA]"
        />
      </div>
      <div className="p-4">
        <p className="text-xs font-mono text-white/55 leading-relaxed whitespace-pre-wrap">
          {shown}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="inline-block w-0.5 h-3 bg-[#A78BFA] ml-0.5 align-middle"
          />
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function NodeResultPage() {
  const params = useParams<{ problemNodeId: string }>();
  const problemNodeId = params.problemNodeId || "";
  const [, navigate] = useLocation();
  const userId = getUserId();
  const dashPath = isAuthenticated() ? getDashboardPath() : "/";

  const [result, setResult] = useState<NodeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!problemNodeId) return;
    setLoading(true);
    setError(null);
    const res = await api.evaluations.getNodeResult(problemNodeId, userId);
    setLoading(false);
    if (res.ok && res.data) {
      setResult(normNodeResult(res.data));
    } else if (res.status === 404) {
      setError("No evaluation result found for this mission yet.");
    } else {
      setError(res.error || "Failed to load mission result.");
    }
  }, [problemNodeId]);

  useEffect(() => { fetchResult(); }, [fetchResult]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a10] flex flex-col items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-[#00D2FF]/10" />
            <Loader2 className="relative w-12 h-12 text-[#00D2FF] animate-spin" />
          </div>
          <p className="text-sm font-mono text-white/40 uppercase tracking-widest">Loading mission result…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#060a10] flex flex-col items-center justify-center text-white px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-14 h-14 text-red-400/50 mx-auto" />
          <p className="text-white/50 font-mono text-sm">{error || "Result not available."}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchResult}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/50 hover:text-white text-sm font-mono transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button
              onClick={() => navigate(dashPath)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/50 hover:text-white text-sm font-mono transition-colors"
            >
              <Home className="w-4 h-4" /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { isPassed, score, netXpGained, missionTitle, positiveFeedback, improvementAreas, strengths, weaknesses, rawAiReasoning, districtId } = result;

  /* ── Merge feedback arrays (deduplicate) ── */
  const allPositive = [...new Set([...positiveFeedback, ...strengths])];
  const allNegative = [...new Set([...improvementAreas, ...weaknesses])];

  return (
    <div className="min-h-screen bg-[#060a10] text-white relative overflow-hidden flex flex-col">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl ${isPassed ? "bg-emerald-500/5" : "bg-red-500/4"}`} />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#9D4EDD]/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(0,210,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,255,0.3) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-4 md:px-8 py-4 border-b border-white/5 bg-black/20 backdrop-blur">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex-1" />
        <button
          onClick={() => navigate(dashPath)}
          className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white transition-colors"
        >
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
      </header>

      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="space-y-6">

          {/* ── Hero card ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-3xl border p-8 text-center relative overflow-hidden ${
              isPassed
                ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 via-[#0d1117] to-[#0a0e14] shadow-[0_0_50px_rgba(16,185,129,0.12)]"
                : "border-red-500/25 bg-gradient-to-br from-red-500/6 via-[#0d1117] to-[#0a0e14]"
            }`}
          >
            {/* Completed badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono uppercase tracking-widest ${
                isPassed
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}>
                <Trophy className="w-3.5 h-3.5" />
                {isPassed ? "Mission Completed" : "Attempt Evaluated"}
              </div>
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">{missionTitle}</h1>

            {/* Score Ring */}
            <div className="flex justify-center mb-6">
              <ScoreRing score={score} isPassed={isPassed} />
            </div>

            {/* XP */}
            <div className="flex justify-center">
              <XPCounter xp={netXpGained} />
            </div>
          </motion.div>

          {/* ── Feedback grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeedbackCard
              title="Strengths"
              icon={<Star className="w-4 h-4 text-[#FFD700]" />}
              items={allPositive}
              accent="text-[#FFD700]"
              bg="bg-[#FFD700]/5"
              border="border-[#FFD700]/20"
              delay={0.15}
            />
            <FeedbackCard
              title="Improvement Areas"
              icon={<TrendingUp className="w-4 h-4 text-[#00D2FF]" />}
              items={allNegative}
              accent="text-[#00D2FF]"
              bg="bg-[#00D2FF]/5"
              border="border-[#00D2FF]/20"
              delay={0.2}
            />
          </div>

          {/* ── Brainiac reasoning ── */}
          <BrainiacPanel text={rawAiReasoning} />

          {/* ── Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {districtId && (
              <button
                onClick={() => navigate(`/app/district/${districtId}/missions`)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/15 bg-white/3 text-white/70 hover:bg-white/8 hover:text-white text-sm font-semibold font-mono transition-all"
              >
                <Map className="w-4 h-4" />
                Return to District
              </button>
            )}
            <button
              onClick={() => navigate(dashPath)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#00D2FF]/30 bg-[#00D2FF]/8 text-[#00D2FF] hover:bg-[#00D2FF]/15 text-sm font-semibold font-mono transition-all"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            {!isPassed && (
              <button
                onClick={() => navigate(`/app/mission/${problemNodeId}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-amber-500/30 bg-amber-500/8 text-amber-400 hover:bg-amber-500/15 text-sm font-semibold font-mono transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Mission
              </button>
            )}
            {isPassed && (
              <button
                onClick={() => navigate("/profession/select")}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15 text-sm font-semibold font-mono transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Next Mission
              </button>
            )}
          </motion.div>

        </div>
      </main>

      <CopyrightBar className="relative z-10 border-t border-white/5" />
    </div>
  );
}
