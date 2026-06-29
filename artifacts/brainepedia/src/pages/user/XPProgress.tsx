import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { asList, text } from "@/lib/jobData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { XPChart } from "@/components/charts/XPChart";
import { ConceptTooltip, TOOLTIP_COPY, InfoTooltip } from "@/components/ux/InfoTooltip";

type XPEntry = { id: string; amount: number; reason: string; date: string; source: string };

export default function XPProgress() {
  usePageTitle("XP Progress");
  const userId = getUserId();
  const [entries, setEntries] = useState<XPEntry[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [credits, stats] = await Promise.all([api.experienceCredits.forUser(userId), api.profiles.stats(userId)]);
      if (cancelled) return;
      if (credits.ok) setEntries(asList(credits.data).map(normEntry));
      if (stats.ok) setTotalXP(Number((stats.data as any)?.totalXP ?? (stats.data as any)?.totalXp ?? 0));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const timeline = useMemo(() => {
    const byDay: Record<string, number> = {};
    entries.forEach((entry) => {
      const day = entry.date?.slice(0, 10) || "Unknown";
      byDay[day] = (byDay[day] || 0) + entry.amount;
    });
    let running = 0;
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, xp]) => ({ date: date.slice(5), xp, cumulative: (running += xp) }))
      .slice(-30);
  }, [entries]);

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((entry) => { map[entry.source] = (map[entry.source] || 0) + entry.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  return (
    <DashboardShell nav={USER_NAV} title="XP Progress" subtitle="// timeline.sources.analytics">
      {loading ? (
        <LoadingState label="Loading XP analytics..." />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            <InfoTooltip label="About XP">{TOOLTIP_COPY.xp}</InfoTooltip>
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={Zap} label="Total XP" value={totalXP.toLocaleString()} />
            <Metric icon={TrendingUp} label="XP Events" value={entries.length.toLocaleString()} />
            <Metric icon={BarChart3} label="Sources" value={sources.length.toLocaleString()} />
          </div>

          <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
            <h2 className="mb-4 text-lg font-bold">XP Growth Chart</h2>
            {timeline.length > 1 ? (
              <XPChart data={timeline} />
            ) : (
              <EmptyState
                title="No XP timeline yet"
                description="Complete missions to build your XP growth chart."
                actionLabel="Start a mission"
                actionHref="/profession/select"
              />
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
              <h2 className="mb-4 text-lg font-bold">XP Sources</h2>
              {sources.length === 0 ? (
                <EmptyState title="No XP sources" description={TOOLTIP_COPY.experienceCredits} />
              ) : sources.map(([source, amount]) => (
                <div key={source} className="mb-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between text-sm"><span>{source}</span><span className="font-mono text-[#FFD700]">{amount.toLocaleString()} XP</span></div>
                </div>
              ))}
            </section>
            <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
              <h2 className="mb-4 text-lg font-bold">XP Timeline</h2>
              {entries.length === 0 ? (
                <EmptyState title="No XP records" description="Your experience credit ledger will appear here after your first mission." />
              ) : entries.slice(0, 12).map((entry) => (
                <div key={entry.id} className="flex gap-3 border-b border-white/5 py-3 last:border-0">
                  <span className="font-mono text-sm text-[#FFD700]">+{entry.amount}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground">{entry.date ? new Date(entry.date).toLocaleString() : "No date"} · {entry.source}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function normEntry(item: any): XPEntry {
  const reason = text(item?.reason ?? item?.description ?? item?.activity, "XP credit");
  return {
    id: String(item?.experienceCreditId ?? item?.id ?? `${reason}-${item?.dateCreated ?? Math.random()}`),
    amount: Number(item?.amount ?? item?.xp ?? item?.points ?? 0),
    reason,
    date: item?.dateCreated ?? item?.createdAt ?? item?.timestamp ?? "",
    source: text(item?.source ?? item?.module ?? item?.creditType ?? reason.split(":")[0], "Mission"),
  };
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="rounded-xl border border-white/5 bg-[#0d1119] p-5"><Icon className="mb-3 h-5 w-5 text-[#FFD700]" /><p className="text-xs font-mono uppercase text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black text-[#FFD700]">{value}</p></div>;
}
