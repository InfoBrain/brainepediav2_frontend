import { useEffect, useMemo, useState } from "react";
import { Award, BriefcaseBusiness, Crown, Loader2, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { asList, text } from "@/lib/jobData";
import { usePageTitle } from "@/hooks/usePageTitle";

type District = { name: string; earnedXP: number; percent: number; mastered: boolean };

export default function VXProgress() {
  usePageTitle("VX Progress");
  const userId = getUserId();
  const [stats, setStats] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [profileStats, professionalIdentity, map] = await Promise.all([
        api.profiles.stats(userId),
        api.identity.professionalIdentity(userId),
        api.profiles.map(userId),
      ]);
      if (cancelled) return;
      if (profileStats.ok) setStats(profileStats.data);
      if (professionalIdentity.ok) setIdentity(professionalIdentity.data);
      if (map.ok) setDistricts(asList(map.data).map(normDistrict));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const vx = Number(identity?.verifiedExperienceYears ?? identity?.verifiedExperience ?? stats?.verifiedExperienceYears ?? 0);
  const totalXP = Number(stats?.totalXP ?? stats?.totalXp ?? identity?.totalXp ?? 0);
  const completed = Number(stats?.problemsSolvedCount ?? identity?.completedTasks ?? districts.filter((d) => d.mastered).length);
  const rank = text(identity?.professionalRank ?? identity?.rank ?? identity?.leaderboardRank, totalXP > 10000 ? "Master Operator" : totalXP > 2500 ? "Architect" : "Initiate");

  const timeline = useMemo(() => {
    let running = 0;
    return districts
      .filter((d) => d.earnedXP > 0 || d.mastered)
      .map((d) => ({ ...d, vx: (running += Math.max(0.1, d.earnedXP / 1200)) }));
  }, [districts]);

  return (
    <DashboardShell nav={USER_NAV} title="VX Progress" subtitle="// verified.experience.growth">
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Calculating verified experience...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/10 to-[#0d1119] p-6">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Verified Experience Calculation</p>
            <h2 className="mt-1 text-3xl font-black">{vx.toFixed(1)} VX</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              VX represents practical experience demonstrated through missions, completed districts, XP-weighted problem solving, and public dossier proof.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={Award} label="Verified Experience" value={`${vx.toFixed(1)} VX`} color="text-[#00D2FF]" />
            <Metric icon={Crown} label="Professional Rank" value={rank} color="text-[#FFD700]" />
            <Metric icon={BriefcaseBusiness} label="Completed Missions" value={String(completed)} color="text-emerald-400" />
            <Metric icon={TrendingUp} label="Career XP" value={totalXP.toLocaleString()} color="text-[#9D4EDD]" />
          </div>

          <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
            <h2 className="mb-4 text-lg font-bold">VX Growth Timeline</h2>
            {timeline.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">Complete missions to build your VX growth timeline.</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((entry, index) => (
                  <div key={`${entry.name}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.percent}% district progression · {entry.earnedXP.toLocaleString()} XP</p>
                      </div>
                      <span className="font-mono text-[#00D2FF]">{entry.vx.toFixed(1)} VX</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
            <h2 className="mb-4 text-lg font-bold">Career Progression</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {["Initiate", "Architect", "Master Operator"].map((level, index) => {
                const active = index === 0 || (index === 1 && totalXP >= 2500) || (index === 2 && totalXP >= 10000);
                return (
                  <div key={level} className={`rounded-xl border p-4 ${active ? "border-[#00D2FF]/30 bg-[#00D2FF]/10" : "border-white/5 bg-white/[0.02]"}`}>
                    <p className={active ? "font-bold text-[#00D2FF]" : "font-bold text-muted-foreground"}>{level}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{index === 0 ? "Foundation missions" : index === 1 ? "Cross-district skill proof" : "Elite verified experience"}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function normDistrict(item: any): District {
  return {
    name: text(item?.districtName ?? item?.name, "District"),
    earnedXP: Number(item?.earnedXP ?? item?.xp ?? 0),
    percent: Number(item?.percentage ?? item?.completionPercentage ?? 0),
    mastered: Boolean(item?.isMastered ?? item?.completed),
  };
}

function Metric({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return <div className="rounded-xl border border-white/5 bg-[#0d1119] p-5"><Icon className={`mb-3 h-5 w-5 ${color}`} /><p className="text-xs font-mono uppercase text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-black ${color}`}>{value}</p></div>;
}
