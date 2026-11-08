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
  if (pct >= 100) return { label: "Mastered", color: "text-[#168a68]", border: "border-[#b9e8d6]", glow: "hover:shadow-[0_10px_30px_rgba(22,138,104,0.15)]", bar: "bg-[#22a77b]", bg: "hover:bg-[#f1fbf7]" };
  if (pct > 0)    return { label: "In Progress", color: "text-[#276ef1]", border: "border-[#c9d8f8]", glow: "hover:shadow-[0_10px_30px_rgba(39,110,241,0.15)]", bar: "bg-[#4d8dff]", bg: "hover:bg-[#f4f8ff]" };
  return           { label: "Not Started", color: "text-[#7a869d]", border: "border-[#e6e8ef]", glow: "hover:shadow-[0_10px_30px_rgba(24,33,55,0.08)]", bar: "bg-[#b9c1d1]", bg: "hover:bg-[#fafbfe]" };
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
      className={`relative group flex flex-col gap-3 p-5 rounded-2xl border bg-white cursor-pointer transition-all duration-300 shadow-[0_10px_24px_rgba(24,33,55,0.06)] ${m.border} ${m.glow} ${m.bg} hover:shadow-xl ${district.isLocked ? "opacity-60 cursor-not-allowed" : ""}         ${isRecommended ? "ring-2 ring-[#7d4ccc]/40" : ""}`}
    >
      {/* Recommended badge */}
      {isRecommended && !mastered && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7d4ccc] text-white text-[9px] font-bold uppercase tracking-widest">
          ★ Recommended
        </div>
      )}

      {/* Mastered overlay badge */}
      {mastered && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-[#168a68]" />
        </div>
      )}

      {/* Lock icon */}
      {district.isLocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-[#9ba5b7]" />
        </div>
      )}

      {/* Pulse dot for in-progress */}
      {pct > 0 && pct < 100 && !district.isLocked && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4d8dff] opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#276ef1]" />
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="flex items-center gap-2 min-w-0">
          {mastered ? (
            <CheckCircle2 className="w-4 h-4 text-[#168a68] shrink-0" />
          ) : pct > 0 ? (
            <Loader2 className="w-4 h-4 text-[#276ef1] shrink-0 animate-spin" />
          ) : (
            <Circle className="w-4 h-4 text-[#c1c9d8] shrink-0" />
          )}
          <h3 className="font-bold text-sm text-[#182137] truncate" style={{ color: "#182137" }}>{district.name}</h3>
        </div>
      </div>

      {/* Description */}
      {district.description && (
        <p className="text-xs text-[#5e6a7f] leading-relaxed line-clamp-2 font-sans">
          {district.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5 mt-auto">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${m.color}`}>
            {m.label}
          </span>
          <span className="text-[10px] font-mono text-[#8b96ab]">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#edf1f7] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: "easeOut" }}
            className={`h-full rounded-full ${m.bar}`}
          />
        </div>
      </div>

      {/* Enter arrow */}
      {!district.isLocked && (
        <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-[#b2bccf] group-hover:text-[#7d4ccc] transition-colors" />
      )}
    </motion.div>
  );
}
