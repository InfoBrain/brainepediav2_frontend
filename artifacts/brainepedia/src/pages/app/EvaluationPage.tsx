import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

const PHASES = [
  "The Oracle is awakening…",
  "Analyzing your approach…",
  "Reviewing logic structure…",
  "Evaluating best practices…",
  "Scoring your solution…",
  "Cross-referencing with expected outcomes…",
  "Measuring code quality…",
  "Finalizing your evaluation…",
];

const MIN_DURATION_MS = 7500;

function OracleOrb() {
  return (
    <div className="relative flex items-center justify-center w-52 h-52">
      {/* Outer glow rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-[#00D2FF]/20"
          style={{ width: `${100 + i * 50}px`, height: `${100 + i * 50}px` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}

      {/* Rotating arc */}
      <motion.div
        className="absolute w-44 h-44 rounded-full border-2 border-transparent border-t-[#00D2FF]/60 border-r-[#9D4EDD]/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-36 h-36 rounded-full border-2 border-transparent border-b-[#9D4EDD]/60 border-l-[#00D2FF]/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      {/* Core orb */}
      <motion.div
        className="relative w-20 h-20 rounded-full"
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Core gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00D2FF] via-[#9D4EDD] to-[#00D2FF] opacity-80" />
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
        {/* Core shine */}
        <motion.div
          className="absolute inset-2 rounded-full bg-white/10"
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Outer glow blur */}
      <div className="absolute w-20 h-20 rounded-full bg-[#00D2FF]/30 blur-2xl" />
      <div className="absolute w-16 h-16 rounded-full bg-[#9D4EDD]/30 blur-xl" />
    </div>
  );
}

function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 4,
    color: i % 3 === 0 ? "#00D2FF" : i % 3 === 1 ? "#9D4EDD" : "#FFD700",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function StatusTextRotator({ phase }: { phase: number }) {
  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-sm font-mono text-white/60 text-center tracking-wide"
        >
          {PHASES[Math.min(phase, PHASES.length - 1)]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function FakeProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-white/30">
        <span>Processing</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] via-[#9D4EDD] to-[#00D2FF] bg-size-200"
          style={{ width: `${progress}%` }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}

export default function EvaluationPage() {
  const params = useParams<{ submissionId: string }>();
  const submissionId = params.submissionId || "";
  const [, navigate] = useLocation();

  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const resultRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const doneRef = useRef(false);

  async function runEvaluation() {
    setError(null);
    setRetrying(false);
    startTimeRef.current = Date.now();
    doneRef.current = false;

    const res = await api.evaluations.process(submissionId);

    if (res.ok) {
      resultRef.current = res.data;
    } else {
      // Show error only after minimum animation has had some time
      const elapsed = Date.now() - startTimeRef.current;
      const wait = Math.max(0, 2000 - elapsed);
      setTimeout(() => setError(res.error || "Evaluation failed. Please retry."), wait);
      return;
    }

    doneRef.current = true;
  }

  useEffect(() => {
    if (!submissionId) return;
    runEvaluation();
  }, [submissionId]);

  // Phase rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => {
        if (p < PHASES.length - 1) return p + 1;
        return p;
      });
    }, MIN_DURATION_MS / (PHASES.length - 1));
    return () => clearInterval(interval);
  }, []);

  // Progress bar animation
  useEffect(() => {
    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const natural = Math.min(95, (elapsed / MIN_DURATION_MS) * 95);

      // If API is done and min time elapsed, rush to 100
      if (doneRef.current && elapsed >= MIN_DURATION_MS) {
        setProgress(100);
        return;
      }

      setProgress(natural);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Redirect when done
  useEffect(() => {
    if (progress < 100) return;
    const timer = setTimeout(() => {
      navigate(`/app/submission/${submissionId}/result`, {
        state: resultRef.current,
        replace: true,
      } as any);
    }, 500);
    return () => clearTimeout(timer);
  }, [progress, submissionId, navigate]);

  // Check if minimum time AND API done → trigger 100%
  useEffect(() => {
    const check = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (doneRef.current && elapsed >= MIN_DURATION_MS) {
        setProgress(100);
        clearInterval(check);
      }
    }, 200);
    return () => clearInterval(check);
  }, []);

  return (
    <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,210,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Ambient gradients */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00D2FF]/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9D4EDD]/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating particles */}
      <Particles />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-md w-full"
      >
        {/* Oracle orb */}
        <OracleOrb />

        {/* Label */}
        <div className="space-y-3">
          <motion.p
            className="text-[10px] font-mono text-[#00D2FF]/60 tracking-[0.4em] uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Oracle · Evaluation Engine
          </motion.p>
          <AnimatePresence>
            {!error ? (
              <StatusTextRotator phase={phase} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 text-red-400 text-sm font-mono">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
                <button
                  onClick={() => { setError(null); setProgress(0); setPhase(0); runEvaluation(); }}
                  className="flex items-center gap-2 text-xs text-white/50 hover:text-white border border-white/20 rounded-lg px-4 py-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Evaluation
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        {!error && <FakeProgressBar progress={progress} />}

        {/* Subtext */}
        {!error && (
          <motion.p
            className="text-[11px] font-mono text-white/20 max-w-xs"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            The Oracle evaluates every aspect of your solution — approach, logic, quality, and alignment with expected outcomes.
          </motion.p>
        )}
      </motion.div>

      {/* Scanline effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />
    </div>
  );
}
