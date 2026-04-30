import { useEffect, useState } from "react";
import { Map, Trophy, Activity, CreditCard, Loader2, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getUser, getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav: NavItem[] = [
  { href: "/user/map", label: "Imperial Map", icon: Map },
  { href: "/user/badges", label: "My Badges", icon: Trophy },
  { href: "/user/activity", label: "Activity Feed", icon: Activity },
  { href: "/user/subscription", label: "Subscription", icon: CreditCard },
];

type Stats = { xp?: number; rank?: string; level?: number; avatarUrl?: string; districtName?: string };
type District = { id?: string; name: string; mastery: number };
type Badge = { id?: string; name: string; rarity?: string; iconUrl?: string; earnedAt?: string };
type Activity = { id?: string; title: string; xp?: number; at?: string };

const RARITY_GLOW: Record<string, string> = {
  common: "shadow-[0_0_15px_rgba(148,163,184,0.4)] border-slate-400/40",
  rare: "shadow-[0_0_18px_rgba(0,210,255,0.5)] border-[#00D2FF]/50",
  epic: "shadow-[0_0_22px_rgba(168,85,247,0.55)] border-purple-400/50",
  legendary: "shadow-[0_0_28px_rgba(255,215,0,0.6)] border-[#FFD700]/60",
};

export default function UserDashboard() {
  const userId = getUserId() || "me";
  const user = getUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [s, m, b, a] = await Promise.all([
        api.profiles.stats(userId),
        api.userProgresses.map(userId),
        api.userBadges.forUser(userId),
        api.activityLogs.forUser(userId),
      ]);
      if (cancelled) return;
      if (s.ok) setStats(normalizeStats(s.data));
      if (m.ok) setDistricts(normalizeDistricts(m.data));
      if (b.ok) setBadges(normalizeBadges(b.data));
      if (a.ok) setActivity(normalizeActivity(a.data));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    const res = await api.subscriptions.initialize({ tier: "Architect" });
    setUpgradeLoading(false);
    if (res.ok && (res.data as any)?.checkoutUrl) {
      window.location.href = (res.data as any).checkoutUrl;
    } else {
      alert(res.ok ? "Subscription initialized." : res.error || "Couldn't start upgrade.");
    }
  };

  const xp = stats?.xp ?? 0;
  const rank = stats?.rank || "Initiate";
  const userInitial = (user?.firstName || user?.email || "U").charAt(0).toUpperCase();

  const headerRight = (
    <div className="hidden md:flex items-center gap-4">
      <div className="text-right">
        <div className="text-xs font-mono text-muted-foreground">XP</div>
        <div className="text-base font-bold text-[#FFD700]">{xp.toLocaleString()}</div>
      </div>
      <div className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/40">
        {rank}
      </div>
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center font-bold text-white border-2 border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]">
        {stats?.avatarUrl ? (
          <img src={stats.avatarUrl} className="h-full w-full rounded-full object-cover" alt="" />
        ) : (
          userInitial
        )}
      </div>
    </div>
  );

  return (
    <DashboardShell
      nav={nav}
      title="Conqueror's Hub"
      subtitle="// imperial.dashboard.user"
      headerRight={headerRight}
      theme="user"
      showBrainiac
    >
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          {/* Mobile header stats */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <StatPill label="XP" value={xp.toLocaleString()} />
            <StatPill label="Rank" value={rank} />
          </div>

          {/* Progress Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold">District Mastery</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    Your conquest of the Imperial City
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-[#FFD700]" />
              </div>
              {districts.length === 0 ? (
                <EmptyHint text="No districts mapped yet. Start a mission to claim territory." />
              ) : (
                <div className="space-y-4">
                  {districts.slice(0, 5).map((d, i) => (
                    <div key={d.id || i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{d.name}</span>
                        <span className="font-mono text-[#FFD700]">{Math.round(d.mastery)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, d.mastery)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#FF8F00] shadow-[0_0_12px_rgba(255,215,0,0.55)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subscription card */}
            <div className="bg-gradient-to-br from-[#7C3AED]/15 to-[#0d1119] border border-[#7C3AED]/30 rounded-xl p-6 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Crown className="h-6 w-6 text-[#FFD700] mb-3" />
              <h3 className="text-lg font-bold mb-1">Ascend to Architect</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Unlock advanced missions, premium badges, and priority Brainiac access.
              </p>
              <Button
                className="w-full bg-[#FFD700] hover:bg-[#FFC107] text-black font-bold shadow-[0_0_18px_rgba(255,215,0,0.45)]"
                onClick={handleUpgrade}
                disabled={upgradeLoading}
              >
                {upgradeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {upgradeLoading ? "Preparing..." : "Upgrade — $19/mo"}
              </Button>
            </div>
          </div>

          {/* Trophy Carousel */}
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Trophy Case</h2>
                <p className="text-xs text-muted-foreground font-mono">Latest earned badges</p>
              </div>
              <Trophy className="h-5 w-5 text-[#FFD700]" />
            </div>
            {badges.length === 0 ? (
              <EmptyHint text="No badges yet. Complete a mission to claim your first." />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
                {badges.slice(0, 12).map((b, i) => {
                  const glow = RARITY_GLOW[(b.rarity || "common").toLowerCase()] || RARITY_GLOW.common;
                  return (
                    <motion.div
                      key={b.id || i}
                      whileHover={{ y: -4 }}
                      className={`shrink-0 w-36 snap-start bg-[#0A0E14] border rounded-xl p-4 text-center ${glow}`}
                    >
                      <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#7C3AED]/20 flex items-center justify-center mb-3">
                        {b.iconUrl ? (
                          <img src={b.iconUrl} alt="" className="h-10 w-10" />
                        ) : (
                          <Trophy className="h-7 w-7 text-[#FFD700]" />
                        )}
                      </div>
                      <div className="text-sm font-semibold truncate">{b.name}</div>
                      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-1">
                        {b.rarity || "common"}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Recent Activity</h2>
                <p className="text-xs text-muted-foreground font-mono">Last 5 mission completions</p>
              </div>
              <Activity className="h-5 w-5 text-[#A78BFA]" />
            </div>
            {activity.length === 0 ? (
              <EmptyHint text="No recent activity logged." />
            ) : (
              <ul className="divide-y divide-white/5">
                {activity.slice(0, 5).map((a, i) => (
                  <li key={a.id || i} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Zap className="h-4 w-4 text-[#FFD700] shrink-0" />
                      <span className="truncate">{a.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0">
                      {typeof a.xp === "number" && (
                        <span className="text-[#FFD700]">+{a.xp} XP</span>
                      )}
                      {a.at && <span>{formatRel(a.at)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0d1119] border border-white/5 rounded-lg px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-[#FFD700]">{value}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="font-mono text-sm">Loading your hub…</span>
    </div>
  );
}

function normalizeStats(d: any): Stats {
  if (!d || typeof d !== "object") return {};
  return {
    xp: Number(d.xp ?? d.totalXp ?? d.experience ?? 0),
    rank: d.rank || d.tier || d.level || "Initiate",
    avatarUrl: d.avatarUrl || d.avatar,
    districtName: d.currentDistrict || d.districtName,
  };
}
function normalizeDistricts(d: any): District[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.districts) ? d.districts : [];
  return arr.map((x: any) => ({
    id: x.id ?? x.districtId,
    name: x.name || x.district || "District",
    mastery: Number(x.mastery ?? x.percent ?? x.progress ?? 0),
  }));
}
function normalizeBadges(d: any): Badge[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.badges) ? d.badges : [];
  return arr.map((x: any) => ({
    id: x.id ?? x.badgeId,
    name: x.name || x.title || "Badge",
    rarity: x.rarity || x.tier,
    iconUrl: x.iconUrl || x.icon,
    earnedAt: x.earnedAt || x.createdAt,
  }));
}
function normalizeActivity(d: any): Activity[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.logs) ? d.logs : [];
  return arr.map((x: any) => ({
    id: x.id,
    title: x.title || x.message || x.action || "Activity",
    xp: typeof x.xp === "number" ? x.xp : undefined,
    at: x.at || x.createdAt || x.timestamp,
  }));
}
function formatRel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
