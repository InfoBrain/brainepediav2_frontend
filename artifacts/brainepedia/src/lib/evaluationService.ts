import { api } from "./api";

export interface ProcessResult {
  evaluationId?: string;
  score: number;
  isPassed: boolean;
  feedback?: {
    positiveFeedback?: string;
    improvementAreas?: string;
    strengths?: string;
    weaknesses?: string;
  };
  netXpGained?: number;
  missionTitle?: string;
}

export interface EvaluationResult {
  score: number;
  isPassed: boolean;
  positiveFeedback?: string | string[];
  improvementAreas?: string | string[];
  strengths?: string | string[];
  weaknesses?: string | string[];
  rawAiReasoning?: string;
  missionTitle?: string;
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
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`[evaluationService] processEvaluation attempt ${attempt + 1} for submission: ${submissionId}`);
    const res = await api.evaluations.process(submissionId);
    console.log(`[evaluationService] process response:`, { ok: res.ok, status: res.status, data: res.data, error: res.error });

    if (res.ok) {
      return { ok: true, data: res.data as ProcessResult };
    }

    if (res.status === 401) {
      console.log(`[evaluationService] processEvaluation got 401 — session expired, not retrying`);
      return { ok: false, error: "Your session has expired. Please log in again." };
    }

    if (attempt < maxRetries) {
      const delay = 2000 * (attempt + 1);
      console.log(`[evaluationService] retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return { ok: false, error: "Evaluation failed after retries. Please try again." };
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

export async function getEvaluationBySession(
  sessionId: string,
  maxRetries = 2
): Promise<{ ok: boolean; data?: EvaluationResult; notFound?: boolean; error?: string }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`[evaluationService] getEvaluationBySession attempt ${attempt + 1} for session: ${sessionId}`);
    const res = await api.evaluations.getResult(sessionId);
    console.log(`[evaluationService] getResult response:`, { ok: res.ok, status: res.status, data: res.data, error: res.error });

    if (res.ok) {
      if (isNotFoundResponse(res)) {
        return { ok: false, notFound: true, error: "Evaluation still processing…" };
      }
      return { ok: true, data: res.data as EvaluationResult };
    }

    if (res.status === 401) {
      console.log(`[evaluationService] getEvaluationBySession got 401 — session expired, not retrying`);
      return { ok: false, error: "Your session has expired. Please log in again." };
    }

    if (isNotFoundResponse(res)) {
      return { ok: false, notFound: true, error: "Evaluation still processing…" };
    }

    if (attempt < maxRetries) {
      const delay = 2000 * (attempt + 1);
      console.log(`[evaluationService] retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return { ok: false, error: "Could not load evaluation results. Please retry." };
}
