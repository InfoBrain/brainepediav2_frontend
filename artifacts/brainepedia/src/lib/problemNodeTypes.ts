export type ProblemNodeDetail = {
  problemNodeId: string;
  title: string;
  context: string;
  missionBrief: string;
  constraints: string[];
  expectedOutcomes: string[];
  experiencePoints: number;
  estimatedMinutes: number;
  difficultyId?: string;
  difficultyName?: string;
  districtId?: string;
  districtName?: string;
  professionName?: string;
  attachmentUrl?: string | null;
  employerChallengeAssignmentId?: string | null;
};

export function parseProblemNodeList(value: unknown, depth = 0): string[] {
  if (value == null || depth > 4) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseProblemNodeList(item, depth + 1)).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  const looksLikeJson = (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("\"") && trimmed.endsWith("\""));
  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(trimmed);
      const nested = parseProblemNodeList(parsed, depth + 1);
      if (nested.length) return nested;
    } catch {
      /* fall through */
    }
  }
  return [trimmed];
}

function parseArr(v: unknown): string[] {
  return parseProblemNodeList(v);
}

export function normProblemNodeDetail(data: unknown): ProblemNodeDetail {
  const d = (data ?? {}) as Record<string, unknown>;
  const district = (d.district ?? d.District) as Record<string, unknown> | undefined;
  const profession = (district?.profession ?? district?.Profession ?? d.profession ?? d.Profession) as
    | Record<string, unknown>
    | undefined;

  return {
    problemNodeId: String(d.problemNodeId ?? d.id ?? d.nodeId ?? d.ProblemNodeId ?? ""),
    title: String(d.title ?? d.name ?? d.Title ?? "Mission"),
    context: String(d.context ?? d.Context ?? ""),
    missionBrief: String(d.missionBrief ?? d.MissionBrief ?? ""),
    constraints: parseArr(d.constraints ?? d.Constraints),
    expectedOutcomes: parseArr(d.expectedOutcomes ?? d.ExpectedOutcomes),
    experiencePoints: Number(d.experiencePoints ?? d.ExperiencePoints ?? 0),
    estimatedMinutes: Number(d.estimatedMinutes ?? d.EstimatedMinutes ?? 0),
    difficultyId: String(d.difficultyId ?? d.DifficultyId ?? "") || undefined,
    difficultyName: String(d.difficultyName ?? d.DifficultyName ?? "") || undefined,
    districtId: String(d.districtId ?? d.DistrictId ?? district?.id ?? district?.districtId ?? "") || undefined,
    districtName: String(d.districtName ?? d.DistrictName ?? district?.name ?? district?.districtName ?? "") || undefined,
    professionName: String(
      d.professionName ??
        d.ProfessionName ??
        profession?.name ??
        profession?.professionName ??
        "",
    ) || undefined,
    attachmentUrl: String(d.attachmentUrl ?? d.AttachmentUrl ?? "") || null,
    employerChallengeAssignmentId:
      String(d.employerChallengeAssignmentId ?? d.EmployerChallengeAssignmentId ?? "") || null,
  };
}
