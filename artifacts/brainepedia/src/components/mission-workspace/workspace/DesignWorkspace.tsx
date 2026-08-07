import { Image, Link2, Paperclip } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { MissionEvidenceDto } from "@/lib/missionExecutionTypes";

type Props = {
  designDescription: string;
  designDecisions: string;
  onDescriptionChange: (v: string) => void;
  onDecisionsChange: (v: string) => void;
  onOpenEvidence: () => void;
  evidence: MissionEvidenceDto[];
  onBlurSave?: () => void;
  focusSection?: "deliverable" | "approach" | "evidence";
};

export function DesignWorkspace({
  designDescription,
  designDecisions,
  onDescriptionChange,
  onDecisionsChange,
  onOpenEvidence,
  evidence,
  onBlurSave,
  focusSection,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2" id="workspace-deliverable">
        <Label className="text-xs font-mono text-[#00D2FF]/80 flex items-center gap-1">
          <Image className="w-3.5 h-3.5" /> Design / Creative Output
        </Label>
        <Textarea
          value={designDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Describe your design solution — layout, visual direction, user flow, creative concept…"
          className={`min-h-[180px] text-sm bg-black/25 border-white/10 resize-y ${
            focusSection === "deliverable" ? "border-[#00D2FF]/40 ring-1 ring-[#00D2FF]/20" : ""
          }`}
        />
      </div>

      <div className="space-y-2" id="workspace-approach">
        <Label className="text-xs font-mono text-white/45">Design decisions & rationale</Label>
        <Textarea
          value={designDecisions}
          onChange={(e) => onDecisionsChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Why did you make these design choices? What trade-offs did you consider?"
          className="min-h-[100px] text-sm bg-black/25 border-white/10 resize-y"
        />
      </div>

      <div
        id="workspace-evidence"
        className={`rounded-xl border bg-[#0a0f16] p-4 ${
          focusSection === "evidence" ? "border-[#FFD700]/40 ring-1 ring-[#FFD700]/20" : "border-white/10"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono text-[#FFD700] uppercase tracking-widest flex items-center gap-1">
            <Paperclip className="w-3 h-3" /> Design Evidence
          </p>
          <Button size="sm" variant="ghost" onClick={onOpenEvidence} className="text-xs font-mono h-7 gap-1">
            <Link2 className="w-3 h-3" /> Add Figma / Screenshot / Link
          </Button>
        </div>
        {evidence.length > 0 ? (
          <ul className="space-y-1.5">
            {evidence.map((ev, i) => (
              <li key={ev.evidenceId ?? i} className="text-xs font-mono text-emerald-400/80 truncate">
                ✓ {ev.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] font-mono text-white/30">
            Attach Figma links, screenshots, or exports to prove your design work.
          </p>
        )}
      </div>
    </div>
  );
}
