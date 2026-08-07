import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { MissionCheckpointDto, MissionEvidenceDto } from "@/lib/missionExecutionTypes";
import { getCheckpointProgress } from "@/lib/missionStage";
import {
  resolveCheckpointAction,
  validateCheckpoint,
  checkpointNeedsWorkspace,
  type MissionWorkInput,
} from "@/lib/checkpointRequirements";
import { WorkspaceRenderer } from "@/components/mission-workspace/workspace/WorkspaceRenderer";
import { WorkspaceType } from "@/lib/workspaceType";
import type { ProblemNodeDetail } from "@/lib/problemNodeTypes";

type Props = {
  checkpoints: MissionCheckpointDto[];
  completingId?: string | null;
  onComplete: (checkpointProgressId: string, notes?: string) => void;
  work: MissionWorkInput;
  workspaceType: WorkspaceType;
  problemNode?: ProblemNodeDetail | null;
  approach: string;
  codeSnippet: string;
  onApproachChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onUnderstandingChange: (v: string) => void;
  onConstraintReflectionChange: (v: string) => void;
  onPlanContentChange: (v: string) => void;
  onReviewConfirmedChange: (v: boolean) => void;
  onOpenEvidence: () => void;
  onBlurSave?: () => void;
  codeLanguage: string;
  onLanguageChange: (v: string) => void;
  structuredSections: Record<string, string>;
  onStructuredSectionChange: (key: string, value: string) => void;
  evidence: MissionEvidenceDto[];
  focusCheckpointId?: string | null;
  focusSection?: "deliverable" | "approach" | "evidence";
};

/*
 * NEW IMPLEMENTATION:
 * Checkpoints require validated work before completion — no free XP clicks.
 * LEGACY: PlanningStage.tsx allowed one-click completion with optional notes.
 */
export function CheckpointWorkStage({
  checkpoints,
  completingId,
  onComplete,
  work,
  workspaceType,
  problemNode,
  approach,
  codeSnippet,
  onApproachChange,
  onCodeChange,
  onUnderstandingChange,
  onConstraintReflectionChange,
  onPlanContentChange,
  onReviewConfirmedChange,
  onOpenEvidence,
  onBlurSave,
  codeLanguage,
  onLanguageChange,
  structuredSections,
  onStructuredSectionChange,
  evidence,
  focusCheckpointId,
  focusSection,
}: Props) {
  const sorted = useMemo(() => [...checkpoints].sort((a, b) => a.order - b.order), [checkpoints]);
  const currentIdx = sorted.findIndex((c) => !c.isCompleted);
  const current = currentIdx >= 0 ? sorted[currentIdx] : null;
  const progress = getCheckpointProgress(checkpoints);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusCheckpointId && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusCheckpointId, current?.checkpointProgressId]);

  return (
    <motion.div
      key="checkpoint-work"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto space-y-5"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Do the Work</h2>
        <p className="text-sm text-white/50 mt-1">
          Complete each step with real output — your team lead expects professional work, not checkbox clicks.
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono text-white/40">
        <span>
          Step {Math.min(progress.completed + 1, progress.total)} of {progress.total}
        </span>
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <span>{progress.pct}%</span>
      </div>

      {/* Compact completed steps */}
      <div className="flex flex-wrap gap-2">
        {sorted.map((cp, i) => {
          if (!cp.isCompleted) return null;
          return (
            <span
              key={cp.checkpointProgressId}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[10px] font-mono text-emerald-400/80"
            >
              <CheckCircle2 className="w-3 h-3" /> {cp.name}
            </span>
          );
        })}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((cp, i) => {
            const isCurrent = i === currentIdx;
            const isLocked = i > currentIdx;
            const isCompleting = completingId === cp.checkpointProgressId;
            const action = resolveCheckpointAction(cp);
            const validation = validateCheckpoint(cp, work);
            const showWorkspace = isCurrent && checkpointNeedsWorkspace(action);

            if (cp.isCompleted || isLocked) {
              if (isLocked) {
                return (
                  <motion.div
                    key={cp.checkpointProgressId}
                    layout
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 opacity-40"
                  >
                    <Lock className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-xs font-mono text-white/25">{cp.name}</span>
                  </motion.div>
                );
              }
              return null;
            }

            if (!isCurrent) return null;

            return (
              <motion.div
                key={cp.checkpointProgressId}
                ref={cardRef}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border-2 p-5 space-y-4 ${
                  focusCheckpointId === cp.checkpointProgressId
                    ? "border-[#00D2FF]/50 bg-[#00D2FF]/8"
                    : "border-[#00D2FF]/30 bg-[#00D2FF]/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#00D2FF] uppercase tracking-widest">
                    Current — Step {i + 1} of {sorted.length}
                  </span>
                  <span className="text-[9px] font-mono text-[#FFD700]/70 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> +{cp.xpReward} XP
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Circle className="w-4 h-4 text-[#00D2FF]" />
                  {cp.name}
                </h3>
                {cp.description && (
                  <p className="text-sm text-white/55 leading-relaxed">{cp.description}</p>
                )}

                {/* Action-specific work UI */}
                {action === "confirm_understanding" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-white/50">
                      Summarize what the client needs in your own words
                    </Label>
                    <Textarea
                      value={work.understandingSummary}
                      onChange={(e) => onUnderstandingChange(e.target.value)}
                      placeholder="What is the client situation? What does success look like?"
                      className="min-h-[100px] text-sm bg-black/30 border-white/10"
                    />
                  </div>
                )}

                {action === "identify_constraints" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-white/50">
                      What constraints must your solution respect?
                    </Label>
                    {problemNode?.constraints && problemNode.constraints.length > 0 && (
                      <ul className="text-xs text-white/40 space-y-1 mb-2">
                        {problemNode.constraints.map((c, idx) => (
                          <li key={idx}>• {c}</li>
                        ))}
                      </ul>
                    )}
                    <Textarea
                      value={work.constraintReflection}
                      onChange={(e) => onConstraintReflectionChange(e.target.value)}
                      placeholder="List the key constraints, risks, and boundaries for your approach…"
                      className="min-h-[100px] text-sm bg-black/30 border-white/10"
                    />
                  </div>
                )}

                {action === "create_plan" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-white/50">Your plan of action</Label>
                    <Textarea
                      value={work.planContent}
                      onChange={(e) => onPlanContentChange(e.target.value)}
                      placeholder="Outline how you will solve the client's problem — steps, decisions, and approach…"
                      className="min-h-[140px] text-sm bg-black/30 border-white/10"
                    />
                  </div>
                )}

                {action === "review_work" && (
                  <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-mono text-white/45 uppercase">Review checklist</p>
                    {(problemNode?.expectedOutcomes ?? []).slice(0, 6).map((outcome, idx) => (
                      <label key={idx} className="flex items-start gap-2 text-xs text-white/60">
                        <Checkbox
                          checked={work.reviewConfirmed}
                          onCheckedChange={(c) => onReviewConfirmedChange(c === true)}
                          className="mt-0.5"
                        />
                        <span>{outcome}</span>
                      </label>
                    ))}
                    {(!problemNode?.expectedOutcomes || problemNode.expectedOutcomes.length === 0) && (
                      <label className="flex items-center gap-2 text-xs text-white/60">
                        <Checkbox
                          checked={work.reviewConfirmed}
                          onCheckedChange={(c) => onReviewConfirmedChange(c === true)}
                        />
                        <span>I have reviewed my work against the mission requirements</span>
                      </label>
                    )}
                  </div>
                )}

                {action === "attach_evidence" && (
                  <div className="rounded-lg border border-[#FFD700]/20 bg-[#FFD700]/5 p-4 space-y-2">
                    <p className="text-sm text-white/55">
                      How would you prove this work was completed in a real organisation?
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenEvidence}
                      className="font-mono text-xs border-[#FFD700]/30 text-[#FFD700]/80"
                    >
                      Add Evidence
                    </Button>
                    {evidence.length > 0 && (
                      <ul className="text-xs font-mono text-emerald-400/80 space-y-1">
                        {evidence.map((ev, idx) => (
                          <li key={ev.evidenceId ?? idx}>✓ {ev.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {showWorkspace && (
                  <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-4">
                    <p className="text-[10px] font-mono text-white/40 uppercase mb-3">Your Workspace</p>
                    <WorkspaceRenderer
                      workspaceType={workspaceType}
                      approach={approach}
                      codeSnippet={codeSnippet}
                      onApproachChange={onApproachChange}
                      onCodeChange={onCodeChange}
                      onBlurSave={onBlurSave}
                      onOpenEvidence={onOpenEvidence}
                      evidence={evidence}
                      codeLanguage={codeLanguage}
                      onLanguageChange={onLanguageChange}
                      focusSection={focusSection}
                      structuredSections={structuredSections}
                      onStructuredSectionChange={onStructuredSectionChange}
                    />
                  </div>
                )}

                {(action === "produce_draft" || action === "finalize" || action === "generic_work") &&
                  !showWorkspace && (
                  <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-4">
                    <WorkspaceRenderer
                      workspaceType={workspaceType}
                      approach={approach}
                      codeSnippet={codeSnippet}
                      onApproachChange={onApproachChange}
                      onCodeChange={onCodeChange}
                      onBlurSave={onBlurSave}
                      onOpenEvidence={onOpenEvidence}
                      evidence={evidence}
                      codeLanguage={codeLanguage}
                      onLanguageChange={onLanguageChange}
                      focusSection={focusSection}
                      structuredSections={structuredSections}
                      onStructuredSectionChange={onStructuredSectionChange}
                    />
                  </div>
                )}

                {!validation.canComplete && (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2"
                    role="status"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-mono text-amber-300/90">{validation.reason}</p>
                      <p className="text-[10px] font-mono text-amber-200/50 mt-0.5">{validation.hint}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => onComplete(cp.checkpointProgressId, work.planContent || undefined)}
                  disabled={isCompleting || !validation.canComplete}
                  className="font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  {isCompleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  {validation.canComplete ? "Complete Step" : validation.actionLabel}
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
