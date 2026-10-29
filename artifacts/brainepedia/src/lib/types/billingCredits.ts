/** Exact DTO contracts for Brainiac credits, privacy, billing, and public mission results. */

export interface ProfilePrivacySettingsDto {
  isPublicDossierEnabled: boolean;
  allowPublicMissionResults: boolean;
  allowPublicMissionScores: boolean;
  allowMlTraining: boolean;
  emailNotificationsEnabled: boolean;
}

export interface PublicMissionResultDto {
  missionTitle?: string | null;
  profession?: string | null;
  district?: string | null;
  completionDate?: string | null;
  passed?: boolean | null;
  score?: number | null;
  publicFeedbackSummary?: string | null;
  publicStrengths?: string | null;
  publicDeliverableLinks?: string[] | null;
  publicPortfolioReference?: string | null;
}

export interface BrainiacCreditBalanceDto {
  planName?: string | null;
  allocation?: number | null;
  usedCredits?: number | null;
  remainingCredits?: number | null;
  usagePercentage?: number | null;
  billingCycleStart?: string | null;
  billingCycleEnd?: string | null;
  isExhausted?: boolean | null;
  canUseAI?: boolean | null;
  walletType?: string | null;
  employerProfileId?: string | null;
  teamMemberUserId?: string | null;
  renewalAction?: string | null;
  applicableRenewalDate?: string | null;
  seatStatus?: string | null;
  memberDisplayName?: string | null;
}

export interface BrainiacCreditsExhaustedDto {
  errorCode?: string | null;
  message?: string | null;
  balance?: BrainiacCreditBalanceDto | null;
  recommendedAction?: string | null;
  canRenewOrRecharge?: boolean | null;
  canUpgrade?: boolean | null;
}

export interface TeamSeatCreditSummaryDto {
  allocatedCredits?: number | null;
  usedCredits?: number | null;
  remainingCredits?: number | null;
  activeSeatCount?: number | null;
  memberCount?: number | null;
}

export interface OrganizationBillingSummaryDto {
  organizationPlan?: string | null;
  subscriptionStatus?: string | null;
  currency?: string | null;
  organizationBasePrice?: number | null;
  activeBillableTeamMemberCount?: number | null;
  teamSeatUnitPrice?: number | null;
  teamSeatSubtotal?: number | null;
  totalMonthlyPrice?: number | null;
  billingCycleStart?: string | null;
  billingCycleEnd?: string | null;
  organizationCreditsAllocated?: number | null;
  organizationCreditsUsed?: number | null;
  organizationCreditsRemaining?: number | null;
  teamSeatCreditSummary?: TeamSeatCreditSummaryDto | null;
}

export interface CurrentMonthSeatsDto {
  uniqueEnrolledEmployeesThisMonth?: number | null;
  activeBillableTeamMemberCount?: number | null;
}

export interface UsageHistoryItemDto {
  date?: string | null;
  createdAt?: string | null;
  timestamp?: string | null;
  aiFeature?: string | null;
  feature?: string | null;
  featureName?: string | null;
  operation?: string | null;
  operationName?: string | null;
  model?: string | null;
  modelName?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  usageStatus?: number | null;
  remainingBalanceAfter?: number | null;
  remainingCreditsAfter?: number | null;
}

export interface UsageHistoryResponse {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  items: UsageHistoryItemDto[];
}

export interface CreditRechargeRequest {
  userId: string;
  accountType?: string | null;
}

export interface CheckoutSessionDto {
  checkoutUrl?: string | null;
  authorization_url?: string | null;
}

export const USAGE_STATUS = {
  Reserved: 0,
  Charged: 1,
  Released: 2,
  Failed: 3,
  Denied: 4,
} as const;

export type UsageStatusValue = (typeof USAGE_STATUS)[keyof typeof USAGE_STATUS];

export const AI_CREDITS_EXHAUSTED = "AI_CREDITS_EXHAUSTED";

export const SUBSCRIPTION_LEVEL = {
  Initiate: 0,
  Architect: 1,
  Grandmaster: 2,
} as const;
