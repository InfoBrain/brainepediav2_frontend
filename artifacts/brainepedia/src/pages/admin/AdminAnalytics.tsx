import { useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, Loader2, MessageSquare } from "lucide-react";
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
        <div className="space-y-6">
          <MetricSection
            title="Employer Metrics"
            icon={BriefcaseBusiness}
            metrics={[
              ["Total Employers", valueOf(stats, ["totalEmployers", "employerCount", "employers"])],
              ["Active Employers", valueOf(stats, ["activeEmployers", "activeEmployerCount"])],
              ["Grandmaster Employers", valueOf(stats, ["grandmasterEmployers", "grandmasterEmployerCount", "grandmasterSubscriptions"])],
            ]}
          />
          <MetricSection
            title="Job Metrics"
            icon={BarChart3}
            metrics={[
              ["Total Jobs", valueOf(stats, ["totalJobs", "jobCount", "jobs"])],
              ["Active Jobs", valueOf(stats, ["activeJobs", "activeJobCount"])],
              ["Applications", valueOf(stats, ["applications", "totalApplications", "applicationCount"])],
            ]}
          />
          <MetricSection
            title="Community Metrics"
            icon={MessageSquare}
            metrics={[
              ["Users", valueOf(stats, ["totalUsers", "userCount", "users"])],
              ["Threads", valueOf(stats, ["threads", "forumThreads", "threadCount"])],
              ["Posts", valueOf(stats, ["posts", "forumPosts", "postCount", "replies"])],
              ["Engagement", valueOf(stats, ["engagement", "communityEngagement", "engagementRate"])],
            ]}
          />
        </div>
      )}
    </DashboardShell>
  );
}

function MetricSection({
  title,
  icon: Icon,
  metrics,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  metrics: [string, unknown][];
}) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#A5B4FC]" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#A5B4FC]">{String(value ?? "—")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function valueOf(stats: any, keys: string[]): unknown {
  for (const key of keys) {
    if (stats?.[key] !== undefined && stats?.[key] !== null) return stats[key];
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (stats?.[pascal] !== undefined && stats?.[pascal] !== null) return stats[pascal];
  }
  return "—";
}
