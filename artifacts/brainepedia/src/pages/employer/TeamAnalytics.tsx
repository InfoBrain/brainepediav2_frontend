import { useEffect, useState } from "react";
import { Loader2, Trophy, Users } from "lucide-react";
import { Link } from "wouter";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { text } from "@/lib/jobData";

type OverviewMetrics = {
  organizationSize: number;
  totalAssignedMissions: number;
  totalCompletedMissions: number;
  teamCompletionRate: number;
  averageTeamEvaluationScore: number;
};

type AssignedMission = {
  missionName: string;
  score: string;
  completed: boolean;
  passed: boolean;
};

type RosterMember = {
  userId: string;
  fullName: string;
  profession?: string;
  rankTitle?: string;
  xp: number;
  vx: number;
  problemsSolved: number;
  dayStreak: number;
  missions: number;
  completedMissions: number;
  completionRate: number;
  status: string;
  assignedMissions: AssignedMission[];
};

type LeaderboardMember = {
  rank: number;
  fullName: string;
  profession?: string;
  xp: number;
  vx: number;
  completedMissions: number;
};

type AnalyticsData = {
  overviewMetrics: OverviewMetrics;
  detailedRoster: RosterMember[];
  performanceLeaderboard: LeaderboardMember[];
};

function StatPill({ label, value, color = "#00D2FF" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0d1119] border border-white/5 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function TeamAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.employers.teamAnalytics().then((res) => {
      if (res.ok) setData(normAnalytics(res.data));
      else setError(res.error || "Unable to load team analytics.");
      setLoading(false);
    });
  }, []);

  const overview = data?.overviewMetrics;

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Analytics" subtitle="// employer.insights.performance" theme="employer">
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-mono text-sm">Loading analytics…</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : !data || !overview ? (
        <div className="py-16 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
          No analytics data available yet. Add team members to see insights.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#00D2FF]/30 bg-gradient-to-br from-[#00D2FF]/15 to-[#0d1119] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Team Members Count</p>
                <h2 className="mt-1 text-5xl font-black text-[#00D2FF]">{overview.organizationSize.toLocaleString()}</h2>
              </div>
              <Users className="h-12 w-12 text-[#00D2FF]/60" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatPill label="Organization Size" value={overview.organizationSize.toLocaleString()} color="#00D2FF" />
            <StatPill label="Total Assigned Missions" value={overview.totalAssignedMissions.toLocaleString()} color="#9D4EDD" />
            <StatPill label="Total Completed Missions" value={overview.totalCompletedMissions.toLocaleString()} color="#22c55e" />
            <StatPill label="Team Completion Rate" value={`${overview.teamCompletionRate}%`} color="#FFD700" />
            <StatPill label="Avg Team Evaluation Score" value={`${overview.averageTeamEvaluationScore}%`} color="#f97316" />
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0d1119] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
              <Users className="h-4 w-4 text-[#00D2FF]" />
              Detailed Roster
            </h3>
            {data.detailedRoster.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                No team member analytics were returned yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Profession</th>
                      <th className="px-3 py-3">XP</th>
                      <th className="px-3 py-3">VX</th>
                      <th className="px-3 py-3">Completion %</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Assigned Missions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detailedRoster.map((employee) => (
                      <tr key={employee.userId} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-3 font-medium">{employee.fullName}</td>
                        <td className="px-3 py-3 text-muted-foreground">{employee.profession || "—"}</td>
                        <td className="px-3 py-3 font-mono text-[#00D2FF]">{employee.xp.toLocaleString()} XP</td>
                        <td className="px-3 py-3">{employee.vx.toLocaleString()} VX</td>
                        <td className="px-3 py-3">{employee.completionRate}%</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-mono ${employee.status === "Completed" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : employee.status === "In Progress" ? "border-[#00D2FF]/40 bg-[#00D2FF]/10 text-[#00D2FF]" : "border-white/10 bg-white/5 text-muted-foreground"}`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/employer/analytics/${encodeURIComponent(employee.userId)}/missions?name=${encodeURIComponent(employee.fullName)}`}
                            className="inline-flex min-h-8 items-center justify-center rounded-md border px-3 text-xs font-medium text-[#00D2FF] hover:bg-[#00D2FF]/10"
                          >
                            View Assigned Missions
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0d1119] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
              <Trophy className="h-4 w-4 text-[#FFD700]" />
              Performance Leaderboard
            </h3>
            {data.performanceLeaderboard.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                No leaderboard data was returned yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3">Rank</th>
                      <th className="px-3 py-3">Full Name</th>
                      <th className="px-3 py-3">Profession</th>
                      <th className="px-3 py-3">XP</th>
                      <th className="px-3 py-3">VX</th>
                      <th className="px-3 py-3">Completed Missions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.performanceLeaderboard.map((employee) => (
                      <tr key={`${employee.rank}-${employee.fullName}`} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-3 font-mono text-[#FFD700]">#{employee.rank}</td>
                        <td className="px-3 py-3 font-medium">{employee.fullName}</td>
                        <td className="px-3 py-3 text-muted-foreground">{employee.profession || "—"}</td>
                        <td className="px-3 py-3 font-mono text-[#00D2FF]">{employee.xp.toLocaleString()} XP</td>
                        <td className="px-3 py-3">{employee.vx.toLocaleString()} VX</td>
                        <td className="px-3 py-3">{employee.completedMissions.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function normAnalytics(d: any): AnalyticsData {
  const root = d?.data ?? d?.analytics ?? d;
  const overview = root?.overviewMetrics ?? root?.OverviewMetrics ?? root;
  const detailedRoster = arrayOf(root?.detailedRoster ?? root?.DetailedRoster ?? root?.employees ?? root?.teamMembers ?? root?.members).map(normRosterMember);
  const performanceLeaderboard = arrayOf(root?.performanceLeaderboard ?? root?.PerformanceLeaderboard).map(normLeaderboardMember);
  const fallbackLeaderboard = detailedRoster
    .slice()
    .sort((a, b) => b.xp - a.xp)
    .map((member, index) => ({
      rank: index + 1,
      fullName: member.fullName,
      profession: member.profession,
      xp: member.xp,
      vx: member.vx,
      completedMissions: member.completedMissions,
    }));
  return {
    overviewMetrics: {
      organizationSize: numberOf(overview?.organizationSize ?? overview?.OrganizationSize ?? detailedRoster.length),
      totalAssignedMissions: numberOf(overview?.totalAssignedMissions ?? overview?.TotalAssignedMissions ?? sum(detailedRoster, "missions")),
      totalCompletedMissions: numberOf(overview?.totalCompletedMissions ?? overview?.TotalCompletedMissions ?? sum(detailedRoster, "completedMissions")),
      teamCompletionRate: numberOf(overview?.teamCompletionRate ?? overview?.TeamCompletionRate),
      averageTeamEvaluationScore: numberOf(overview?.averageTeamEvaluationScore ?? overview?.AverageTeamEvaluationScore),
    },
    detailedRoster,
    performanceLeaderboard: performanceLeaderboard.length ? performanceLeaderboard : fallbackLeaderboard,
  };
}

function normRosterMember(x: any): RosterMember {
  const missions = arrayOf(x?.assignedMissions ?? x?.AssignedMissions ?? x?.missionsAssigned ?? x?.MissionsAssigned ?? x?.missions ?? x?.Missions);
  const completedMissions = numberOf(x?.completedMissions ?? x?.CompletedMissions ?? x?.totalCompletedMissions ?? x?.TotalCompletedMissions);
  const totalMissions = numberOf(x?.missions ?? x?.Missions ?? x?.totalMissions ?? x?.TotalMissions ?? missions.length);
  const completed = completedMissions || missions.filter((mission) => Boolean(mission?.completed ?? mission?.Completed ?? mission?.isCompleted ?? mission?.IsCompleted)).length;
  const completionRate = totalMissions ? Math.round((completed / totalMissions) * 100) : 0;
  return {
    userId: String(x?.userId ?? x?.UserId ?? x?.id ?? x?.Id ?? `${text(x?.fullName ?? x?.FullName ?? x?.name, "member")}-${Math.random()}`),
    fullName: text(x?.fullName ?? x?.FullName ?? x?.name ?? x?.Name ?? `${x?.firstName ?? x?.FirstName ?? ""} ${x?.lastName ?? x?.LastName ?? ""}`.trim(), "Team member"),
    profession: text(x?.profession ?? x?.Profession ?? x?.professionName ?? x?.ProfessionName, ""),
    rankTitle: text(x?.rankTitle ?? x?.RankTitle ?? x?.rank ?? x?.Rank, ""),
    xp: numberOf(x?.xp ?? x?.XP ?? x?.totalXP ?? x?.TotalXP ?? x?.totalXp ?? x?.TotalXp),
    vx: numberOf(x?.vx ?? x?.VX ?? x?.verifiedExperience ?? x?.VerifiedExperience ?? x?.verifiedExperienceYears ?? x?.VerifiedExperienceYears),
    problemsSolved: numberOf(x?.problemsSolved ?? x?.ProblemsSolved ?? x?.solved ?? x?.Solved),
    dayStreak: numberOf(x?.dayStreak ?? x?.DayStreak ?? x?.streak ?? x?.Streak),
    missions: totalMissions,
    completedMissions: completed,
    completionRate,
    status: completionRate >= 100 ? "Completed" : completionRate > 0 ? "In Progress" : "Not Started",
    assignedMissions: missions.map(normAssignedMission),
  };
}

function normAssignedMission(mission: any): AssignedMission {
  return {
    missionName: text(mission?.missionName ?? mission?.MissionName ?? mission?.challengeName ?? mission?.ChallengeName ?? mission?.name ?? mission?.Name, "Mission"),
    score: text(mission?.score ?? mission?.Score ?? mission?.evaluationScore ?? mission?.EvaluationScore, "—"),
    completed: Boolean(mission?.completed ?? mission?.Completed ?? mission?.isCompleted ?? mission?.IsCompleted ?? mission?.hasCompleted ?? mission?.HasCompleted),
    passed: Boolean(mission?.passed ?? mission?.Passed ?? mission?.isPassed ?? mission?.IsPassed),
  };
}

function normLeaderboardMember(x: any, index: number): LeaderboardMember {
  return {
    rank: numberOf(x?.rank ?? x?.Rank ?? x?.position ?? x?.Position) || index + 1,
    fullName: text(x?.fullName ?? x?.FullName ?? x?.name ?? x?.Name, "Team member"),
    profession: text(x?.profession ?? x?.Profession ?? x?.professionName ?? x?.ProfessionName, ""),
    xp: numberOf(x?.xp ?? x?.XP ?? x?.totalXP ?? x?.TotalXP ?? x?.totalXp ?? x?.TotalXp),
    vx: numberOf(x?.vx ?? x?.VX ?? x?.verifiedExperience ?? x?.VerifiedExperience),
    completedMissions: numberOf(x?.completedMissions ?? x?.CompletedMissions ?? x?.totalCompletedMissions ?? x?.TotalCompletedMissions),
  };
}

function arrayOf(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function numberOf(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(items: RosterMember[], key: "missions" | "completedMissions"): number {
  return items.reduce((total, item) => total + item[key], 0);
}
