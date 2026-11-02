import { fetchApi, queryString, type ApiResult } from "./api";
import { readPage } from "./paged";
import { clampPageSize } from "./safeUrl";
import type { ExternalJobCreateDto, ExternalJobDto, ExternalJobQuery, PagedResult } from "./types/socialFeed";

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

export function normalizeExternalJob(raw: unknown): ExternalJobDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  return {
    externalJobId: String(item.externalJobId ?? item.id ?? ""),
    jobTitle: nullableString(item.jobTitle),
    jobDescription: nullableString(item.jobDescription),
    organisationName: nullableString(item.organisationName),
    organisationLogoUrl: nullableString(item.organisationLogoUrl),
    organisationWebsite: nullableString(item.organisationWebsite),
    location: nullableString(item.location),
    country: nullableString(item.country),
    employmentType: nullableString(item.employmentType),
    experienceLevel: nullableString(item.experienceLevel),
    salaryInformation: nullableString(item.salaryInformation),
    applicationType: nullableString(item.applicationType) ?? "External",
    applicationUrl: nullableString(item.applicationUrl),
    professionId: nullableString(item.professionId),
    professionName: nullableString(item.professionName),
    closingDate: nullableString(item.closingDate),
    createdAt: nullableString(item.createdAt),
    isActive: typeof item.isActive === "boolean" ? item.isActive : null,
    shareToFeed: typeof item.shareToFeed === "boolean" ? item.shareToFeed : null,
    createdByUserId: nullableString(item.createdByUserId),
    updatedAt: nullableString(item.updatedAt),
  };
}

export async function listActiveExternalJobs(
  query: ExternalJobQuery = {},
): Promise<ApiResult<PagedResult<ExternalJobDto>>> {
  const endpoint = `/api/ExternalJobs/active${queryString({
    search: query.search,
    profession: query.profession,
    location: query.location,
    employmentType: query.employmentType,
    experienceLevel: query.experienceLevel,
    organisation: query.organisation,
    pageNumber: query.pageNumber ?? 1,
    pageSize: clampPageSize(query.pageSize),
  })}`;
  const res = await fetchApi(endpoint, { skipAuth: true, suppressUnauthorized: true });
  if (!res.ok) return res;
  return {
    ...res,
    data: readPage(res.data, normalizeExternalJob, query.pageNumber ?? 1, clampPageSize(query.pageSize), res.pagination),
  };
}

export async function listAdminExternalJobs(
  pageNumber = 1,
  pageSize = 20,
): Promise<ApiResult<PagedResult<ExternalJobDto>>> {
  const endpoint = `/api/ExternalJobs${queryString({ pageNumber, pageSize: clampPageSize(pageSize) })}`;
  const res = await fetchApi(endpoint, { suppressForbidden: true });
  if (!res.ok) return res;
  return {
    ...res,
    data: readPage(res.data, normalizeExternalJob, pageNumber, clampPageSize(pageSize), res.pagination),
  };
}

export async function getExternalJob(id: string): Promise<ApiResult<ExternalJobDto>> {
  const res = await fetchApi(`/api/ExternalJobs/${encodeURIComponent(id)}`, { suppressForbidden: true });
  if (!res.ok) return res;
  return { ...res, data: normalizeExternalJob(res.data) };
}

export async function createExternalJob(body: ExternalJobCreateDto): Promise<ApiResult<ExternalJobDto>> {
  const res = await fetchApi("/api/ExternalJobs", {
    method: "POST",
    body: JSON.stringify(body),
    suppressForbidden: true,
  });
  if (!res.ok) return res;
  return { ...res, data: normalizeExternalJob(res.data) };
}

export async function updateExternalJob(id: string, body: ExternalJobCreateDto): Promise<ApiResult<ExternalJobDto>> {
  const res = await fetchApi(`/api/ExternalJobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
    suppressForbidden: true,
  });
  if (!res.ok) return res;
  return { ...res, data: normalizeExternalJob(res.data) };
}

export async function deleteExternalJob(id: string): Promise<ApiResult> {
  return fetchApi(`/api/ExternalJobs/${encodeURIComponent(id)}`, { method: "DELETE", suppressForbidden: true });
}
