import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";

type AssignedMission = {
  missionName: string;
  score: string;
  completed: boolean;
  passed: boolean;
};

export default function TeamMemberMissions() {
  const [, params] = useRoute("/employer/analytics/:userId/missions");
  const userId = params?.userId ? decodeURIComponent(params.userId) : "";
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const memberName = search.get("name") || "Team Member";
  const [missions, setMissions] = useState<AssignedMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.employers.teamAnalytics().then((res) => {
      if (!res.ok) {
        setError(res.error || "Unable to load assigned missions.");
        setLoading(false);
        return;
      }
      const roster = normRoster(res.data);
      const member = roster.find((item) => item.userId === userId);
      setMissions(member?.assignedMissions ?? []);
      setLoading(false);
    });
  }, [userId]);

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Assigned Missions" subtitle="// employer.team.member.missions" theme="employer">
      <div className="space-y-5">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/employer/analytics">
            <ArrowLeft className="mr-2 h-4 w-4" /> Team Member
          </Link>
        </Button>
        <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Team Member</p>
          <h2 className="mt-1 text-2xl font-black">{memberName}</h2>
          <p className="mt-2 break-all text-xs font-mono text-muted-foreground">UserId: {userId || "-"}</p>
        </div>
        {loading ? (
          <LoadingState label="Loading assigned missions..." variant="table" rows={5} />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>
        ) : missions.length === 0 ? (
          <EmptyState icon={Users} title="No assigned missions" description="No assigned missions were returned for this team member." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0d1119]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Mission Name</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Completed Status</th>
                  <th className="px-4 py-3">Pass Status</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((mission, index) => (
                  <tr key={`${mission.missionName}-${index}`} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium">{mission.missionName}</td>
                    <td className="px-4 py-3">{mission.score}</td>
                    <td className="px-4 py-3">{mission.completed ? "Completed" : "Not Completed"}</td>
                    <td className="px-4 py-3">{mission.passed ? "Passed" : "Not Passed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normRoster(data: any): { userId: string; assignedMissions: AssignedMission[] }[] {
  const root = data?.data ?? data?.analytics ?? data;
  const rows = arrayOf(root?.detailedRoster ?? root?.DetailedRoster ?? root?.employees ?? root?.teamMembers ?? root?.members);
  return rows.map((item) => ({
    userId: text(item?.userId ?? item?.UserId ?? item?.id ?? item?.Id, ""),
    assignedMissions: arrayOf(item?.assignedMissions ?? item?.AssignedMissions ?? item?.missionsAssigned ?? item?.MissionsAssigned ?? item?.missions ?? item?.Missions).map(normMission),
  }));
}

function normMission(mission: any): AssignedMission {
  return {
    missionName: text(mission?.missionName ?? mission?.MissionName ?? mission?.challengeName ?? mission?.ChallengeName ?? mission?.name ?? mission?.Name, "Mission"),
    score: text(mission?.score ?? mission?.Score ?? mission?.evaluationScore ?? mission?.EvaluationScore, "-"),
    completed: Boolean(mission?.completed ?? mission?.Completed ?? mission?.isCompleted ?? mission?.IsCompleted ?? mission?.hasCompleted ?? mission?.HasCompleted),
    passed: Boolean(mission?.passed ?? mission?.Passed ?? mission?.isPassed ?? mission?.IsPassed),
  };
}

function arrayOf(value: any): any[] {
  return Array.isArray(value) ? value : [];
}
