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
    data?.applicants ??
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
    item?.jobApplicationId ??
      item?.JobApplicationId ??
      item?.applicationId ??
      item?.ApplicationId ??
      item?.jobId ??
      item?.jobPostingId ??
      item?.postingId ??
      item?.candidateUserId ??
      item?.candidate?.userId ??
      item?.candidate?.UserId ??
      item?.candidate?.id ??
      item?.applicant?.userId ??
      item?.applicant?.UserId ??
      item?.candidateInfo?.userId ??
      item?.candidateInfo?.UserId ??
      item?.profile?.userId ??
      item?.profile?.UserId ??
      item?.user?.userId ??
      item?.user?.UserId ??
      item?.profileUserId ??
      item?.applicationUserId ??
      item?.userId ??
      item?.UserId ??
      item?.id ??
      ""
  );
}

export function profileDetailsOf(item: any): any {
  return (
    item?.profileDetails ??
    item?.ProfileDetails ??
    item?.candidate?.profileDetails ??
    item?.candidate?.ProfileDetails ??
    item?.applicant?.profileDetails ??
    item?.applicant?.ProfileDetails ??
    item?.candidateInfo?.profileDetails ??
    item?.candidateInfo?.ProfileDetails ??
    null
  );
}

export function applicantUserId(item: any): string {
  const profile = profileDetailsOf(item);
  return text(
    profile?.userId ??
      profile?.UserId ??
      item?.userId ??
      item?.UserId ??
      item?.candidateUserId ??
      item?.CandidateUserId ??
      item?.applicantUserId ??
      item?.ApplicantUserId ??
      item?.candidate?.userId ??
      item?.candidate?.UserId ??
      item?.applicant?.userId ??
      item?.applicant?.UserId,
    ""
  );
}

export function applicationProblemNodeId(item: any, job?: any): string {
  return text(
    item?.problemNodeId ??
      item?.ProblemNodeId ??
      item?.linkedAssessmentNodeId ??
      item?.LinkedAssessmentNodeId ??
      item?.linkAssessmentNodeId ??
      item?.LinkAssessmentNodeId ??
      job?.problemNodeId ??
      job?.ProblemNodeId ??
      job?.linkedAssessmentNodeId ??
      job?.LinkedAssessmentNodeId ??
      job?.linkAssessmentNodeId ??
      job?.LinkAssessmentNodeId ??
      job?.assessmentNodeId ??
      job?.AssessmentNodeId,
    ""
  );
}

export function candidateName(item: any): string {
  const profile = profileDetailsOf(item);
  const source = item?.candidate ?? item?.applicant ?? item?.candidateInfo ?? item?.profile ?? item?.user ?? item;
  const first = source?.firstName ?? source?.FirstName ?? item?.firstName ?? item?.FirstName;
  const last =
    source?.surName ??
    source?.SurName ??
    source?.surname ??
    source?.Surname ??
    source?.lastName ??
    source?.LastName ??
    item?.surName ??
    item?.SurName ??
    item?.lastName ??
    item?.LastName;
  const candidates = [
    profile?.fullName,
    profile?.FullName,
    source?.displayName,
    source?.DisplayName,
    source?.fullName,
    source?.FullName,
    item?.displayName,
    item?.DisplayName,
    `${first ?? ""} ${last ?? ""}`.trim(),
    source?.candidateName,
    source?.CandidateName,
    item?.candidateName,
    item?.CandidateName,
    source?.name,
    source?.Name,
  ];
  const name = candidates
    .map((value) => text(value, ""))
    .find((value) => value && !["candidate", "applicant"].includes(value.toLowerCase()));
  return text(name, "Name unavailable");
}

export function candidateAvatar(item: any): string {
  const profile = profileDetailsOf(item);
  const source = item?.candidate ?? item?.applicant ?? item?.candidateInfo ?? item?.profile ?? item?.user ?? item;
  return text(
    profile?.avatarUrl ??
      profile?.AvatarUrl ??
      source?.avatarUrl ??
      source?.AvatarUrl ??
      source?.profilePictureUrl ??
      source?.ProfilePictureUrl ??
      source?.photoUrl ??
      source?.PhotoUrl ??
      item?.avatarUrl ??
      item?.AvatarUrl,
    ""
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

export function formatDate(value: unknown, fallback = "Date unavailable"): string {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? text(value, fallback) : date.toLocaleDateString();
}

export function formatDisplayDate(value: unknown, fallback = "Date unavailable"): string {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? text(value, fallback)
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function expiryDateOf(item: any): unknown {
  return (
    item?.expiryDate ??
    item?.ExpiryDate ??
    item?.expiresAt ??
    item?.ExpiresAt ??
    item?.expirationDate ??
    item?.ExpirationDate ??
    item?.expiresOn ??
    item?.ExpiresOn ??
    item?.applicationDeadline ??
    item?.ApplicationDeadline ??
    item?.deadline ??
    item?.Deadline
  );
}

export function formatExpiryDate(item: any): string {
  return formatDisplayDate(expiryDateOf(item), "No expiry");
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}
