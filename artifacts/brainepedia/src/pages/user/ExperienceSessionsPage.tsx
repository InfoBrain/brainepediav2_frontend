import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarCheck, CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

type SessionRow = {
  id: string;
  missionName: string;
  status: string;
  started?: string;
  completed?: string;
  progress: number;
  userId?: string;
};

export default function ExperienceSessionsPage() {
  usePageTitle("Experience Sessions");
  const currentUserId = getUserId();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.experienceSessions.list();
    if (res.ok) {
      setSessions(asList(res.data).map(normSession).filter((s) => !s.userId || s.userId === currentUserId));
    } else {
      setSessions([]);
      setError(res.status === 404 ? "" : res.error || "Could not load experience sessions.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUserId]);

  const counts = useMemo(() => ({
    total: sessions.length,
    completed: sessions.filter((s) => s.completed || s.status.toLowerCase().includes("complete")).length,
    active: sessions.filter((s) => !s.completed && !s.status.toLowerCase().includes("complete")).length,
  }), [sessions]);

  return (
    <DashboardShell nav={USER_NAV} title="Experience Sessions" subtitle="// mission.attempts.only">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/10 to-[#0d1119] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Mission attempts</p>
              <h2 className="mt-1 text-2xl font-black">Session status, dates, mission names, and progress.</h2>
              <p className="mt-2 text-sm text-muted-foreground">This page intentionally shows experience sessions only, not generic activity logs.</p>
            </div>
            <Button onClick={load} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric icon={Activity} label="Mission Attempts" value={counts.total} color="text-[#00D2FF]" />
          <Metric icon={CalendarClock} label="Active Sessions" value={counts.active} color="text-[#FFD700]" />
          <Metric icon={CalendarCheck} label="Completed Sessions" value={counts.completed} color="text-emerald-400" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading sessions...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center text-sm text-muted-foreground">
            No mission sessions found. Start a District mission to create your first experience session.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0d1119]">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Mission Name</th>
                  <th className="px-4 py-3 text-left">Session Status</th>
                  <th className="px-4 py-3 text-left">Started Date</th>
                  <th className="px-4 py-3 text-left">Completed Date</th>
                  <th className="px-4 py-3 text-left">Session Progress</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-semibold">{session.missionName}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">{session.status}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(session.started)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(session.completed)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 rounded-full bg-white/10"><div className="h-full rounded-full bg-[#00D2FF]" style={{ width: `${session.progress}%` }} /></div>
                        <span className="font-mono text-xs text-[#00D2FF]">{session.progress}%</span>
                      </div>
                    </td>
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

function normSession(item: any): SessionRow {
  const completed = item?.completedAt ?? item?.dateCompleted ?? item?.completionDate;
  const status = text(item?.status ?? item?.sessionStatus ?? (completed ? "Completed" : "In Progress"), "In Progress");
  return {
    id: String(item?.experienceSessionId ?? item?.sessionId ?? item?.id ?? Math.random()),
    missionName: text(item?.missionName ?? item?.problemNode?.title ?? item?.problemNodeTitle ?? item?.title, "Mission"),
    status,
    started: item?.startedAt ?? item?.dateStarted ?? item?.dateCreated ?? item?.createdAt,
    completed,
    progress: Math.max(0, Math.min(100, Number(item?.progress ?? item?.completionPercentage ?? (completed ? 100 : 50)))),
    userId: item?.userId ?? item?.applicationUserId,
  };
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

function Metric({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return <div className="rounded-xl border border-white/5 bg-[#0d1119] p-5"><Icon className={`mb-3 h-5 w-5 ${color}`} /><p className="text-xs font-mono uppercase text-muted-foreground">{label}</p><p className={`mt-1 text-3xl font-black ${color}`}>{value}</p></div>;
}
