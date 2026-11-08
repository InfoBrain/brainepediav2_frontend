import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PHASE_LABELS } from "@/lib/missionExecutionTypes";

type Props = {
  missionTitle: string;
  missionBrief: string;
  currentPhase: number;
  progressPercentage: number;
  briefReviewed: boolean;
  employerChallenge?: boolean;
  onConfirmBrief: () => void;
  confirming?: boolean;
};

export function MissionBriefPanel({
  missionTitle,
  missionBrief,
  currentPhase,
  progressPercentage,
  briefReviewed,
  employerChallenge,
  onConfirmBrief,
  confirming,
}: Props) {
  const phaseLabel = PHASE_LABELS[currentPhase] ?? "In Progress";

  return (
    <section
      className="rounded-xl border border-[#e6e8ef] bg-white p-4 space-y-3"
      aria-labelledby="mission-brief-heading"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono text-[#7d4ccc] tracking-widest uppercase mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Mission Brief
          </p>
          <h2 id="mission-brief-heading" className="text-sm font-bold text-[#182137] leading-snug">
            {missionTitle}
          </h2>
        </div>
        {employerChallenge && (
          <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[#9a3412]">
            Employer Challenge
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-[#6b768c]">
          <span>{phaseLabel}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#f4f6fb] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7d4ccc] to-[#9b74dc] transition-all duration-500"
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-[#52617a] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
        {missionBrief || "Review the mission brief before starting your work."}
      </div>

      {!briefReviewed ? (
        <Button
          size="sm"
          onClick={onConfirmBrief}
          disabled={confirming}
          className="w-full bg-[#f5f0fc]/20 text-[#7d4ccc] border border-[#7d4ccc]/30 hover:bg-[#f5f0fc]/30 font-mono text-xs"
        >
          {confirming ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
          )}
          I've read the brief
        </Button>
      ) : (
        <p className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Brief confirmed — checkpoints unlocked
        </p>
      )}
    </section>
  );
}
