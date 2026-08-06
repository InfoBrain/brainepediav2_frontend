import { Loader2, Send, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { XP_HINTS } from "@/lib/missionExecutionTypes";

type Props = {
  sessionXpEarned: number;
  isReady: boolean;
  submissionStage: number;
  onRequestReview: () => void;
  onSubmitFinal: () => void;
  requestingReview?: boolean;
  submitting?: boolean;
};

export function SubmitBar({
  sessionXpEarned,
  isReady,
  submissionStage,
  onRequestReview,
  onSubmitFinal,
  requestingReview,
  submitting,
}: Props) {
  const reviewDone = submissionStage >= 1;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono text-[#FFD700] tracking-widest uppercase">Session XP</p>
          <p className="text-lg font-bold font-mono text-[#FFD700] flex items-center gap-1">
            <Zap className="w-4 h-4" /> {sessionXpEarned}
          </p>
        </div>
        <div className="text-[9px] font-mono text-white/30 text-right leading-relaxed max-w-[140px]">
          +{XP_HINTS.missionStart} start · +{XP_HINTS.checkpoint} checkpoint · +{XP_HINTS.evidence} evidence · +{XP_HINTS.mentor} mentor · +{XP_HINTS.submission} submit
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {!reviewDone && (
          <Button
            variant="outline"
            disabled={requestingReview || submitting}
            onClick={onRequestReview}
            className="flex-1 text-xs font-mono border-[#9D4EDD]/25 text-[#9D4EDD]/80 hover:bg-[#9D4EDD]/10 gap-1"
          >
            {requestingReview ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Request review (optional)
          </Button>
        )}
        <Button
          disabled={!isReady || submitting}
          onClick={onSubmitFinal}
          className="flex-1 text-xs font-mono bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] text-white border-0 gap-1 disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Submit final deliverable
        </Button>
      </div>
    </div>
  );
}
