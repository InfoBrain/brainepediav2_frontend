import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  approachExplanation: string;
  codeSnippet: string;
  onApproachChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onSaveDraft: () => void;
  saving?: boolean;
  lastSavedAt?: string | null;
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

export function WorkArea({
  approachExplanation,
  codeSnippet,
  onApproachChange,
  onCodeChange,
  onSaveDraft,
  saving,
  lastSavedAt,
}: Props) {
  const savedLabel = formatSavedAt(lastSavedAt);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0a0f16] flex flex-col min-h-0" aria-label="Work area">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Your Deliverable</p>
        <div className="flex items-center gap-2">
          {savedLabel && (
            <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
              Saved {savedLabel}
            </span>
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

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          <Label htmlFor="approach-explanation" className="text-xs font-mono text-white/50">
            Approach & explanation
          </Label>
          <Textarea
            id="approach-explanation"
            value={approachExplanation}
            onChange={(e) => onApproachChange(e.target.value)}
            onBlur={onSaveDraft}
            placeholder="Explain your approach, decisions, and how you met the brief…"
            className="min-h-[120px] text-sm bg-black/25 border-white/10 resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliverable-editor" className="text-xs font-mono text-white/50">
            Deliverable (code, doc, design notes, lesson plan…)
          </Label>
          <Textarea
            id="deliverable-editor"
            value={codeSnippet}
            onChange={(e) => onCodeChange(e.target.value)}
            onBlur={onSaveDraft}
            placeholder="Paste code, write documentation, or capture your deliverable here…"
            className="min-h-[200px] text-sm font-mono bg-black/35 border-white/10 resize-y"
            spellCheck={false}
          />
        </div>
      </div>
    </section>
  );
}
