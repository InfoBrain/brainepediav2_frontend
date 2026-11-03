import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Clock, Info, Loader2, Percent, RefreshCw, Sparkles, Target, Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { buildMissionHref, storeMissionAssignmentContext } from "@/lib/missionAssignmentContext";
import {
  normalizeUserMissionStatistics,
  openContinuableMission,
  type MissionRecord,
  type UserMissionStatistics,
} from "@/lib/missionStatistics";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingState, ButtonLoading } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { useApiFeedback } from "@/hooks/useApiFeedback";

export default function UserMissions() {
  usePageTitle("Missions");
  const { showError } = useApiFeedback();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<UserMissionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const userId = getUserId();
    if (!userId) {
      const message = "Unable to identify the current user. Please log in again.";
      setError(message);
      setStats(null);
      setLoading(false);
      showError(message, { title: "Missions unavailable" });
      return;
    }
    const res = await api.dashboard.userMissionStatistics(userId);
    if (!res.ok) {
      const message = res.error || "Could not load missions. Please try again.";
      setError(message);
      setStats(null);
      setLoading(false);
      showError(message, { title: "Missions unavailable" });
      return;
    }
    setStats(normalizeUserMissionStatistics(res.data));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openMission = async (row: MissionRecord) => {
    const userId = getUserId();
    if (!userId || !row.problemNodeId) return;
    setOpeningId(row.problemNodeId + (row.employerChallengeAssignmentId || ""));
    const result = await openContinuableMission(userId, row);
    setOpeningId("");
    if (!result.ok || !result.href) {
      showError(result.error || "Unable to open this mission.", { title: "Mission unavailable" });
      return;
    }
    navigate(result.href);
  };

  return (
    <DashboardShell nav={USER_NAV} title="Missions" subtitle="Mission statistics and recent activity">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/10 to-[#0d1119] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#FFD700]">Mission command</p>
              <h2 className="mt-1 text-2xl font-black">Continue pending work, then review what you have already finished.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-[#FFD700] font-bold text-black hover:bg-[#F3C800]">
              <Link href="/profession/select">Start a Mission</Link>
            </Button>
            <Button onClick={load} variant="outline" disabled={loading}>
              <ButtonLoading loading={loading}>
                <>
                  {!loading && <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh
                </>
              </ButtonLoading>
            </Button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="space-y-5">
            <LoadingState variant="grid" rows={6} className="md:grid-cols-2 xl:grid-cols-3" />
            <LoadingState variant="table" rows={6} />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Metric icon={Target} label="Total Assigned Missions" value={stats?.totalAssignedMissions ?? 0} color="text-[#00D2FF]" tooltip="All missions assigned to you across districts, jobs, and private challenges." />
              <Metric icon={Clock} label="Pending Missions" value={stats?.pendingMissionsCount ?? 0} color="text-amber-300" tooltip="Corporate assignments that have not been started." />
              <Metric icon={Sparkles} label="In Progress Missions" value={stats?.inProgressMissions ?? 0} color="text-[#A78BFA]" tooltip="Missions with an open session that are not completed yet." />
              <Metric icon={CheckCircle2} label="Completed Missions" value={stats?.completedMissions ?? 0} color="text-emerald-400" tooltip="Missions submitted and marked complete or passed." />
              <Metric icon={Zap} label="Total XP Earned" value={stats?.totalXpEarned ?? 0} color="text-[#FFD700]" tooltip="XP earned from mission performance and evaluation outcomes." />
              <Metric icon={Percent} label="Mission Success Rate" value={`${stats?.missionSuccessRate ?? 0}%`} color="text-sky-300" tooltip="Percentage of assigned or attempted missions completed successfully." />
            </div>
            <MissionSection
              title="Continue a mission"
              rows={stats?.continuableMissions ?? []}
              empty="No pending or in-progress missions. Start a Mission to choose an eligible challenge."
              openingId={openingId}
              onContinue={openMission}
            />
            <MissionSection
              title="Recent Missions"
              rows={stats?.recentMissions ?? []}
              empty="No missions yet. Start a Mission to choose an eligible challenge and build your history."
              openingId={openingId}
              onContinue={openMission}
            />
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function MissionSection({
  title,
  rows,
  empty,
  openingId,
  onContinue,
}: {
  title: string;
  rows: MissionRecord[];
  empty: string;
  openingId: string;
  onContinue: (row: MissionRecord) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No missions yet"
          description={empty}
          actionLabel="Start a Mission"
          actionHref="/profession/select"
          className="border-none bg-transparent"
        />
      ) : (
        <div className="divide-y divide-white/5">
          {rows.map((row, index) => {
            const rowKey = `${row.problemNodeId}-${row.employerChallengeAssignmentId || index}`;
            const busy = openingId === row.problemNodeId + (row.employerChallengeAssignmentId || "");
            return (
              <div key={rowKey} className="flex flex-wrap items-center gap-3 py-3">
                <Clock className="h-4 w-4 text-[#00D2FF]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.challengeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.companyName} · {row.missionSource}
                    {row.completedAt ? ` · ${new Date(row.completedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric", timeZone: "Africa/Lagos" })}` : row.startedAt ? " · Started" : " · Not started"}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                  row.status === "Completed"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : row.status === "InProgress"
                      ? "border-[#A78BFA]/30 bg-[#A78BFA]/10 text-[#A78BFA]"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                }`}>
                  {row.status === "InProgress" ? "In progress" : row.status}
                </span>
                {row.canContinue ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onContinue(row)}>
                    {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    {row.status === "Pending" ? "Start" : "Continue"}
                  </Button>
                ) : row.problemNodeId ? (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildMissionHref({
                        problemNodeId: row.problemNodeId,
                        employerChallengeAssignmentId: row.employerChallengeAssignmentId,
                      })}
                      onClick={() => {
                        storeMissionAssignmentContext({
                          problemNodeId: row.problemNodeId,
                          employerChallengeAssignmentId: row.employerChallengeAssignmentId,
                          assignmentRequired: Boolean(row.employerChallengeAssignmentId),
                        });
                      }}
                    >
                      View
                    </Link>
                  </Button>
                ) : null}
              </div>
            );
          })}
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
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
          </div>
          <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 bg-[#111827] text-white border border-white/10">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
