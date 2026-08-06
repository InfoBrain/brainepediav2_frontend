import { api } from "./api";
import type { ExtendedEvaluationFeedback, ExtendedProcessResult } from "./missionExecutionTypes";

export interface ProcessResult extends ExtendedProcessResult {}

export interface EvaluationResult {
  score: number;
  isPassed: boolean;
  positiveFeedback?: string | string[];
  improvementAreas?: string | string[];
  strengths?: string | string[];
  weaknesses?: string | string[];
  missingRequirements?: string | string[];
  riskAssessment?: string | string[];
  rawAiReasoning?: string;
  missionTitle?: string;
  clientAcceptance?: string;
  finalRecommendation?: string;
  confidenceScore?: number;
  practicalityScore?: number;
  professionalismScore?: number;
  communicationScore?: number;
  creativityScore?: number;
  planningScore?: number;
  improvementScore?: number;
  mentoringScore?: number;
  taskCompletionScore?: number;
  evidenceScore?: number;
  requiresReflection?: boolean;
  netXpGained?: number;
}

function normFeedback(raw: unknown): ExtendedEvaluationFeedback | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const pick = (key: string) => d[key] ?? d[key.charAt(0).toUpperCase() + key.slice(1)];
  return {
    positiveFeedback: pick("positiveFeedback") as ExtendedEvaluationFeedback["positiveFeedback"],
    improvementAreas: pick("improvementAreas") as ExtendedEvaluationFeedback["improvementAreas"],
    strengths: pick("strengths") as ExtendedEvaluationFeedback["strengths"],
    weaknesses: pick("weaknesses") as ExtendedEvaluationFeedback["weaknesses"],
    missingRequirements: pick("missingRequirements") as string[] | undefined,
    riskAssessment: pick("riskAssessment") as string[] | undefined,
  };
}

function normProcessResult(raw: unknown): ProcessResult {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    evaluationId: String(d.evaluationId ?? d.EvaluationId ?? "") || undefined,
    score: Number(d.score ?? d.Score ?? 0),
    isPassed: Boolean(d.isPassed ?? d.IsPassed),
    feedback: normFeedback(d.feedback ?? d.Feedback),
    clientAcceptance: String(d.clientAcceptance ?? d.ClientAcceptance ?? "") || undefined,
    finalRecommendation: String(d.finalRecommendation ?? d.FinalRecommendation ?? "") || undefined,
    confidenceScore: Number(d.confidenceScore ?? d.ConfidenceScore ?? 0) || undefined,
    practicalityScore: Number(d.practicalityScore ?? d.PracticalityScore ?? 0) || undefined,
    professionalismScore: Number(d.professionalismScore ?? d.ProfessionalismScore ?? 0) || undefined,
    communicationScore: Number(d.communicationScore ?? d.CommunicationScore ?? 0) || undefined,
    creativityScore: Number(d.creativityScore ?? d.CreativityScore ?? 0) || undefined,
    planningScore: Number(d.planningScore ?? d.PlanningScore ?? 0) || undefined,
    improvementScore: Number(d.improvementScore ?? d.ImprovementScore ?? 0) || undefined,
    mentoringScore: Number(d.mentoringScore ?? d.MentoringScore ?? 0) || undefined,
    taskCompletionScore: Number(d.taskCompletionScore ?? d.TaskCompletionScore ?? 0) || undefined,
    evidenceScore: Number(d.evidenceScore ?? d.EvidenceScore ?? 0) || undefined,
    requiresReflection: Boolean(d.requiresReflection ?? d.RequiresReflection),
    netXpGained: Number(d.netXpGained ?? d.NetXpGained ?? 0) || undefined,
    missionTitle: String(d.missionTitle ?? d.MissionTitle ?? "") || undefined,
  };
}

const SESSION_CACHE_KEY = (id: string) => `brainepedia:eval_session:${id}`;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function cacheEvalBySession(sessionId: string, data: Partial<ProcessResult> & { _ts?: number }) {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY(sessionId), JSON.stringify({ ...data, _ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

export function getCachedEvalBySession(sessionId: string): (Partial<ProcessResult> & { _ts?: number }) | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed._ts || 0) > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

export async function processEvaluation(
  submissionId: string,
  maxRetries = 2
): Promise<{ ok: boolean; data?: ProcessResult; error?: string }> {
  let lastError = "";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await api.evaluations.process(submissionId);

    if (res.ok) {
      return { ok: true, data: normProcessResult(res.data) };
    }

    if (res.status === 401) {
      return { ok: false, error: "Your session has expired. Please log in again." };
    }

    lastError = res.error || lastError;

    if (attempt < maxRetries) {
      const delay = 2000 * (attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return { ok: false, error: lastError || "Evaluation failed after retries. Please try again." };
}

const NOT_FOUND_PHRASES = ["no evaluation found", "not found", "does not exist"];

function isNotFoundResponse(res: { ok: boolean; data?: any; error?: string; status?: number }): boolean {
  if (res.status === 404) return true;
  const msg = (
    (typeof res.data === "string" ? res.data : res.data?.message || res.data?.title || "") +
    " " +
    (res.error || "")
  ).toLowerCase();
  return NOT_FOUND_PHRASES.some(p => msg.includes(p));
}

function normEvaluationResult(raw: unknown): EvaluationResult {
  const d = (raw ?? {}) as Record<string, unknown>;
  const fb = (d.feedback ?? d.Feedback ?? {}) as Record<string, unknown>;
  return {
    score: Number(d.score ?? d.Score ?? 0),
    isPassed: Boolean(d.isPassed ?? d.IsPassed),
    positiveFeedback: (d.positiveFeedback ?? d.PositiveFeedback ?? fb.positiveFeedback ?? fb.PositiveFeedback) as EvaluationResult["positiveFeedback"],
    improvementAreas: (d.improvementAreas ?? d.ImprovementAreas ?? fb.improvementAreas ?? fb.ImprovementAreas) as EvaluationResult["improvementAreas"],
    strengths: (d.strengths ?? d.Strengths ?? fb.strengths ?? fb.Strengths) as EvaluationResult["strengths"],
    weaknesses: (d.weaknesses ?? d.Weaknesses ?? fb.weaknesses ?? fb.Weaknesses) as EvaluationResult["weaknesses"],
    missingRequirements: (fb.missingRequirements ?? fb.MissingRequirements ?? d.missingRequirements ?? d.MissingRequirements) as EvaluationResult["missingRequirements"],
    riskAssessment: (fb.riskAssessment ?? fb.RiskAssessment ?? d.riskAssessment ?? d.RiskAssessment) as EvaluationResult["riskAssessment"],
    rawAiReasoning: String(d.rawAiReasoning ?? d.RawAiReasoning ?? d.reasoning ?? d.Reasoning ?? ""),
    missionTitle: String(d.missionTitle ?? d.MissionTitle ?? ""),
    clientAcceptance: String(d.clientAcceptance ?? d.ClientAcceptance ?? "") || undefined,
    finalRecommendation: String(d.finalRecommendation ?? d.FinalRecommendation ?? "") || undefined,
    confidenceScore: Number(d.confidenceScore ?? d.ConfidenceScore ?? 0) || undefined,
    practicalityScore: Number(d.practicalityScore ?? d.PracticalityScore ?? 0) || undefined,
    professionalismScore: Number(d.professionalismScore ?? d.ProfessionalismScore ?? 0) || undefined,
    communicationScore: Number(d.communicationScore ?? d.CommunicationScore ?? 0) || undefined,
    creativityScore: Number(d.creativityScore ?? d.CreativityScore ?? 0) || undefined,
    planningScore: Number(d.planningScore ?? d.PlanningScore ?? 0) || undefined,
    improvementScore: Number(d.improvementScore ?? d.ImprovementScore ?? 0) || undefined,
    mentoringScore: Number(d.mentoringScore ?? d.MentoringScore ?? 0) || undefined,
    taskCompletionScore: Number(d.taskCompletionScore ?? d.TaskCompletionScore ?? 0) || undefined,
    evidenceScore: Number(d.evidenceScore ?? d.EvidenceScore ?? 0) || undefined,
    requiresReflection: Boolean(d.requiresReflection ?? d.RequiresReflection),
    netXpGained: Number(d.netXpGained ?? d.NetXpGained ?? 0) || undefined,
  };
}

export async function getEvaluationBySession(
  sessionId: string,
  maxRetries = 2
): Promise<{ ok: boolean; data?: EvaluationResult; notFound?: boolean; error?: string }> {
  let lastError = "";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await api.evaluations.getResult(sessionId);

    if (res.ok) {
      if (isNotFoundResponse(res)) {
        return { ok: false, notFound: true, error: "Evaluation still processing…" };
      }
      return { ok: true, data: normEvaluationResult(res.data) };
    }

    if (res.status === 401) {
      return { ok: false, error: "Your session has expired. Please log in again." };
    }

    if (isNotFoundResponse(res)) {
      return { ok: false, notFound: true, error: "Evaluation still processing…" };
    }

    lastError = res.error || lastError;

    if (attempt < maxRetries) {
      const delay = 2000 * (attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return { ok: false, error: lastError || "Could not load evaluation results. Please retry." };
}
