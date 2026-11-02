import type { PaginationHeader } from "./api";
import type { PagedResult } from "./types/socialFeed";

export function readPage<T>(
  data: unknown,
  mapItem: (item: unknown) => T,
  fallbackPage = 1,
  fallbackSize = 20,
  header?: PaginationHeader | null,
): PagedResult<T> {
  if (Array.isArray(data)) {
    const items = data.map(mapItem);
    return {
      items,
      totalCount: header?.totalCount ?? items.length,
      pageNumber: header?.currentPage ?? fallbackPage,
      pageSize: header?.pageSize ?? fallbackSize,
      totalPages: header?.totalPages ?? (items.length ? 1 : 0),
    };
  }
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems.map(mapItem);
  const pageSize = numberFrom(record.pageSize) ?? header?.pageSize ?? fallbackSize;
  const totalCount = numberFrom(record.totalCount) ?? header?.totalCount ?? items.length;
  const pageNumber = numberFrom(record.pageNumber) ?? header?.currentPage ?? fallbackPage;
  const totalPages =
    numberFrom(record.totalPages) ??
    header?.totalPages ??
    (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0);
  return { items, totalCount, pageNumber, pageSize, totalPages };
}

function numberFrom(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}
