import { formatDisplayDate, text } from "./jobData";

export type NormalizedSubscriptionDetails = {
  currentTier: string;
  active: boolean;
  status: string;
  startDate: string;
  expiryDate: string;
  expiryDateRaw?: string;
  expired: boolean;
  corporateSeatBypass: boolean;
  corporateProvider: string;
  subscriptionType: string;
  paystackReference: string;
  subscriptionPlanCode: string;
};

export function normalizeSubscriptionDetails(data: any): NormalizedSubscriptionDetails {
  const root = data?.data ?? data?.subscriptionDetails ?? data?.subscription ?? data;
  const corporateSeatBypass = Boolean(
    root?.isCorporateSeatBypass ??
      root?.IsCorporateSeatBypass ??
      root?.corporateSeatBypass ??
      root?.CorporateSeatBypass ??
      root?.corporateSeat ??
      root?.CorporateSeat ??
      root?.isCorporateSeat ??
      root?.IsCorporateSeat,
  );
  const expiryValue = root?.expiryDate ?? root?.ExpiryDate ?? root?.expiry ?? root?.Expiry ?? root?.expiresAt ?? root?.ExpiresAt;
  const expiryDate = expiryValue ? new Date(String(expiryValue)) : null;
  const expiryPassed = Boolean(expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now());
  const rawActive = root?.isActive ?? root?.IsActive ?? root?.active ?? root?.Active;
  const active = corporateSeatBypass ? true : Boolean(rawActive) && !expiryPassed;
  const expired = !corporateSeatBypass && (!active || expiryPassed);
  const provider = text(
    root?.associatedCorporateProvider ??
      root?.AssociatedCorporateProvider ??
      root?.corporateProvider ??
      root?.CorporateProvider ??
      root?.companyName ??
      root?.CompanyName,
    "—",
  );
  const tier = text(root?.currentTier ?? root?.CurrentTier ?? root?.tier ?? root?.Tier ?? root?.planName ?? root?.PlanName, "Initiate");

  return {
    currentTier: corporateSeatBypass ? "Grandmaster" : tier,
    active,
    status: corporateSeatBypass ? "Provided by corporate seat" : active ? "Active" : "Subscription Expired",
    startDate: formatDisplayDate(root?.startDate ?? root?.StartDate ?? root?.createdAt ?? root?.CreatedAt, "—"),
    expiryDate: formatDisplayDate(expiryValue, "—"),
    expiryDateRaw: expiryValue ? String(expiryValue) : undefined,
    expired,
    corporateSeatBypass,
    corporateProvider: provider,
    subscriptionType: text(root?.subscriptionType ?? root?.SubscriptionType ?? root?.type ?? root?.Type, "—"),
    paystackReference: text(root?.paystackReference ?? root?.PaystackReference ?? root?.reference ?? root?.Reference, "—"),
    subscriptionPlanCode: text(root?.subscriptionPlanCode ?? root?.SubscriptionPlanCode ?? root?.planCode ?? root?.PlanCode, "—"),
  };
}
