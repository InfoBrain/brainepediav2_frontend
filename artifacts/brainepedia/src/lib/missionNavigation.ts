import { MissionStage } from "./missionStage";
import type { MissionCheckpointDto, ReadinessDto } from "./missionExecutionTypes";
import { resolveCheckpointAction, type CheckpointActionType } from "./checkpointRequirements";

export type NavigationTarget =
  | { type: "brief" }
  | { type: "checkpoint"; checkpointId: string }
  | { type: "workspace"; section?: "deliverable" | "approach" | "evidence" }
  | { type: "review" }
  | { type: "brainiac" };

export function resolveContinueTarget(
  readiness: ReadinessDto | null,
  checkpoints: MissionCheckpointDto[],
  briefReviewed: boolean,
): NavigationTarget {
  if (!briefReviewed || readiness?.briefReviewed === false) {
    return { type: "brief" };
  }

  const nextCheckpoint = checkpoints.find((c) => !c.isCompleted);
  if (nextCheckpoint) {
    return { type: "checkpoint", checkpointId: nextCheckpoint.checkpointProgressId };
  }

  if (readiness?.missingRequirements?.length) {
    for (const req of readiness.missingRequirements) {
      const lower = req.toLowerCase();
      if (lower.includes("evidence")) return { type: "workspace", section: "evidence" };
      if (lower.includes("explanation") || lower.includes("approach")) {
        return { type: "workspace", section: "approach" };
      }
      if (lower.includes("checkpoint") || lower.includes("step")) {
        const cp = checkpoints.find((c) => !c.isCompleted);
        if (cp) return { type: "checkpoint", checkpointId: cp.checkpointProgressId };
      }
      if (lower.includes("brief")) return { type: "brief" };
      if (lower.includes("deliverable") || lower.includes("draft") || lower.includes("solution")) {
        return { type: "workspace", section: "deliverable" };
      }
    }
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
