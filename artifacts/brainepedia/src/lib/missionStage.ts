import type { MissionCheckpointDto, MissionWorkspaceDto, ReadinessDto } from "./missionExecutionTypes";

export enum MissionStage {
  Brief = "BRIEF",
  Planning = "PLANNING",
  Building = "BUILDING",
  Review = "REVIEW",
  Submission = "SUBMISSION",
}

export type JourneyStep = "brief" | "plan" | "build" | "review" | "submit";

export const JOURNEY_STEPS: { id: JourneyStep; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "plan", label: "Plan" },
  { id: "build", label: "Build" },
  { id: "review", label: "Review" },
  { id: "submit", label: "Submit" },
];

export function getRequiredCheckpoints(checkpoints: MissionCheckpointDto[]) {
  return checkpoints.filter((c) => c.isRequired);
}

export function getCheckpointProgress(checkpoints: MissionCheckpointDto[]) {
  const required = getRequiredCheckpoints(checkpoints);
  const completed = required.filter((c) => c.isCompleted).length;
  const total = required.length || checkpoints.length;
  const done = checkpoints.filter((c) => c.isCompleted).length;
  const all = checkpoints.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, done, all, pct };
}

export function allRequiredCheckpointsDone(checkpoints: MissionCheckpointDto[]) {
  const required = getRequiredCheckpoints(checkpoints);
  if (!required.length) return true;
  return required.every((c) => c.isCompleted);
}

export function resolveMissionStage(
  workspace: MissionWorkspaceDto,
  readiness: ReadinessDto | null,
  approach: string,
  codeSnippet: string,
): MissionStage {
  if (!workspace.briefReviewed) return MissionStage.Brief;

  if (!allRequiredCheckpointsDone(workspace.checkpoints)) {
    return MissionStage.Planning;
  }

  const isReady = readiness?.isReady ?? workspace.isReadyForFinalSubmission;
  if (isReady) return MissionStage.Submission;

  const hasWork =
    Boolean(approach.trim() || codeSnippet.trim()) ||
    workspace.evidence.length > 0 ||
    Boolean(workspace.latestDraft);

  if (!hasWork) return MissionStage.Building;

  return MissionStage.Review;
}

export function stageToJourneyStep(stage: MissionStage): JourneyStep {
  switch (stage) {
    case MissionStage.Brief:
      return "brief";
    case MissionStage.Planning:
      return "plan";
    case MissionStage.Building:
      return "build";
    case MissionStage.Review:
      return "review";
    case MissionStage.Submission:
      return "submit";
  }
}

export function isJourneyStepComplete(step: JourneyStep, current: JourneyStep): boolean {
  const order: JourneyStep[] = ["brief", "plan", "build", "review", "submit"];
  return order.indexOf(step) < order.indexOf(current);
}

export type NextAction = {
  title: string;
  description: string;
  ctaLabel: string;
  stage: MissionStage;
};

export function resolveNextAction(
  workspace: MissionWorkspaceDto,
  readiness: ReadinessDto | null,
  approach: string,
  codeSnippet: string,
): NextAction {
  const stage = resolveMissionStage(workspace, readiness, approach, codeSnippet);
  const progress = getCheckpointProgress(workspace.checkpoints);
  const nextCheckpoint = workspace.checkpoints.find((c) => !c.isCompleted);

  switch (stage) {
    case MissionStage.Brief:
      return {
        title: "Read the mission brief",
        description: "Before you begin, make sure you understand what the client needs.",
        ctaLabel: "I've Read the Brief →",
        stage,
      };
    case MissionStage.Planning:
      return {
        title: nextCheckpoint ? `Complete: ${nextCheckpoint.name}` : "Finish planning steps",
        description:
          nextCheckpoint?.description ||
          `Step ${progress.completed + 1} of ${progress.total} — outline your approach before building.`,
        ctaLabel: "Continue →",
        stage,
      };
    case MissionStage.Building:
      return {
        title: "Build your solution",
        description:
          "Now do the work. Your deliverable should demonstrate how you would handle this in the real world.",
        ctaLabel: "Continue to Review →",
        stage,
      };
    case MissionStage.Review:
      return {
        title: "Review your work",
        description: "Check your solution against the mission requirements before submitting.",
        ctaLabel: "Review Solution →",
        stage,
      };
    case MissionStage.Submission:
      return {
        title: "Ready to submit",
        description: "Your work meets the requirements. Submit your final solution to your team lead.",
        ctaLabel: "Submit Final Solution →",
        stage,
      };
  }
}

/** Profession-agnostic deliverable labels */
export function getDeliverableLabels(professionHint?: string) {
  const hint = (professionHint || "").toLowerCase();
  if (hint.includes("design")) {
    return { deliverable: "Design / Creative Output", explanation: "Why did you make these design decisions?" };
  }
  if (hint.includes("market")) {
    return { deliverable: "Campaign / Strategy", explanation: "Why did you choose this approach?" };
  }
  if (hint.includes("teach") || hint.includes("education")) {
    return { deliverable: "Lesson / Learning Material", explanation: "Why did you structure it this way?" };
  }
  if (hint.includes("account") || hint.includes("finance")) {
    return { deliverable: "Analysis / Report", explanation: "Why did you reach these conclusions?" };
  }
  if (hint.includes("hr") || hint.includes("human")) {
    return { deliverable: "Policy / Recommendation", explanation: "Why is this the right recommendation?" };
  }
  if (hint.includes("develop") || hint.includes("engineer") || hint.includes("software")) {
    return { deliverable: "Implementation", explanation: "Why did you make these technical decisions?" };
  }
  return { deliverable: "Your Deliverable", explanation: "Why did you make these decisions?" };
}
