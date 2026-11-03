import { fetchApi, queryString, type ApiResult } from "@/lib/api";

export type EmailDeliveryStatus = "Pending" | "Sent" | "Failed";

export type EmailDeliveryLog = {
  emailDeliveryLogId: string;
  recipientEmail: string;
  recipientUserId: string | null;
  subject: string;
  source: string;
  deliveryStatus: string;
  failureSummary: string | null;
  createdAtUtc: string | null;
};

export type EmailLogQuery = {
  pageNumber?: number;
  pageSize?: number;
  status?: EmailDeliveryStatus | "";
  recipient?: string;
  source?: string;
  fromUtc?: string;
  toUtc?: string;
};

export type EmailLogPage = {
  items: EmailDeliveryLog[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

export function normalizeEmailLog(raw: unknown): EmailDeliveryLog {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    emailDeliveryLogId: text(item.emailDeliveryLogId ?? item.EmailDeliveryLogId),
    recipientEmail: text(item.recipientEmail ?? item.RecipientEmail),
    recipientUserId: text(item.recipientUserId ?? item.RecipientUserId) || null,
    subject: text(item.subject ?? item.Subject),
    source: text(item.source ?? item.Source),
    deliveryStatus: text(item.deliveryStatus ?? item.DeliveryStatus) || "Pending",
    failureSummary: text(item.failureSummary ?? item.FailureSummary) || null,
    createdAtUtc: text(item.createdAtUtc ?? item.CreatedAtUtc) || null,
  };
}

export function normalizeEmailLogPage(raw: unknown, pageNumber = 1, pageSize = 20): EmailLogPage {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const itemsRaw = root.items ?? root.Items ?? [];
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeEmailLog) : [];
  const totalCount = Number(root.totalCount ?? root.TotalCount ?? items.length) || 0;
  const size = Number(root.pageSize ?? root.PageSize ?? pageSize) || pageSize;
  return {
    items,
    totalCount,
    pageNumber: Number(root.pageNumber ?? root.PageNumber ?? pageNumber) || pageNumber,
    pageSize: size,
    totalPages: Number(root.totalPages ?? root.TotalPages ?? Math.max(1, Math.ceil(totalCount / Math.max(size, 1)))) || 1,
  };
}

export async function listEmailLogs(query: EmailLogQuery = {}): Promise<ApiResult<EmailLogPage>> {
  const pageNumber = query.pageNumber ?? 1;
  const pageSize = query.pageSize ?? 20;
  const res = await fetchApi(`/api/EmailLogs${queryString({
    pageNumber,
    pageSize,
    status: query.status || undefined,
    recipient: query.recipient,
    source: query.source,
    fromUtc: query.fromUtc,
    toUtc: query.toUtc,
  })}`);
  if (!res.ok) return res;
  return { ...res, data: normalizeEmailLogPage(res.data, pageNumber, pageSize) };
}
