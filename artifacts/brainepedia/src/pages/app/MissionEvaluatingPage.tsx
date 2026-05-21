import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw, Cpu } from "lucide-react";
import { processEvaluation, cacheEvalBySession } from "@/lib/evaluationService";
import { api } from "@/lib/api";

const PHASES = [
  "Brainiac is analyzing your architecture…",
  "Validating task requirements…",
  "Evaluating problem-solving patterns…",
  "Computing XP rewards…",
  "Cross-referencing expected outcomes…",
  "Measuring quality & structure…",
  "Scanning for edge case coverage…",
  "Finalizing your score…",
];

const MIN_MS = 7500;

/* ── Visual sub-components ── */
function BrainiacOrb() {
  return (
    <div className="relative flex items-center justify-center w-56 h-56">
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-[#00D2FF]/15"
          style={{ width: `${90 + i * 44}px`, height: `${90 + i * 44}px` }}
          animate={{ scale: [1, 1.07, 1], opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        className="absolute w-48 h-48 rounded-full border border-[#00D2FF]/20 border-t-[#00D2FF]/70 border-r-[#9D4EDD]/50"
        animate={{ rotate: 360 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-36 h-36 rounded-full border border-[#9D4EDD]/20 border-b-[#9D4EDD]/60 border-l-[#00D2FF]/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-24 h-24 rounded-full border border-[#FFD700]/10 border-t-[#FFD700]/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="relative w-20 h-20 rounded-full"
        animate={{ scale: [0.93, 1.06, 0.93] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00D2FF] via-[#9D4EDD] to-[#00D2FF] opacity-80" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/25 to-transparent" />
        <motion.div
          className="absolute inset-2 rounded-full bg-white/10"
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl select-none">🧠</div>
      </motion.div>
      <div className="absolute w-20 h-20 rounded-full bg-[#00D2FF]/25 blur-2xl" />
      <div className="absolute w-16 h-16 rounded-full bg-[#9D4EDD]/25 blur-xl" />
    </div>
  );
}

function NeuralBackground() {
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    x: 10 + (i * 7.5) % 85,
    y: 10 + (i * 13) % 80,
    delay: i * 0.3,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {nodes.map((n, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#00D2FF]"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: n.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Particles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 7 + 4,
    delay: Math.random() * 5,
    color: ["#00D2FF", "#9D4EDD", "#FFD700", "#00FF88"][i % 4],
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: p.color }}
          animate={{ y: [0, -40, 0], opacity: [0, 0.7, 0], scale: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function PhaseText({ phase }: { phase: number }) {
  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.45 }}
          className="text-sm font-mono text-white/60 text-center tracking-wide px-4"
        >
          {PHASES[Math.min(phase, PHASES.length - 1)]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-white/30">
        <span>Brainiac Processing</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] via-[#9D4EDD] to-[#FFD700]"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function MissionEvaluatingPage() {
  const params = useParams<{ submissionId: string; sessionId: string }>();
  const submissionId = params.submissionId || "";
  const sessionId = params.sessionId || "";
  const [, navigate] = useLocation();

  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [missionTitle, setMissionTitle] = useState<string | null>(null);

  const doneRef = useRef(false);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  /* Fetch mission title */
  useEffect(() => {
    if (!submissionId) return;
    api.submissions.get(submissionId).then(res => {
      if (res.ok) {
        const d = res.data as Record<string, any>;
        const title =
          d?.experienceSession?.problemNode?.title ||
          d?.problemNode?.title ||
          d?.missionTitle ||
          null;
        if (title) setMissionTitle(String(title));
      }
    });
  }, [submissionId]);

  /* Run evaluation */
  async function runEvaluation() {
    setError(null);
    doneRef.current = false;
    startRef.current = Date.now();

    const result = await processEvaluation(submissionId);

    if (result.ok && result.data) {
      /* Cache by sessionId so ResultPage can pick it up */
      cacheEvalBySession(sessionId, {
        score: result.data.score,
        isPassed: result.data.isPassed,
        netXpGained: result.data.netXpGained,
        missionTitle: result.data.missionTitle,
        feedback: result.data.feedback,
      });
      doneRef.current = true;
    } else {
      const elapsed = Date.now() - startRef.current;
      setTimeout(() => {
        setError(result.error || "Evaluation failed. Please retry.");
      }, Math.max(0, 2000 - elapsed));
    }
  }

  useEffect(() => {
    if (!submissionId) return;
    runEvaluation();
  }, [submissionId]);

  /* Phase rotation */
  useEffect(() => {
    const id = setInterval(() => {
      setPhase(p => Math.min(p + 1, PHASES.length - 1));
    }, MIN_MS / (PHASES.length - 1));
    return () => clearInterval(id);
  }, []);

  /* Progress animation */
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      if (doneRef.current && elapsed >= MIN_MS) {
        setProgress(100);
        return;
      }
      setProgress(Math.min(95, (elapsed / MIN_MS) * 95));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* Check completion */
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      if (doneRef.current && elapsed >= MIN_MS) {
        setProgress(100);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  /* Navigate when progress hits 100 */
  useEffect(() => {
    if (progress < 100) return;
    const timer = setTimeout(() => {
      navigate(`/mission/results/${sessionId}`);
    }, 600);
    return () => clearTimeout(timer);
  }, [progress, sessionId, navigate]);

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setPhase(0);
    runEvaluation();
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,210,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,255,0.5) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-[#00D2FF]/3 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#9D4EDD]/3 rounded-full blur-[130px] pointer-events-none" />

      <NeuralBackground />
      <Particles />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-9 px-6 text-center max-w-md w-full"
      >
        <BrainiacOrb />

        <div className="space-y-4 w-full">
          <motion.p
            className="text-[10px] font-mono text-[#00D2FF]/60 tracking-[0.45em] uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Brainiac · Evaluation Engine
          </motion.p>

          <AnimatePresence>
            {missionTitle && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Cpu className="w-3 h-3 text-[#9D4EDD]/50 shrink-0" />
                <p className="text-[11px] font-mono text-white/35 leading-snug">
                  Evaluating:{" "}
                  <span className="text-[#9D4EDD]/70">{missionTitle}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 text-red-400 text-sm font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 text-xs text-white/50 hover:text-white border border-white/20 hover:border-white/40 rounded-xl px-5 py-2.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Evaluation
                </button>
              </motion.div>
            ) : (
              <motion.div key="phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PhaseText phase={phase} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!error && <ProgressBar progress={progress} />}

        {!error && (
          <motion.p
            className="text-[11px] font-mono text-white/20 max-w-xs"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Brainiac evaluates every aspect of your solution — approach, logic,
            quality, and alignment with expected outcomes.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
