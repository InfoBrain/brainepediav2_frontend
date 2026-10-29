import {
  AI_CREDITS_EXHAUSTED,
  type BrainiacCreditBalanceDto,
  type BrainiacCreditsExhaustedDto,
  type CheckoutSessionDto,
  type CurrentMonthSeatsDto,
  type OrganizationBillingSummaryDto,
  type PublicMissionResultDto,
  type TeamSeatCreditSummaryDto,
  type UsageHistoryItemDto,
  type UsageHistoryResponse,
} from "./types/billingCredits";

export const AI_CREDITS_EXHAUSTED_EVENT = "api-ai-credits-exhausted";

export type CreditsExhaustedEventDetail = {
  payload: BrainiacCreditsExhaustedDto;
  organizationWallet: boolean;
};

export function unwrapApiData<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const record = payload as Record<string, unknown>;
  const nested = record.data;
  const looksLikeEnvelope =
    nested != null &&
    typeof nested === "object" &&
    ("message" in record || "Message" in record || "status" in record || "Status" in record || "success" in record || "Success" in record);
  if (looksLikeEnvelope) return nested as T;
  return payload as T;
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export function readString(...values: unknown[]): string {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

export function readNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function readBoolean(value: unknown): boolean | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (text === "true" || text === "yes" || text === "passed") return true;
  if (text === "false" || text === "no") return false;
  return null;
}

export function formatCredits(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("en-US");
}

export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(Number(amount));
  } catch {
    return `${code} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function usageStatusLabel(status: number | null | undefined): string {
  switch (status) {
    case 0:
      return "Reserved";
    case 1:
      return "Charged";
    case 2:
      return "Released";
    case 3:
      return "Failed";
    case 4:
      return "Denied";
    default:
      return status == null ? "Unknown" : String(status);
  }
}

export function usageStatusTone(status: number | null | undefined): string {
  switch (status) {
    case 0:
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    case 1:
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case 2:
      return "border-sky-400/30 bg-sky-400/10 text-sky-300";
    case 3:
      return "border-red-400/30 bg-red-400/10 text-red-300";
    case 4:
      return "border-orange-400/30 bg-orange-400/10 text-orange-300";
    default:
      return "border-white/10 bg-white/5 text-muted-foreground";
  }
}

export function extractErrorCode(data: unknown): string {
  const record = asRecord(data);
  const nested = asRecord(record.data);
  return readString(
    record.errorCode,
    record.ErrorCode,
    nested.errorCode,
    nested.ErrorCode,
  );
}

export function isAiCreditsExhaustedCode(code: string): boolean {
  return code.trim().toUpperCase() === AI_CREDITS_EXHAUSTED;
}

export function extractCreditsExhausted(
  status: number | undefined,
  data: unknown,
): BrainiacCreditsExhaustedDto | null {
  if (!data) return null;
  const record = asRecord(data);
  const nested = asRecord(record.data);
  const source = extractErrorCode(data) ? record : nested.errorCode || nested.ErrorCode ? nested : record;
  const errorCode = extractErrorCode(data);
  const message = readString(source.message, source.Message, record.message, record.Message);
  const clearlyIdentified =
    isAiCreditsExhaustedCode(errorCode) ||
    (Boolean(message) && /AI_CREDITS_EXHAUSTED/i.test(JSON.stringify(data)));

  if (!clearlyIdentified) return null;
  if (status !== 402 && status !== 500 && status !== undefined) return null;
  if (status === 500 && !clearlyIdentified) return null;

  const balanceRaw = source.balance ?? source.Balance ?? nested.balance ?? nested.Balance ?? null;
  return {
    errorCode: errorCode || AI_CREDITS_EXHAUSTED,
    message: message || "This account has exhausted its Brainiac AI credits for the current billing cycle.",
    balance: balanceRaw ? normalizeCreditBalance(balanceRaw) : null,
    recommendedAction: readString(source.recommendedAction, source.RecommendedAction) || null,
    canRenewOrRecharge: readBoolean(source.canRenewOrRecharge ?? source.CanRenewOrRecharge) ?? false,
    canUpgrade: readBoolean(source.canUpgrade ?? source.CanUpgrade) ?? false,
  };
}

export function normalizeCreditBalance(payload: unknown): BrainiacCreditBalanceDto {
  const root = asRecord(unwrapApiData(payload));
  return {
    planName: readString(root.planName, root.PlanName) || null,
    allocation: readNumber(root.allocation ?? root.Allocation),
    usedCredits: readNumber(root.usedCredits ?? root.UsedCredits),
    remainingCredits: readNumber(root.remainingCredits ?? root.RemainingCredits),
    usagePercentage: readNumber(root.usagePercentage ?? root.UsagePercentage),
    billingCycleStart: readString(root.billingCycleStart, root.BillingCycleStart) || null,
    billingCycleEnd: readString(root.billingCycleEnd, root.BillingCycleEnd) || null,
    isExhausted: readBoolean(root.isExhausted ?? root.IsExhausted),
    canUseAI: readBoolean(root.canUseAI ?? root.CanUseAI),
    walletType: readString(root.walletType, root.WalletType) || null,
    employerProfileId: readString(root.employerProfileId, root.EmployerProfileId) || null,
    teamMemberUserId: readString(root.teamMemberUserId, root.TeamMemberUserId) || null,
    renewalAction: readString(root.renewalAction, root.RenewalAction) || null,
    applicableRenewalDate: readString(root.applicableRenewalDate, root.ApplicableRenewalDate) || null,
    seatStatus: readString(root.seatStatus, root.SeatStatus) || null,
    memberDisplayName: readString(root.memberDisplayName, root.MemberDisplayName, root.displayName, root.DisplayName) || null,
  };
}

export function isOrganizationWallet(walletType?: string | null): boolean {
  return /organiz/i.test(walletType || "");
}

export function normalizeCheckoutUrl(payload: unknown): string {
  const root = asRecord(unwrapApiData(payload));
  return readString(root.checkoutUrl, root.CheckoutUrl, root.authorization_url, root.authorizationUrl);
}

export function normalizeUsageHistory(payload: unknown, fallbackPage = 1, fallbackPageSize = 20): UsageHistoryResponse {
  const root = asRecord(unwrapApiData(payload));
  const rawItems = root.items ?? root.Items ?? root.records ?? root.Records;
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeUsageItem) : [];
  const pageSize = readNumber(root.pageSize ?? root.PageSize) ?? fallbackPageSize;
  const currentPage = readNumber(root.currentPage ?? root.CurrentPage) ?? fallbackPage;
  const totalCount = readNumber(root.totalCount ?? root.TotalCount) ?? items.length;
  return { totalCount, currentPage, pageSize, items };
}

export function normalizeUsageItem(payload: unknown): UsageHistoryItemDto {
  const root = asRecord(payload);
  return {
    date: readString(root.date, root.Date) || null,
    createdAt: readString(root.createdAt, root.CreatedAt) || null,
    timestamp: readString(root.timestamp, root.Timestamp) || null,
    aiFeature: readString(root.aiFeature, root.AiFeature, root.feature, root.Feature, root.featureName, root.FeatureName) || null,
    operation: readString(root.operation, root.Operation, root.operationName, root.OperationName) || null,
    model: readString(root.model, root.Model, root.modelName, root.ModelName) || null,
    inputTokens: readNumber(root.inputTokens ?? root.InputTokens),
    outputTokens: readNumber(root.outputTokens ?? root.OutputTokens),
    totalTokens: readNumber(root.totalTokens ?? root.TotalTokens),
    usageStatus: readNumber(root.usageStatus ?? root.UsageStatus ?? root.status ?? root.Status),
    remainingBalanceAfter: readNumber(
      root.remainingBalanceAfter ?? root.RemainingBalanceAfter ?? root.remainingCreditsAfter ?? root.RemainingCreditsAfter,
    ),
  };
}

export function usageOccurredAt(item: UsageHistoryItemDto): string {
  return item.date || item.createdAt || item.timestamp || "";
}

export function usagePages(totalCount: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / pageSize));
}

export function normalizeOrganizationBilling(payload: unknown): OrganizationBillingSummaryDto {
  const root = asRecord(unwrapApiData(payload));
  const summaryRaw = root.teamSeatCreditSummary ?? root.TeamSeatCreditSummary;
  return {
    organizationPlan: readString(root.organizationPlan, root.OrganizationPlan, root.planName, root.PlanName) || null,
    subscriptionStatus: readString(root.subscriptionStatus, root.SubscriptionStatus, root.status, root.Status) || null,
    currency: readString(root.currency, root.Currency, root.currencyCode, root.CurrencyCode) || "USD",
    organizationBasePrice: readNumber(root.organizationBasePrice ?? root.OrganizationBasePrice),
    activeBillableTeamMemberCount: readNumber(root.activeBillableTeamMemberCount ?? root.ActiveBillableTeamMemberCount),
    teamSeatUnitPrice: readNumber(root.teamSeatUnitPrice ?? root.TeamSeatUnitPrice),
    teamSeatSubtotal: readNumber(root.teamSeatSubtotal ?? root.TeamSeatSubtotal),
    totalMonthlyPrice: readNumber(root.totalMonthlyPrice ?? root.TotalMonthlyPrice),
    billingCycleStart: readString(root.billingCycleStart, root.BillingCycleStart) || null,
    billingCycleEnd: readString(root.billingCycleEnd, root.BillingCycleEnd) || null,
    organizationCreditsAllocated: readNumber(root.organizationCreditsAllocated ?? root.OrganizationCreditsAllocated),
    organizationCreditsUsed: readNumber(root.organizationCreditsUsed ?? root.OrganizationCreditsUsed),
    organizationCreditsRemaining: readNumber(root.organizationCreditsRemaining ?? root.OrganizationCreditsRemaining),
    teamSeatCreditSummary: summaryRaw ? normalizeTeamSeatSummary(summaryRaw) : null,
  };
}

export function normalizeTeamSeatSummary(payload: unknown): TeamSeatCreditSummaryDto {
  const root = asRecord(payload);
  return {
    allocatedCredits: readNumber(root.allocatedCredits ?? root.AllocatedCredits ?? root.allocation ?? root.Allocation),
    usedCredits: readNumber(root.usedCredits ?? root.UsedCredits),
    remainingCredits: readNumber(root.remainingCredits ?? root.RemainingCredits),
    activeSeatCount: readNumber(root.activeSeatCount ?? root.ActiveSeatCount),
    memberCount: readNumber(root.memberCount ?? root.MemberCount),
  };
}

export function normalizeCurrentMonthSeats(payload: unknown): CurrentMonthSeatsDto {
  const root = asRecord(unwrapApiData(payload));
  return {
    uniqueEnrolledEmployeesThisMonth: readNumber(
      root.uniqueEnrolledEmployeesThisMonth ?? root.UniqueEnrolledEmployeesThisMonth ?? root.uniqueActiveEmployees,
    ),
    activeBillableTeamMemberCount: readNumber(
      root.activeBillableTeamMemberCount ?? root.ActiveBillableTeamMemberCount,
    ),
  };
}

export function extractCompletedMissionResults(payload: unknown): PublicMissionResultDto[] {
  const root = asRecord(unwrapApiData(payload));
  const raw = root.completedMissionResults ?? root.CompletedMissionResults;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePublicMissionResult);
}

export function normalizePublicMissionResult(payload: unknown): PublicMissionResultDto {
  const root = asRecord(payload);
  const linksRaw = root.publicDeliverableLinks ?? root.PublicDeliverableLinks ?? root.deliverableLinks ?? root.DeliverableLinks;
  const links = Array.isArray(linksRaw)
    ? linksRaw.map((item) => readString(item)).filter(Boolean)
    : readString(linksRaw)
      ? [readString(linksRaw)]
      : [];
  return {
    missionTitle: readString(root.missionTitle, root.MissionTitle, root.title, root.Title) || null,
    profession: readString(root.profession, root.Profession, root.professionName, root.ProfessionName) || null,
    district: readString(root.district, root.District, root.districtName, root.DistrictName) || null,
    completionDate: readString(root.completionDate, root.CompletionDate, root.completedAt, root.CompletedAt) || null,
    passed: readBoolean(root.passed ?? root.Passed ?? root.isPassed ?? root.IsPassed),
    score: readNumber(root.score ?? root.Score),
    publicFeedbackSummary: readString(root.publicFeedbackSummary, root.PublicFeedbackSummary) || null,
    publicStrengths: normalizeStrengths(root.publicStrengths ?? root.PublicStrengths),
    publicDeliverableLinks: links.length ? links : null,
    publicPortfolioReference: readString(root.publicPortfolioReference, root.PublicPortfolioReference) || null,
  };
}

function normalizeStrengths(value: unknown): string | null {
  if (Array.isArray(value)) {
    const items = value.map((item) => readString(item)).filter(Boolean);
    return items.length ? items.join("\n") : null;
  }
  return readString(value) || null;
}

export function classifyExternalUrl(url: string): "image" | "video" | "link" {
  const path = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return "image";
  if (/\.(mp4|webm|ogg|mov)$/.test(path)) return "video";
  return "link";
}

export function safeExternalHref(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function renewalKind(action?: string | null): "upgrade" | "recharge" | "renew" | "none" {
  const text = (action || "").toLowerCase();
  if (!text) return "none";
  if (text.includes("upgrade")) return "upgrade";
  if (text.includes("recharge")) return "recharge";
  if (text.includes("renew")) return "renew";
  return "none";
}

export function checkoutFrom(payload: unknown): CheckoutSessionDto {
  return { checkoutUrl: normalizeCheckoutUrl(payload) || null };
}

export const VIRTUAL_SELF_RATE_LIMIT_MESSAGE = "Too many virtual-self requests. Please try again later.";
