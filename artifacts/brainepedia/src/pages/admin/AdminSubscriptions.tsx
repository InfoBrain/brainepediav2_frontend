import { useEffect, useMemo, useState } from "react";
import { CreditCard, DollarSign, Gem, Loader2, RefreshCw, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { asList, formatDisplayDate, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";

export default function AdminSubscriptions() {
  usePageTitle("Admin Subscriptions");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.subscriptions.listAll();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load subscriptions.");
      setSubscriptions([]);
      return;
    }
    setSubscriptions(asList(res.data));
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const active = subscriptions.filter((item) => Boolean(item?.active ?? item?.Active ?? item?.isActive ?? item?.IsActive)).length;
    const revenue = subscriptions.reduce((sum, item) => sum + Number(item?.amount ?? item?.Amount ?? item?.totalPaid ?? item?.TotalPaid ?? 0), 0);
    return { active, revenue };
  }, [subscriptions]);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Subscriptions" subtitle="// plans.revenue.access" theme="admin">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#A5B4FC]/20 bg-gradient-to-br from-[#6366F1]/15 to-[#0d1119] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#A5B4FC]">Subscription command</p>
              <h2 className="mt-1 text-2xl font-black">Active plans, revenue metrics, employer subscriptions, and user subscriptions.</h2>
            </div>
            <Button onClick={load} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card icon={Gem} title="Active Plans" value={loading ? "Loading..." : summary.active.toLocaleString()} />
          <Card icon={DollarSign} title="Revenue Metrics" value={summary.revenue ? formatCurrency(summary.revenue) : "—"} />
          <Card icon={CreditCard} title="Employer Subscriptions" value="Grandmaster Corporate accounts" />
          <Card icon={Users} title="User Subscriptions" value="Initiate / Architect" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#A5B4FC]" /> Loading subscriptions...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center text-sm text-muted-foreground">
            No subscriptions were returned by the backend.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0d1119]">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Current Tier</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Corporate Seat</th>
                  <th className="px-4 py-3">Corporate Provider</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription, index) => {
                  const row = normSubscription(subscription);
                  return (
                    <tr key={`${row.user}-${index}`} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">{row.user}</td>
                      <td className="px-4 py-3 font-semibold">{row.currentTier}</td>
                      <td className="px-4 py-3">{row.active ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3">{row.startDate}</td>
                      <td className="px-4 py-3">{row.expiry}</td>
                      <td className="px-4 py-3">{row.corporateSeat ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{row.corporateProvider}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normSubscription(item: any) {
  return {
    user: text(item?.userName ?? item?.UserName ?? item?.email ?? item?.Email ?? item?.userId ?? item?.UserId, "User unavailable"),
    currentTier: text(item?.currentTier ?? item?.CurrentTier ?? item?.tier ?? item?.Tier ?? item?.planName ?? item?.PlanName, "—"),
    active: Boolean(item?.active ?? item?.Active ?? item?.isActive ?? item?.IsActive),
    startDate: formatDisplayDate(item?.startDate ?? item?.StartDate ?? item?.createdAt ?? item?.CreatedAt, "—"),
    expiry: formatDisplayDate(item?.expiry ?? item?.Expiry ?? item?.expiryDate ?? item?.ExpiryDate, "—"),
    corporateSeat: Boolean(item?.corporateSeat ?? item?.CorporateSeat ?? item?.isCorporateSeat ?? item?.IsCorporateSeat),
    corporateProvider: text(item?.corporateProvider ?? item?.CorporateProvider ?? item?.companyName ?? item?.CompanyName, "—"),
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function Card({ icon: Icon, title, value }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
      <Icon className="mb-3 h-5 w-5 text-[#A5B4FC]" />
      <p className="font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
