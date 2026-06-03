import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, Loader2, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

type MissionRow = {
  id: string;
  title: string;
  status: string;
  date?: string;
  xp?: number;
  score?: number;
};

export default function UserMissions() {
  usePageTitle("Missions");
  const userId = getUserId();
  const [active, setActive] = useState<MissionRow[]>([]);
  const [history, setHistory] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    const [assigned, submissions] = await Promise.all([
      api.dashboard.assignedChallenges(),
      api.submissions.forUser(userId),
    ]);
    if (assigned.ok) setActive(asList(assigned.data).map(normAssigned));
    if (submissions.ok || submissions.status === 404) setHistory(asList(submissions.data).map(normSubmission));
    if (!assigned.ok && submissions.status !== 404 && !submissions.ok) setError("Could not load missions. Please try again.");
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const completed = useMemo(
    () => history.filter((mission) => mission.status.toLowerCase().includes("complete") || mission.status.toLowerCase().includes("passed")),
    [history],
  );

  return (
    <DashboardShell nav={USER_NAV} title="Missions" subtitle="// active.completed.history">
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
          <State label="Loading missions..." />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric icon={Sparkles} label="Active Missions" value={active.length} color="text-[#00D2FF]" />
              <Metric icon={CheckCircle2} label="Completed Missions" value={completed.length} color="text-emerald-400" />
              <Metric icon={Trophy} label="Mission Attempts" value={history.length} color="text-[#FFD700]" />
            </div>
            <MissionSection title="Active Missions" rows={active} empty="No active assigned missions. Pick a District to start a new mission." />
            <MissionSection title="Completed Missions" rows={completed} empty="No completed missions yet." />
            <MissionSection title="Mission History" rows={history} empty="Mission attempts will appear here after you submit work." />
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function normAssigned(item: any): MissionRow {
  return {
    id: String(item?.problemNodeId ?? item?.missionId ?? item?.id ?? ""),
    title: text(item?.title ?? item?.missionName ?? item?.challengeName, "Assigned mission"),
    status: text(item?.status ?? item?.completionStatus, "Active"),
    date: item?.dateAssigned ?? item?.assignedAt ?? item?.createdAt,
    xp: Number(item?.experiencePoints ?? item?.xp ?? 0),
  };
}

function normSubmission(item: any): MissionRow {
  const evaluation = item?.evaluation ?? item?.evaluationResult ?? {};
  const passed = Boolean(evaluation?.isPassed ?? item?.isPassed);
  return {
    id: String(item?.submissionId ?? item?.id ?? ""),
    title: text(item?.missionTitle ?? item?.problemNode?.title ?? item?.title, "Mission attempt"),
    status: passed ? "Passed / Completed" : text(item?.status ?? evaluation?.status, "Submitted"),
    date: item?.submittedAt ?? item?.createdAt ?? item?.dateCreated,
    xp: Number(item?.netXpGained ?? item?.xpGained ?? evaluation?.netXpGained ?? 0),
    score: Number(evaluation?.score ?? item?.score ?? 0),
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
              {row.xp ? <span className="font-mono text-xs text-[#FFD700]">+{row.xp} XP</span> : null}
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

function Metric({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
      <Icon className={`mb-3 h-5 w-5 ${color}`} />
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function State({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />{label}</div>;
}
