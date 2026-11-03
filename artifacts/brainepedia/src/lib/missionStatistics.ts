import { api } from "@/lib/api";
import { asList, numberish, text } from "@/lib/jobData";
import { storeMissionAssignmentContext } from "@/lib/missionAssignmentContext";

export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export type MissionStatus = "Pending" | "InProgress" | "Completed";
export type MissionSource = "Corporate" | "Personal";

export type MissionRecord = {
  employerChallengeAssignmentId: string | null;
  experienceSessionId: string | null;
  problemNodeId: string;
  challengeName: string;
  companyName: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number;
  hasCompleted: boolean;
  status: MissionStatus;
  canContinue: boolean;
  missionSource: MissionSource;
};

export type UserMissionStatistics = {
  totalAssignedMissions: number;
  completedMissions: number;
  pendingMissionsCount: number;
  inProgressMissions: number;
  totalXpEarned: number;
  missionSuccessRate: number;
  continuableMissions: MissionRecord[];
  recentMissions: MissionRecord[];
};

export function presentGuid(value: unknown): string | null {
  const id = text(value, "").trim();
  if (!id || id.toLowerCase() === EMPTY_GUID) return null;
  return id;
}

function readStatus(item: Record<string, unknown>, hasCompleted: boolean): MissionStatus {
  const raw = text(item.status ?? item.Status, "");
  const normalized = raw.replace(/[\s_-]/g, "").toLowerCase();
  if (normalized === "completed" || hasCompleted) return "Completed";
  if (normalized === "inprogress" || normalized === "active" || normalized === "submitted") return "InProgress";
  if (normalized === "pending" || normalized === "notstarted") return "Pending";
  return hasCompleted ? "Completed" : "Pending";
}

export function normalizeMissionRecord(item: unknown): MissionRecord {
  const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
  const hasCompleted = Boolean(row.hasCompleted ?? row.HasCompleted);
  const status = readStatus(row, hasCompleted);
  const sourceRaw = text(row.missionSource ?? row.MissionSource, "");
  const missionSource: MissionSource = sourceRaw.toLowerCase() === "corporate" ? "Corporate" : "Personal";
  const canContinueValue = row.canContinue ?? row.CanContinue;
  const canContinue = typeof canContinueValue === "boolean" ? canContinueValue : status !== "Completed";
  return {
    employerChallengeAssignmentId: presentGuid(row.employerChallengeAssignmentId ?? row.EmployerChallengeAssignmentId),
    experienceSessionId: presentGuid(row.experienceSessionId ?? row.ExperienceSessionId),
    problemNodeId: text(row.problemNodeId ?? row.ProblemNodeId ?? row.missionId ?? row.MissionId, ""),
    challengeName: text(row.challengeName ?? row.ChallengeName ?? row.missionTitle ?? row.MissionTitle ?? row.title ?? row.Title, "Mission"),
    companyName: text(row.companyName ?? row.CompanyName ?? row.employerName ?? row.EmployerName, "General Platform"),
    startedAt: text(row.startedAt ?? row.StartedAt, "") || null,
    completedAt: text(row.completedAt ?? row.CompletedAt ?? row.completedDate ?? row.CompletedDate, "") || null,
    score: numberish(row.score ?? row.Score) ?? 0,
    hasCompleted: hasCompleted || status === "Completed",
    status,
    canContinue: canContinue && status !== "Completed",
    missionSource,
  };
}

function percent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value > 1 ? value : value * 100);
}

export function normalizeUserMissionStatistics(data: unknown): UserMissionStatistics {
  const root = ((data as any)?.data ?? (data as any)?.statistics ?? (data as any)?.missionStatistics ?? data ?? {}) as Record<string, unknown>;
  const completed = numberish(root.completedMissions ?? root.CompletedMissions ?? root.completedMissionsCount ?? root.CompletedMissionsCount) ?? 0;
  const totalAssigned = numberish(root.totalAssignedMissions ?? root.TotalAssignedMissions ?? root.assignedMissions ?? root.AssignedMissions) ?? 0;
  const pending = numberish(root.pendingMissionsCount ?? root.PendingMissionsCount) ?? 0;
  const inProgress = numberish(root.inProgressMissionsCount ?? root.InProgressMissionsCount ?? root.inProgressMissions ?? root.InProgressMissions) ?? Math.max(totalAssigned - completed - pending, 0);
  const successRateRaw = numberish(root.missionSuccessRate ?? root.MissionSuccessRate ?? root.successRate ?? root.SuccessRate) ?? 0;
  return {
    totalAssignedMissions: totalAssigned,
    completedMissions: completed,
    pendingMissionsCount: pending,
    inProgressMissions: inProgress,
    totalXpEarned: numberish(root.totalXpEarned ?? root.TotalXpEarned ?? root.totalXPEarned ?? root.TotalXPEarned) ?? 0,
    missionSuccessRate: percent(successRateRaw),
    continuableMissions: asList(root.continuableMissions ?? root.ContinuableMissions).map(normalizeMissionRecord).filter((row) => row.canContinue && row.problemNodeId),
    recentMissions: asList(root.recentMissions ?? root.RecentMissions ?? root.missions ?? root.Missions).map(normalizeMissionRecord),
  };
}

export function workspaceHref(sessionId: string): string {
  return `/app/session/${encodeURIComponent(sessionId)}/workspace`;
}

function sessionIdFrom(data: unknown): string {
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const nested = (record.data && typeof record.data === "object" ? record.data : {}) as Record<string, unknown>;
  return presentGuid(
    record.experienceSessionId ??
      record.ExperienceSessionId ??
      record.sessionId ??
      record.SessionId ??
      record.id ??
      nested.experienceSessionId ??
      nested.sessionId ??
      nested.id,
  ) || "";
}

export async function openContinuableMission(
  userId: string,
  mission: MissionRecord,
): Promise<{ ok: boolean; href?: string; error?: string; status?: number }> {
  const assignmentId = mission.missionSource === "Corporate" ? mission.employerChallengeAssignmentId : null;
  storeMissionAssignmentContext({
    problemNodeId: mission.problemNodeId,
    employerChallengeAssignmentId: assignmentId,
    assignmentRequired: Boolean(assignmentId),
  });

  if (mission.experienceSessionId) {
    return { ok: true, href: workspaceHref(mission.experienceSessionId) };
  }

  const res = await api.experienceSessions.start({
    userId,
    problemNodeId: mission.problemNodeId,
    ...(assignmentId ? { employerChallengeAssignmentId: assignmentId } : {}),
  });
  if (!res.ok) {
    return { ok: false, error: res.error || "Unable to open this mission.", status: res.status };
  }
  const sessionId = sessionIdFrom(res.data);
  if (!sessionId) {
    return { ok: false, error: "The mission started, but no session id was returned." };
  }
  return { ok: true, href: workspaceHref(sessionId) };
}
