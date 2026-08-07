import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

type Props = {
  deliverable: string;
  approach: string;
  onDeliverableChange: (html: string) => void;
  onApproachChange: (v: string) => void;
  onBlurSave?: () => void;
  deliverableLabel?: string;
  approachLabel?: string;
  focusSection?: "deliverable" | "approach";
  useRichText?: boolean;
};

export function WritingWorkspace({
  deliverable,
  approach,
  onDeliverableChange,
  onApproachChange,
  onBlurSave,
  deliverableLabel = "Your Deliverable",
  approachLabel = "Why did you make these decisions?",
  focusSection,
  useRichText = true,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2" id="workspace-deliverable">
        <Label className="text-xs font-mono text-[#00D2FF]/80">{deliverableLabel}</Label>
        {useRichText ? (
          <div
            className={
              focusSection === "deliverable" ? "ring-1 ring-[#00D2FF]/30 rounded-xl" : undefined
            }
            onBlur={onBlurSave}
          >
            <RichTextEditor
              value={deliverable}
              onChange={(html) => onDeliverableChange(html)}
              placeholder="Write your report, proposal, lesson plan, or professional document…"
              minHeightClassName="min-h-[280px]"
            />
          </div>
        ) : (
          <Textarea
            value={deliverable}
            onChange={(e) => onDeliverableChange(e.target.value)}
            onBlur={onBlurSave}
            placeholder="Write your professional deliverable…"
            className="min-h-[280px] text-sm bg-black/25 border-white/10 resize-y"
          />
        )}
      </div>

      <div className="space-y-2" id="workspace-approach">
        <Label className="text-xs font-mono text-white/45">{approachLabel}</Label>
        <Textarea
          value={approach}
          onChange={(e) => onApproachChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Document your reasoning for your team lead…"
          className={`min-h-[100px] text-sm bg-black/25 border-white/10 resize-y ${
            focusSection === "approach" ? "border-[#00D2FF]/40 ring-1 ring-[#00D2FF]/20" : ""
          }`}
        />
      </div>
    </div>
  );
}
