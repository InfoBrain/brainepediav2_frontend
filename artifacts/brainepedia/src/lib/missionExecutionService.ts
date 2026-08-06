import { api } from "./api";
import type {
  MentorMessageDto,
  MentorResponseDto,
  MissionCheckpointDto,
  MissionDraftDto,
  MissionEvidenceDto,
  MissionWorkspaceDto,
  ReadinessDto,
  ReflectionDto,
} from "./missionExecutionTypes";

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true" || v === "1";
  return Boolean(v);
}

function arr<T>(v: unknown, map: (item: unknown) => T): T[] {
  if (!Array.isArray(v)) return [];
  return v.map(map);
}

export function normCheckpoint(raw: unknown): MissionCheckpointDto {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    checkpointProgressId: str(d.checkpointProgressId ?? d.CheckpointProgressId ?? d.id ?? d.Id),
    name: str(d.name ?? d.Name, "Checkpoint"),
    description: str(d.description ?? d.Description),
    order: num(d.order ?? d.Order),
    isRequired: bool(d.isRequired ?? d.IsRequired ?? true),
    isCompleted: bool(d.isCompleted ?? d.IsCompleted),
    xpReward: num(d.xpReward ?? d.XpReward, 10),
  };
}

export function normEvidence(raw: unknown): MissionEvidenceDto {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    evidenceId: str(d.evidenceId ?? d.EvidenceId ?? d.id ?? d.Id) || undefined,
    title: str(d.title ?? d.Title),
    description: str(d.description ?? d.Description),
    evidenceType: num(d.evidenceType ?? d.EvidenceType, 5),
    url: str(d.url ?? d.Url ?? d.link ?? d.Link),
    createdAt: str(d.createdAt ?? d.CreatedAt) || undefined,
  };
}

export function normDraft(raw: unknown): MissionDraftDto | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const draftId = str(d.draftId ?? d.DraftId ?? d.id ?? d.Id);
  if (!draftId) return undefined;
  const linksRaw = d.evidenceLinks ?? d.EvidenceLinks;
  const evidenceLinks = Array.isArray(linksRaw) ? linksRaw.map(String) : [];
  return {
    draftId,
    approachExplanation: str(d.approachExplanation ?? d.ApproachExplanation),
    codeSnippet: str(d.codeSnippet ?? d.CodeSnippet),
    evidenceLinks,
    stage: num(d.stage ?? d.Stage),
    version: num(d.version ?? d.Version),
    lastSavedAt: str(d.lastSavedAt ?? d.LastSavedAt ?? d.updatedAt ?? d.UpdatedAt),
  };
}

export function normWorkspace(raw: unknown): MissionWorkspaceDto {
  const root = (raw ?? {}) as Record<string, unknown>;
  const d = (root.data ?? root) as Record<string, unknown>;
  const checkpointsRaw = d.checkpoints ?? d.Checkpoints ?? [];
  const evidenceRaw = d.evidence ?? d.Evidence ?? [];
  const latestDraftRaw = d.latestDraft ?? d.LatestDraft ?? d.draft ?? d.Draft;

  return {
    sessionId: str(d.sessionId ?? d.SessionId ?? d.experienceSessionId ?? d.ExperienceSessionId),
    problemNodeId: str(d.problemNodeId ?? d.ProblemNodeId),
    missionTitle: str(d.missionTitle ?? d.MissionTitle ?? d.title ?? d.Title, "Mission"),
    missionBrief: str(d.missionBrief ?? d.MissionBrief ?? d.brief ?? d.Brief),
    currentPhase: num(d.currentPhase ?? d.CurrentPhase),
    submissionStage: num(d.submissionStage ?? d.SubmissionStage),
    progressPercentage: num(d.progressPercentage ?? d.ProgressPercentage),
    briefReviewed: bool(d.briefReviewed ?? d.BriefReviewed),
    isReadyForFinalSubmission: bool(d.isReadyForFinalSubmission ?? d.IsReadyForFinalSubmission),
    employerChallengeAssignmentId:
      str(d.employerChallengeAssignmentId ?? d.EmployerChallengeAssignmentId) || undefined,
    checkpoints: arr(checkpointsRaw, normCheckpoint).sort((a, b) => a.order - b.order),
    evidence: arr(evidenceRaw, normEvidence),
    latestDraft: normDraft(latestDraftRaw),
    sessionXpEarned: num(d.sessionXpEarned ?? d.SessionXpEarned),
  };
}

export function normReadiness(raw: unknown): ReadinessDto {
  const d = ((raw as Record<string, unknown>)?.data ?? raw ?? {}) as Record<string, unknown>;
  const missing = d.missingRequirements ?? d.MissingRequirements;
  return {
    isReady: bool(d.isReady ?? d.IsReady),
    briefReviewed: bool(d.briefReviewed ?? d.BriefReviewed),
    requiredCheckpointsCompleted: bool(d.requiredCheckpointsCompleted ?? d.RequiredCheckpointsCompleted),
    hasExplanation: bool(d.hasExplanation ?? d.HasExplanation),
    hasRequiredEvidence: bool(d.hasRequiredEvidence ?? d.HasRequiredEvidence),
    missingRequirements: Array.isArray(missing) ? missing.map(String) : [],
  };
}

export function normMentorResponse(raw: unknown): MentorResponseDto {
  const d = ((raw as Record<string, unknown>)?.data ?? raw ?? {}) as Record<string, unknown>;
  const actionsRaw = d.suggestedNextActions ?? d.SuggestedNextActions;
  return {
    response: str(d.response ?? d.Response ?? d.message ?? d.Message),
    responseType: num(d.responseType ?? d.ResponseType, 1),
    suggestedNextActions: Array.isArray(actionsRaw) ? actionsRaw.map(String) : [],
    mentorInteractionCount: num(d.mentorInteractionCount ?? d.MentorInteractionCount),
    xpAwarded: num(d.xpAwarded ?? d.XpAwarded),
  };
}

export function normMentorHistory(raw: unknown): MentorMessageDto[] {
  const root = (raw as Record<string, unknown>) ?? {};
  const list = root.messages ?? root.Messages ?? root.history ?? root.History ?? root.data ?? raw;
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const d = (item ?? {}) as Record<string, unknown>;
    const actionsRaw = d.suggestedNextActions ?? d.SuggestedNextActions;
    return {
      sender: num(d.sender ?? d.Sender, 1),
      message: str(d.message ?? d.Message ?? d.text ?? d.Text ?? d.content ?? d.Content),
      responseType: num(d.responseType ?? d.ResponseType) || undefined,
      createdAt: str(d.createdAt ?? d.CreatedAt) || undefined,
      suggestedNextActions: Array.isArray(actionsRaw) ? actionsRaw.map(String) : undefined,
    };
  });
}

export function normReflection(raw: unknown): ReflectionDto | null {
  if (!raw) return null;
  const d = ((raw as Record<string, unknown>).data ?? raw) as Record<string, unknown>;
  const learned = str(d.whatLearned ?? d.WhatLearned);
  const improve = str(d.whatToImprove ?? d.WhatToImprove);
  const challenged = str(d.whatChallenged ?? d.WhatChallenged);
  if (!learned && !improve && !challenged) return null;
  return {
    whatLearned: learned,
    whatToImprove: improve,
    whatChallenged: challenged,
    savedAt: str(d.savedAt ?? d.SavedAt ?? d.createdAt ?? d.CreatedAt) || undefined,
  };
}

export async function fetchWorkspace(sessionId: string) {
  const res = await api.missionExecution.getWorkspace(sessionId);
  if (!res.ok) return { ok: false as const, error: res.error, status: res.status };
  return { ok: true as const, data: normWorkspace(res.data) };
}

export async function markBriefReviewed(sessionId: string) {
  return api.missionExecution.markBriefReviewed(sessionId);
}

export async function fetchCheckpoints(sessionId: string) {
  const res = await api.missionExecution.getCheckpoints(sessionId);
  if (!res.ok) return { ok: false as const, error: res.error };
  const root = (res.data as Record<string, unknown>) ?? {};
  const list = root.checkpoints ?? root.Checkpoints ?? res.data;
  return {
    ok: true as const,
    data: arr(list, normCheckpoint).sort((a, b) => a.order - b.order),
  };
}

export async function completeCheckpoint(sessionId: string, checkpointProgressId: string, notes?: string) {
  return api.missionExecution.completeCheckpoint(sessionId, { checkpointProgressId, notes });
}

export async function registerEvidence(payload: {
  experienceSessionId: string;
  title: string;
  description: string;
  evidenceType: number;
  url: string;
}) {
  return api.missionExecution.addEvidence(payload);
}

export async function saveDraft(payload: {
  experienceSessionId: string;
  approachExplanation: string;
  codeSnippet: string;
  evidenceLinks?: string[];
}) {
  return api.missionExecution.saveDraft(payload);
}

export async function fetchDraft(sessionId: string) {
  const res = await api.missionExecution.getDraft(sessionId);
  if (!res.ok) return { ok: false as const, error: res.error };
  const draft = normDraft(res.data);
  return { ok: true as const, data: draft };
}

export async function requestReview(sessionId: string) {
  return api.missionExecution.requestReview(sessionId);
}

export async function fetchReadiness(sessionId: string) {
  const res = await api.missionExecution.getReadiness(sessionId);
  if (!res.ok) return { ok: false as const, error: res.error, status: res.status };
  return { ok: true as const, data: normReadiness(res.data) };
}

export async function sendMentorMessage(payload: {
  experienceSessionId: string;
  userMessage: string;
  intent: number;
  currentApproach?: string;
  currentDraft?: string;
}) {
  const res = await api.missionExecution.mentor(payload);
  if (!res.ok) return { ok: false as const, error: res.error };
  return { ok: true as const, data: normMentorResponse(res.data) };
}

export async function fetchMentorHistory(sessionId: string) {
  const res = await api.missionExecution.getMentorHistory(sessionId);
  if (!res.ok) return { ok: false as const, error: res.error };
  return { ok: true as const, data: normMentorHistory(res.data) };
}

export async function reviewDraftWithMentor(sessionId: string, draftContent: string) {
  const res = await api.missionExecution.reviewDraft(sessionId, draftContent);
  if (!res.ok) return { ok: false as const, error: res.error };
  return { ok: true as const, data: normMentorResponse(res.data) };
}

export async function finalSubmit(formData: FormData) {
  return api.missionExecution.finalSubmit(formData);
}

export async function saveReflection(payload: {
  experienceSessionId: string;
  whatLearned: string;
  whatToImprove: string;
  whatChallenged: string;
}) {
  return api.missionExecution.saveReflection(payload);
}

export async function fetchReflection(sessionId: string) {
  const res = await api.missionExecution.getReflection(sessionId);
  if (!res.ok) {
    if (res.status === 404) return { ok: true as const, data: null };
    return { ok: false as const, error: res.error };
  }
  return { ok: true as const, data: normReflection(res.data) };
}

export async function resolveSubmissionIdForSession(sessionId: string): Promise<string | null> {
  const res = await api.submissions.getBySession(sessionId);
  if (!res.ok) return null;
  const root = res.data as Record<string, unknown>;
  const list = (root?.submissions ?? root?.Submissions ?? root?.data ?? res.data) as unknown;
  if (!Array.isArray(list) || list.length === 0) {
    const singleId = str(root?.submissionId ?? root?.SubmissionId ?? root?.id ?? root?.Id);
    return singleId || null;
  }
  const latest = list[list.length - 1] as Record<string, unknown>;
  return str(latest.submissionId ?? latest.SubmissionId ?? latest.id ?? latest.Id) || null;
}
