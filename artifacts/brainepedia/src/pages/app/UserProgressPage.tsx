import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Zap, Target, Flame, Crown, Map, Trophy, Activity, BookOpen, LogOut,
  Home, ArrowRight, Star, CheckCircle2, Clock, TrendingUp, User,
  LayoutDashboard, RefreshCw, AlertCircle, Loader2, Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUserId, getUser, clearToken } from "@/lib/auth";

type Stats = { totalXP: number; problemsSolvedCount: number; dayStreak: number; currentSubscription: string; isSubscriptionActive: boolean };
type DistrictProgress = { districtName: string; districtId: string; earnedXP: number; totalPossibleXP: number; percentage: number; isMastered: boolean };
type Badge = { userBadgeId: string; name: string; description: string; iconUrl?: string; rarity: string; unlockedAt?: string };
type Activity = { activityLogId: number | string; activity: string; dateCreated: string };
type XPEntry = { experienceCreditId: string; amount: number; reason: string; dateCreated: string };

const RARITY_STYLE: Record<string, { border: string; text: string; bg: string }> = {
  legendary: { border: "border-[#FFD700]/40", text: "text-[#FFD700]", bg: "bg-[#FFD700]/8" },
  epic: { border: "border-[#9D4EDD]/40", text: "text-[#9D4EDD]", bg: "bg-[#9D4EDD]/8" },
  rare: { border: "border-[#00D2FF]/40", text: "text-[#00D2FF]", bg: "bg-[#00D2FF]/8" },
  common: { border: "border-white/10", text: "text-white/40", bg: "bg-white/3" },
};
function rarityStyle(r?: string) {
  return RARITY_STYLE[(r || "common").toLowerCase()] || RARITY_STYLE.common;
}

const XP_LEVELS = [0, 500, 1200, 2500, 4500, 7000, 10000, 15000, 22000, 30000];
function getLevel(xp: number): { level: number; current: number; next: number; pct: number } {
  let lv = XP_LEVELS.findIndex(v => xp < v);
  if (lv === -1) lv = XP_LEVELS.length;
  else lv = Math.max(1, lv);
  const current = XP_LEVELS[lv - 1] ?? 0;
  const next = XP_LEVELS[lv] ?? XP_LEVELS[XP_LEVELS.length - 1];
  return { level: lv, current, next, pct: next > current ? Math.min(100, ((xp - current) / (next - current)) * 100) : 100 };
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
  { label: "Missions", icon: Target, href: "/profession/select" },
  { label: "District Map", icon: Map, href: "/profession/select" },
  { label: "Badges", icon: Trophy, href: "/user/badges" },
  { label: "Activity", icon: Activity, href: "/user/activity" },
];

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative rounded-2xl border bg-[#0d1117] p-5 overflow-hidden border-white/8`}
    >
      <div className={`absolute inset-0 opacity-5 ${color} rounded-2xl`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color} bg-current/10`} style={{ background: "rgba(255,255,255,0.05)" }}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white font-mono">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function UserProgressPage() {
  const [, navigate] = useLocation();
  const userId = getUserId() || "";
  const user = getUser()?.userProfile ?? getUser();
  const [activeSection, setActiveSection] = useState("dashboard");

  function handleLogout() {
    clearToken();
    navigate("/auth/login");
  }

  // Profile stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      const res = await api.profiles.stats(userId);
      if (!res.ok) throw new Error("Failed");
      const d = res.data as any;
      return { totalXP: d?.totalXP ?? 0, problemsSolvedCount: d?.problemsSolvedCount ?? 0, dayStreak: d?.dayStreak ?? 0, currentSubscription: d?.currentSubscription ?? "Initiate", isSubscriptionActive: Boolean(d?.isSubscriptionActive) };
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });

  // Map progress
  const { data: districts, isLoading: distLoading } = useQuery<DistrictProgress[]>({
    queryKey: ["profile-map", userId],
    queryFn: async () => {
      const res = await api.profiles.map(userId);
      if (!res.ok) throw new Error("Failed");
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.map((d: any) => ({
        districtName: d?.districtName || "Unknown",
        districtId: d?.districtId || "",
        earnedXP: Number(d?.earnedXP ?? 0),
        totalPossibleXP: Number(d?.totalPossibleXP ?? 0),
        percentage: Number(d?.percentage ?? 0),
        isMastered: Boolean(d?.isMastered),
      }));
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });

  // Badges
  const { data: badges } = useQuery<Badge[]>({
    queryKey: ["badges", userId],
    queryFn: async () => {
      const res = await api.userBadges.forUser(userId);
      if (!res.ok) throw new Error("Failed");
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.map((b: any) => ({ userBadgeId: b?.userBadgeId || b?.id || "", name: b?.name || "Badge", description: b?.description || "", iconUrl: b?.iconUrl, rarity: b?.rarity || "Common", unlockedAt: b?.unlockedAt }));
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  // Activity
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activity-logs", userId],
    queryFn: async () => {
      const res = await api.activityLogs.forUser(userId);
      if (!res.ok) throw new Error("Failed");
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.slice(0, 20).map((a: any) => ({ activityLogId: a?.activityLogId ?? a?.id, activity: a?.activity || "", dateCreated: a?.dateCreated || "" }));
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });

  // XP history
  const { data: xpHistory } = useQuery<XPEntry[]>({
    queryKey: ["xp-history", userId],
    queryFn: async () => {
      const res = await api.experienceCredits.forUser(userId);
      if (!res.ok) throw new Error("Failed");
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.map((x: any) => ({ experienceCreditId: x?.experienceCreditId || x?.id || "", amount: Number(x?.amount ?? 0), reason: x?.reason || "", dateCreated: x?.dateCreated || "" }));
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const lvData = getLevel(stats?.totalXP ?? 0);

  // Chart data
  const chartData = (() => {
    if (!xpHistory?.length) return [];
    const byDay: Record<string, number> = {};
    xpHistory.forEach(e => {
      const day = (e.dateCreated || "").slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + e.amount;
    });
    return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, xp]) => ({ date: date.slice(5), xp }));
  })();

  const subColor = (sub: string) => {
    const s = (sub || "").toLowerCase();
    if (s.includes("grand")) return "text-[#FFD700]";
    if (s.includes("arch")) return "text-[#00D2FF]";
    return "text-white/40";
  };

  return (
    <div className="min-h-screen bg-[#060a10] text-white flex">
      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-[#080c12] border-r border-white/5 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-white/5">
          <p className="text-xs font-mono text-[#00D2FF] tracking-[0.3em] uppercase">Brainepedia</p>
          <p className="text-[10px] text-white/20 mt-0.5">Operator Command Center</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 pt-4">
          {NAV_ITEMS.map(item => (
            <Link key={item.label} href={item.href}>
              <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-mono transition-colors text-left
                ${item.label === "Dashboard" ? "bg-[#00D2FF]/10 text-[#00D2FF]" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-mono text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 overflow-x-hidden">
        {/* Profile Header */}
        <header className="sticky top-0 z-20 bg-[#060a10]/90 backdrop-blur border-b border-white/5 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D2FF] to-[#9D4EDD] flex items-center justify-center text-sm font-black font-mono shrink-0">
              {(user?.firstName || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{[user?.firstName, user?.surName || user?.lastName].filter(Boolean).join(" ") || "Operator"}</p>
              <p className="text-xs font-mono text-white/30 truncate">{user?.currentTitle || user?.email || ""}</p>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs font-mono">
              {stats && (
                <>
                  <span className="hidden sm:flex items-center gap-1 text-[#FFD700]"><Star className="w-3.5 h-3.5" />{stats.totalXP} XP</span>
                  <span className="hidden sm:flex items-center gap-1 text-orange-400"><Flame className="w-3.5 h-3.5" />{stats.dayStreak}d</span>
                  <span className={`font-bold ${subColor(stats.currentSubscription)}`}>{stats.currentSubscription}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-8 space-y-8 max-w-5xl">
          {/* XP Progress Card */}
          {statsLoading ? (
            <div className="h-32 rounded-2xl bg-white/3 animate-pulse" />
          ) : stats && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl border border-[#00D2FF]/15 bg-gradient-to-br from-[#00D2FF]/5 to-[#9D4EDD]/5 p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00D2FF]/3 via-transparent to-[#9D4EDD]/3" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                <div>
                  <p className="text-[10px] font-mono text-[#00D2FF]/60 tracking-[0.3em] uppercase mb-1">Level {lvData.level}</p>
                  <motion.p className="text-4xl font-black font-mono text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    {stats.totalXP.toLocaleString()} XP
                  </motion.p>
                  <p className="text-xs font-mono text-white/30 mt-1">Next level at {lvData.next.toLocaleString()} XP</p>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-white/30">
                    <span>Level {lvData.level}</span>
                    <span>Level {lvData.level + 1}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
                      initial={{ width: 0 }} animate={{ width: `${lvData.pct}%` }} transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }} />
                  </div>
                  <p className="text-[10px] font-mono text-white/20">{stats.totalXP - lvData.current} / {lvData.next - lvData.current} XP to next level</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/3 animate-pulse" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Target className="w-5 h-5" />} label="Missions" value={stats.problemsSolvedCount} sub="Completed" color="text-[#00D2FF]" />
              <StatCard icon={<Flame className="w-5 h-5" />} label="Streak" value={`${stats.dayStreak}d`} sub="Day streak" color="text-orange-400" />
              <StatCard icon={<Crown className="w-5 h-5" />} label="Plan" value={stats.currentSubscription} sub={stats.isSubscriptionActive ? "Active" : "Expired"} color={subColor(stats.currentSubscription)} />
              <StatCard icon={<Star className="w-5 h-5" />} label="Total XP" value={stats.totalXP.toLocaleString()} sub={`Level ${lvData.level}`} color="text-[#FFD700]" />
            </div>
          )}

          {/* District Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold font-mono text-white/60 uppercase tracking-widest flex items-center gap-2"><Map className="w-4 h-4 text-[#00D2FF]" /> District Mastery</h2>
            </div>
            {distLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse" />)}</div>
            ) : !districts?.length ? (
              <div className="text-center py-8 text-white/20 text-sm font-mono">No district data yet. Start a mission to begin.</div>
            ) : (
              <div className="space-y-3">
                {districts.map((d, i) => (
                  <motion.div key={d.districtId || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-[#0d1117] hover:border-white/15 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/district/${d.districtId}/missions`)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-mono text-white truncate">{d.districtName}</p>
                        {d.isMastered && <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">MASTERED</span>}
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
                          initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold font-mono text-[#00D2FF]">{d.percentage}%</p>
                      <p className="text-[10px] text-white/30 font-mono">{d.earnedXP}/{d.totalPossibleXP} XP</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* XP Chart */}
          {chartData.length > 1 && (
            <section>
              <h2 className="text-sm font-bold font-mono text-white/60 uppercase tracking-widest flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#9D4EDD]" /> XP Growth
              </h2>
              <div className="rounded-2xl border border-white/8 bg-[#0d1117] p-5">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(0,210,255,0.2)", borderRadius: "12px", color: "#fff", fontSize: 12, fontFamily: "monospace" }} />
                    <Line type="monotone" dataKey="xp" stroke="#00D2FF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#00D2FF", stroke: "none" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Badges */}
          <section>
            <h2 className="text-sm font-bold font-mono text-white/60 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-[#FFD700]" /> Trophy Case
            </h2>
            {!badges?.length ? (
              <div className="rounded-2xl border border-white/8 bg-[#0d1117] p-8 text-center">
                <Lock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/20 font-mono">No badges yet. Complete missions to unlock rewards.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {badges.map((b, i) => {
                  const rs = rarityStyle(b.rarity);
                  return (
                    <motion.div key={b.userBadgeId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.05, y: -3 }}
                      className={`rounded-xl border ${rs.border} ${rs.bg} p-4 text-center cursor-default`}>
                      {b.iconUrl ? <img src={b.iconUrl} alt={b.name} className="w-10 h-10 mx-auto mb-2 object-contain" onError={e => { (e.currentTarget as any).style.display = "none"; }} /> : <Trophy className="w-10 h-10 mx-auto mb-2 text-[#FFD700]/60" />}
                      <p className="text-xs font-bold text-white truncate">{b.name}</p>
                      <p className={`text-[10px] font-mono mt-0.5 ${rs.text}`}>{b.rarity}</p>
                      {b.unlockedAt && <p className="text-[10px] text-white/20 mt-1">{new Date(b.unlockedAt).toLocaleDateString()}</p>}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Activity + XP Ledger */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Activity */}
            <section>
              <h2 className="text-sm font-bold font-mono text-white/60 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#00D2FF]" /> Recent Activity
              </h2>
              <div className="rounded-2xl border border-white/8 bg-[#0d1117] divide-y divide-white/5 max-h-72 overflow-y-auto">
                {!activities?.length ? (
                  <div className="p-6 text-center text-white/20 text-sm font-mono">No recent activity.</div>
                ) : activities.map((a, i) => (
                  <div key={a.activityLogId} className="flex items-start gap-3 px-4 py-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 truncate">{a.activity}</p>
                      {a.dateCreated && <p className="text-[10px] text-white/20 font-mono mt-0.5">{new Date(a.dateCreated).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* XP Ledger */}
            <section>
              <h2 className="text-sm font-bold font-mono text-white/60 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#FFD700]" /> XP Ledger
              </h2>
              <div className="rounded-2xl border border-white/8 bg-[#0d1117] divide-y divide-white/5 max-h-72 overflow-y-auto">
                {!xpHistory?.length ? (
                  <div className="p-6 text-center text-white/20 text-sm font-mono">No XP history yet.</div>
                ) : xpHistory.slice(0, 15).map((x, i) => (
                  <div key={x.experienceCreditId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`text-sm font-bold font-mono shrink-0 ${x.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {x.amount >= 0 ? "+" : ""}{x.amount}
                    </span>
                    <p className="flex-1 text-xs text-white/50 truncate">{x.reason}</p>
                    {x.dateCreated && <p className="text-[10px] text-white/20 font-mono shrink-0">{new Date(x.dateCreated).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Quick Actions */}
          <section>
            <h2 className="text-sm font-bold font-mono text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#9D4EDD]" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Continue Learning", href: "/profession/select", color: "from-[#00D2FF] to-[#9D4EDD]", text: "text-white" },
                { label: "District Map", href: "/profession/select", color: "from-transparent to-transparent", text: "text-white/60" },
                { label: "Start Mission", href: "/profession/select", color: "from-transparent to-transparent", text: "text-white/60" },
                { label: "Upgrade Plan", href: "/user/subscription/success", color: "from-[#FFD700]/20 to-[#FFD700]/5", text: "text-[#FFD700]" },
              ].map(a => (
                <Link key={a.label} href={a.href}>
                  <button className={`w-full py-3 px-4 rounded-xl text-xs font-bold font-mono bg-gradient-to-br ${a.color} ${a.text} border border-white/10 hover:border-white/20 hover:scale-[1.03] transition-all text-center`}>
                    {a.label}
                  </button>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <aside className="hidden xl:flex flex-col w-64 flex-shrink-0 border-l border-white/5 bg-[#080c12] sticky top-0 h-screen overflow-y-auto p-5 space-y-5">
        {/* Rank */}
        <div className="rounded-xl border border-white/8 bg-[#0d1117] p-4">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Global Rank</p>
          <p className="text-xl font-black text-[#00D2FF] font-mono">#—</p>
          <p className="text-[10px] text-white/20 font-mono mt-0.5">Complete more missions to rank up</p>
        </div>

        {/* Next Achievement */}
        <div className="rounded-xl border border-[#9D4EDD]/20 bg-[#9D4EDD]/5 p-4">
          <p className="text-[10px] font-mono text-[#9D4EDD]/60 uppercase tracking-widest mb-2">Next Badge</p>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-[#9D4EDD]" />
            <p className="text-sm font-bold text-white">Bug Slayer</p>
          </div>
          <p className="text-xs text-white/30 mb-3">Solve 3 more debugging missions</p>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-[#9D4EDD]/60" />
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-4">
          <p className="text-[10px] font-mono text-[#FFD700]/60 uppercase tracking-widest mb-2">Daily Challenge</p>
          <p className="text-sm text-white font-bold mb-1">Daily Available</p>
          <p className="text-xs text-white/40 mb-3">Earn +50 XP bonus</p>
          <Link href="/profession/select">
            <button className="w-full py-2 text-xs font-mono font-bold text-black bg-[#FFD700] rounded-lg hover:bg-[#FFD700]/80 transition-colors">
              Start Challenge
            </button>
          </Link>
        </div>

        {/* Subscription status */}
        {stats && (
          <div className={`rounded-xl border p-4 ${stats.isSubscriptionActive ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Subscription</p>
            <p className={`text-sm font-bold ${stats.isSubscriptionActive ? "text-emerald-400" : "text-red-400"}`}>
              {stats.isSubscriptionActive ? "Active" : "Expired"}
            </p>
            <p className="text-xs text-white/30 mt-0.5">{stats.currentSubscription} Plan</p>
            {!stats.isSubscriptionActive && (
              <Link href="/user/subscription/success">
                <button className="mt-2 w-full py-1.5 text-xs font-mono font-bold text-black bg-[#FFD700] rounded-lg hover:opacity-80 transition-opacity">Upgrade</button>
              </Link>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
