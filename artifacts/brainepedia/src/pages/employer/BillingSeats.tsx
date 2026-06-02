import { useEffect, useState } from "react";
import { CreditCard, Loader2, Calendar, Users, Gem, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type BillingData = {
  billingCycleStart?: string;
  billingCycleEnd?: string;
  uniqueActiveEmployees?: number;
  planType?: string;
  totalSeats?: number;
  costPerSeat?: number;
  currency?: string;
  totalBilled?: number;
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
    if (res.ok) setBilling(normBilling(res.data));
    else setError(res.error || "Failed to load billing data.");
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
                icon={Calendar}
                label="Billing Cycle Start"
                value={cycleStart}
                sub={cycleEnd !== "—" ? `Ends ${cycleEnd}` : undefined}
                color="#00D2FF"
              />
              <InfoCard
                icon={Users}
                label="Active Employees"
                value={billing?.uniqueActiveEmployees ?? "—"}
                sub="Unique active seats this cycle"
                color="#9D4EDD"
              />
              <InfoCard
                icon={Gem}
                label="Plan Type"
                value={billing?.planType ?? "—"}
                sub={billing?.totalSeats !== undefined ? `${billing.totalSeats} total seats` : undefined}
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
                  Grandmaster seats are billed per unique active employee each month.
                  An employee is "active" if they have completed at least one challenge during the billing cycle.
                </p>
                <p>
                  To activate a Grandmaster seat for a specific team member, go to{" "}
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

function normBilling(d: any): BillingData {
  return {
    billingCycleStart: d?.billingCycleStart ?? d?.cycleStart ?? d?.startDate,
    billingCycleEnd: d?.billingCycleEnd ?? d?.cycleEnd ?? d?.endDate,
    uniqueActiveEmployees: d?.uniqueActiveEmployees ?? d?.activeEmployees ?? d?.activeSeats,
    planType: d?.planType ?? d?.plan ?? d?.tier ?? d?.subscriptionTier,
    totalSeats: d?.totalSeats ?? d?.seats,
    costPerSeat: d?.costPerSeat ?? d?.seatCost ?? d?.pricePerSeat,
    currency: d?.currency ?? d?.currencyCode,
    totalBilled: d?.totalBilled ?? d?.totalAmount ?? d?.amount,
  };
}
