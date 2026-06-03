import { useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, Loader2, MessageSquare, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminAnalytics() {
  usePageTitle("Admin Analytics");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.stats().then((res) => {
      if (res.ok) setStats(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Analytics" subtitle="// platform.metrics" theme="admin">
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#A5B4FC]" /> Loading analytics...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} title="User Metrics" value={stats?.totalUsers ?? stats?.userCount ?? "—"} detail="Learners and professionals" />
          <Metric icon={BriefcaseBusiness} title="Employer Metrics" value={stats?.totalEmployers ?? stats?.employerCount ?? "—"} detail="Recruitment organizations" />
          <Metric icon={BarChart3} title="Jobs Metrics" value={stats?.totalJobs ?? stats?.jobCount ?? "—"} detail="Job postings and applicant flow" />
          <Metric icon={MessageSquare} title="Community Metrics" value={stats?.forumThreads ?? stats?.communityCount ?? "—"} detail="Forum discussions and engagement" />
        </div>
      )}
    </DashboardShell>
  );
}

function Metric({ icon: Icon, title, value, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; value: unknown; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
      <Icon className="mb-3 h-6 w-6 text-[#A5B4FC]" />
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-black text-[#A5B4FC]">{String(value)}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
