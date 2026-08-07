import { MissionStage } from "./missionStage";
import type { MissionCheckpointDto, ReadinessDto } from "./missionExecutionTypes";
import { resolveCheckpointAction, type CheckpointActionType } from "./checkpointRequirements";

export type NavigationTarget =
  | { type: "brief" }
  | { type: "checkpoint"; checkpointId: string }
  | { type: "workspace"; section?: "deliverable" | "approach" | "evidence" }
  | { type: "review" }
  | { type: "brainiac" };

function allCheckpointsComplete(checkpoints: MissionCheckpointDto[]): boolean {
  const required = checkpoints.filter((c) => c.isRequired);
  const list = required.length ? required : checkpoints;
  return list.length > 0 && list.every((c) => c.isCompleted);
}

function resolveWorkspaceTargetFromReadiness(readiness: ReadinessDto): NavigationTarget {
  const missing = readiness.missingRequirements ?? [];
  const needsEvidence =
    readiness.hasRequiredEvidence === false ||
    missing.some((r) => /evidence|upload|attach|proof/i.test(r));
  const needsExplanation =
    readiness.hasExplanation === false ||
    missing.some((r) => /explanation|approach|write|document|reasoning/i.test(r));
  const needsDeliverable = missing.some((r) =>
    /deliverable|draft|solution|implementation|work product|content/i.test(r),
  );

  if (needsExplanation && needsEvidence) return { type: "workspace" };
  if (needsEvidence) return { type: "workspace", section: "evidence" };
  if (needsExplanation) return { type: "workspace", section: "approach" };
  if (needsDeliverable) return { type: "workspace", section: "deliverable" };
  return { type: "workspace" };
}

export function resolveContinueTarget(
  readiness: ReadinessDto | null,
  checkpoints: MissionCheckpointDto[],
  briefReviewed: boolean,
): NavigationTarget {
  if (!briefReviewed || readiness?.briefReviewed === false) {
    return { type: "brief" };
  }

  // When checkpoints are done but readiness still has gaps, go to Build workspace
  if (readiness && !readiness.isReady && allCheckpointsComplete(checkpoints)) {
    return resolveWorkspaceTargetFromReadiness(readiness);
  }

  const nextCheckpoint = checkpoints.find((c) => !c.isCompleted);
  if (nextCheckpoint) {
    return { type: "checkpoint", checkpointId: nextCheckpoint.checkpointProgressId };
  }

  if (readiness?.missingRequirements?.length) {
    return resolveWorkspaceTargetFromReadiness(readiness);
  }

  if (readiness?.hasRequiredEvidence === false) {
    return { type: "workspace", section: "evidence" };
  }
  if (readiness?.hasExplanation === false) {
    return { type: "workspace", section: "approach" };
  }
  if (readiness?.requiredCheckpointsCompleted === false) {
    const cp = checkpoints.find((c) => !c.isCompleted);
    if (cp) return { type: "checkpoint", checkpointId: cp.checkpointProgressId };
  }

  return { type: "workspace", section: "deliverable" };
}

export function missingRequirementToTarget(requirement: string): NavigationTarget {
  const lower = requirement.toLowerCase();
  if (/evidence|upload|attach|proof/i.test(lower)) return { type: "workspace", section: "evidence" };
  if (/explanation|approach|write|reasoning/i.test(lower)) return { type: "workspace", section: "approach" };
  if (/deliverable|draft|solution|implementation/i.test(lower)) return { type: "workspace", section: "deliverable" };
  if (/brief/i.test(lower)) return { type: "brief" };
  if (/checkpoint|step/i.test(lower)) return { type: "workspace" };
  return { type: "workspace" };
}

export function navigationTargetToStage(target: NavigationTarget): MissionStage {
  switch (target.type) {
    case "brief":
      return MissionStage.Brief;
    case "checkpoint":
      return MissionStage.Planning;
    case "workspace":
      return MissionStage.Building;
    case "review":
      return MissionStage.Review;
    case "brainiac":
      return MissionStage.Building;
  }
}

export function brainiacPromptForAction(action: CheckpointActionType, stage: MissionStage): string {
  if (stage === MissionStage.Brief) {
    return "Before you begin, make sure you understand what the client needs. What questions do you have about the brief?";
  }
  switch (action) {
    case "confirm_understanding":
      return "Let's make sure we're aligned. What do you think the client is really asking for here?";
    case "identify_constraints":
      return "What constraints or risks should shape your approach before you start building?";
    case "create_plan":
      return "Before you start, what approach are you considering? Walk me through your plan.";
    case "produce_draft":
      return "You're doing the real work now. Need help getting started, or want me to review your approach?";
    case "review_work":
      return "Let's check your work against the requirements. Would you like me to review your current draft?";
    case "attach_evidence":
      return "How would you prove this work was completed in a real organisation? I can help you decide what evidence to attach.";
    case "finalize":
      return "Before you finalize, let's make sure your deliverable is ready for the client.";
    default:
      return "Need help? Ask me about your approach, request a hint, or get feedback on your draft.";
  }
}
