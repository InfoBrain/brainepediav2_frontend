import { useEffect, useMemo, useState } from "react";
import { CreditCard, DollarSign, Gem, Loader2, RefreshCw, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { asList, formatDisplayDate, listMeta, text, type ListMeta } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSubscriptions() {
  usePageTitle("Admin Subscriptions");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ListMeta>({ page: 1, pageSize: 10 });
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.subscriptions.listAll({ search, tier, isActive: activeFilter, page, pageSize });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load subscriptions.");
      setSubscriptions([]);
      return;
    }
    setSubscriptions(asList(res.data));
    setMeta(listMeta(res.data, page, pageSize));
  };

  useEffect(() => { load(); }, [page, tier, activeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
        <div className="grid gap-3 rounded-2xl border border-white/5 bg-[#0d1119] p-4 md:grid-cols-4">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user or email" />
          <select
            value={tier}
            onChange={(event) => { setTier(event.target.value); setPage(1); }}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All tiers</option>
            <option value="Initiate">Initiate</option>
            <option value="Architect">Architect</option>
            <option value="Grandmaster">Grandmaster</option>
          </select>
          <select
            value={activeFilter}
            onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button onClick={load} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Apply Filters
          </Button>
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
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Paystack Reference</th>
                  <th className="px-4 py-3">Subscription Plan Code</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription, index) => {
                  const row = normSubscription(subscription);
                  return (
                    <tr key={`${row.user}-${index}`} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">{row.user}</td>
                      <td className="px-4 py-3 font-semibold">{row.tier}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">{row.startDate}</td>
                      <td className="px-4 py-3">{row.expiry}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.paystackReference}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.subscriptionPlanCode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-sm text-muted-foreground">
              <span>
                Page {meta.page} of {meta.totalPages ?? Math.max(1, Math.ceil(subscriptions.length / pageSize))}
                {meta.totalCount !== undefined ? ` · ${meta.totalCount.toLocaleString()} subscriptions` : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || (meta.totalPages !== undefined ? page >= meta.totalPages : subscriptions.length < pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normSubscription(item: any) {
  const active = Boolean(item?.active ?? item?.Active ?? item?.isActive ?? item?.IsActive);
  const expiryValue = item?.expiry ?? item?.Expiry ?? item?.expiryDate ?? item?.ExpiryDate;
  const expiryDate = expiryValue ? new Date(String(expiryValue)) : null;
  const expired = Boolean(expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now());
  return {
    user: text(item?.userName ?? item?.UserName ?? item?.email ?? item?.Email ?? item?.userId ?? item?.UserId, "User unavailable"),
    tier: text(item?.currentTier ?? item?.CurrentTier ?? item?.tier ?? item?.Tier ?? item?.planName ?? item?.PlanName, "—"),
    active,
    status: active && !expired ? "Active" : "Inactive",
    startDate: formatDisplayDate(item?.startDate ?? item?.StartDate ?? item?.createdAt ?? item?.CreatedAt, "—"),
    expiry: formatDisplayDate(expiryValue, "—"),
    paystackReference: text(item?.paystackReference ?? item?.PaystackReference ?? item?.reference ?? item?.Reference, "—"),
    subscriptionPlanCode: text(item?.subscriptionPlanCode ?? item?.SubscriptionPlanCode ?? item?.planCode ?? item?.PlanCode, "—"),
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
