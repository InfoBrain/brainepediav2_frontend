import { fetchApi, type ApiResult } from "./api";
import type { FeedSettingsDto } from "./types/socialFeed";

export const DEFAULT_FEED_SETTINGS: FeedSettingsDto = {
  shareXpProgress: false,
  shareMissionResults: false,
  sharePortfolioUpdates: false,
};

export function normalizeFeedSettings(raw: unknown): FeedSettingsDto {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    shareXpProgress: item.shareXpProgress === true,
    shareMissionResults: item.shareMissionResults === true,
    sharePortfolioUpdates: item.sharePortfolioUpdates === true,
  };
}

export async function getFeedSettings(): Promise<ApiResult<FeedSettingsDto>> {
  const res = await fetchApi("/api/Feed/settings");
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedSettings(res.data) };
}

export async function updateFeedSettings(body: FeedSettingsDto): Promise<ApiResult<FeedSettingsDto>> {
  const payload: FeedSettingsDto = {
    shareXpProgress: body.shareXpProgress === true,
    shareMissionResults: body.shareMissionResults === true,
    sharePortfolioUpdates: body.sharePortfolioUpdates === true,
  };
  const res = await fetchApi("/api/Feed/settings", { method: "PUT", body: JSON.stringify(payload) });
  if (!res.ok) return res;
  return { ...res, data: normalizeFeedSettings(res.data ?? payload) };
}
