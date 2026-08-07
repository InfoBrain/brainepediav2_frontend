import { motion } from "framer-motion";
import { Paperclip, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceRenderer } from "@/components/mission-workspace/workspace/WorkspaceRenderer";
import { DraftSaveIndicator } from "@/components/mission-workspace/DraftSaveIndicator";
import { MissionContext } from "@/components/mission-workspace/MissionContext";
import { WorkspaceType } from "@/lib/workspaceType";
import type { MissionEvidenceDto } from "@/lib/missionExecutionTypes";
import type { ProblemNodeDetail } from "@/lib/problemNodeTypes";

type Props = {
  problemNode: ProblemNodeDetail | null;
  missionBrief: string;
  workspaceType: WorkspaceType;
  approachExplanation: string;
  codeSnippet: string;
  onApproachChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onSaveDraft: () => void;
  onOpenEvidence: () => void;
  saving?: boolean;
  lastSavedAt?: string | null;
  evidence: MissionEvidenceDto[];
  codeLanguage: string;
  onLanguageChange: (v: string) => void;
  structuredSections: Record<string, string>;
  onStructuredSectionChange: (key: string, value: string) => void;
  focusSection?: "deliverable" | "approach" | "evidence";
};

export function BuildStage({
  problemNode,
  missionBrief,
  workspaceType,
  approachExplanation,
  codeSnippet,
  onApproachChange,
  onCodeChange,
  onSaveDraft,
  onOpenEvidence,
  saving,
  lastSavedAt,
  evidence,
  codeLanguage,
  onLanguageChange,
  structuredSections,
  onStructuredSectionChange,
  focusSection,
}: Props) {
  return (
    <motion.div
      key="build"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Build Your Solution</h2>
          <p className="text-sm text-white/50 mt-1">
            This is your professional workspace. Produce real work your team lead can review.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <DraftSaveIndicator saving={saving} lastSavedAt={lastSavedAt} />
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

      {problemNode && (
        <MissionContext node={problemNode} missionBrief={missionBrief} compact />
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0a0f16] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Work Area</p>
        </div>
        <div className="p-4">
          <WorkspaceRenderer
            workspaceType={workspaceType}
            approach={approachExplanation}
            codeSnippet={codeSnippet}
            onApproachChange={onApproachChange}
            onCodeChange={onCodeChange}
            onBlurSave={onSaveDraft}
            onOpenEvidence={onOpenEvidence}
            evidence={evidence}
            codeLanguage={codeLanguage}
            onLanguageChange={onLanguageChange}
            focusSection={focusSection}
            structuredSections={structuredSections}
            onStructuredSectionChange={onStructuredSectionChange}
          />
        </div>
      </div>

      <div
        id="workspace-evidence"
        className={`rounded-xl border bg-[#0a0f16] p-4 ${
          focusSection === "evidence" ? "border-[#FFD700]/40 ring-1 ring-[#FFD700]/20" : "border-white/10"
        }`}
      >
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
        <p className="text-[11px] text-white/40 mb-2">
          How would you prove this work was completed in a real organisation?
        </p>
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
