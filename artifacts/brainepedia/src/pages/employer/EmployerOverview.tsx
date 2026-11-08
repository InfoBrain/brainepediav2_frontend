import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BriefcaseBusiness,
  Building2,
  Clock,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDisplayDate, text } from "@/lib/jobData";
import { BrainiacCreditsCard } from "@/components/credits/BrainiacCreditsCard";
import { useOptionalBrainiacCredits } from "@/hooks/useBrainiacCredits";

type ProfileData = {
  companyName?: string;
  companyLogoUrl?: string;
  aboutCompany?: string;
  planType?: string;
};

type DashboardSummary = {
  totalJobsPosted: number;
  activeJobsCount: number;
  totalApplicantsCount: number;
  pendingApplicantsCount: number;
  totalActiveTeamMembers: number;
  totalSavedCandidatesCount: number;
  activeSubscriptionTier: string;
  nextBillingDate: string;
  billingStatus: string;
  globalTeamCompletionRate: number;
  recentActivities: ActivityItem[];
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
};

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tint: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tracking-tight text-[#182137] dark:text-white">{value}</p>
        <p className="mt-1 text-sm font-bold text-[#182137] dark:text-white">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-[#70798d] dark:text-white/60">{sub}</p>}
      </div>
    </div>
  );
}

export default function EmployerOverview() {
  const user = getUser();
  const [, navigate] = useLocation();
  const credits = useOptionalBrainiacCredits();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const [summaryRes, profileRes] = await Promise.all([
        api.dashboard.summary(),
        api.employers.myProfile(),
      ]);
      if (summaryRes.ok) {
        setSummary(normSummary(summaryRes.data));
      } else {
        setSummary(null);
        setError(summaryRes.error || "Unable to load dashboard summary.");
      }
      if (profileRes.ok) setProfile(normProfile(profileRes.data));
      setLoading(false);
    }
    load();
  }, []);

  const companyName = profile?.companyName || user?.companyName || user?.firstName || "Your company";
  const logoUrl = profile?.companyLogoUrl;
  const plan = summary?.activeSubscriptionTier && summary.activeSubscriptionTier !== "-"
    ? summary.activeSubscriptionTier
    : profile?.planType || "Employer workspace";
  const lagosHour = (new Date().getUTCHours() + 1) % 24;
  const greeting = lagosHour < 12 ? "Good morning" : lagosHour < 17 ? "Good afternoon" : "Good evening";
  const mark = companyName.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Dashboard" theme="employer" showHeading={false}>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#276ef1]">Employer overview</p>
            <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight text-[#182137] dark:text-white">
              {greeting}, {companyName}.
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[#70798d] dark:text-white/60">Manage recruitment, discover skilled professionals, and find the right talent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/employer/candidates" className="inline-flex h-10 items-center rounded-[10px] border border-[#e6e8ef] bg-white px-4 text-sm font-bold text-[#182137] shadow-sm dark:border-white/15 dark:bg-[#0d1119] dark:text-white">
              Discover Talent
            </Link>
            <Link href="/employer/jobs/create" className="inline-flex h-10 items-center rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(125,76,204,0.28)]">
              + Post a Job
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#276ef1]" />
            <span className="text-sm font-semibold">Loading overview...</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>
        ) : summary ? (
          <>
            <section className="flex flex-col gap-4 rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)] sm:flex-row sm:items-center dark:border-white/10 dark:bg-[#0d1119]">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#276ef1] text-sm font-extrabold text-white">{mark}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#276ef1]">
                  {summary.activeSubscriptionTier && summary.activeSubscriptionTier !== "-" ? "Verified employer" : "Employer"}
                </p>
                <h2 className="text-lg font-extrabold text-[#182137] dark:text-white">{companyName}</h2>
                <p className="text-sm text-[#70798d] dark:text-white/60">{plan}{user?.email ? ` · ${user.email}` : ""}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-extrabold text-[#276ef1]">
                Employer workspace active
              </span>
            </section>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard icon={BriefcaseBusiness} label="Active jobs" value={summary.activeJobsCount} sub={`${summary.totalJobsPosted} posted in total`} tint="bg-[#edf4ff] text-[#276ef1]" />
              <MetricCard icon={Users} label="Total applications" value={summary.totalApplicantsCount} sub="Across all jobs" tint="bg-[#f5f0fc] text-[#7d4ccc]" />
              <MetricCard icon={Clock} label="New applications" value={summary.pendingApplicantsCount} sub="Awaiting review" tint="bg-[#fff6e8] text-[#d88c1b]" />
              <MetricCard icon={UserCheck} label="Saved professionals" value={summary.totalSavedCandidatesCount} sub="Ready for follow-up" tint="bg-[#eefaf4] text-[#168a68]" />
              <MetricCard icon={Building2} label="Team members" value={summary.totalActiveTeamMembers} sub={`${summary.globalTeamCompletionRate}% mission completion`} tint="bg-[#f3f5f8] text-[#276ef1]" />
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
              <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-[#182137] dark:text-white">Recent activity</h2>
                    <p className="text-xs text-[#70798d] dark:text-white/60">Latest updates from your employer workspace</p>
                  </div>
                  <Link href="/employer/applications" className="text-sm font-bold text-[#276ef1]">View all</Link>
                </div>
                {summary.recentActivities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e6e8ef] px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-[#182137] dark:text-white">No recent activity yet</p>
                    <p className="mt-1 text-sm text-[#70798d] dark:text-white/60">Applications and hiring updates will show here as they happen.</p>
                    <Link href="/employer/applications" className="mt-3 inline-flex text-sm font-bold text-[#276ef1]">Review applications</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#eef0f4]">
                    {summary.recentActivities.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[#182137] dark:text-white">{item.title}</p>
                          {item.description && <p className="text-sm text-[#70798d] dark:text-white/60">{item.description}</p>}
                          <p className="mt-1 text-xs text-[#8c93a2] dark:text-white/45">{formatDisplayDate(item.date, "Date unavailable")}</p>
                        </div>
                        <Link href="/employer/applications" className="shrink-0 text-sm font-bold text-[#276ef1]">Review</Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="space-y-4">
                <section className="rounded-2xl bg-gradient-to-br from-[#5b35c5] to-[#7d4ccc] p-5 text-white shadow-[0_12px_30px_rgba(125,76,204,0.28)]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/80">Brainiac employer insights</p>
                  <h2 className="mt-2 text-xl font-extrabold">Smarter talent insights</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">Compare profile evidence with your job requirements. AI insights support, and do not replace, your recruitment decisions.</p>
                  <Link href="/employer/candidates" className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-white px-4 text-sm font-bold text-[#5b35c5]">
                    Explore compatibility insights
                  </Link>
                </section>

                <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
                  <h2 className="text-base font-extrabold text-[#182137] dark:text-white">Recruitment pipeline</h2>
                  <div className="mt-4 space-y-3">
                    <PipelineRow label="Active jobs" value={summary.activeJobsCount} max={Math.max(summary.activeJobsCount, summary.totalApplicantsCount, summary.pendingApplicantsCount, summary.totalSavedCandidatesCount, 1)} />
                    <PipelineRow label="Awaiting review" value={summary.pendingApplicantsCount} max={Math.max(summary.activeJobsCount, summary.totalApplicantsCount, summary.pendingApplicantsCount, summary.totalSavedCandidatesCount, 1)} />
                    <PipelineRow label="Total applications" value={summary.totalApplicantsCount} max={Math.max(summary.activeJobsCount, summary.totalApplicantsCount, summary.pendingApplicantsCount, summary.totalSavedCandidatesCount, 1)} />
                    <PipelineRow label="Saved professionals" value={summary.totalSavedCandidatesCount} max={Math.max(summary.activeJobsCount, summary.totalApplicantsCount, summary.pendingApplicantsCount, summary.totalSavedCandidatesCount, 1)} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#70798d] dark:text-white/60">
                    <p>Plan: <span className="font-bold text-[#182137] dark:text-white">{summary.activeSubscriptionTier}</span></p>
                    <p>Billing: <span className="font-bold text-[#182137] dark:text-white">{summary.billingStatus}</span></p>
                    <p className="col-span-2">Next billing: <span className="font-bold text-[#182137] dark:text-white">{summary.nextBillingDate}</span></p>
                  </div>
                </section>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {credits && (
                <BrainiacCreditsCard
                  title="Organization Brainiac credits"
                  compact
                  balance={credits.organizationBalance}
                  loading={credits.organizationLoading}
                  error={credits.organizationError}
                  usageHref="/employer/credits"
                  billingHref="/employer/billing"
                  onRefresh={() => void credits.refreshOrganization()}
                  onUpgrade={() => navigate("/employer/subscription")}
                  onRecharge={() => navigate("/employer/billing")}
                />
              )}
              <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
                <h2 className="text-base font-extrabold text-[#182137] dark:text-white">Workspace actions</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Add team member", href: "/employer/team" },
                    { label: "Create job", href: "/employer/jobs/create" },
                    { label: "Review applicants", href: "/employer/applications" },
                    { label: "Discover professionals", href: "/employer/candidates" },
                    { label: "Saved professionals", href: "/employer/saved-candidates" },
                    { label: "Team analytics", href: "/employer/analytics" },
                  ].map((action) => (
                    <Link key={action.href} href={action.href} className="rounded-xl border border-[#e6e8ef] px-3 py-3 text-sm font-bold text-[#276ef1] hover:bg-[#edf4ff] dark:border-white/15 dark:text-[#8db5ff] dark:hover:bg-white/5">
                      {action.label}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function PipelineRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(6, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-[#626b7d] dark:text-white/65">{label}</span>
        <span className="font-extrabold text-[#182137] dark:text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eef1f6] dark:bg-white/10">
        <div className="h-full rounded-full bg-[#276ef1]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function normProfile(d: any): ProfileData {
  return {
    companyName: d?.companyName ?? d?.name,
    companyLogoUrl: d?.companyLogoUrl ?? d?.logoUrl,
    aboutCompany: d?.aboutCompany ?? d?.about,
    planType: d?.planType ?? d?.plan,
  };
}

function normSummary(data: any): DashboardSummary {
  const root = data?.data ?? data?.summary ?? data ?? {};
  return {
    totalJobsPosted: numberOf(root?.totalJobsPosted ?? root?.TotalJobsPosted),
    activeJobsCount: numberOf(root?.activeJobsCount ?? root?.ActiveJobsCount),
    totalApplicantsCount: numberOf(root?.totalApplicantsCount ?? root?.TotalApplicantsCount),
    pendingApplicantsCount: numberOf(root?.pendingApplicantsCount ?? root?.PendingApplicantsCount),
    totalActiveTeamMembers: numberOf(root?.totalActiveTeamMembers ?? root?.TotalActiveTeamMembers),
    totalSavedCandidatesCount: numberOf(root?.totalSavedCandidatesCount ?? root?.TotalSavedCandidatesCount),
    activeSubscriptionTier: text(root?.activeSubscriptionTier ?? root?.ActiveSubscriptionTier, "-"),
    nextBillingDate: formatDisplayDate(root?.nextBillingDate ?? root?.NextBillingDate, "-"),
    billingStatus: text(root?.billingStatus ?? root?.BillingStatus, "-"),
    globalTeamCompletionRate: numberOf(root?.globalTeamCompletionRate ?? root?.GlobalTeamCompletionRate),
    recentActivities: activityList(root?.recentActivities ?? root?.RecentActivities),
  };
}

function activityList(value: any): ActivityItem[] {
  const rows = Array.isArray(value) ? value : [];
  return rows.map((item, index) => ({
    id: text(item?.id ?? item?.Id ?? item?.activityId ?? item?.ActivityId ?? index, String(index)),
    title: text(item?.title ?? item?.Title ?? item?.activity ?? item?.Activity ?? item?.message ?? item?.Message, "Activity"),
    description: text(item?.description ?? item?.Description ?? item?.details ?? item?.Details, ""),
    date: text(item?.createdAt ?? item?.CreatedAt ?? item?.dateCreated ?? item?.DateCreated ?? item?.timestamp ?? item?.Timestamp, ""),
  }));
}

function numberOf(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
