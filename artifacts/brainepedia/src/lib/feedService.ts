import { fetchApi, queryString, type ApiResult } from "./api";
import { getToken } from "./auth";
import { readPage } from "./paged";
import { clampPageSize } from "./safeUrl";
import type {
  FeedCommentDto,
  FeedLikeResponseDto,
  FeedListResponse,
  FeedPostCreateDto,
  FeedPostDto,
  FeedQuery,
  PagedResult,
} from "./types/socialFeed";

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeFeedPost(raw: unknown): FeedPostDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const authorRaw = item.author && typeof item.author === "object" ? item.author : null;
  const relatedRaw = item.relatedEntity && typeof item.relatedEntity === "object" ? item.relatedEntity : null;
  return {
    feedPostId: String(item.feedPostId ?? ""),
    postType: nullableString(item.postType) ?? "UserPost",
    title: nullableString(item.title),
    content: nullableString(item.content),
    mediaUrl: nullableString(item.mediaUrl),
    thumbnailUrl: nullableString(item.thumbnailUrl),
    author: authorRaw
      ? {
          userId: nullableString(authorRaw.userId),
          fullName: nullableString(authorRaw.fullName),
          avatarUrl: nullableString(authorRaw.avatarUrl),
        }
      : null,
    relatedEntity: relatedRaw
      ? { type: nullableString(relatedRaw.type), id: nullableString(relatedRaw.id) }
      : null,
    professionId: nullableString(item.professionId),
    topicId: nullableString(item.topicId),
    jobPostingId: nullableString(item.jobPostingId),
    externalJobId: nullableString(item.externalJobId),
    organisationName: nullableString(item.organisationName),
    linkUrl: nullableString(item.linkUrl),
    visibility: nullableString(item.visibility),
    likeCount: nullableNumber(item.likeCount),
    commentCount: nullableNumber(item.commentCount),
    isLikedByCurrentUser: Boolean(item.isLikedByCurrentUser),
    isFollowedByCurrentUser: Boolean(item.isFollowedByCurrentUser),
    isFollowingAuthor: Boolean(item.isFollowingAuthor),
    publishedAt: nullableString(item.publishedAt),
    createdAt: nullableString(item.createdAt),
  };
}

export function normalizeFeedComment(raw: unknown): FeedCommentDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const authorRaw = item.author && typeof item.author === "object" ? item.author : null;
  return {
    commentId: String(item.commentId ?? ""),
    postId: String(item.postId ?? ""),
    content: nullableString(item.content),
    author: authorRaw
      ? {
          userId: nullableString(authorRaw.userId),
          fullName: nullableString(authorRaw.fullName),
          avatarUrl: nullableString(authorRaw.avatarUrl),
        }
      : null,
    createdAt: nullableString(item.createdAt),
    updatedAt: nullableString(item.updatedAt),
  };
}

function feedQuery(query: FeedQuery): string {
  return queryString({
    pageNumber: query.pageNumber ?? 1,
    pageSize: clampPageSize(query.pageSize),
    search: query.search,
    postType: query.postType,
    professionId: query.professionId,
    topic: query.topic,
    jobId: query.jobId,
    candidateId: query.candidateId,
    organisation: query.organisation,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });
}

export async function listFeed(query: FeedQuery = {}): Promise<ApiResult<PagedResult<FeedPostDto>>> {
  const endpoint = `/api/Feed${feedQuery(query)}`;
  const hasToken = Boolean(getToken());
  let res = await fetchApi<FeedListResponse>(endpoint, {
    suppressUnauthorized: true,
    skipAuth: !hasToken,
  });
  if (!res.ok && res.status === 401 && hasToken) {
    res = await fetchApi<FeedListResponse>(endpoint, { skipAuth: true, suppressUnauthorized: true });
  }
  if (!res.ok) return res;
  return {
    ...res,
    data: readPage(res.data, normalizeFeedPost, query.pageNumber ?? 1, clampPageSize(query.pageSize), res.pagination),
  };
}

export async function getFeedPost(id: string): Promise<ApiResult<FeedPostDto>> {
  const endpoint = `/api/Feed/posts/${encodeURIComponent(id)}`;
  const hasToken = Boolean(getToken());
  let res = await fetchApi(endpoint, { suppressUnauthorized: true, skipAuth: !hasToken });
  if (!res.ok && res.status === 401 && hasToken) {
    res = await fetchApi(endpoint, { skipAuth: true, suppressUnauthorized: true });
  }
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedPost(res.data) };
}

function appendText(form: FormData, key: string, value: string | null | undefined) {
  const text = value?.trim();
  if (text) form.append(key, text);
}

/** Multipart when a cover file is attached. JSON otherwise. Thumbnail is never sent. */
export function buildFeedPostRequest(body: FeedPostCreateDto): FormData | Record<string, unknown> {
  if (body.media) {
    const form = new FormData();
    form.append("Content", body.content);
    appendText(form, "Title", body.title);
    form.append("Media", body.media);
    appendText(form, "ProfessionId", body.professionId);
    appendText(form, "TopicId", body.topicId);
    appendText(form, "Visibility", body.visibility);
    return form;
  }

  const json: Record<string, unknown> = { content: body.content };
  if (body.title?.trim()) json.title = body.title.trim();
  if (body.mediaUrl?.trim()) json.mediaUrl = body.mediaUrl.trim();
  if (body.professionId) json.professionId = body.professionId;
  if (body.topicId) json.topicId = body.topicId;
  if (body.visibility) json.visibility = body.visibility;
  return json;
}

function feedRequestBody(body: FeedPostCreateDto): BodyInit {
  const payload = buildFeedPostRequest(body);
  return payload instanceof FormData ? payload : JSON.stringify(payload);
}

export async function createFeedPost(body: FeedPostCreateDto): Promise<ApiResult<FeedPostDto>> {
  const res = await fetchApi("/api/Feed/posts", { method: "POST", body: feedRequestBody(body) });
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedPost(res.data) };
}

export async function updateFeedPost(id: string, body: FeedPostCreateDto): Promise<ApiResult<FeedPostDto>> {
  const res = await fetchApi(`/api/Feed/posts/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: feedRequestBody(body),
  });
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedPost(res.data) };
}

export async function deleteFeedPost(id: string): Promise<ApiResult> {
  return fetchApi(`/api/Feed/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function likeFeedPost(postId: string): Promise<ApiResult<FeedLikeResponseDto>> {
  const res = await fetchApi(`/api/Feed/posts/${encodeURIComponent(postId)}/like`, { method: "POST" });
  if (!res.ok) return res;
  return { ...res, data: normalizeLike(res.data, postId, true) };
}

export async function unlikeFeedPost(postId: string): Promise<ApiResult<FeedLikeResponseDto>> {
  const res = await fetchApi(`/api/Feed/posts/${encodeURIComponent(postId)}/like`, { method: "DELETE" });
  if (!res.ok) return res;
  return { ...res, data: normalizeLike(res.data, postId, false) };
}

function normalizeLike(raw: unknown, postId: string, fallbackLiked: boolean): FeedLikeResponseDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    postId: String(item.postId ?? postId),
    liked: typeof item.liked === "boolean" ? item.liked : fallbackLiked,
    likeCount: typeof item.likeCount === "number" ? item.likeCount : 0,
  };
}

export async function listFeedComments(
  postId: string,
  pageNumber = 1,
  pageSize = 20,
): Promise<ApiResult<PagedResult<FeedCommentDto>>> {
  const endpoint = `/api/Feed/posts/${encodeURIComponent(postId)}/comments${queryString({
    pageNumber,
    pageSize: clampPageSize(pageSize),
  })}`;
  const hasToken = Boolean(getToken());
  let res = await fetchApi(endpoint, { suppressUnauthorized: true, skipAuth: !hasToken });
  if (!res.ok && res.status === 401 && hasToken) {
    res = await fetchApi(endpoint, { skipAuth: true, suppressUnauthorized: true });
  }
  if (!res.ok) return res;
  return {
    ...res,
    data: readPage(res.data, normalizeFeedComment, pageNumber, clampPageSize(pageSize), res.pagination),
  };
}

export async function createFeedComment(postId: string, content: string): Promise<ApiResult<FeedCommentDto>> {
  const res = await fetchApi(`/api/Feed/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedComment(res.data) };
}

export async function updateFeedComment(commentId: string, content: string): Promise<ApiResult<FeedCommentDto>> {
  const res = await fetchApi(`/api/Feed/comments/${encodeURIComponent(commentId)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedComment(res.data) };
}

export async function deleteFeedComment(commentId: string): Promise<ApiResult> {
  return fetchApi(`/api/Feed/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
}
