import { fetchApi, queryString, type ApiResult } from "./api";
import { readPage } from "./paged";
import { clampPageSize } from "./safeUrl";
import type { FollowResponseDto, PagedResult, PublicFollowUserDto } from "./types/socialFeed";

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

export function normalizeFollowUser(raw: unknown): PublicFollowUserDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    userId: String(item.userId ?? ""),
    fullName: nullableString(item.fullName),
    avatarUrl: nullableString(item.avatarUrl),
    profession: nullableString(item.profession),
    currentTitle: nullableString(item.currentTitle),
  };
}

function normalizeFollowResponse(raw: unknown, userId: string, fallbackFollowing: boolean): FollowResponseDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    userId: String(item.userId ?? userId),
    following: typeof item.following === "boolean" ? item.following : fallbackFollowing,
    followerCount: typeof item.followerCount === "number" ? item.followerCount : null,
  };
}

export async function followUser(userId: string): Promise<ApiResult<FollowResponseDto>> {
  const res = await fetchApi(`/api/Users/${encodeURIComponent(userId)}/follow`, { method: "POST" });
  if (!res.ok) return res;
  return { ...res, data: normalizeFollowResponse(res.data, userId, true) };
}

export async function unfollowUser(userId: string): Promise<ApiResult<FollowResponseDto>> {
  const res = await fetchApi(`/api/Users/${encodeURIComponent(userId)}/follow`, { method: "DELETE" });
  if (!res.ok) return res;
  return { ...res, data: normalizeFollowResponse(res.data, userId, false) };
}

export async function listFollowers(
  userId: string,
  pageNumber = 1,
  pageSize = 20,
): Promise<ApiResult<PagedResult<PublicFollowUserDto>>> {
  return listRelation(userId, "followers", pageNumber, pageSize);
}

export async function listFollowing(
  userId: string,
  pageNumber = 1,
  pageSize = 20,
): Promise<ApiResult<PagedResult<PublicFollowUserDto>>> {
  return listRelation(userId, "following", pageNumber, pageSize);
}

async function listRelation(
  userId: string,
  relation: "followers" | "following",
  pageNumber: number,
  pageSize: number,
): Promise<ApiResult<PagedResult<PublicFollowUserDto>>> {
  const endpoint = `/api/Users/${encodeURIComponent(userId)}/${relation}${queryString({
    pageNumber,
    pageSize: clampPageSize(pageSize),
  })}`;
  const res = await fetchApi(endpoint, { skipAuth: true, suppressUnauthorized: true });
  if (!res.ok) return res;
  return {
    ...res,
    data: readPage(res.data, normalizeFollowUser, pageNumber, clampPageSize(pageSize), res.pagination),
  };
}
