import { useEffect, useState } from "react";
import { CreditCard, Loader2, Calendar, Users, Gem, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type BillingData = {
  billingCycleStart?: string;
  billingCycleEnd?: string;
  uniqueActiveEmployees?: number;
  planType?: string;
  totalSeats?: number;
  activeTeamSeats?: number;
  totalPaidSeats?: number;
  costPerSeat?: number;
  currency?: string;
  totalBilled?: number;
  currentPlan?: string;
  nextBillingDate?: string;
  billingCycle?: string;
};

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "#00D2FF",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0d1119] border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function BillingSeats() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBilling = async () => {
    setLoading(true);
    setError("");
    const res = await api.employers.billingSeats();
    const [subscriptionRes, rosterRes] = await Promise.all([
      getUserId() ? api.subscriptions.details(getUserId() as string) : Promise.resolve(null),
      api.employers.myTeamRoster(),
    ]);
    if (res.ok) {
      const roster = rosterRes.ok ? asArray(rosterRes.data) : [];
      setBilling(normBilling(res.data, subscriptionRes?.ok ? subscriptionRes.data : null, roster));
    } else setError(res.error || "Failed to load billing data.");
    setLoading(false);
  };

  useEffect(() => { fetchBilling(); }, []);

  const cycleStart = billing?.billingCycleStart
    ? new Date(billing.billingCycleStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const cycleEnd = billing?.billingCycleEnd
    ? new Date(billing.billingCycleEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Billing & Seats" subtitle="// employer.billing.overview" theme="employer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Current billing cycle seat usage and plan details.</p>
          <Button variant="outline" size="sm" onClick={fetchBilling}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm">Loading billing…</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-destructive font-mono border border-destructive/20 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard
                icon={Gem}
                label="Current Plan"
                value={billing?.currentPlan ?? billing?.planType ?? "—"}
                sub="Employer Grandmaster subscription"
                color="#FFD700"
              />
              <InfoCard
                icon={Calendar}
                label="Next Billing Date"
                value={billing?.nextBillingDate ? formatDate(billing.nextBillingDate) : "—"}
                sub={billing?.billingCycle ? `Cycle: ${billing.billingCycle}` : "Monthly employer subscription"}
                color="#f97316"
              />
              <InfoCard
                icon={Calendar}
                label="Billing Cycle Start"
                value={cycleStart}
                sub={cycleEnd !== "—" ? `Ends ${cycleEnd}` : undefined}
                color="#00D2FF"
              />
              <InfoCard
                icon={Users}
                label="Active Team Seats"
                value={billing?.activeTeamSeats ?? billing?.uniqueActiveEmployees ?? "—"}
                sub="Active employees this cycle"
                color="#9D4EDD"
              />
              <InfoCard
                icon={Gem}
                label="Total Paid Seats"
                value={billing?.totalPaidSeats ?? "—"}
                sub="IsGrandmasterSeatPaid == true"
                color="#FFD700"
              />
              {billing?.costPerSeat !== undefined && (
                <InfoCard
                  icon={CreditCard}
                  label="Cost Per Seat"
                  value={`${billing.currency ?? "$"}${billing.costPerSeat}`}
                  sub="Per Grandmaster seat / month"
                  color="#22c55e"
                />
              )}
              {billing?.totalBilled !== undefined && (
                <InfoCard
                  icon={CreditCard}
                  label="Total Billed"
                  value={`${billing.currency ?? "$"}${billing.totalBilled}`}
                  sub="This billing cycle"
                  color="#f97316"
                />
              )}
            </div>

            {/* Billing breakdown note */}
            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#00D2FF]" />
                How Seat Billing Works
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Employer Grandmaster is the organization subscription at <strong>$49.99/month</strong>.
                  Employee seat activation is billed separately at <strong>$19.99/month per team member</strong>.
                </p>
                <p>
                  The employer pays the Grandmaster subscription for recruitment and corporate tooling.
                  Each employee seat activation grants that team member separate Grandmaster access.
                </p>
                <p>
                  To activate an employee seat, go to{" "}
                  <a href="/employer/team" className="text-[#00D2FF] hover:underline">Team Members</a> and click
                  "Activate Seat" next to their name.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-[#9D4EDD]/10 to-[#00D2FF]/10 border border-[#9D4EDD]/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold">Need more seats?</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Upgrade your plan to unlock more Grandmaster seats for your team.</p>
              </div>
              <a href="/employer/subscription">
                <Button className="font-bold shadow-[0_0_12px_rgba(157,78,221,0.35)]" style={{ background: "#9D4EDD" }}>
                  <Gem className="h-4 w-4 mr-2" />
                  View Subscription
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function normBilling(d: any, subscription: any, roster: any[]): BillingData {
  const sub = subscription?.data ?? subscription?.subscription ?? subscription;
  const paidSeats = roster.filter((member) => Boolean(member?.isGrandmasterSeatPaid ?? member?.IsGrandmasterSeatPaid ?? member?.grandmasterSeatPaid ?? member?.GrandmasterSeatPaid)).length;
  return {
    billingCycleStart: d?.billingCycleStart ?? d?.cycleStart ?? d?.startDate,
    billingCycleEnd: d?.billingCycleEnd ?? d?.cycleEnd ?? d?.endDate,
    uniqueActiveEmployees: d?.uniqueActiveEmployees ?? d?.activeEmployees ?? d?.activeSeats,
    activeTeamSeats: d?.activeTeamSeats ?? d?.activeSeats ?? d?.uniqueActiveEmployees,
    totalPaidSeats: d?.totalPaidSeats ?? d?.paidSeats ?? paidSeats,
    planType: d?.planType ?? d?.plan ?? d?.tier ?? d?.subscriptionTier,
    totalSeats: d?.totalSeats ?? d?.seats,
    costPerSeat: d?.costPerSeat ?? d?.seatCost ?? d?.pricePerSeat,
    currency: d?.currency ?? d?.currencyCode,
    totalBilled: d?.totalBilled ?? d?.totalAmount ?? d?.amount,
    currentPlan: sub?.currentTier ?? sub?.CurrentTier ?? sub?.tier ?? sub?.Tier ?? sub?.planName ?? sub?.PlanName ?? d?.planType ?? d?.plan,
    nextBillingDate: sub?.nextBillingDate ?? sub?.NextBillingDate ?? sub?.expiry ?? sub?.Expiry ?? sub?.expiryDate ?? sub?.ExpiryDate,
    billingCycle: sub?.billingCycle ?? sub?.BillingCycle ?? d?.billingCycle ?? d?.cycle,
  };
}

function asArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  const rows = data?.members ?? data?.employees ?? data?.items ?? data?.roster ?? data?.data ?? [];
  return Array.isArray(rows) ? rows : [];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
