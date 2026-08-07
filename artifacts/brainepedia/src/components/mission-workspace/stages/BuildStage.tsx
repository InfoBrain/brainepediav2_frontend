import { motion } from "framer-motion";
import { Paperclip, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getDeliverableLabels } from "@/lib/missionStage";
import type { MissionEvidenceDto } from "@/lib/missionExecutionTypes";

type Props = {
  approachExplanation: string;
  codeSnippet: string;
  onApproachChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onSaveDraft: () => void;
  onOpenEvidence: () => void;
  saving?: boolean;
  lastSavedAt?: string | null;
  evidence: MissionEvidenceDto[];
  professionHint?: string;
};

function formatSavedAt(ts?: string | null) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function BuildStage({
  approachExplanation,
  codeSnippet,
  onApproachChange,
  onCodeChange,
  onSaveDraft,
  onOpenEvidence,
  saving,
  lastSavedAt,
  evidence,
  professionHint,
}: Props) {
  const labels = getDeliverableLabels(professionHint);
  const savedLabel = formatSavedAt(lastSavedAt);

  return (
    <motion.div
      key="build"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto space-y-5"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Build Your Solution</h2>
        <p className="text-sm text-white/50 mt-1">
          Now do the work. Your deliverable should demonstrate how you would handle this situation in the real world.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0f16] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
          <p className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Work Area</p>
          <div className="flex items-center gap-2">
            {savedLabel && (
              <span className="text-[10px] font-mono text-white/30 hidden sm:inline">Saved {savedLabel}</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onSaveDraft}
              disabled={saving}
              className="text-xs font-mono border-white/15 text-white/60 hover:text-white gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Draft
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="deliverable-editor" className="text-xs font-mono text-[#00D2FF]/80">
              {labels.deliverable}
            </Label>
            <Textarea
              id="deliverable-editor"
              value={codeSnippet}
              onChange={(e) => onCodeChange(e.target.value)}
              onBlur={onSaveDraft}
              placeholder="Paste your work here — code, documentation, design notes, lesson plan, or analysis…"
              className="min-h-[220px] text-sm font-mono bg-black/35 border-white/10 resize-y"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approach-explanation" className="text-xs font-mono text-white/45">
              {labels.explanation}
            </Label>
            <Textarea
              id="approach-explanation"
              value={approachExplanation}
              onChange={(e) => onApproachChange(e.target.value)}
              onBlur={onSaveDraft}
              placeholder="Document your reasoning for your team lead…"
              className="min-h-[100px] text-sm bg-black/25 border-white/10 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Evidence section — compact */}
      <div className="rounded-xl border border-white/10 bg-[#0a0f16] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono text-[#FFD700] tracking-widest uppercase flex items-center gap-1">
            <Paperclip className="w-3 h-3" /> Evidence
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenEvidence}
            className="text-xs font-mono text-white/50 h-7 gap-1"
          >
            <Plus className="w-3 h-3" /> Add Evidence
          </Button>
        </div>

        {evidence.length > 0 ? (
          <ul className="space-y-2" role="list">
            {evidence.map((ev, i) => (
              <li
                key={ev.evidenceId ?? `${ev.url}-${i}`}
                className="flex items-center gap-2 text-xs font-mono text-emerald-400/80"
              >
                <span>✓</span>
                <span className="truncate">{ev.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] font-mono text-white/30">No evidence attached yet.</p>
        )}
      </div>
    </motion.div>
  );
}
