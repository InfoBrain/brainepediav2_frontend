export type ListMeta = {
  page: number;
  pageSize: number;
  totalCount?: number;
  totalPages?: number;
};

export function asList(data: any): any[] {
  if (Array.isArray(data)) return data;
  const candidate =
    data?.items ??
    data?.results ??
    data?.data ??
    data?.jobs ??
    data?.postings ??
    data?.candidates ??
    data?.applications ??
    data?.savedCandidates ??
    data?.threads ??
    [];
  return Array.isArray(candidate) ? candidate : [];
}

export function listMeta(data: any, fallbackPage = 1, fallbackPageSize = 10): ListMeta {
  const totalCount = numberish(data?.totalCount ?? data?.total ?? data?.count);
  const pageSize = numberish(data?.pageSize ?? data?.perPage) ?? fallbackPageSize;
  return {
    page: numberish(data?.page ?? data?.currentPage) ?? fallbackPage,
    pageSize,
    totalCount,
    totalPages: numberish(data?.totalPages) ?? (totalCount ? Math.ceil(totalCount / pageSize) : undefined),
  };
}

export function numberish(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function text(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const out = String(value).trim();
  return out || fallback;
}

export function idOf(item: any): string {
  return String(
    item?.jobId ??
      item?.jobPostingId ??
      item?.postingId ??
      item?.applicationId ??
      item?.candidateUserId ??
      item?.userId ??
      item?.id ??
      ""
  );
}

export function candidateName(item: any): string {
  return text(
    item?.fullName ??
      item?.candidateName ??
      item?.name ??
      `${item?.firstName ?? ""} ${item?.lastName ?? item?.surName ?? ""}`.trim(),
    "Candidate"
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function formatNumber(value: unknown): string {
  const n = numberish(value);
  return n === undefined ? "—" : n.toLocaleString();
}
