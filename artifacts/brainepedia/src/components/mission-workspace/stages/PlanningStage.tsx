/*
 * LEGACY IMPLEMENTATION:
 * The previous checkpoint flow allowed users to mark a checkpoint complete with
 * optional notes and no validated work. Retained for backward compatibility /
 * reference but no longer used by MissionWorkspacePage — see CheckpointWorkStage.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MissionCheckpointDto } from "@/lib/missionExecutionTypes";
import { getCheckpointProgress } from "@/lib/missionStage";

type Props = {
  checkpoints: MissionCheckpointDto[];
  completingId?: string | null;
  onComplete: (checkpointProgressId: string, notes?: string) => void;
};

export function PlanningStage({ checkpoints, completingId, onComplete }: Props) {
  const [notes, setNotes] = useState("");
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);
  const currentIdx = sorted.findIndex((c) => !c.isCompleted);
  const current = currentIdx >= 0 ? sorted[currentIdx] : null;
  const progress = getCheckpointProgress(checkpoints);

  return (
    <motion.div
      key="planning"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto w-full space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Plan Your Approach</h2>
        <p className="text-sm text-white/50 mt-1">
          Before you build, think like a professional solving a real client problem.
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono text-white/40">
        <span>Step {Math.min(progress.completed + 1, progress.total)} of {progress.total}</span>
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <span>{progress.pct}%</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((cp, i) => {
            const isCurrent = i === currentIdx;
            const isLocked = i > currentIdx;
            const isCompleting = completingId === cp.checkpointProgressId;

            if (cp.isCompleted) {
              return (
                <motion.div
                  key={cp.checkpointProgressId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-mono text-emerald-400/80 truncate">{cp.name}</span>
                </motion.div>
              );
            }

            if (isLocked) {
              return (
                <motion.div
                  key={cp.checkpointProgressId}
                  layout
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.01] opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <span className="text-xs font-mono text-white/25 truncate">{cp.name}</span>
                </motion.div>
              );
            }

            if (isCurrent) {
              return (
                <motion.div
                  key={cp.checkpointProgressId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-[#00D2FF]/30 bg-[#00D2FF]/5 p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#00D2FF] uppercase tracking-widest">Current</span>
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
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes on completion…"
                    className="min-h-[60px] text-xs bg-black/30 border-white/10"
                    aria-label={`Notes for ${cp.name}`}
                  />
                  <Button
                    onClick={() => {
                      onComplete(cp.checkpointProgressId, notes.trim() || undefined);
                      setNotes("");
                    }}
                    disabled={isCompleting}
                    className="font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                  >
                    {isCompleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    )}
                    Complete Step
                  </Button>
                </motion.div>
              );
            }

            return null;
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
