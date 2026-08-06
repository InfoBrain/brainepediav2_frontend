import { useState } from "react";
import { CheckCircle2, Circle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MissionCheckpointDto } from "@/lib/missionExecutionTypes";

type Props = {
  checkpoints: MissionCheckpointDto[];
  briefReviewed: boolean;
  completingId?: string | null;
  onComplete: (checkpointProgressId: string, notes?: string) => void;
};

export function CheckpointChecklist({ checkpoints, briefReviewed, completingId, onComplete }: Props) {
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const requiredDone = checkpoints.filter((c) => c.isRequired && c.isCompleted).length;
  const requiredTotal = checkpoints.filter((c) => c.isRequired).length;

  return (
    <nav
      className="rounded-xl border border-white/10 bg-[#0a0f16] p-4 space-y-3"
      aria-label="Mission checkpoints"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-[#9D4EDD] tracking-widest uppercase">Checkpoints</p>
        <span className="text-[10px] font-mono text-white/35">
          {requiredDone}/{requiredTotal} required
        </span>
      </div>

      {!briefReviewed && (
        <p className="text-[11px] font-mono text-white/40 border border-white/5 rounded-lg p-2">
          Confirm the brief to unlock checkpoints.
        </p>
      )}

      <ol className="space-y-2" role="list">
        {checkpoints.map((cp) => {
          const isCompleting = completingId === cp.checkpointProgressId;
          const showNotes = notesFor === cp.checkpointProgressId;

          return (
            <li
              key={cp.checkpointProgressId}
              className={`rounded-lg border p-3 transition-colors ${
                cp.isCompleted
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-white/8 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  disabled={!briefReviewed || cp.isCompleted || isCompleting}
                  onClick={() => {
                    if (!cp.isCompleted) setNotesFor(cp.checkpointProgressId);
                  }}
                  className="shrink-0 mt-0.5 disabled:opacity-40"
                  aria-label={
                    cp.isCompleted
                      ? `${cp.name} completed`
                      : `Mark ${cp.name} complete`
                  }
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 text-[#00D2FF] animate-spin" />
                  ) : cp.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/25" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-white/85">{cp.name}</span>
                    {cp.isRequired && (
                      <span className="text-[9px] font-mono text-white/30 uppercase">Required</span>
                    )}
                    <span className="text-[9px] font-mono text-[#FFD700]/70 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> +{cp.xpReward}
                    </span>
                  </div>
                  {cp.description && (
                    <p className="text-[11px] text-white/45 mt-1 leading-relaxed">{cp.description}</p>
                  )}
                </div>
              </div>

              {showNotes && !cp.isCompleted && (
                <div className="mt-3 space-y-2 pl-6">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes on completion…"
                    className="min-h-[60px] text-xs bg-black/30 border-white/10"
                    aria-label={`Notes for ${cp.name}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      disabled={isCompleting}
                      onClick={() => {
                        onComplete(cp.checkpointProgressId, notes.trim() || undefined);
                        setNotes("");
                        setNotesFor(null);
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs font-mono text-white/40"
                      onClick={() => {
                        setNotesFor(null);
                        setNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
