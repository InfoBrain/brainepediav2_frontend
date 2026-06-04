import { CreditCard, DollarSign, Gem, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminSubscriptions() {
  usePageTitle("Admin Subscriptions");
  return (
    <DashboardShell nav={ADMIN_NAV} title="Subscriptions" subtitle="// plans.revenue.access" theme="admin">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#A5B4FC]/20 bg-gradient-to-br from-[#6366F1]/15 to-[#0d1119] p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#A5B4FC]">Subscription command</p>
          <h2 className="mt-1 text-2xl font-black">Active plans, revenue metrics, employer subscriptions, and user subscriptions.</h2>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card icon={Gem} title="Active Plans" value="Live plan mix" />
          <Card icon={DollarSign} title="Revenue Metrics" value="Payment summaries" />
          <Card icon={CreditCard} title="Employer Subscriptions" value="Grandmaster Corporate accounts" />
          <Card icon={Users} title="User Subscriptions" value="Initiate / Architect" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6 text-sm text-muted-foreground">
          Detailed revenue and subscription history endpoints are not currently exposed in Swagger, so this page provides the dedicated admin workspace without inventing mock billing data.
        </div>
      </div>
    </DashboardShell>
  );
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
