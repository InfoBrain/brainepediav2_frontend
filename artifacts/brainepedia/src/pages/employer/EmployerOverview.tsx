import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Bookmark,
  BriefcaseBusiness,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDisplayDate, text } from "@/lib/jobData";

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

function StatCard({
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
    <div className="bg-[#0d1119] border border-white/5 rounded-xl p-5 flex items-start gap-4">
      <div
        className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function EmployerOverview() {
  const user = getUser();
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

  const companyName = profile?.companyName || user?.firstName || "Your Company";
  const logoUrl = profile?.companyLogoUrl;

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Employer Dashboard" subtitle="// employer.command.center" theme="employer">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-14 w-14 rounded-xl object-cover border border-white/10" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00D2FF]/30 to-[#7C3AED]/20 flex items-center justify-center border border-white/10">
              <Building2 className="h-6 w-6 text-[#00D2FF]" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{companyName}</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {summary?.activeSubscriptionTier ? `Plan: ${summary.activeSubscriptionTier}` : profile?.planType ? `Plan: ${profile.planType}` : "Employer Account"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm">Loading overview...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={BriefcaseBusiness} label="TotalJobsPosted" value={summary.totalJobsPosted} sub="All postings created" color="#00D2FF" />
              <StatCard icon={CheckCircle2} label="ActiveJobsCount" value={summary.activeJobsCount} sub="Currently open roles" color="#19C37D" />
              <StatCard icon={UserCheck} label="TotalApplicantsCount" value={summary.totalApplicantsCount} sub="Across job postings" color="#9D4EDD" />
              <StatCard icon={Clock} label="PendingApplicantsCount" value={summary.pendingApplicantsCount} sub="Awaiting review" color="#3284FF" />
              <StatCard icon={Users} label="TotalActiveTeamMembers" value={summary.totalActiveTeamMembers} sub="Active team seats" color="#22c55e" />
              <StatCard icon={Bookmark} label="TotalSavedCandidatesCount" value={summary.totalSavedCandidatesCount} sub="Shortlisted talent" color="#FFD700" />
              <StatCard icon={Zap} label="ActiveSubscriptionTier" value={summary.activeSubscriptionTier} sub="Organization plan" color="#FFD700" />
              <StatCard icon={CreditCard} label="BillingStatus" value={summary.billingStatus} sub={`NextBillingDate: ${summary.nextBillingDate}`} color="#f97316" />
              <StatCard icon={Activity} label="GlobalTeamCompletionRate" value={`${summary.globalTeamCompletionRate}%`} sub="Team mission completion" color="#00D2FF" />
            </div>

            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Add Team Member", href: "/employer/team", color: "#00D2FF" },
                  { label: "Create Job", href: "/employer/jobs/create", color: "#9D4EDD" },
                  { label: "Review Applicants", href: "/employer/applications", color: "#FFD700" },
                  { label: "Explore Candidates", href: "/employer/candidates", color: "#22c55e" },
                ].map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className="rounded-lg p-3 text-center text-sm font-medium border transition-all hover:scale-[1.02]"
                    style={{ background: `${action.color}10`, borderColor: `${action.color}30`, color: action.color }}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00D2FF]" />
                RecentActivities
              </h3>
              {summary.recentActivities.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                  No recent activity returned yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {summary.recentActivities.map((item) => (
                    <div key={item.id} className="relative flex gap-4 border-l border-[#00D2FF]/25 pl-4">
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-[#00D2FF] shadow-[0_0_12px_rgba(0,210,255,0.5)]" />
                      <div className="min-w-0">
                        <p className="font-semibold">{item.title}</p>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        <p className="mt-1 text-xs font-mono text-muted-foreground">{formatDisplayDate(item.date, "Date unavailable")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
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
