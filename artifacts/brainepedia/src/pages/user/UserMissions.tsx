import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, Loader2, Percent, RefreshCw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { asList, numberish, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type MissionRow = {
  id: string;
  title: string;
  status: string;
  date?: string;
  xp?: number;
  score?: number;
};

type MissionStats = {
  totalAssigned: number;
  completed: number;
  inProgress: number;
  totalXp: number;
  successRate: number;
  recent: MissionRow[];
};

export default function UserMissions() {
  usePageTitle("Missions");
  const { toast } = useToast();
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const userId = getUserId();
    if (!userId) {
      const message = "Unable to identify the current user. Please log in again.";
      setError(message);
      setStats(null);
      setLoading(false);
      toast({ title: "Missions unavailable", description: message, variant: "destructive" });
      return;
    }
    const res = await api.dashboard.userMissionStatistics(userId);
    if (!res.ok) {
      const message = res.error || "Could not load missions. Please try again.";
      setError(message);
      setStats(null);
      setLoading(false);
      toast({ title: "Missions unavailable", description: message, variant: "destructive" });
      return;
    }
    setStats(normStats(res.data));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const recent = useMemo(() => stats?.recent ?? [], [stats]);

  return (
    <DashboardShell nav={USER_NAV} title="Missions" subtitle="// mission.statistics.recent">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/10 to-[#0d1119] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#FFD700]">Mission command</p>
              <h2 className="mt-1 text-2xl font-black">Track active missions, completed work, and assessment history.</h2>
            </div>
            <Button onClick={load} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </section>

        {loading ? (
          <MissionSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Metric icon={Target} label="Total Assigned Missions" value={stats?.totalAssigned ?? 0} color="text-[#00D2FF]" tooltip="All missions assigned to you across districts, jobs, and private challenges." />
              <Metric icon={CheckCircle2} label="Completed Missions" value={stats?.completed ?? 0} color="text-emerald-400" tooltip="Missions submitted and marked complete or passed." />
              <Metric icon={Sparkles} label="In Progress Missions" value={stats?.inProgress ?? 0} color="text-[#A78BFA]" tooltip="Assigned missions that are not completed yet." />
              <Metric icon={Zap} label="Total XP Earned" value={stats?.totalXp ?? 0} color="text-[#FFD700]" tooltip="XP earned from mission performance and evaluation outcomes." />
              <Metric icon={Percent} label="Mission Success Rate" value={`${stats?.successRate ?? 0}%`} color="text-sky-300" tooltip="Percentage of assigned or attempted missions completed successfully." />
            </div>
            <MissionSection title="Recent Missions" rows={recent} empty="No Missions Yet. Start in Prove Yourself to build your mission history." />
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function normStats(data: any): MissionStats {
  const root = data?.data ?? data?.statistics ?? data?.missionStatistics ?? data;
  const recentRaw =
    root?.recentMissions ??
    root?.RecentMissions ??
    root?.missions ??
    root?.Missions ??
    root?.items ??
    [];
  const completed = numberish(root?.completedMissions ?? root?.CompletedMissions ?? root?.completedMissionsCount ?? root?.CompletedMissionsCount ?? root?.completedCount ?? root?.CompletedCount) ?? 0;
  const totalAssigned = numberish(root?.totalAssignedMissions ?? root?.TotalAssignedMissions ?? root?.assignedMissions ?? root?.AssignedMissions ?? root?.totalAssigned ?? root?.TotalAssigned) ?? 0;
  const inProgress = numberish(root?.inProgressMissions ?? root?.InProgressMissions ?? root?.inProgressMissionsCount ?? root?.InProgressMissionsCount ?? root?.inProgressCount ?? root?.InProgressCount) ?? Math.max(totalAssigned - completed, 0);
  const successRateRaw = numberish(root?.missionSuccessRate ?? root?.MissionSuccessRate ?? root?.successRate ?? root?.SuccessRate) ?? 0;
  return {
    totalAssigned,
    completed,
    inProgress,
    totalXp: numberish(root?.totalXpEarned ?? root?.TotalXpEarned ?? root?.totalXPEarned ?? root?.TotalXPEarned ?? root?.totalXp ?? root?.TotalXp) ?? 0,
    successRate: Math.round(successRateRaw > 1 ? successRateRaw : successRateRaw * 100),
    recent: asList(recentRaw).map(normRecentMission),
  };
}

function normRecentMission(item: any): MissionRow {
  return {
    id: String(item?.problemNodeId ?? item?.ProblemNodeId ?? item?.missionId ?? item?.MissionId ?? item?.id ?? item?.Id ?? ""),
    title: text(item?.missionTitle ?? item?.MissionTitle ?? item?.title ?? item?.Title ?? item?.problemNode?.title, "Mission"),
    status: text(item?.status ?? item?.Status ?? item?.completionStatus ?? item?.CompletionStatus, "In progress"),
    date: item?.dateCompleted ?? item?.DateCompleted ?? item?.completedAt ?? item?.CompletedAt ?? item?.submittedAt ?? item?.dateCreated,
    xp: numberish(item?.xpEarned ?? item?.XpEarned ?? item?.experiencePointsEarned ?? item?.xp ?? item?.XP ?? item?.netXpGained),
    score: numberish(item?.score ?? item?.Score),
  };
}

function MissionSection({ title, rows, empty }: { title: string; rows: MissionRow[]; empty: string }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">{title}</h3>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y divide-white/5">
          {rows.slice(0, 12).map((row, index) => (
            <div key={`${row.id}-${index}`} className="flex flex-wrap items-center gap-3 py-3">
              <Clock className="h-4 w-4 text-[#00D2FF]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.date ? new Date(row.date).toLocaleDateString() : "No date"} · {row.status}</p>
              </div>
              <span className="font-mono text-xs text-[#FFD700]">{row.xp ? `+${row.xp} XP` : "0 XP"}</span>
              {row.id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={row.id.length > 20 ? `/app/mission/${encodeURIComponent(row.id)}` : "/profession/select"}>Open</Link>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, color, tooltip }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; color: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
          <Icon className={`mb-3 h-5 w-5 ${color}`} />
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 bg-[#111827] text-white border border-white/10">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function MissionSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, index) => <Skeleton key={index} className="h-32 bg-white/10" />)}
      </div>
      <Skeleton className="h-64 bg-white/10" />
    </div>
  );
}
