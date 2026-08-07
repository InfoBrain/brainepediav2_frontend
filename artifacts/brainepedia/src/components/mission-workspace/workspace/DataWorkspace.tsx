import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import type { MissionEvidenceDto } from "@/lib/missionExecutionTypes";

type Props = {
  analysis: string;
  findings: string;
  conclusions: string;
  onAnalysisChange: (v: string) => void;
  onFindingsChange: (v: string) => void;
  onConclusionsChange: (v: string) => void;
  onBlurSave?: () => void;
  onOpenEvidence: () => void;
  evidence: MissionEvidenceDto[];
  focusSection?: "deliverable" | "approach" | "evidence";
};

export function DataWorkspace({
  analysis,
  findings,
  conclusions,
  onAnalysisChange,
  onFindingsChange,
  onConclusionsChange,
  onBlurSave,
  onOpenEvidence,
  evidence,
  focusSection,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2" id="workspace-deliverable">
        <Label className="text-xs font-mono text-[#00D2FF]/80">Analysis & Method</Label>
        <Textarea
          value={analysis}
          onChange={(e) => onAnalysisChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Describe your data sources, queries, methodology, or analytical approach…"
          className={`min-h-[120px] text-sm font-mono bg-black/30 border-white/10 resize-y ${
            focusSection === "deliverable" ? "border-[#00D2FF]/40 ring-1 ring-[#00D2FF]/20" : ""
          }`}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-mono text-white/45">Key Findings</Label>
        <Textarea
          value={findings}
          onChange={(e) => onFindingsChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="What did the data reveal? Include metrics, patterns, or insights…"
          className="min-h-[120px] text-sm bg-black/25 border-white/10 resize-y"
        />
      </div>
      <div className="space-y-2" id="workspace-approach">
        <Label className="text-xs font-mono text-white/45">Conclusions & Recommendations</Label>
        <Textarea
          value={conclusions}
          onChange={(e) => onConclusionsChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="What do these findings mean for the client? What should they do next?"
          className={`min-h-[100px] text-sm bg-black/25 border-white/10 resize-y ${
            focusSection === "approach" ? "border-[#00D2FF]/40 ring-1 ring-[#00D2FF]/20" : ""
          }`}
        />
      </div>
      <div
        id="workspace-evidence"
        className={`rounded-xl border p-4 bg-[#0a0f16] ${
          focusSection === "evidence" ? "border-[#FFD700]/40" : "border-white/10"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-[#FFD700] uppercase">Supporting Data</p>
          <Button size="sm" variant="ghost" onClick={onOpenEvidence} className="text-xs h-7 gap-1">
            <Paperclip className="w-3 h-3" /> Add spreadsheet / chart
          </Button>
        </div>
        {evidence.length > 0 && (
          <ul className="mt-2 space-y-1">
            {evidence.map((ev, i) => (
              <li key={ev.evidenceId ?? i} className="text-xs font-mono text-emerald-400/80">
                ✓ {ev.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
