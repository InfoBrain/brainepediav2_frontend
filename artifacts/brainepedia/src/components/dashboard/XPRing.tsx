import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const XP_LEVELS = [0, 500, 1200, 2500, 4500, 7000, 10000, 15000, 22000, 30000, 40000];

export function getXPLevel(xp: number) {
  let lv = XP_LEVELS.findIndex(v => xp < v);
  if (lv === -1) lv = XP_LEVELS.length;
  else lv = Math.max(1, lv);
  const current = XP_LEVELS[lv - 1] ?? 0;
  const next = XP_LEVELS[lv] ?? XP_LEVELS[XP_LEVELS.length - 1];
  const pct = next > current ? Math.min(100, ((xp - current) / (next - current)) * 100) : 100;
  return { level: lv, current, next, pct };
}

function useCountUp(target: number, duration = 1400) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(eased * target);
      if (ref.current) ref.current.textContent = val.toLocaleString();
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return ref;
}

interface XPRingProps {
  totalXP: number;
  size?: number;
}

export function XPRing({ totalXP, size = 180 }: XPRingProps) {
  const { level, next, pct } = getXPLevel(totalXP);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const countRef = useCountUp(totalXP);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <motion.circle
            cx="80" cy="80" r={r} fill="none"
            stroke="url(#xp-grad)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="xp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D2FF" />
              <stop offset="100%" stopColor="#9D4EDD" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-[#00D2FF]/60 uppercase tracking-[0.3em]">Level</span>
          <span className="text-4xl font-black text-white font-mono leading-none">{level}</span>
          <span className="text-[10px] font-mono text-white/30 mt-1">
            <span ref={countRef}>0</span> XP
          </span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <div className="text-xs font-mono text-white/40">
          Next level at <span className="text-[#00D2FF]">{next.toLocaleString()} XP</span>
        </div>
        <div className="h-1.5 w-40 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        </div>
        <div className="text-[10px] text-white/20 font-mono">{pct.toFixed(1)}% to level {level + 1}</div>
      </div>
    </div>
  );
}
