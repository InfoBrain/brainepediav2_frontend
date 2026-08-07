import { WorkspaceType } from "@/lib/workspaceType";
import { DeveloperWorkspace } from "./DeveloperWorkspace";
import { WritingWorkspace } from "./WritingWorkspace";
import { DesignWorkspace } from "./DesignWorkspace";
import { DataWorkspace } from "./DataWorkspace";
import { StructuredWorkspace } from "./StructuredWorkspace";
import type { MissionEvidenceDto } from "@/lib/missionExecutionTypes";

export type WorkspaceRendererProps = {
  workspaceType: WorkspaceType;
  approach: string;
  codeSnippet: string;
  onApproachChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onBlurSave?: () => void;
  onOpenEvidence?: () => void;
  evidence?: MissionEvidenceDto[];
  codeLanguage: string;
  onLanguageChange: (v: string) => void;
  focusSection?: "deliverable" | "approach" | "evidence";
  /** Structured section values keyed by section id */
  structuredSections?: Record<string, string>;
  onStructuredSectionChange?: (key: string, value: string) => void;
};

function businessSections(sections: Record<string, string> | undefined) {
  return [
    {
      key: "situation",
      label: "Situation Analysis",
      placeholder: "What is the client situation and what problem are you solving?",
      value: sections?.situation ?? "",
    },
    {
      key: "solution",
      label: "Proposed Solution",
      placeholder: "What is your recommended approach or solution?",
      value: sections?.solution ?? "",
    },
    {
      key: "plan",
      label: "Action Plan / Deliverable",
      placeholder: "Outline the steps, timeline, or deliverable you would present to the client…",
      value: sections?.plan ?? "",
    },
  ];
}

function marketingSections(sections: Record<string, string> | undefined) {
  return [
    {
      key: "strategy",
      label: "Campaign Strategy",
      placeholder: "What is your overall campaign or go-to-market strategy?",
      value: sections?.strategy ?? "",
    },
    {
      key: "audience",
      label: "Target Audience & Messaging",
      placeholder: "Who are you targeting and what is the core message?",
      value: sections?.audience ?? "",
    },
    {
      key: "content",
      label: "Content Plan & KPIs",
      placeholder: "What content/channels will you use and how will you measure success?",
      value: sections?.content ?? "",
    },
  ];
}

function educationSections(sections: Record<string, string> | undefined) {
  return [
    {
      key: "objectives",
      label: "Learning Objectives",
      placeholder: "What should learners be able to do after this?",
      value: sections?.objectives ?? "",
    },
    {
      key: "lesson",
      label: "Lesson / Learning Material",
      placeholder: "Outline your lesson plan or learning material…",
      value: sections?.lesson ?? "",
    },
    {
      key: "assessment",
      label: "Teaching Approach & Assessment",
      placeholder: "How will you teach and assess understanding?",
      value: sections?.assessment ?? "",
    },
  ];
}

function projectSections(sections: Record<string, string> | undefined) {
  return [
    {
      key: "requirements",
      label: "Requirements",
      placeholder: "What must be delivered and to whom?",
      value: sections?.requirements ?? "",
    },
    {
      key: "risks",
      label: "Risk Analysis",
      placeholder: "What risks could affect delivery and how will you mitigate them?",
      value: sections?.risks ?? "",
    },
    {
      key: "timeline",
      label: "Work Breakdown & Timeline",
      placeholder: "Break down the work and outline your delivery plan…",
      value: sections?.timeline ?? "",
    },
  ];
}

export function WorkspaceRenderer({
  workspaceType,
  approach,
  codeSnippet,
  onApproachChange,
  onCodeChange,
  onBlurSave,
  onOpenEvidence,
  evidence = [],
  codeLanguage,
  onLanguageChange,
  focusSection,
  structuredSections,
  onStructuredSectionChange,
}: WorkspaceRendererProps) {
  switch (workspaceType) {
    case WorkspaceType.Developer:
      return (
        <DeveloperWorkspace
          code={codeSnippet}
          approach={approach}
          language={codeLanguage}
          onCodeChange={onCodeChange}
          onApproachChange={onApproachChange}
          onLanguageChange={onLanguageChange}
          onBlurSave={onBlurSave}
          focusSection={focusSection === "evidence" ? undefined : focusSection}
        />
      );

    case WorkspaceType.Design:
      return (
        <DesignWorkspace
          designDescription={codeSnippet}
          designDecisions={approach}
          onDescriptionChange={onCodeChange}
          onDecisionsChange={onApproachChange}
          onOpenEvidence={onOpenEvidence ?? (() => {})}
          evidence={evidence}
          onBlurSave={onBlurSave}
          focusSection={focusSection}
        />
      );

    case WorkspaceType.Data:
      return (
        <DataWorkspace
          analysis={structuredSections?.analysis ?? codeSnippet}
          findings={structuredSections?.findings ?? ""}
          conclusions={approach}
          onAnalysisChange={(v) => {
            onCodeChange(v);
            onStructuredSectionChange?.("analysis", v);
          }}
          onFindingsChange={(v) => onStructuredSectionChange?.("findings", v)}
          onConclusionsChange={onApproachChange}
          onBlurSave={onBlurSave}
          onOpenEvidence={onOpenEvidence ?? (() => {})}
          evidence={evidence}
          focusSection={focusSection}
        />
      );

    case WorkspaceType.Marketing:
      return (
        <StructuredWorkspace
          sections={marketingSections(structuredSections)}
          onSectionChange={(k, v) => onStructuredSectionChange?.(k, v)}
          onBlurSave={onBlurSave}
          focusSection={focusSection === "evidence" ? undefined : focusSection}
        />
      );

    case WorkspaceType.Education:
      return (
        <StructuredWorkspace
          sections={educationSections(structuredSections)}
          onSectionChange={(k, v) => onStructuredSectionChange?.(k, v)}
          onBlurSave={onBlurSave}
          focusSection={focusSection === "evidence" ? undefined : focusSection}
        />
      );

    case WorkspaceType.ProjectManagement:
      return (
        <StructuredWorkspace
          sections={projectSections(structuredSections)}
          onSectionChange={(k, v) => onStructuredSectionChange?.(k, v)}
          onBlurSave={onBlurSave}
          focusSection={focusSection === "evidence" ? undefined : focusSection}
        />
      );

    case WorkspaceType.Business:
      return (
        <StructuredWorkspace
          sections={businessSections(structuredSections)}
          onSectionChange={(k, v) => onStructuredSectionChange?.(k, v)}
          onBlurSave={onBlurSave}
          focusSection={focusSection === "evidence" ? undefined : focusSection}
        />
      );

    case WorkspaceType.Writing:
      return (
        <WritingWorkspace
          deliverable={codeSnippet}
          approach={approach}
          onDeliverableChange={onCodeChange}
          onApproachChange={onApproachChange}
          onBlurSave={onBlurSave}
          deliverableLabel="Document / Report"
          focusSection={focusSection === "evidence" ? undefined : focusSection}
        />
      );

    case WorkspaceType.Generic:
    default:
      return (
        <WritingWorkspace
          deliverable={codeSnippet}
          approach={approach}
          onDeliverableChange={onCodeChange}
          onApproachChange={onApproachChange}
          onBlurSave={onBlurSave}
          deliverableLabel="Your Deliverable"
          approachLabel="Why did you make these decisions?"
          focusSection={focusSection === "evidence" ? undefined : focusSection}
          useRichText={false}
        />
      );
  }
}
