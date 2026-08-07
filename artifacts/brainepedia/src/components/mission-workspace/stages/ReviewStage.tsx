import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MissionWorkspaceDto, ReadinessDto } from "@/lib/missionExecutionTypes";
import type { ProblemNodeDetail } from "@/lib/problemNodeTypes";

type Props = {
  workspace: MissionWorkspaceDto;
  problemNode?: ProblemNodeDetail | null;
  readiness: ReadinessDto | null;
  readinessLoading?: boolean;
  approach: string;
  codeSnippet: string;
  onReviewWithBrainiac: () => void;
  reviewingDraft?: boolean;
  mentorFeedback?: string | null;
  onSubmitFinal: () => void;
  onContinueWorking: () => void;
  onGoToRequirement?: (requirement: string) => void;
  submitting?: boolean;
};

export function ReviewStage({
  workspace,
  problemNode,
  readiness,
  readinessLoading,
  approach,
  codeSnippet,
  onReviewWithBrainiac,
  reviewingDraft,
  mentorFeedback,
  onSubmitFinal,
  onContinueWorking,
  onGoToRequirement,
  submitting,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const isReady = readiness?.isReady ?? workspace.isReadyForFinalSubmission;

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto w-full space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Client Review</h2>
        <p className="text-sm text-white/50 mt-1">
          Review your deliverable against the mission before sending to your team lead.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-4 space-y-2">
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Mission Objective</p>
          <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap line-clamp-6">
            {problemNode?.context || workspace.missionBrief || "See mission brief"}
          </p>
          {problemNode && problemNode.expectedOutcomes.length > 0 && (
            <ul className="mt-2 space-y-1">
              {problemNode.expectedOutcomes.slice(0, 4).map((o, i) => (
                <li key={i} className="text-[10px] text-white/40">• {o}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-[#00D2FF]/20 bg-[#00D2FF]/5 p-4 space-y-2">
          <p className="text-[10px] font-mono text-[#00D2FF]/70 uppercase tracking-widest">Your Solution</p>
          <p className="text-xs text-white/55 leading-relaxed line-clamp-3">
            {codeSnippet.trim() || approach.trim() || "No deliverable content yet."}
          </p>
          {approach.trim() && (
            <p className="text-[10px] font-mono text-white/30">+ approach notes included</p>
          )}
          {workspace.evidence.length > 0 && (
            <p className="text-[10px] font-mono text-emerald-400/70">
              ✓ {workspace.evidence.length} evidence item(s) attached
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#9D4EDD]/25 bg-[#9D4EDD]/5 p-4 space-y-3">
        <Button
          variant="outline"
          onClick={onReviewWithBrainiac}
          disabled={reviewingDraft}
          className="font-mono text-xs border-[#9D4EDD]/30 text-[#9D4EDD]/80 gap-2"
        >
          {reviewingDraft ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Brain className="w-3.5 h-3.5" />
          )}
          Review my solution
        </Button>
        {mentorFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap border-t border-[#9D4EDD]/15 pt-3"
          >
            {mentorFeedback}
          </motion.div>
        )}
      </div>

      {/* Readiness — only shown in review/submit phase */}
      <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-5 space-y-4">
        {readinessLoading ? (
          <p className="text-xs font-mono text-white/35">Checking readiness…</p>
        ) : isReady ? (
          <>
            <p className="text-sm font-bold text-white">Ready to submit?</p>
            <ul className="space-y-2" role="list">
              {[
                { ok: readiness?.briefReviewed, label: "Brief reviewed" },
                { ok: readiness?.requiredCheckpointsCompleted, label: "Required steps complete" },
                { ok: readiness?.hasExplanation, label: "Explanation provided" },
                { ok: readiness?.hasRequiredEvidence, label: "Evidence attached" },
              ].map(({ ok, label }) => (
                <li key={label} className="flex items-center gap-2 text-xs font-mono">
                  {ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-white/25" />
                  )}
                  <span className={ok ? "text-white/65" : "text-white/35"}>{label}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={onSubmitFinal}
              disabled={submitting}
              className="w-full font-mono text-sm bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Final Solution →
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-amber-300/90">
              {readiness?.missingRequirements?.length
                ? `${readiness.missingRequirements.length} thing${readiness.missingRequirements.length > 1 ? "s" : ""} remaining`
                : "Not ready yet"}
            </p>
            {readiness && readiness.missingRequirements.length > 0 && (
              <ul className="space-y-1">
                {readiness.missingRequirements.map((req) => (
                  <li key={req}>
                    {onGoToRequirement ? (
                      <button
                        type="button"
                        onClick={() => onGoToRequirement(req)}
                        className="text-xs text-amber-200/80 font-mono hover:text-[#00D2FF] text-left underline-offset-2 hover:underline"
                      >
                        • {req}
                      </button>
                    ) : (
                      <span className="text-xs text-amber-200/70 font-mono">• {req}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onContinueWorking}
                className="flex-1 font-mono text-sm border-[#00D2FF]/30 text-[#00D2FF]/80 hover:bg-[#00D2FF]/10"
              >
                Continue Working →
              </Button>
              {onGoToRequirement && (
                <Button
                  variant="ghost"
                  onClick={onContinueWorking}
                  className="font-mono text-xs text-white/50 hover:text-white"
                >
                  Open Build workspace
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {!isReady && readiness && (
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="text-[10px] font-mono text-white/30 hover:text-white/50"
        >
          {showDetails ? "Hide" : "View"} detailed requirements
        </button>
      )}
    </motion.div>
  );
}
