export type MissionActivityItem = {
  id: string;
  userName: string;
  userId?: string | null;
  missionTitle: string;
  activityType: string;
  xpEarned?: number | null;
  createdAt?: string;
  description?: string;
};

export type MissionActivityPage = {
  items: MissionActivityItem[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normMissionActivityItem(raw: Record<string, unknown>): MissionActivityItem {
  const user = (raw.user ?? raw.User ?? raw.performedBy ?? raw.PerformedBy) as Record<string, unknown> | string | undefined;
  const userName =
    typeof user === "string"
      ? user
      : str(user?.nickName ?? user?.NickName ?? user?.firstName ?? user?.FirstName ?? user?.name ?? user?.Name) ||
        str(raw.userName ?? raw.UserName ?? raw.nickName ?? raw.NickName ?? raw.performedBy ?? raw.PerformedBy) ||
        "Member";

  const missionTitle =
    str(
      raw.missionTitle ??
        raw.MissionTitle ??
        raw.problemNodeTitle ??
        raw.ProblemNodeTitle ??
        raw.challengeName ??
        raw.ChallengeName ??
        raw.title ??
        raw.Title,
    ) || "Mission";

  const activityType =
    str(raw.activityType ?? raw.ActivityType ?? raw.type ?? raw.Type ?? raw.activity ?? raw.Activity) || "activity";

  const xpRaw =
    raw.xpEarned ??
    raw.XpEarned ??
    raw.xp ??
    raw.Xp ??
    raw.experiencePoints ??
    raw.ExperiencePoints ??
    raw.netXpGained ??
    raw.NetXpGained;

  return {
    id: str(raw.activityLogId ?? raw.ActivityLogId ?? raw.id ?? raw.Id) || `${userName}-${missionTitle}-${raw.dateCreated ?? raw.createdAt ?? Date.now()}`,
    userName,
    userId: str(raw.userId ?? raw.UserId ?? (typeof user === "object" ? user?.userId ?? user?.UserId ?? user?.id ?? user?.Id : "")) || null,
    missionTitle,
    activityType,
    xpEarned: num(xpRaw),
    createdAt: str(raw.createdAt ?? raw.CreatedAt ?? raw.dateCreated ?? raw.DateCreated ?? raw.timestamp ?? raw.Timestamp) || undefined,
    description: str(raw.description ?? raw.Description ?? raw.activity ?? raw.Activity ?? raw.message ?? raw.Message) || undefined,
  };
}

export function normMissionActivityPage(data: unknown): MissionActivityPage {
  const d = (data ?? {}) as Record<string, unknown>;
  const itemsRaw =
    Array.isArray(data)
      ? data
      : Array.isArray(d.items)
        ? d.items
        : Array.isArray(d.Items)
          ? d.Items
          : Array.isArray(d.data)
            ? d.data
            : Array.isArray(d.Data)
              ? d.Data
              : Array.isArray(d.activities)
                ? d.activities
                : Array.isArray(d.Activities)
                  ? d.Activities
                  : Array.isArray(d.logs)
                    ? d.logs
                    : [];

  const items = (itemsRaw as Record<string, unknown>[]).map(normMissionActivityItem);
  const totalCount = num(d.totalCount ?? d.TotalCount) ?? items.length;
  const pageSize = num(d.pageSize ?? d.PageSize) ?? items.length;
  const currentPage = num(d.currentPage ?? d.CurrentPage ?? d.pageNumber ?? d.PageNumber ?? d.page ?? d.Page) ?? 1;
  const totalPages = num(d.totalPages ?? d.TotalPages) ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1);

  return {
    items,
    totalCount,
    pageSize,
    currentPage,
    totalPages,
    hasNext: Boolean(d.hasNext ?? d.HasNext ?? currentPage < totalPages),
    hasPrevious: Boolean(d.hasPrevious ?? d.HasPrevious ?? currentPage > 1),
  };
}

export function missionActivityLabel(item: MissionActivityItem): string {
  const type = item.activityType.toLowerCase();
  if (type.includes("complete") || type.includes("completed") || type.includes("finish")) {
    return "completed";
  }
  if (type.includes("start") || type.includes("began") || type.includes("started")) {
    return "started";
  }
  return type;
}

export function missionActivitySubtext(item: MissionActivityItem): string {
  const label = missionActivityLabel(item);
  if (label === "completed" && item.xpEarned && item.xpEarned > 0) {
    return `+${item.xpEarned} XP`;
  }
  if (label === "started") {
    return "Started a mission";
  }
  if (item.description && item.description !== item.missionTitle) {
    return item.description;
  }
  return "";
}
