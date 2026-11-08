import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Section = { key: string; label: string; placeholder: string; value: string };

type Props = {
  sections: Section[];
  onSectionChange: (key: string, value: string) => void;
  onBlurSave?: () => void;
  focusSection?: "deliverable" | "approach";
};

export function StructuredWorkspace({ sections, onSectionChange, onBlurSave, focusSection }: Props) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div
          key={section.key}
          className="space-y-2"
          id={i === 0 ? "workspace-deliverable" : i === sections.length - 1 ? "workspace-approach" : undefined}
        >
          <Label className="text-xs font-mono text-[#7d4ccc]/80">{section.label}</Label>
          <Textarea
            value={section.value}
            onChange={(e) => onSectionChange(section.key, e.target.value)}
            onBlur={onBlurSave}
            placeholder={section.placeholder}
            className={`min-h-[100px] text-sm bg-white border-[#e6e8ef] resize-y ${ (focusSection === "deliverable" && i === 0) || (focusSection === "approach" && i === sections.length - 1) ? "border-[#7d4ccc]/40 ring-1 ring-[#7d4ccc]/20" : "" }`}
          />
        </div>
      ))}
    </div>
  );
}
