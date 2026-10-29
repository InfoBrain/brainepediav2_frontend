import { CreditCard, Gem, Users } from "lucide-react";
import { formatCredits, formatDateOnly, formatMoney } from "@/lib/aiCredits";
import type { CurrentMonthSeatsDto, OrganizationBillingSummaryDto } from "@/lib/types/billingCredits";

export function OrganizationBillingSummary({
  billing,
  seats,
  loading,
  error,
}: {
  billing: OrganizationBillingSummaryDto | null;
  seats?: CurrentMonthSeatsDto | null;
  loading?: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-6 text-sm text-muted-foreground">
        Loading organization billing…
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>;
  }

  if (!billing) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-8 text-center">
        <h3 className="text-lg font-bold">No active organization billing</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Organization subscription and seat pricing will appear here after the backend returns a billing summary.
        </p>
      </div>
    );
  }

  const currency = billing.currency || "USD";
  const inactive = /inactive|expired|none|not active/i.test(billing.subscriptionStatus || "");

  return (
    <section className="space-y-4">
      {inactive && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          This organization subscription is {billing.subscriptionStatus}. Amounts are shown only when the server returns them.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Info label="Organization plan" value={billing.organizationPlan || "—"} icon={Gem} />
        <Info label="Subscription status" value={billing.subscriptionStatus || "—"} icon={CreditCard} />
        <Info label="Currency" value={currency} icon={CreditCard} />
        <Info label="Organization base price" value={formatMoney(billing.organizationBasePrice, currency)} icon={CreditCard} />
        <Info label="Active billable team members" value={billing.activeBillableTeamMemberCount ?? "—"} icon={Users} />
        <Info label="Team-seat unit price" value={formatMoney(billing.teamSeatUnitPrice, currency)} icon={CreditCard} />
        <Info label="Team-seat subtotal" value={formatMoney(billing.teamSeatSubtotal, currency)} icon={CreditCard} />
        <Info label="Total monthly price" value={formatMoney(billing.totalMonthlyPrice, currency)} icon={Gem} emphasize />
        <Info
          label="Billing cycle"
          value={`${formatDateOnly(billing.billingCycleStart)} – ${formatDateOnly(billing.billingCycleEnd)}`}
          icon={CreditCard}
        />
        <Info label="Organization credits allocated" value={formatCredits(billing.organizationCreditsAllocated)} icon={Gem} />
        <Info label="Organization credits used" value={formatCredits(billing.organizationCreditsUsed)} icon={Gem} />
        <Info label="Organization credits remaining" value={formatCredits(billing.organizationCreditsRemaining)} icon={Gem} />
      </div>

      {billing.teamSeatCreditSummary && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
          <h3 className="mb-3 text-base font-bold">Team-seat credit summary</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Mini label="Allocated" value={formatCredits(billing.teamSeatCreditSummary.allocatedCredits)} />
            <Mini label="Used" value={formatCredits(billing.teamSeatCreditSummary.usedCredits)} />
            <Mini label="Remaining" value={formatCredits(billing.teamSeatCreditSummary.remainingCredits)} />
          </div>
        </div>
      )}

      {seats && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
          <h3 className="mb-2 text-base font-bold">Current-month seat activity</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Unique enrolled employees this month measures mission activity. It is not used to calculate billing.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Mini label="Unique enrolled employees this month" value={seats.uniqueEnrolledEmployeesThisMonth ?? "—"} />
            <Mini label="Active billable team members" value={seats.activeBillableTeamMemberCount ?? billing.activeBillableTeamMemberCount ?? "—"} />
          </div>
        </div>
      )}
    </section>
  );
}

function Info({
  label,
  value,
  icon: Icon,
  emphasize,
}: {
  label: string;
  value: string | number;
  icon: typeof CreditCard;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-[#00D2FF]" />
        <p className="text-[11px] font-mono uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-xl font-bold ${emphasize ? "text-[#FFD700]" : ""}`}>{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
