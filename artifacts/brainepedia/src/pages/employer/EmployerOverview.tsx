import { useEffect, useState } from "react";
import { Users, Lock, UserCheck, CreditCard, Zap, Building2, Loader2, BriefcaseBusiness, Bookmark } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { asList } from "@/lib/jobData";

type BillingData = {
  billingCycleStart?: string;
  uniqueActiveEmployees?: number;
  planType?: string;
  totalSeats?: number;
  activeSeats?: number;
};

type AnalyticsData = {
  organizationSize?: number;
  totalChallenges?: number;
  totalCandidates?: number;
  employees?: any[];
};

type ProfileData = {
  companyName?: string;
  companyLogoUrl?: string;
  aboutCompany?: string;
  planType?: string;
};

type JobsOverview = {
  totalJobs: number;
  totalApplicants: number;
  savedCandidates: number;
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
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [jobsOverview, setJobsOverview] = useState<JobsOverview>({ totalJobs: 0, totalApplicants: 0, savedCandidates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [bRes, aRes, pRes, jobsRes, savedRes] = await Promise.all([
        api.employers.billingSeats(),
        api.employers.teamAnalytics(),
        api.employers.myProfile(),
        api.jobs.myPostings(),
        api.jobs.savedCandidates(),
      ]);
      if (bRes.ok) setBilling(normBilling(bRes.data));
      if (aRes.ok) setAnalytics(normAnalytics(aRes.data));
      if (pRes.ok) setProfile(normProfile(pRes.data));
      const postings = jobsRes.ok ? asList(jobsRes.data) : [];
      const saved = savedRes.ok ? asList(savedRes.data) : [];
      setJobsOverview({
        totalJobs: postings.length,
        totalApplicants: postings.reduce((sum, job) => sum + Number(job?.applicantCount ?? job?.applicationsCount ?? job?.totalApplicants ?? 0), 0),
        savedCandidates: saved.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  const companyName = profile?.companyName || user?.firstName || "Your Company";
  const logoUrl = profile?.companyLogoUrl;

  return (
    <DashboardShell
      nav={EMPLOYER_NAV}
      title="Employer Dashboard"
      subtitle="// employer.command.center"
      theme="employer"
    >
      <div className="space-y-6">
        {/* Header */}
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
              {profile?.planType ? `Plan: ${profile.planType}` : "Employer Account"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm">Loading overview…</span>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={BriefcaseBusiness}
                label="Total Jobs"
                value={jobsOverview.totalJobs}
                sub="Active postings"
                color="#00D2FF"
              />
              <StatCard
                icon={UserCheck}
                label="Total Applicants"
                value={jobsOverview.totalApplicants}
                sub="Across job postings"
                color="#9D4EDD"
              />
              <StatCard
                icon={Bookmark}
                label="Saved Candidates"
                value={jobsOverview.savedCandidates}
                sub="Shortlisted talent"
                color="#FFD700"
              />
              <StatCard
                icon={Users}
                label="Team Size"
                value={analytics?.organizationSize ?? analytics?.employees?.length ?? "—"}
                sub="Provisioned members"
                color="#22c55e"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Add Team Member", href: "/employer/team", color: "#00D2FF" },
                  { label: "Create Job", href: "/employer/jobs/create", color: "#9D4EDD" },
                  { label: "Review Applicants", href: "/employer/applications", color: "#FFD700" },
                  { label: "Explore Candidates", href: "/employer/candidates", color: "#22c55e" },
                ].map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    className="rounded-lg p-3 text-center text-sm font-medium border transition-all hover:scale-[1.02]"
                    style={{
                      background: `${a.color}10`,
                      borderColor: `${a.color}30`,
                      color: a.color,
                    }}
                  >
                    {a.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Recent Team Members */}
            {(analytics?.employees?.length ?? 0) > 0 && (
              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#00D2FF]" />
                  Team Members
                </h3>
                <div className="space-y-2">
                  {analytics!.employees!.slice(0, 5).map((emp: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00D2FF]/30 to-[#7C3AED]/20 flex items-center justify-center text-xs font-bold shrink-0">
                        {(emp.firstName || emp.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name || "Employee"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{emp.profession || emp.email || "—"}</p>
                      </div>
                      {emp.totalXP !== undefined && (
                        <span className="text-xs font-mono text-[#00D2FF] shrink-0">{emp.totalXP} XP</span>
                      )}
                    </div>
                  ))}
                </div>
                {analytics!.employees!.length > 5 && (
                  <a href="/employer/analytics" className="text-xs text-[#00D2FF] hover:underline mt-3 inline-block">
                    View all {analytics!.employees!.length} members →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function normBilling(d: any): BillingData {
  return {
    billingCycleStart: d?.billingCycleStart ?? d?.cycleStart,
    uniqueActiveEmployees: d?.uniqueActiveEmployees ?? d?.activeEmployees ?? d?.activeSeats,
    planType: d?.planType ?? d?.plan ?? d?.tier,
    totalSeats: d?.totalSeats,
    activeSeats: d?.activeSeats,
  };
}

function normAnalytics(d: any): AnalyticsData {
  return {
    organizationSize: d?.organizationSize ?? d?.teamSize ?? d?.totalMembers,
    totalChallenges: d?.totalChallenges ?? d?.activeChallenges,
    totalCandidates: d?.totalCandidates ?? d?.candidates,
    employees: Array.isArray(d?.employees) ? d.employees : Array.isArray(d?.members) ? d.members : [],
  };
}

function normProfile(d: any): ProfileData {
  return {
    companyName: d?.companyName ?? d?.name,
    companyLogoUrl: d?.companyLogoUrl ?? d?.logoUrl,
    aboutCompany: d?.aboutCompany ?? d?.about,
    planType: d?.planType ?? d?.plan,
  };
}
