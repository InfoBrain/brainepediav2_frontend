import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, Lock, ChevronRight } from "lucide-react";

export type District = {
  districtId: string;
  name: string;
  description?: string | null;
  completionPercentage: number;
  isLocked?: boolean;
};

type Props = {
  district: District;
  index: number;
  isRecommended: boolean;
  onClick: (d: District) => void;
};

function statusMeta(pct: number) {
  if (pct >= 100) return { label: "Mastered", color: "text-emerald-400", border: "border-emerald-500/40", glow: "hover:shadow-emerald-500/30", bar: "bg-emerald-500", bg: "hover:bg-emerald-500/5" };
  if (pct > 0)    return { label: "In Progress", color: "text-cyan-400",    border: "border-cyan-500/30",    glow: "hover:shadow-cyan-500/30",    bar: "bg-cyan-500",    bg: "hover:bg-cyan-500/5" };
  return           { label: "Not Started",  color: "text-white/30",  border: "border-white/10",       glow: "hover:shadow-white/10",       bar: "bg-slate-600",   bg: "hover:bg-white/5" };
}

export function DistrictCard({ district, index, isRecommended, onClick }: Props) {
  const pct = Math.min(100, Math.max(0, district.completionPercentage ?? 0));
  const m = statusMeta(pct);
  const mastered = pct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !district.isLocked && onClick(district)}
      className={`relative group flex flex-col gap-3 p-5 rounded-2xl border bg-[#0d1117] cursor-pointer transition-all duration-300 shadow-lg
        ${m.border} ${m.glow} ${m.bg} hover:shadow-xl
        ${district.isLocked ? "opacity-60 cursor-not-allowed" : ""}
        ${isRecommended ? "ring-1 ring-amber-400/50" : ""}`}
    >
      {/* Recommended badge */}
      {isRecommended && !mastered && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-bold font-mono uppercase tracking-widest shadow-lg shadow-amber-500/40">
          ★ Recommended
        </div>
      )}

      {/* Mastered overlay badge */}
      {mastered && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
      )}

      {/* Lock icon */}
      {district.isLocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-white/30" />
        </div>
      )}

      {/* Pulse dot for in-progress */}
      {pct > 0 && pct < 100 && !district.isLocked && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="flex items-center gap-2 min-w-0">
          {mastered ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : pct > 0 ? (
            <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
          ) : (
            <Circle className="w-4 h-4 text-white/20 shrink-0" />
          )}
          <h3 className="font-bold text-sm text-white/90 truncate font-mono">{district.name}</h3>
        </div>
      </div>

      {/* Description */}
      {district.description && (
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2 font-sans">
          {district.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5 mt-auto">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${m.color}`}>
            {m.label}
          </span>
          <span className="text-[10px] font-mono text-white/40">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: "easeOut" }}
            className={`h-full rounded-full ${m.bar} ${mastered ? "shadow-[0_0_8px_rgba(52,211,153,0.6)]" : ""}`}
          />
        </div>
      </div>

      {/* Enter arrow */}
      {!district.isLocked && (
        <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
      )}
    </motion.div>
  );
}
