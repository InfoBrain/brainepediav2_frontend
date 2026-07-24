import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { BarChart3, BriefcaseBusiness, MessageSquare, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ErrorState } from "@/components/ux/ErrorState";
import { LoadingState } from "@/components/ux/LoadingState";
import { PageHeader } from "@/components/ux/PageHeader";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

const AnalyticsChartInner = lazy(() => import("@/components/charts/AnalyticsChartInner"));

export default function AdminAnalytics() {
  usePageTitle("Admin Analytics");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await api.admin.analytics();
    if (res.ok) {
      setStats(res.data);
    } else {
      setStats(null);
      setError(res.error || "Unable to load analytics.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const employerMetrics = useMemo(() => ({
    total: metric(stats, ["employerMetrics.totalEmployers", "totalEmployers", "employerCount", "employers"]),
    active: metric(stats, ["employerMetrics.activeEmployers", "activeEmployers", "activeEmployerCount"]),
    grandmaster: metric(stats, ["employerMetrics.grandmasterEmployers", "grandmasterEmployers", "grandmasterEmployerCount", "grandmasterSubscriptions"]),
  }), [stats]);

  const jobMetrics = useMemo(() => ({
    total: metric(stats, ["jobMetrics.totalJobs", "totalJobs", "jobCount", "jobs"]),
    active: metric(stats, ["jobMetrics.activeJobs", "activeJobs", "activeJobCount"]),
    applications: metric(stats, ["jobMetrics.applications", "jobMetrics.totalApplications", "applications", "totalApplications", "applicationCount"]),
  }), [stats]);

  const communityMetrics = useMemo(() => ({
    users: metric(stats, ["communityMetrics.users", "communityMetrics.totalUsers", "totalUsers", "userCount", "users"]),
    threads: metric(stats, ["communityMetrics.threads", "threads", "forumThreads", "threadCount"]),
    posts: metric(stats, ["communityMetrics.posts", "posts", "forumPosts", "postCount", "replies"]),
    engagement: metric(stats, ["communityMetrics.totalEngagement", "communityMetrics.engagement", "engagement", "communityEngagement", "engagementRate"]),
  }), [stats]);

  const chartData = useMemo(() => ([
    { name: "Employers", value: toNumber(employerMetrics.total) },
    { name: "Jobs", value: toNumber(jobMetrics.total) },
    { name: "Applications", value: toNumber(jobMetrics.applications) },
    { name: "Users", value: toNumber(communityMetrics.users) },
    { name: "Threads", value: toNumber(communityMetrics.threads) },
    { name: "Posts", value: toNumber(communityMetrics.posts) },
  ]), [employerMetrics, jobMetrics, communityMetrics]);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Analytics" subtitle="// platform.metrics" theme="admin">
      <div className="space-y-6">
        <PageHeader
          title="Platform Metrics"
          subtitle="Employer, job, and community performance across Brainepedia."
          actions={
            <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        {loading ? (
          <LoadingState variant="grid" rows={3} label="Loading analytics…" />
        ) : error ? (
          <ErrorState title="Unable to load analytics" message={error} onRetry={loadStats} showDashboardLink={false} />
        ) : (
          <>
            <MetricSection
              title="Employer Metrics"
              icon={BriefcaseBusiness}
              metrics={[
                ["Total Employers", employerMetrics.total],
                ["Active Employers", employerMetrics.active],
                ["Grandmaster Employers", employerMetrics.grandmaster],
              ]}
            />
            <MetricSection
              title="Job Metrics"
              icon={BarChart3}
              metrics={[
                ["Total Jobs", jobMetrics.total],
                ["Active Jobs", jobMetrics.active],
                ["Applications", jobMetrics.applications],
              ]}
            />
            <MetricSection
              title="Community Metrics"
              icon={MessageSquare}
              metrics={[
                ["Users", communityMetrics.users],
                ["Threads", communityMetrics.threads],
                ["Posts", communityMetrics.posts],
                ["Total Engagement", communityMetrics.engagement],
              ]}
            />
            <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
              <h2 className="mb-4 text-lg font-bold">Platform Overview</h2>
              <div className="h-72 w-full">
                <Suspense fallback={<LoadingState label="Loading chart..." variant="card" rows={1} />}>
                  <AnalyticsChartInner data={chartData} />
                </Suspense>
              </div>
            </section>
          </>
        )}
      </div>
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
            <p className="mt-2 text-3xl font-black text-[#A5B4FC]">{formatMetric(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function metric(stats: any, keys: string[]): unknown {
  for (const key of keys) {
    if (key.includes(".")) {
      const value = key.split(".").reduce((acc, part) => acc?.[part] ?? acc?.[part.charAt(0).toUpperCase() + part.slice(1)], stats);
      if (value !== undefined && value !== null) return value;
      continue;
    }
    if (stats?.[key] !== undefined && stats?.[key] !== null) return stats[key];
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (stats?.[pascal] !== undefined && stats?.[pascal] !== null) return stats[pascal];
  }
  return "—";
}

function formatMetric(value: unknown): string {
  if (value === null || value === undefined || value === "—") return "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
