export type MissionAssignmentContext = {
  problemNodeId: string;
  employerChallengeAssignmentId?: string | null;
  assignmentRequired?: boolean;
};

const STORAGE_PREFIX = "brainepedia:mission-assignment:";

function cleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function storageKey(problemNodeId: string): string {
  return `${STORAGE_PREFIX}${problemNodeId}`;
}

function readStoredContext(problemNodeId: string): MissionAssignmentContext | null {
  if (typeof window === "undefined" || !problemNodeId) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(problemNodeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MissionAssignmentContext;
    if (parsed?.problemNodeId !== problemNodeId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function problemNodeIdOf(item: any): string {
  return cleanString(
    item?.problemNodeId ??
      item?.ProblemNodeId ??
      item?.missionId ??
      item?.MissionId ??
      item?.nodeId ??
      item?.NodeId ??
      item?.assessmentId ??
      item?.AssessmentId ??
      item?.linkedAssessmentNodeId ??
      item?.LinkedAssessmentNodeId ??
      item?.linkAssessmentNodeId ??
      item?.LinkAssessmentNodeId ??
      item?.assessmentNodeId ??
      item?.AssessmentNodeId ??
      item?.problemNode?.problemNodeId ??
      item?.problemNode?.ProblemNodeId ??
      item?.problemNode?.id ??
      item?.ProblemNode?.ProblemNodeId ??
      item?.ProblemNode?.Id ??
      item?.data?.problemNodeId ??
      item?.data?.ProblemNodeId,
  );
}

export function employerChallengeAssignmentIdOf(item: any): string {
  return cleanString(
    item?.employerChallengeAssignmentId ??
      item?.EmployerChallengeAssignmentId ??
      item?.challengeAssignmentId ??
      item?.ChallengeAssignmentId ??
      item?.assignmentId ??
      item?.AssignmentId ??
      item?.employerAssignmentId ??
      item?.EmployerAssignmentId ??
      item?.assignment?.employerChallengeAssignmentId ??
      item?.assignment?.EmployerChallengeAssignmentId ??
      item?.employerChallengeAssignment?.employerChallengeAssignmentId ??
      item?.employerChallengeAssignment?.EmployerChallengeAssignmentId ??
      item?.EmployerChallengeAssignment?.EmployerChallengeAssignmentId ??
      item?.EmployerChallengeAssignment?.employerChallengeAssignmentId ??
      item?.data?.employerChallengeAssignmentId ??
      item?.data?.EmployerChallengeAssignmentId,
  );
}

export function hasEmployerAssignmentSignal(item: any): boolean {
  if (!item) return false;
  if (employerChallengeAssignmentIdOf(item)) return true;

  const explicit =
    item?.isEmployerAssigned ??
    item?.IsEmployerAssigned ??
    item?.isEmployerAssignedChallenge ??
    item?.IsEmployerAssignedChallenge ??
    item?.assignmentRequired ??
    item?.AssignmentRequired ??
    item?.requiresAssignmentContext ??
    item?.RequiresAssignmentContext;
  if (typeof explicit === "boolean") return explicit;

  if (item?.employerChallengeAssignment || item?.EmployerChallengeAssignment || item?.assignment || item?.Assignment) {
    return true;
  }

  const source = cleanString(
    item?.assignmentType ??
      item?.AssignmentType ??
      item?.sourceType ??
      item?.SourceType ??
      item?.challengeSource ??
      item?.ChallengeSource ??
      item?.assessmentSource ??
      item?.AssessmentSource,
  ).toLowerCase();

  return ["employer", "private", "candidate", "job", "team"].some((token) => source.includes(token));
}

export function buildMissionHref(context: MissionAssignmentContext): string {
  const problemNodeId = cleanString(context.problemNodeId);
  const href = `/app/mission/${encodeURIComponent(problemNodeId)}`;
  const assignmentId = cleanString(context.employerChallengeAssignmentId);
  if (!assignmentId) return href;
  const query = new URLSearchParams({ employerChallengeAssignmentId: assignmentId });
  return `${href}?${query.toString()}`;
}

export function storeMissionAssignmentContext(context: MissionAssignmentContext): void {
  if (typeof window === "undefined") return;
  const problemNodeId = cleanString(context.problemNodeId);
  if (!problemNodeId) return;

  const assignmentId = cleanString(context.employerChallengeAssignmentId);
  const assignmentRequired = Boolean(context.assignmentRequired || assignmentId);

  try {
    if (!assignmentId && !assignmentRequired) {
      window.sessionStorage.removeItem(storageKey(problemNodeId));
      return;
    }

    const stored: MissionAssignmentContext = {
      problemNodeId,
      employerChallengeAssignmentId: assignmentId || null,
      assignmentRequired,
    };
    window.sessionStorage.setItem(storageKey(problemNodeId), JSON.stringify(stored));
  } catch {
    // Session storage is best-effort; the URL query still carries valid assignment IDs.
  }
}

export function readMissionAssignmentContext(problemNodeId: string): MissionAssignmentContext {
  const normalizedProblemNodeId = cleanString(problemNodeId);
  const stored = readStoredContext(normalizedProblemNodeId);
  let urlAssignmentId = "";

  if (typeof window !== "undefined") {
    urlAssignmentId = cleanString(new URLSearchParams(window.location.search).get("employerChallengeAssignmentId"));
  }

  return {
    problemNodeId: normalizedProblemNodeId,
    employerChallengeAssignmentId: urlAssignmentId || stored?.employerChallengeAssignmentId || null,
    assignmentRequired: Boolean(stored?.assignmentRequired || urlAssignmentId),
  };
}

export function prepareMissionNavigation(context: MissionAssignmentContext): string {
  storeMissionAssignmentContext(context);
  return buildMissionHref(context);
}
