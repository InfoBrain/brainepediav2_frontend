import { SessionStatus } from "@/lib/missionExecutionTypes";
import { employerChallengeAssignmentIdOf, problemNodeIdOf } from "@/lib/missionAssignmentContext";

export type OngoingMission = {
  sessionId: string;
  problemNodeId: string;
  title: string;
  professionName?: string;
  districtName?: string;
  progressPercentage: number;
  completedCheckpoints: number;
  totalCheckpoints: number;
  employerChallengeAssignmentId?: string | null;
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function isActiveSessionStatus(status: unknown): boolean {
  if (status === SessionStatus.Active || status === 0) return true;
  const s = str(status).toLowerCase();
  return s === "active" || s === "inprogress" || s === "in progress";
}

function isResumableSession(item: Record<string, unknown>): boolean {
  const status = item.status ?? item.Status ?? item.sessionStatus ?? item.SessionStatus;
  if (!isActiveSessionStatus(status)) return false;

  const completedAt = item.completedAt ?? item.CompletedAt ?? item.dateCompleted ?? item.DateCompleted;
  if (completedAt) return false;

  const submissionStage = item.submissionStage ?? item.SubmissionStage;
  if (submissionStage === 2 || submissionStage === 3 || str(submissionStage).toLowerCase() === "finalsubmitted" || str(submissionStage).toLowerCase() === "evaluated") {
    return false;
  }

  const abandoned = item.isAbandoned ?? item.IsAbandoned ?? item.abandoned ?? item.Abandoned;
  if (abandoned === true) return false;

  return true;
}

export function normOngoingMissionFromSession(item: unknown): OngoingMission | null {
  const raw = (item ?? {}) as Record<string, unknown>;
  if (!isResumableSession(raw)) return null;

  const sessionId = str(
    raw.experienceSessionId ??
      raw.ExperienceSessionId ??
      raw.sessionId ??
      raw.SessionId ??
      raw.id ??
      raw.Id,
  );
  const problemNodeId = problemNodeIdOf(raw) || str(raw.problemNodeId ?? raw.ProblemNodeId);
  if (!sessionId || !problemNodeId) return null;

  const problemNode = (raw.problemNode ?? raw.ProblemNode) as Record<string, unknown> | undefined;
  const district = (problemNode?.district ?? problemNode?.District) as Record<string, unknown> | undefined;
  const profession = (district?.profession ?? district?.Profession ?? problemNode?.profession ?? problemNode?.Profession) as
    | Record<string, unknown>
    | undefined;

  const progressPercentage = Math.max(
    0,
    Math.min(100, Number(raw.progressPercentage ?? raw.ProgressPercentage ?? raw.progress ?? raw.Progress ?? 0)),
  );

  return {
    sessionId,
    problemNodeId,
    title: str(
      raw.missionName ??
        raw.MissionName ??
        problemNode?.title ??
        problemNode?.Title ??
        raw.missionTitle ??
        raw.MissionTitle,
    ) || "Mission",
    professionName:
      str(
        raw.professionName ??
          raw.ProfessionName ??
          profession?.name ??
          profession?.professionName ??
          profession?.ProfessionName,
      ) || undefined,
    districtName:
      str(
        raw.districtName ??
          raw.DistrictName ??
          district?.name ??
          district?.districtName ??
          district?.DistrictName,
      ) || undefined,
    progressPercentage,
    completedCheckpoints: 0,
    totalCheckpoints: 0,
    employerChallengeAssignmentId: employerChallengeAssignmentIdOf(raw) || null,
  };
}

export function applyCheckpointProgress(
  mission: OngoingMission,
  checkpoints: { isCompleted?: boolean; IsCompleted?: boolean }[],
): OngoingMission {
  const total = checkpoints.length;
  if (total === 0) return mission;
  const completed = checkpoints.filter((c) => Boolean(c.isCompleted ?? c.IsCompleted)).length;
  const pct = Math.round((completed / total) * 100);
  return {
    ...mission,
    totalCheckpoints: total,
    completedCheckpoints: completed,
    progressPercentage: pct > 0 ? pct : mission.progressPercentage,
  };
}
