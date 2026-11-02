import { fetchApi, type ApiResult } from "./api";
import type {
  CompatibilityReportDto,
  CompatibilityReportRequestDto,
  CompatibilityResultDto,
} from "./types/socialFeed";

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeResult(raw: unknown): CompatibilityResultDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  return {
    jobId: String(item.jobId ?? ""),
    jobType: nullableString(item.jobType),
    jobTitle: nullableString(item.jobTitle),
    organisationName: nullableString(item.organisationName),
    compatibilityScore: typeof item.compatibilityScore === "number" ? item.compatibilityScore : null,
    compatibilityLevel: nullableString(item.compatibilityLevel),
    whyItMatches: stringList(item.whyItMatches),
    matchingSkills: stringList(item.matchingSkills),
    matchingExperience: stringList(item.matchingExperience),
    missingSkills: stringList(item.missingSkills),
    missingExperience: stringList(item.missingExperience),
    improvementRecommendations: stringList(item.improvementRecommendations),
    applicationUrl: nullableString(item.applicationUrl),
    applicationType: nullableString(item.applicationType),
  };
}

export function normalizeCompatibilityReport(raw: unknown): CompatibilityReportDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const candidateRaw = item.candidate && typeof item.candidate === "object" ? item.candidate : null;
  return {
    reportId: nullableString(item.reportId),
    candidate: candidateRaw
      ? {
          userId: nullableString(candidateRaw.userId),
          fullName: nullableString(candidateRaw.fullName),
          profession: nullableString(candidateRaw.profession),
        }
      : null,
    totalJobsEvaluated: typeof item.totalJobsEvaluated === "number" ? item.totalJobsEvaluated : null,
    results: Array.isArray(item.results) ? item.results.map(normalizeResult) : [],
    generalRecommendations: stringList(item.generalRecommendations),
    disclaimer: nullableString(item.disclaimer),
  };
}

export async function createCompatibilityReport(
  body: CompatibilityReportRequestDto,
): Promise<ApiResult<CompatibilityReportDto>> {
  const payload: CompatibilityReportRequestDto = {
    jobIds: Array.isArray(body.jobIds) ? body.jobIds.filter(Boolean) : [],
    includeInternalJobs: body.includeInternalJobs !== false,
    includeExternalJobs: body.includeExternalJobs !== false,
    professionId: body.professionId || null,
    customInstruction: body.customInstruction?.trim() ? body.customInstruction.trim() : "",
  };
  const res = await fetchApi("/api/Jobs/compatibility-report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return res;
  return { ...res, data: normalizeCompatibilityReport(res.data) };
}
