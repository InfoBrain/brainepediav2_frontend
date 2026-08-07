import type { MissionCheckpointDto, MissionEvidenceDto } from "./missionExecutionTypes";

export type CheckpointActionType =
  | "confirm_understanding"
  | "identify_constraints"
  | "create_plan"
  | "produce_draft"
  | "review_work"
  | "attach_evidence"
  | "finalize"
  | "generic_work";

export type MissionWorkInput = {
  approachExplanation: string;
  codeSnippet: string;
  constraintReflection: string;
  planContent: string;
  understandingSummary: string;
  reviewConfirmed: boolean;
  evidence: MissionEvidenceDto[];
  briefReviewed: boolean;
};

export type CheckpointValidation = {
  canComplete: boolean;
  reason: string;
  actionLabel: string;
  hint: string;
};

const FILLER = /^(test|asdf|lorem|xxx+|aaa+|done|ok|n\/a|none|tbd|placeholder|sample|foo|bar)\.?$/i;

export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
}

/** Minimum meaningful content — not crude length-only, but rejects obvious filler */
export function isMeaningfulText(text: string, minChars = 40, minWords = 8): boolean {
  const cleaned = stripHtml(text).trim();
  if (cleaned.length < minChars) return false;
  const words = cleaned.split(/\s+/).filter((w) => w.replace(/[^a-z0-9]/gi, "").length > 2);
  if (words.length < minWords) return false;
  if (FILLER.test(cleaned)) return false;
  const unique = new Set(words.map((w) => w.toLowerCase()));
  if (unique.size < Math.min(5, minWords)) return false;
  return true;
}

export function isMeaningfulCode(code: string, minLines = 3): boolean {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("#") && !l.startsWith("/*"));
  if (lines.length < minLines) return false;
  return isMeaningfulText(code, 30, 5);
}

export function resolveCheckpointAction(checkpoint: MissionCheckpointDto): CheckpointActionType {
  const name = checkpoint.name.toLowerCase();
  const desc = (checkpoint.description || "").toLowerCase();
  const blob = `${name} ${desc}`;

  if (blob.includes("understand") || blob.includes("requirement")) return "confirm_understanding";
  if (blob.includes("constraint") || blob.includes("consideration") || blob.includes("limitation")) {
    return "identify_constraints";
  }
  if (blob.includes("plan") || blob.includes("approach") || blob.includes("strategy")) return "create_plan";
  if (
    blob.includes("draft") ||
    blob.includes("produce") ||
    blob.includes("build") ||
    blob.includes("implement") ||
    blob.includes("deliverable") ||
    blob.includes("create")
  ) {
    return "produce_draft";
  }
  if (blob.includes("review") || blob.includes("validate") || blob.includes("check")) return "review_work";
  if (blob.includes("evidence") || blob.includes("attach") || blob.includes("proof")) return "attach_evidence";
  if (blob.includes("final")) return "finalize";
  return "generic_work";
}

export function validateCheckpointAction(
  action: CheckpointActionType,
  work: MissionWorkInput,
): CheckpointValidation {
  switch (action) {
    case "confirm_understanding":
      if (!work.briefReviewed) {
        return {
          canComplete: false,
          reason: "Review the mission brief before confirming understanding.",
          actionLabel: "Read the brief",
          hint: "Summarize what the client needs in your own words.",
        };
      }
      if (!isMeaningfulText(work.understandingSummary, 30, 6)) {
        return {
          canComplete: false,
          reason: "Write a short summary showing you understand the client's situation.",
          actionLabel: "Summarize requirements",
          hint: "Explain the problem and what success looks like — at least a few sentences.",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "You've demonstrated understanding of the mission.",
      };

    case "identify_constraints":
      if (!isMeaningfulText(work.constraintReflection, 25, 5)) {
        return {
          canComplete: false,
          reason: "Identify at least one real constraint or consideration for this mission.",
          actionLabel: "Document constraints",
          hint: "What limits, risks, or boundaries must your solution respect?",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Constraints documented.",
      };

    case "create_plan":
      if (!isMeaningfulText(work.planContent, 40, 8)) {
        return {
          canComplete: false,
          reason: "Create a meaningful plan before moving on.",
          actionLabel: "Write your plan",
          hint: "Outline how you intend to solve the client's problem step by step.",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Plan captured.",
      };

    case "produce_draft":
      if (!isMeaningfulText(work.approachExplanation, 20, 4) && !isMeaningfulCode(work.codeSnippet)) {
        return {
          canComplete: false,
          reason: "Produce your first draft in the workspace before completing this step.",
          actionLabel: "Start working",
          hint: "Add your deliverable and explain your approach — this is the actual work.",
        };
      }
      if (!isMeaningfulCode(work.codeSnippet) && !isMeaningfulText(stripHtml(work.codeSnippet), 50, 10)) {
        return {
          canComplete: false,
          reason: "Your deliverable needs more substance — add real work product.",
          actionLabel: "Build deliverable",
          hint: "Write code, a document, analysis, or design output that addresses the mission.",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Draft produced.",
      };

    case "review_work":
      if (!work.reviewConfirmed) {
        return {
          canComplete: false,
          reason: "Review your work against the mission requirements before completing.",
          actionLabel: "Confirm review",
          hint: "Check each requirement and confirm you've addressed them.",
        };
      }
      if (!isMeaningfulText(work.approachExplanation, 20, 4) && !isMeaningfulCode(work.codeSnippet)) {
        return {
          canComplete: false,
          reason: "You need a deliverable to review before completing this step.",
          actionLabel: "Return to workspace",
          hint: "Produce your solution first, then review it here.",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Review confirmed.",
      };

    case "attach_evidence":
      if (work.evidence.length === 0) {
        return {
          canComplete: false,
          reason: "Attach evidence that proves you completed this work in a real organisation.",
          actionLabel: "Add evidence",
          hint: "Link a repo, upload a file, or add a screenshot/document.",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Evidence attached.",
      };

    case "finalize":
      if (!isMeaningfulText(work.approachExplanation, 20, 4)) {
        return {
          canComplete: false,
          reason: "Document your approach and decisions before finalizing.",
          actionLabel: "Add explanation",
          hint: "Explain why you made these decisions — like handing off to a team lead.",
        };
      }
      if (!isMeaningfulCode(work.codeSnippet) && !isMeaningfulText(stripHtml(work.codeSnippet), 50, 10)) {
        return {
          canComplete: false,
          reason: "Finalize only after producing a meaningful deliverable.",
          actionLabel: "Complete deliverable",
          hint: "Your final work product should be ready for client review.",
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Ready to finalize.",
      };

    default:
      if (!isMeaningfulText(work.approachExplanation, 20, 4) && !isMeaningfulCode(work.codeSnippet)) {
        return {
          canComplete: false,
          reason: "Complete the required work for this step before marking it done.",
          actionLabel: "Do the work",
          hint: checkpointActionHint(action),
        };
      }
      return {
        canComplete: true,
        reason: "",
        actionLabel: "Complete step",
        hint: "Step requirements met.",
      };
  }
}

function checkpointActionHint(action: CheckpointActionType): string {
  switch (action) {
    case "confirm_understanding":
      return "Show you understand what the client needs.";
    case "identify_constraints":
      return "Document the constraints that shape your solution.";
    case "create_plan":
      return "Outline your approach before building.";
    case "produce_draft":
      return "Produce real work in the workspace.";
    case "review_work":
      return "Review your output against requirements.";
    case "attach_evidence":
      return "Attach proof of your work.";
    case "finalize":
      return "Finalize your deliverable.";
    default:
      return "Complete the work required for this step.";
  }
}

export function validateCheckpoint(
  checkpoint: MissionCheckpointDto,
  work: MissionWorkInput,
): CheckpointValidation {
  const action = resolveCheckpointAction(checkpoint);
  return validateCheckpointAction(action, work);
}

export function checkpointNeedsWorkspace(action: CheckpointActionType): boolean {
  return action === "produce_draft" || action === "create_plan" || action === "generic_work";
}
