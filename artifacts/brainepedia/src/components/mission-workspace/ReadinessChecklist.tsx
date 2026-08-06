import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import type { ReadinessDto } from "@/lib/missionExecutionTypes";

type Props = {
  readiness: ReadinessDto | null;
  loading?: boolean;
};

const ITEMS: Array<{ key: keyof ReadinessDto; label: string }> = [
  { key: "briefReviewed", label: "Brief reviewed" },
  { key: "requiredCheckpointsCompleted", label: "Required checkpoints done" },
  { key: "hasExplanation", label: "Approach explanation provided" },
  { key: "hasRequiredEvidence", label: "Required evidence attached" },
];

export function ReadinessChecklist({ readiness, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-4 text-xs font-mono text-white/35">
        Checking readiness…
      </div>
    );
  }

  if (!readiness) return null;

  return (
    <section
      className="rounded-xl border border-white/10 bg-[#0a0f16] p-4 space-y-3"
      aria-label="Submission readiness"
    >
      <p className="text-[10px] font-mono text-white/50 tracking-widest uppercase flex items-center gap-1">
        <ClipboardCheck className="w-3 h-3" /> Readiness
      </p>

      <ul className="space-y-2" role="list">
        {ITEMS.map(({ key, label }) => {
          const ok = Boolean(readiness[key]);
          return (
            <li key={key} className="flex items-center gap-2 text-xs font-mono">
              {ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400/70 shrink-0" aria-hidden />
              )}
              <span className={ok ? "text-white/65" : "text-white/40"}>{label}</span>
            </li>
          );
        })}
      </ul>

      {!readiness.isReady && readiness.missingRequirements.length > 0 && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
          <p className="text-[10px] font-mono text-amber-300/80 mb-1">Still needed:</p>
          <ul className="space-y-1">
            {readiness.missingRequirements.map((req) => (
              <li key={req} className="text-[11px] text-amber-200/70">• {req}</li>
            ))}
          </ul>
        </div>
      )}

      {readiness.isReady && (
        <p className="text-[11px] font-mono text-emerald-400/80">Ready for final submission.</p>
      )}
    </section>
  );
}
