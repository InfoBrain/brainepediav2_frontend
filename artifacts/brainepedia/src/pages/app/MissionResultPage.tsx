import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Zap, Trophy, Star, Loader2, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Brain, Sparkles, Map, Home,
  RotateCcw, ArrowRight, Target, ThumbsUp, Lightbulb, AlertTriangle,
  Flag, Send, Award, TrendingUp, Flame, Shield,
} from "lucide-react";
import { getEvaluationBySession, getCachedEvalBySession, type EvaluationResult } from "@/lib/evaluationService";
import { getDashboardPath, isAuthenticated } from "@/lib/auth";

/* ── Helpers ── */
function toLines(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.map(String).filter(Boolean);
    } catch { /* not json */ }
    const lines = v.split(/\n|\r\n|\r|;/).map((s: string) => s.trim()).filter(Boolean);
    return lines.length > 1 ? lines : [v.trim()];
  }
  return [];
}

/* ── Timeline ── */
const TIMELINE = [
  { label: "Challenge Started", icon: Flag },
  { label: "Submission Sent", icon: Send },
  { label: "Brainiac Evaluated", icon: Brain },
  { label: "XP Awarded", icon: Zap },
  { label: "Challenge Complete", icon: Award },
];

function MissionStatusTimeline({ passed }: { passed: boolean }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (active >= TIMELINE.length - 1) return;
    const t = setTimeout(() => setActive(a => a + 1), 350);
    return () => clearTimeout(t);
  }, [active]);
  const accentColor = passed ? "#00D2FF" : "#FF6B6B";
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 border-b border-white/5 px-4 py-4 bg-[#060a10]/80 backdrop-blur"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {TIMELINE.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= active;
          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: isActive ? 1 : 0.8, opacity: isActive ? 1 : 0.25 }}
                transition={{ delay: i * 0.1, duration: 0.3, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                  style={{
                    borderColor: isActive ? accentColor : "rgba(255,255,255,0.1)",
                    backgroundColor: isActive ? `${accentColor}18` : "transparent",
                    boxShadow: isActive ? `0 0 12px ${accentColor}40` : "none",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? accentColor : "rgba(255,255,255,0.2)" }} />
                </div>
                <span className="text-[9px] font-mono whitespace-nowrap" style={{ color: isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>
                  {step.label}
                </span>
              </motion.div>
              {i < TIMELINE.length - 1 && (
                <motion.div
                  className="h-[1px] w-8 md:w-12 rounded shrink-0"
                  style={{ backgroundColor: isActive && i < active ? accentColor : "rgba(255,255,255,0.08)" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isActive && i < active ? 1 : 0.3 }}
                  transition={{ delay: i * 0.12 + 0.1, duration: 0.3 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Score Ring ── */
function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const color = passed ? "#00D2FF" : "#FF6B6B";
  return (
    <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="68" cy="68" r={r}
          stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="text-center">
        <motion.p
          className="text-3xl font-black font-mono"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          {score}%
        </motion.p>
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Score</p>
      </div>
    </div>
  );
}

/* ── Confetti ── */
function ConfettiPiece({ i }: { i: number }) {
  const colors = ["#00D2FF", "#FFD700", "#9D4EDD", "#00FF88", "#FF6B6B"];
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm pointer-events-none"
      style={{ backgroundColor: colors[i % colors.length], left: `${8 + (i * 5.4) % 84}%`, top: -12 }}
      animate={{ y: ["0vh", "115vh"], rotate: [0, 720 * (i % 2 === 0 ? 1 : -1)], opacity: [1, 0] }}
      transition={{ duration: 2.2 + (i % 3) * 0.4, delay: i * 0.07, ease: "easeIn" }}
    />
  );
}

/* ── Feedback Card ── */
type FeedbackCardConfig = {
  title: string;
  icon: React.ReactNode;
  lines: string[];
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
};

function FeedbackCard({ config, delay }: { config: FeedbackCardConfig; delay: number }) {
  if (!config.lines.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="relative rounded-2xl border p-5 overflow-hidden"
      style={{
        borderColor: config.borderColor,
        backgroundColor: config.bgColor,
        boxShadow: `0 0 20px ${config.glowColor}`,
      }}
    >
      <div className="absolute inset-0 opacity-30 blur-2xl pointer-events-none" style={{ backgroundColor: config.bgColor }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-4">
          {config.icon}
          <span className="text-sm font-bold font-mono" style={{ color: config.color }}>{config.title}</span>
        </div>
        <ul className="space-y-2.5">
          {config.lines.map((line, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.05 * i }}
              className="flex items-start gap-2.5 text-sm text-white/65 leading-relaxed"
            >
              <span className="shrink-0 mt-0.5" style={{ color: config.color }}>›</span>
              {line}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ── Brainiac Analysis Panel ── */
function BrainiacAnalysisPanel({ rawReasoning }: { rawReasoning: string }) {
  const [open, setOpen] = useState(false);
  const [displayed, setDisplayed] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open || !rawReasoning) { setDisplayed(""); return; }
    setDisplayed("");
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx++;
      setDisplayed(rawReasoning.slice(0, idx));
      if (idx >= rawReasoning.length && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 8);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open, rawReasoning]);

  if (!rawReasoning) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl border border-[#9D4EDD]/25 bg-[#9D4EDD]/5 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(157,78,221,0.08)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <Brain className="w-4 h-4 text-[#9D4EDD]" />
          </motion.div>
          <span className="text-sm font-bold font-mono text-white/80">Brainiac Deep Analysis</span>
          <span className="text-[10px] font-mono text-[#9D4EDD]/50 bg-[#9D4EDD]/10 px-2 py-0.5 rounded-full">AI Terminal</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 pt-1">
              <div
                className="rounded-xl p-4 border border-[#9D4EDD]/20 font-mono text-xs leading-relaxed overflow-auto max-h-72 relative"
                style={{ backgroundColor: "rgba(10,5,20,0.8)", color: "rgba(157,78,221,0.8)" }}
              >
                {/* Scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(157,78,221,0.02) 2px,rgba(157,78,221,0.02) 4px)" }}
                />
                <span className="text-[#9D4EDD]/40">{">"} </span>
                <span className="text-[#00D2FF]/60">brainiac.analyze</span>
                <span className="text-white/30">(session) </span>
                <span className="text-[#FFD700]/40">→</span>
                <br /><br />
                <span className="text-[#9D4EDD]/70 whitespace-pre-wrap">{displayed}</span>
                {displayed.length < rawReasoning.length && (
                  <motion.span
                    className="inline-block w-1.5 h-3 bg-[#9D4EDD]/70 ml-0.5"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── XP Reward Card ── */
function XpRewardCard({ xp, passed }: { xp: number; passed: boolean }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!xp || !passed) return;
    const start = Date.now();
    const duration = 1800;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * xp));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [xp, passed]);

  /* XP Particles */
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 20 + (i * 10) % 60,
    delay: i * 0.15,
  }));

  if (!passed && !xp) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        borderColor: passed ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.08)",
        backgroundColor: passed ? "rgba(255,215,0,0.05)" : "rgba(255,255,255,0.02)",
        boxShadow: passed ? "0 0 30px rgba(255,215,0,0.08)" : "none",
      }}
    >
      {/* Floating XP particles */}
      {passed && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute text-[10px] font-mono font-bold text-[#FFD700]/60"
              style={{ left: `${p.x}%`, bottom: 0 }}
              animate={{ y: [0, -80], opacity: [0, 1, 0] }}
              transition={{ duration: 2, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
            >
              +XP
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative z-10 px-6 py-5 flex items-center gap-6">
        <motion.div
          className="relative w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}
          animate={passed ? { boxShadow: ["0 0 0px rgba(255,215,0,0.3)", "0 0 20px rgba(255,215,0,0.5)", "0 0 0px rgba(255,215,0,0.3)"] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-8 h-8 text-[#FFD700]" />
        </motion.div>

        <div className="flex-1">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest mb-1">
            {passed ? "XP Earned This Challenge" : "No XP Awarded"}
          </p>
          <motion.p
            className="text-4xl font-black font-mono"
            style={{ color: passed ? "#FFD700" : "rgba(255,255,255,0.2)" }}
          >
            {passed ? `+${count}` : "0"}
          </motion.p>
          {passed && xp > 0 && (
            <div className="mt-2">
              <div className="h-1 rounded-full bg-white/5 overflow-hidden w-full max-w-[200px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FFD700]/70 to-[#FFD700]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <p className="text-[10px] font-mono text-[#FFD700]/40 mt-1">XP awarded to your profile</p>
            </div>
          )}
        </div>

        {passed && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
          >
            <Star className="w-8 h-8 text-[#FFD700]" fill="#FFD700" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Action Buttons ── */
function MissionResultActions({
  passed,
  sessionId,
}: {
  passed: boolean;
  sessionId: string;
}) {
  const [, navigate] = useLocation();
  const dashPath = isAuthenticated() ? getDashboardPath() : "/";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85 }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Primary CTA */}
        <button
          onClick={() => navigate("/profession/select")}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold font-mono text-sm transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
          style={{
            background: "linear-gradient(135deg, #00D2FF, #9D4EDD)",
            boxShadow: "0 8px 24px rgba(0,210,255,0.2)",
          }}
        >
          <ArrowRight className="w-4 h-4" />
          Continue Journey
        </button>

        {/* Dashboard */}
        <Link href={dashPath}>
          <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 text-white/60 font-mono text-sm hover:bg-white/5 hover:text-white transition-all">
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </Link>

        {/* Retry — always shown */}
        <button
          onClick={() => navigate("/profession/select")}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 text-white/50 font-mono text-sm hover:bg-white/5 hover:text-white transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          {passed ? "Retry Challenge" : "Retry Challenge"}
        </button>

        {/* Back to District */}
        <button
          onClick={() => navigate("/profession/select")}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 text-white/50 font-mono text-sm hover:bg-white/5 hover:text-white transition-all"
        >
          <Map className="w-4 h-4" />
          Back to District
        </button>
      </div>

      {/* Leaderboard */}
      <button
        onClick={() => navigate("/app/dashboard")}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[#FFD700]/15 text-[#FFD700]/50 font-mono text-sm hover:bg-[#FFD700]/5 hover:text-[#FFD700]/80 transition-all"
      >
        <Trophy className="w-4 h-4" />
        View Leaderboard
      </button>
    </motion.div>
  );
}

/* ── Polling state UI ── */
function EvaluationStillProcessing({ pollCount, onRetry }: { pollCount: number; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center gap-8 px-6">
      <motion.div
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 rounded-full border-2 border-[#00D2FF]/40 flex items-center justify-center"
        style={{ boxShadow: "0 0 30px rgba(0,210,255,0.15)" }}
      >
        <Brain className="w-7 h-7 text-[#00D2FF]" />
      </motion.div>
      <div className="text-center space-y-2">
        <p className="text-white/80 font-mono font-bold">Evaluation Still Processing</p>
        <p className="text-sm font-mono text-white/40">
          Brainiac is still computing your results…
          {pollCount > 0 && ` (Check ${pollCount})`}
        </p>
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 rounded-full border-2 border-transparent border-t-[#00D2FF] border-r-[#9D4EDD]"
      />
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white border border-white/15 hover:border-white/30 rounded-xl px-5 py-2.5 transition-all font-mono"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh Manually
      </button>
    </div>
  );
}

/* ── Main Component ── */
interface EvalData {
  score: number;
  isPassed: boolean;
  strengths: string[];
  weaknesses: string[];
  positiveFeedback: string[];
  improvementAreas: string[];
  rawAiReasoning: string;
  missionTitle: string;
  netXpGained: number;
}

function buildEvalData(apiData: EvaluationResult, cachedXp: number, cachedTitle: string): EvalData {
  return {
    score: Number(apiData.score ?? 0),
    isPassed: Boolean(apiData.isPassed),
    strengths: toLines(apiData.strengths),
    weaknesses: toLines(apiData.weaknesses),
    positiveFeedback: toLines(apiData.positiveFeedback),
    improvementAreas: toLines(apiData.improvementAreas),
    rawAiReasoning: String(apiData.rawAiReasoning || ""),
    missionTitle: String(apiData.missionTitle || cachedTitle || "Mission"),
    netXpGained: cachedXp,
  };
}

export default function MissionResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "";

  const [evalData, setEvalData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  /* Resolve cached XP + title from EvaluatingPage storage */
  const cached = sessionId ? getCachedEvalBySession(sessionId) : null;
  const cachedXp = Number(cached?.netXpGained ?? 0);
  const cachedTitle = String(cached?.missionTitle ?? "");

  const fetchResults = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) setLoading(true);
    setError(null);

    /* Fast path: if we have cached process result use it while API loads */
    if (cached && !evalData) {
      const fd = cached.feedback || {};
      setEvalData({
        score: Number(cached.score ?? 0),
        isPassed: Boolean(cached.isPassed),
        strengths: toLines(fd.strengths),
        weaknesses: toLines(fd.weaknesses),
        positiveFeedback: toLines(fd.positiveFeedback),
        improvementAreas: toLines(fd.improvementAreas),
        rawAiReasoning: "",
        missionTitle: cachedTitle || "Mission",
        netXpGained: cachedXp,
      });
    }

    const res = await getEvaluationBySession(sessionId);
    setLoading(false);

    if (res.ok && res.data) {
      setEvalData(buildEvalData(res.data, cachedXp, cachedTitle));
      setIsPolling(false);
      window.dispatchEvent(new CustomEvent("brainepedia:evaluation-complete"));
    } else if (res.notFound) {
      setIsPolling(true);
    } else {
      setError(res.error || "Failed to load evaluation results.");
    }
  }, [sessionId, cachedXp, cachedTitle]);

  useEffect(() => {
    if (!sessionId) return;
    fetchResults();
  }, [sessionId]);

  /* Polling every 5 s when not found */
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(async () => {
      setPollCount(c => c + 1);
      const res = await getEvaluationBySession(sessionId, 0);
      if (res.ok && res.data) {
        setEvalData(buildEvalData(res.data, cachedXp, cachedTitle));
        setIsPolling(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPolling, sessionId, cachedXp, cachedTitle]);

  /* ── Loading ── */
  if (loading && !evalData) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#00D2FF] border-r-[#9D4EDD]"
          />
          <p className="text-sm font-mono text-white/40">Loading your results…</p>
        </div>
      </div>
    );
  }

  /* ── Still processing (polling, no data yet) ── */
  if (isPolling && !evalData) {
    return (
      <EvaluationStillProcessing
        pollCount={pollCount}
        onRetry={() => fetchResults(true)}
      />
    );
  }

  /* ── Error ── */
  if (error && !evalData) {
    return (
      <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center gap-6 px-6">
        <AlertCircle className="w-12 h-12 text-red-400/60" />
        <div className="text-center">
          <p className="text-white/70 font-mono font-bold">Unable to Load Results</p>
          <p className="text-sm font-mono text-white/40 mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchResults(true)}
          className="flex items-center gap-2 text-sm border border-white/20 rounded-xl px-5 py-3 text-white/50 hover:text-white transition-all font-mono"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!evalData) return null;

  const { score, isPassed, strengths, weaknesses, positiveFeedback, improvementAreas, rawAiReasoning, missionTitle, netXpGained } = evalData;

  const feedbackCards: FeedbackCardConfig[] = [
    {
      title: "Strengths",
      icon: <Shield className="w-4 h-4 text-[#00FF88]" />,
      lines: strengths,
      color: "#00FF88",
      borderColor: "rgba(0,255,136,0.25)",
      bgColor: "rgba(0,255,136,0.05)",
      glowColor: "rgba(0,255,136,0.06)",
    },
    {
      title: "Weaknesses",
      icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
      lines: weaknesses,
      color: "#FF8C42",
      borderColor: "rgba(255,140,66,0.25)",
      bgColor: "rgba(255,140,66,0.05)",
      glowColor: "rgba(255,140,66,0.06)",
    },
    {
      title: "Positive Feedback",
      icon: <ThumbsUp className="w-4 h-4 text-[#00D2FF]" />,
      lines: positiveFeedback,
      color: "#00D2FF",
      borderColor: "rgba(0,210,255,0.25)",
      bgColor: "rgba(0,210,255,0.05)",
      glowColor: "rgba(0,210,255,0.06)",
    },
    {
      title: "Improvement Areas",
      icon: <Lightbulb className="w-4 h-4 text-[#FFD700]" />,
      lines: improvementAreas,
      color: "#FFD700",
      borderColor: "rgba(255,215,0,0.25)",
      bgColor: "rgba(255,215,0,0.05)",
      glowColor: "rgba(255,215,0,0.06)",
    },
  ];

  return (
    <div className={`min-h-screen text-white relative overflow-x-hidden ${isPassed ? "bg-[#020408]" : "bg-[#070408]"}`}>

      {/* Confetti */}
      {isPassed && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 22 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
        </div>
      )}

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ backgroundColor: isPassed ? "rgba(0,210,255,0.04)" : "rgba(255,107,107,0.04)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none"
        style={{ backgroundColor: "rgba(157,78,221,0.03)" }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,210,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,255,0.5) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Timeline */}
      <MissionStatusTimeline passed={isPassed} />

      {/* Scrollable content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-6">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border p-8 overflow-hidden"
          style={{
            borderColor: isPassed ? "rgba(0,210,255,0.2)" : "rgba(255,107,107,0.2)",
            background: isPassed
              ? "linear-gradient(135deg, rgba(0,210,255,0.06) 0%, rgba(157,78,221,0.06) 100%)"
              : "linear-gradient(135deg, rgba(255,107,107,0.06) 0%, rgba(255,140,66,0.06) 100%)",
            boxShadow: isPassed ? "0 0 60px rgba(0,210,255,0.05)" : "0 0 60px rgba(255,107,107,0.05)",
          }}
        >
          {/* Glow blob */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
            style={{ backgroundColor: isPassed ? "rgba(0,210,255,0.08)" : "rgba(255,107,107,0.08)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={score} passed={isPassed} />

            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Pass/Fail badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold font-mono mb-4 border"
                  style={
                    isPassed
                      ? { color: "#00D2FF", borderColor: "rgba(0,210,255,0.35)", backgroundColor: "rgba(0,210,255,0.1)", boxShadow: "0 0 16px rgba(0,210,255,0.15)" }
                      : { color: "#FF6B6B", borderColor: "rgba(255,107,107,0.35)", backgroundColor: "rgba(255,107,107,0.1)" }
                  }
                >
                  {isPassed
                    ? <><CheckCircle2 className="w-4 h-4" /> Mission Cleared</>
                    : <><XCircle className="w-4 h-4" /> Mission Failed</>
                  }
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{missionTitle}</h1>

                {!isPassed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-white/45 italic leading-relaxed max-w-sm"
                  >
                    You're close! Review Brainiac's feedback below, sharpen your approach, and try again. You've got this.
                  </motion.p>
                )}

                {isPassed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border border-[#00FF88]/30 bg-[#00FF88]/8 text-[#00FF88]/80">
                      <Sparkles className="w-3 h-3" /> Excellent Work
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/8 text-[#9D4EDD]/80">
                      <Flame className="w-3 h-3" /> Brainiac Certified
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Brainiac Evaluation Complete banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative z-10 mt-6 pt-5 border-t border-white/5 flex items-center justify-between flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 text-[11px] font-mono text-white/30">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-3.5 h-3.5 text-[#9D4EDD]/60" />
              </motion.div>
              Brainiac Evaluation Complete
            </div>
            {isPolling && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FFD700]/60">
                <Loader2 className="w-3 h-3 animate-spin" />
                Results updating…
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* ── XP REWARD ── */}
        <XpRewardCard xp={netXpGained} passed={isPassed} />

        {/* ── FEEDBACK CARDS ── */}
        {feedbackCards.some(c => c.lines.length > 0) && (
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Brainiac Feedback
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbackCards.map((card, i) => (
                <FeedbackCard key={card.title} config={card} delay={0.52 + i * 0.08} />
              ))}
            </div>
          </div>
        )}

        {/* ── BRAINIAC ANALYSIS ── */}
        <BrainiacAnalysisPanel rawReasoning={rawAiReasoning} />

        {/* ── ACTIONS ── */}
        <MissionResultActions passed={isPassed} sessionId={sessionId} />

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-mono text-white/15 pb-4"
        >
          Brainiac · AI Evaluation Engine · Session {sessionId.slice(0, 8)}…
        </motion.p>
      </div>
    </div>
  );
}
