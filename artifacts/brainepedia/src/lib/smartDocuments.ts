import { api, type ApiResult } from "@/lib/api";

export type SmartDocument = {
  smartDocHistoryId: string;
  documentType: string;
  chargedFee: number;
  dateCreated: string | null;
  rawContent: string | null;
};

export type SmartDocumentPage = {
  userId: string;
  profileId: string;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  documents: SmartDocument[];
};

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

export function normalizeSmartDocument(raw: unknown): SmartDocument {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    smartDocHistoryId: text(item.smartDocHistoryId ?? item.SmartDocHistoryId),
    documentType: text(item.documentType ?? item.DocumentType) || "CV",
    chargedFee: Number(item.chargedFee ?? item.ChargedFee ?? 0) || 0,
    dateCreated: text(item.dateCreated ?? item.DateCreated) || null,
    rawContent: text(item.rawContent ?? item.RawContent) || null,
  };
}

export function normalizeSmartDocumentPage(raw: unknown, pageNumber = 1, pageSize = 20): SmartDocumentPage {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const documentsRaw = root.documents ?? root.Documents ?? root.items ?? [];
  const documents = Array.isArray(documentsRaw) ? documentsRaw.map(normalizeSmartDocument) : [];
  const totalCount = Number(root.totalCount ?? root.TotalCount ?? documents.length) || 0;
  const size = Number(root.pageSize ?? root.PageSize ?? pageSize) || pageSize;
  return {
    userId: text(root.userId ?? root.UserId),
    profileId: text(root.profileId ?? root.ProfileId),
    totalCount,
    pageNumber: Number(root.pageNumber ?? root.PageNumber ?? pageNumber) || pageNumber,
    pageSize: size,
    totalPages: Number(root.totalPages ?? root.TotalPages ?? Math.max(1, Math.ceil(totalCount / Math.max(size, 1)))) || 1,
    documents: documents.filter((item) => item.smartDocHistoryId),
  };
}

/** Nigeria stores this timestamp without a zone. Keep the clock time in Africa/Lagos. */
export function formatNigeriaTimestamp(value: string | null | undefined): string {
  if (!value) return "";
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(hasZone ? normalized : `${normalized}+01:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export async function listSmartDocuments(
  userId: string,
  params: { documentType?: string; includeContent?: boolean; pageNumber?: number; pageSize?: number } = {},
): Promise<ApiResult<SmartDocumentPage>> {
  const res = await api.profiles.listSmartDocuments(userId, params);
  if (!res.ok) return res;
  return {
    ...res,
    data: normalizeSmartDocumentPage(res.data, params.pageNumber ?? 1, params.pageSize ?? 20),
  };
}

export async function getSmartDocument(userId: string, smartDocHistoryId: string): Promise<ApiResult<SmartDocument>> {
  const res = await api.profiles.getSmartDocument(userId, smartDocHistoryId);
  if (!res.ok) return res;
  return { ...res, data: normalizeSmartDocument(res.data) };
}
