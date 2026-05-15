import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Map, Trophy, Activity, CreditCard, Sparkles, Flame, Target, Crown,
  User as UserIcon, LayoutDashboard, Compass, TrendingUp, CheckCircle2,
  Medal, Star, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { XPRing } from "@/components/dashboard/XPRing";
import { Leaderboard, type LeaderboardUser, type CurrentUserRank } from "@/components/dashboard/Leaderboard";
import { api } from "@/lib/api";
import { getUser, getUserId, getProfileId } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const nav: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/dashboard", label: "Progress", icon: TrendingUp },
  { href: "/profession/select", label: "Choose Path", icon: Compass },
  { href: "/profession/select", label: "Imperial Map", icon: Map },
  { href: "/profile/edit", label: "My Profile", icon: UserIcon },
  { href: "/user/badges", label: "My Badges", icon: Trophy },
  { href: "/user/activity", label: "Activity Feed", icon: Activity },
  { href: "/user/subscription", label: "Subscription", icon: CreditCard },
];

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Stats = {
  totalXP: number;
  dayStreak: number;
  problemsSolvedCount: number;
  currentSubscription: number;
};
type DashboardStats = {
  totalDistricts: number;
  claimedCount: number;
  inProgressCount: number;
  dayStreak: number;
  problemsSolved: number;
  subscription: string;
  hasBadges: boolean;
  hasDistricts: boolean;
  totalXP: number;
};
type District = {
  districtName: string;
  earnedXP: number;
  totalPossibleXP: number;
  completionPercentage: number;
};
type ActivityLog = { activity: string; createdAt?: string; performedBy?: string };
type Profile = {
  firstName?: string;
  surName?: string;
  lastName?: string;
  nickName?: string;
  email?: string;
  currentTitle?: string;
  avatarUrl?: string;
  imageUrl?: string;
  currentSubscription?: number;
};
type BadgeMilestone = { name: string; description: string; rarity: number; check: (s: Stats) => boolean };
type EarnedBadge = { name: string; description: string; rarityKey: string; isNew?: boolean };

/* ─── Constants ──────────────────────────────────────────────────────────── */
const SUB_NAMES: Record<number, string> = { 0: "Initiate", 1: "Architect", 2: "Grandmaster" };

const SUB_STYLE: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Grandmaster: { bg: "bg-[#FFD700]/15", text: "text-[#FFD700]", border: "border-[#FFD700]/40", glow: "shadow-[0_0_16px_rgba(255,215,0,0.5)]" },
  Architect:   { bg: "bg-[#00D2FF]/12", text: "text-[#00D2FF]", border: "border-[#00D2FF]/40", glow: "shadow-[0_0_14px_rgba(0,210,255,0.4)]" },
  Initiate:    { bg: "bg-gray-800/60",  text: "text-gray-400",  border: "border-gray-700",     glow: "" },
};

const RARITY_COLOR: Record<string, { ring: string; glow: string; label: string; labelText: string }> = {
  legendary: { ring: "from-amber-400 to-yellow-600", glow: "shadow-[0_0_22px_rgba(255,215,0,0.7)]", label: "text-amber-400", labelText: "Legendary" },
  epic:      { ring: "from-[#A78BFA] to-[#7C3AED]", glow: "shadow-[0_0_18px_rgba(168,85,247,0.6)]", label: "text-[#A78BFA]", labelText: "Epic" },
  rare:      { ring: "from-cyan-400 to-blue-600",    glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]", label: "text-cyan-400",  labelText: "Rare" },
  common:    { ring: "from-slate-400 to-slate-600",  glow: "",                                        label: "text-slate-400", labelText: "Common" },
};

function numericRarityToKey(rarity: number): string {
  return ["common", "rare", "epic", "legendary"][Math.min(rarity, 3)] ?? "common";
}

/* ─── Badge cache ────────────────────────────────────────────────────────── */
const BADGE_CACHE_PREFIX = "brainepedia:awarded_badges:";
function getCachedBadgeNames(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${BADGE_CACHE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set<string>(parsed as string[]);
  } catch { }
  return new Set();
}
function cacheBadgeName(userId: string, name: string): void {
  try {
    const key = `${BADGE_CACHE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let existing: string[] = [];
    try { const p = JSON.parse(raw ?? "[]"); if (Array.isArray(p)) existing = p as string[]; } catch { existing = []; }
    if (!existing.includes(name)) localStorage.setItem(key, JSON.stringify([...existing, name]));
  } catch { }
}
function seedBadgeCache(userId: string, names: string[]): void {
  try {
    const key = `${BADGE_CACHE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let existing: string[] = [];
    try { const p = JSON.parse(raw ?? "[]"); if (Array.isArray(p)) existing = p as string[]; } catch { existing = []; }
    localStorage.setItem(key, JSON.stringify(Array.from(new Set([...existing, ...names]))));
  } catch { }
}

const BADGE_MILESTONES: BadgeMilestone[] = [
  { name: "First Blood",      description: "Earned your first XP in the empire",          rarity: 0, check: s => s.totalXP > 0 },
  { name: "Problem Solver",   description: "Conquered your first problem node",             rarity: 1, check: s => s.problemsSolvedCount >= 1 },
  { name: "Streak Keeper",    description: "Maintained a 3-day activity streak",            rarity: 1, check: s => s.dayStreak >= 3 },
  { name: "Centurion",        description: "Crossed the 100 XP threshold",                 rarity: 1, check: s => s.totalXP >= 100 },
  { name: "Week Warrior",     description: "Held the line for 7 consecutive days",         rarity: 2, check: s => s.dayStreak >= 7 },
  { name: "XP Veteran",       description: "Accumulated 500 total XP",                     rarity: 2, check: s => s.totalXP >= 500 },
  { name: "Architect Tier",   description: "Ascended to the Architect subscription rank",  rarity: 2, check: s => s.currentSubscription >= 1 },
  { name: "Imperial Champion",description: "Reached 1 000 XP — a true empire builder",    rarity: 3, check: s => s.totalXP >= 1000 },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function UserDashboard() {
  usePageTitle("Dashboard");
  const [, navigate] = useLocation();
  const userId = getUserId();
  const profileId = getProfileId();
  const user = getUser();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const newBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      const updatedUser = getUser();
      if (updatedUser) {
        setProfile(prev => prev ? {
          ...prev,
          firstName: updatedUser.firstName || prev.firstName,
          surName: updatedUser.surName || updatedUser.lastName || prev.surName,
          avatarUrl: updatedUser.avatarUrl || prev.avatarUrl,
          imageUrl: updatedUser.imageUrl || prev.imageUrl,
        } : prev);
      }
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!userId) { navigate("/auth/login"); return; }

    if (user) {
      setProfile(prev => prev ?? {
        firstName: user.firstName,
        surName: user.lastName || user.surName,
      });
    }

    const userEmail = user?.email || "";
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLeaderboardLoading(true);

      const pid = getProfileId() || userId;
      const [s, m, a, pDirect, b, ds, lb] = await Promise.all([
        api.profiles.stats(userId),
        api.profiles.map(userId),
        api.activityLogs.forUser(userId),
        api.profiles.get(pid),
        api.userBadges.forUser(userId),
        api.dashboard.stats(userId),
        api.dashboard.leaderboard(20),
      ]);
      if (cancelled) return;

      const stats = s.ok ? normStats(s.data) : null;
      if (stats) setStats(stats);
      if (m.ok) setDistricts(normDistricts(m.data));
      if (a.ok) setActivity(normActivity(a.data));

      // Dashboard stats (richer endpoint)
      if (ds.ok && ds.data && typeof ds.data === "object") {
        setDashStats(normDashStats(ds.data));
      }

      // Leaderboard
      applyLeaderboard(lb);
      setLeaderboardLoading(false);

      // Profile
      if (pDirect.ok && pDirect.data && typeof pDirect.data === "object") {
        setProfile(pDirect.data as Profile);
      } else {
        const all = await api.profiles.search({});
        if (!cancelled && all.ok && Array.isArray(all.data)) {
          const found = all.data.find((x: any) =>
            (userEmail && x.email?.toLowerCase() === userEmail.toLowerCase()) || x.userId === userId
          );
          if (found) setProfile(found as Profile);
        }
      }

      // Badge logic
      if (stats && userId) {
        const rawBadges = normBadgesFromRaw(b.ok ? b.data : null);
        const serverNames = rawBadges.map(x => x.name).filter(Boolean) as string[];
        if (serverNames.length > 0) seedBadgeCache(userId, serverNames);
        const cachedNames = getCachedBadgeNames(userId);
        const existingNames = new Set<string>([...serverNames, ...cachedNames]);
        const existingBadgeList: EarnedBadge[] = rawBadges.filter(x => x.name).map(x => ({
          name: x.name!, description: x.description || "", rarityKey: numericRarityToKey(x.rarity ?? 0), isNew: false,
        }));
        const toAward = BADGE_MILESTONES.filter(m => m.check(stats) && !existingNames.has(m.name));
        if (toAward.length > 0) {
          const awardResults = await Promise.all(toAward.map(async milestone => {
            const [awardRes] = await Promise.all([
              api.userBadges.award({ userId, name: milestone.name, description: milestone.description, rarity: milestone.rarity }),
              api.activityLogs.create({ userId, activity: `Unlocked badge: ${milestone.name} — ${milestone.description}` }),
            ]);
            const alreadyExists = awardRes.status === 409;
            if (awardRes.ok || alreadyExists) cacheBadgeName(userId, milestone.name);
            return { milestone, success: awardRes.ok };
          }));
          if (!cancelled) {
            const refreshed = await api.activityLogs.forUser(userId);
            if (!cancelled && refreshed.ok) setActivity(normActivity(refreshed.data));
            const confirmed = awardResults.filter(r => r.success).map(r => r.milestone);
            if (confirmed.length > 0) {
              const freshBadges: EarnedBadge[] = confirmed.map(m => ({ name: m.name, description: m.description, rarityKey: numericRarityToKey(m.rarity), isNew: true }));
              freshBadges.forEach(badge => {
                const r = RARITY_COLOR[badge.rarityKey] ?? RARITY_COLOR.common;
                toast({ title: `🏆 Badge Unlocked: ${badge.name}`, description: `${badge.description} · ${r.labelText}` });
              });
              setNewBadges(freshBadges);
              setEarnedBadges([...freshBadges, ...existingBadgeList]);
              if (newBadgeTimerRef.current) clearTimeout(newBadgeTimerRef.current);
              newBadgeTimerRef.current = setTimeout(() => {
                setNewBadges([]);
                setEarnedBadges(prev => prev.map(b => ({ ...b, isNew: false })));
              }, 6000);
            } else { setEarnedBadges(existingBadgeList); }
          }
        } else if (!cancelled) { setEarnedBadges(existingBadgeList); }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
      if (newBadgeTimerRef.current) clearTimeout(newBadgeTimerRef.current);
    };
  }, [userId]);

  /* ── Leaderboard helpers ── */
  const applyLeaderboard = (lb: Awaited<ReturnType<typeof api.dashboard.leaderboard>>) => {
    if (!lb.ok || !lb.data) return;
    const d = lb.data as any;

    /* Support both camelCase and PascalCase top-level keys */
    const rawList: any[] = Array.isArray(d.topUsers)
      ? d.topUsers
      : Array.isArray(d.TopUsers)
        ? d.TopUsers
        : [];

    /* Resolve current user's nickName from profile state (available via closure) */
    const myNickName: string | null = (profile as any)?.nickName || null;

    /* Map entries — handle every known casing variant for each field */
    const users: LeaderboardUser[] = rawList.map((u: any, i: number) => {
      const mappedNick = u.nickName || u.NickName || u.name || u.Name || u.userName || u.UserName || null;
      const isMe = Boolean(
        u.isCurrentUser ??
        u.IsCurrentUser ??
        (myNickName && mappedNick && mappedNick === myNickName)
      );
      return {
        rank: Number(u.rank ?? u.Rank ?? i + 1),
        nickName: mappedNick || "Operative",
        avatarUrl: u.avatarUrl || u.AvatarUrl || null,
        totalXP: Number(
          u.totalXP    ??
          u.TotalXP    ??
          u.totalXp    ??
          u.TotalXp    ??
          u.xp         ??
          u.Xp         ??
          u.xPoints    ??
          u.XPoints    ??
          u.experiencePoints ??
          u.ExperiencePoints ??
          0
        ),
        isCurrentUser: isMe,
      };
    });
    setTopUsers(users);

    /* currentUser block — support camelCase + PascalCase */
    const cu: any = d.currentUser ?? d.CurrentUser ?? null;
    /* Also use profile stats as fallback XP source */
    const myXP = Number(
      (stats as any)?.totalXP ??
      (dashStats as any)?.totalXP ??
      0
    );

    if (cu) {
      const meInList = users.find(u => u.isCurrentUser);
      setCurrentUserRank({
        rank: Number(cu.rank ?? cu.Rank ?? meInList?.rank ?? 0),
        xp: Number(
          cu.xp       ??
          cu.Xp       ??
          cu.totalXP  ??
          cu.TotalXP  ??
          cu.totalXp  ??
          cu.TotalXp  ??
          cu.xPoints  ??
          cu.XPoints  ??
          cu.experiencePoints ??
          cu.ExperiencePoints ??
          meInList?.totalXP   ??
          myXP
        ),
        nickName: cu.nickName || cu.NickName || cu.name || cu.Name || meInList?.nickName,
        avatarUrl: cu.avatarUrl || cu.AvatarUrl || meInList?.avatarUrl,
      });
    } else {
      /* Derive from topUsers list if currentUser block absent */
      const meInList = users.find(u => u.isCurrentUser);
      if (meInList) {
        /* Use stats XP if the leaderboard entry has 0 (might be stale) */
        setCurrentUserRank({
          rank: meInList.rank,
          xp: meInList.totalXP || myXP,
          nickName: meInList.nickName,
          avatarUrl: meInList.avatarUrl,
        });
      } else if (myNickName && myXP > 0) {
        /* Current user not in top list — show their position from stats */
        setCurrentUserRank({ rank: 0, xp: myXP, nickName: myNickName });
      }
    }
  };

  const refreshLeaderboard = async () => {
    setLeaderboardLoading(true);
    const lb = await api.dashboard.leaderboard(20);
    applyLeaderboard(lb);
    setLeaderboardLoading(false);
  };

  const refreshDistricts = async () => {
    if (!userId) return;
    const m = await api.profiles.map(userId);
    if (m.ok) setDistricts(normDistricts(m.data));
  };

  /* Refresh leaderboard + districts whenever a mission evaluation completes */
  useEffect(() => {
    const handler = () => {
      refreshLeaderboard();
      refreshDistricts();
    };
    window.addEventListener("brainepedia:evaluation-complete", handler);
    return () => window.removeEventListener("brainepedia:evaluation-complete", handler);
  }, [userId]);

  const handleUpgrade = async () => {
    if (!userId) return;
    setUpgradeLoading(true);
    const targetTierName = subName === "Architect" ? "Grandmaster" : "Architect";
    /* Use numeric tier values to match the subscription page's working flow */
    const TIER_NUMS: Record<string, number> = { Initiate: 0, Architect: 1, Grandmaster: 2 };
    const newTier = TIER_NUMS[targetTierName] ?? 1;
    const res = await api.subscriptions.initializeUpgrade({
      userId,
      newTier,
      currency: "NGN",
      source: "paystack",
    });
    setUpgradeLoading(false);
    const data = res.data as { checkoutUrl?: string; authorization_url?: string } | null;
    const url = data?.checkoutUrl || data?.authorization_url;
    if (res.ok && url) {
      api.activityLogs.create({ userId, activity: `Initiated subscription upgrade to ${targetTierName} tier` });
      window.location.href = url;
    } else if (res.ok) {
      toast({ title: "Payment initialised", description: "Check your email or dashboard for the payment link." });
    } else {
      toast({ title: "Upgrade failed", description: res.error || "Payment initialization failed. Please try again.", variant: "destructive" });
    }
  };

  /* Derived values */
  const totalXP    = dashStats?.totalXP ?? stats?.totalXP ?? 0;
  const dayStreak  = dashStats?.dayStreak ?? stats?.dayStreak ?? 0;
  const solved     = dashStats?.problemsSolved ?? stats?.problemsSolvedCount ?? 0;
  const subName    = dashStats?.subscription ?? SUB_NAMES[stats?.currentSubscription ?? 0] ?? "Initiate";
  const subStyle   = SUB_STYLE[subName] ?? SUB_STYLE.Initiate;
  const hasBadges  = dashStats?.hasBadges ?? earnedBadges.length > 0;
  const hasDistricts = dashStats?.hasDistricts ?? districts.length > 0;
  const totalDist  = dashStats?.totalDistricts ?? districts.length;
  const claimedDist= dashStats?.claimedCount ?? districts.filter(d => d.completionPercentage >= 100).length;
  const inProgDist = dashStats?.inProgressCount ?? districts.filter(d => d.completionPercentage > 0 && d.completionPercentage < 100).length;
  const level      = Math.floor(totalXP / 1000) + 1;
  const rank       = currentUserRank?.rank ?? null;

  const displayName = profile
    ? `${profile.firstName || ""} ${profile.surName || profile.lastName || ""}`.trim() || user?.firstName || user?.email || "Operative"
    : user?.firstName ? `${user.firstName} ${user?.lastName || ""}`.trim() : user?.email || "Operative";
  const nickName    = profile?.nickName || displayName;
  const displayTitle= profile?.currentTitle || "Brainepedia Operative";
  const avatarUrl   = profile?.avatarUrl || profile?.imageUrl || null;
  const initial     = displayName.charAt(0).toUpperCase();

  const headerRight = (
    <div className="hidden md:flex items-center gap-3">
      {rank && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-xs font-mono text-[#FFD700]">
          <Medal className="h-3 w-3" />#{rank}
        </div>
      )}
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">XP</div>
        <div className="text-base font-bold text-amber-400">{totalXP.toLocaleString()}</div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${subStyle.bg} ${subStyle.text} ${subStyle.border} ${subStyle.glow}`}>
        {subName}
      </div>
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover border-2 border-amber-400/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]" />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center font-bold text-white border-2 border-amber-400/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]">
          {initial}
        </div>
      )}
    </div>
  );

  return (
    <DashboardShell nav={nav} title="Command Center" subtitle="// imperial.dashboard" headerRight={headerRight} theme="user" showBrainiac>
      {loading ? <BrainiacSpinner /> : (
        <div className="space-y-6 max-w-6xl">

          {/* ── HERO PROFILE ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-stretch gap-5 bg-gradient-to-r from-[#0d1119] via-[#0d1119] to-[#0d1119]/60 border border-white/8 rounded-2xl p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/8 via-transparent to-[#00D2FF]/5 pointer-events-none" />
            {/* Avatar */}
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_22px_rgba(255,215,0,0.35)] shrink-0" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center text-3xl font-bold text-white border-2 border-amber-400/60 shadow-[0_0_22px_rgba(255,215,0,0.35)] shrink-0">
                {initial}
              </div>
            )}
            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-2xl font-bold text-white truncate">{nickName}</p>
              <p className="text-sm text-white/40 truncate">{displayTitle}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${subStyle.bg} ${subStyle.text} ${subStyle.border} ${subStyle.glow}`}>
                  {subName} Tier
                </span>
                {rank && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
                    <Trophy className="h-3 w-3" /> Rank #{rank}
                  </span>
                )}
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-white/50 border border-white/10">
                  <Star className="h-3 w-3 text-amber-400" /> Lv.{level}
                </span>
              </div>
            </div>
            {/* XP display */}
            <div className="flex flex-col items-center justify-center shrink-0 text-center px-4 py-2 rounded-xl border border-amber-400/20 bg-amber-400/5">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/60 mb-0.5">Total XP</div>
              <AnimatedXP value={totalXP} />
              <Link href="/profile/edit" className="text-[9px] font-mono uppercase tracking-wider text-white/30 hover:text-amber-400 mt-2 transition-colors">
                Edit Profile →
              </Link>
            </div>
          </motion.div>

          {/* ── QUICK STATS GRID ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Problems Solved", value: solved, icon: CheckCircle2, accent: "text-[#00D2FF]", glow: "from-[#00D2FF]/10" },
              { label: "Claimed Districts", value: claimedDist, icon: Map, accent: "text-emerald-400", glow: "from-emerald-400/10" },
              { label: "In Progress", value: inProgDist, icon: Activity, accent: "text-[#A78BFA]", glow: "from-[#A78BFA]/10" },
              { label: "Day Streak", value: `${dayStreak}d`, icon: Flame, accent: "text-orange-400", glow: "from-orange-400/10", streak: true },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`relative bg-[#0d1119] border border-white/6 rounded-xl p-5 overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} to-transparent opacity-40`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-white/40">{card.label}</span>
                    <card.icon className={`h-4 w-4 ${card.accent}`} />
                  </div>
                  <div className={`text-3xl font-black font-mono ${card.accent}`}>
                    {card.value}
                  </div>
                  {card.streak && <StreakFlame active={dayStreak >= 3} />}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── VIEW PROGRESS CTA ── */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/app/dashboard"
              className="flex items-center justify-between w-full bg-[#0d1119] border border-[#00D2FF]/20 hover:border-[#00D2FF]/50 rounded-xl px-5 py-4 group transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#00D2FF]/10 flex items-center justify-center group-hover:bg-[#00D2FF]/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-[#00D2FF]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">View Full Progress</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Track missions, XP &amp; district completion</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#00D2FF]/60">Total XP</p>
                  <p className="text-base font-bold font-mono text-[#00D2FF]">{totalXP.toLocaleString()}</p>
                </div>
                <span className="text-xs font-mono text-[#00D2FF] group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          </motion.div>

          {/* ── XP RING + DISTRICT OVERVIEW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* XP Ring */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0d1119] border border-white/6 rounded-2xl p-6 flex flex-col items-center gap-2">
              <div className="w-full flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-bold text-white">XP Progress</h2>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Level system</p>
                </div>
                <Zap className="h-5 w-5 text-[#FFD700]" />
              </div>
              <XPRing totalXP={totalXP} size={190} />
            </motion.div>

            {/* District Overview */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="bg-[#0d1119] border border-white/6 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">District Status</h2>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Territorial control</p>
                </div>
                <Map className="h-5 w-5 text-amber-400" />
              </div>
              {!hasDistricts ? (
                <EmptyState label="No territories claimed yet." cta="Explore Professions" href="/profession/select" />
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Claimed", value: claimedDist, total: totalDist, color: "bg-emerald-400", text: "text-emerald-400" },
                    { label: "In Progress", value: inProgDist, total: totalDist, color: "bg-[#00D2FF]", text: "text-[#00D2FF]" },
                    { label: "Total Districts", value: totalDist, total: totalDist, color: "bg-[#A78BFA]", text: "text-white" },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-white/50">{bar.label}</span>
                        <span className={`text-sm font-bold font-mono ${bar.text}`}>{bar.value} / {bar.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className={`h-full rounded-full ${bar.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: bar.total > 0 ? `${(bar.value / bar.total) * 100}%` : "0%" }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                  <Link href="/profession/select"
                    className="block mt-3 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition-colors border border-dashed border-white/10 rounded-lg py-2.5">
                    View Imperial Map →
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── LEADERBOARD (top 3 + your position) ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#0d1119] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#FFD700]" /> Top Problem Solvers
                </h2>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-0.5">Global leaderboard · Keep climbing</p>
              </div>
              {rank && (
                <div className="text-right">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Your Rank</p>
                  <p className="text-2xl font-black text-[#FFD700] font-mono">#{rank}</p>
                </div>
              )}
            </div>
            {/* Pass only top 3 — zero-XP entries beyond that are suppressed */}
            <Leaderboard
              topUsers={topUsers.filter(u => u.totalXP > 0).slice(0, 3)}
              currentUser={currentUserRank}
              loading={leaderboardLoading}
            />
          </motion.div>

          {/* ── ACHIEVEMENT STATUS ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className={`flex items-center gap-4 rounded-xl border p-4 ${hasBadges ? "border-[#FFD700]/25 bg-[#FFD700]/5" : "border-white/8 bg-[#0d1117]"}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${hasBadges ? "bg-[#FFD700]/15" : "bg-white/5"}`}>
              <Trophy className={`h-5 w-5 ${hasBadges ? "text-[#FFD700]" : "text-white/20"}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${hasBadges ? "text-[#FFD700]" : "text-white/30"}`}>
                {hasBadges ? "Badge Collector Active" : "No badges unlocked yet"}
              </p>
              <p className="text-xs text-white/30 font-mono">
                {hasBadges
                  ? `${earnedBadges.length} badge${earnedBadges.length !== 1 ? "s" : ""} earned — keep going`
                  : "Complete missions to unlock your first achievement"}
              </p>
            </div>
            <Link href="/user/badges" className="ml-auto text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-amber-400 transition-colors shrink-0">
              All Badges →
            </Link>
          </motion.div>

          {/* ── BADGE SHOWCASE ── */}
          {earnedBadges.length > 0 && (
            <div className="bg-[#0d1119] border border-white/6 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-amber-400">Badge Showcase</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    {newBadges.length > 0 ? `${newBadges.length} new badge${newBadges.length > 1 ? "s" : ""} unlocked!` : "Your latest honours"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {newBadges.length > 0 && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-400/20 text-amber-400 border border-amber-400/40">
                      New!
                    </motion.span>
                  )}
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <AnimatePresence>
                  {earnedBadges.slice(0, 6).map((badge, i) => {
                    const r = RARITY_COLOR[badge.rarityKey] ?? RARITY_COLOR.common;
                    return (
                      <motion.div key={badge.name}
                        initial={badge.isNew ? { opacity: 0, scale: 0.7, y: 12 } : false}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: badge.isNew ? i * 0.12 : 0 }}
                        className="relative">
                        <div className={`rounded-xl p-[2px] bg-gradient-to-br ${r.ring} ${r.glow}`}>
                          <div className="bg-[#0A0E14] rounded-[10px] p-3 flex flex-col items-center justify-center text-center gap-1.5 min-h-[90px]">
                            <Trophy className={`h-6 w-6 ${r.label}`} />
                            <div className="text-xs font-bold leading-tight line-clamp-2 text-white">{badge.name}</div>
                            <div className={`text-[9px] font-mono uppercase tracking-wider ${r.label}`}>{r.labelText}</div>
                          </div>
                        </div>
                        {badge.isNew && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-400 border border-black flex items-center justify-center">
                            <span className="text-[8px] font-bold text-black leading-none">✦</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="mt-4 text-right">
                <Link href="/user/badges" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition-colors">
                  View all badges →
                </Link>
              </div>
            </div>
          )}

          {/* ── IMPERIAL MAP + SUBSCRIPTION ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0d1119] border border-white/6 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-amber-400">Imperial Map</h2>
                  <p className="text-xs text-muted-foreground font-mono">Districts under your conquest</p>
                </div>
                <Map className="h-5 w-5 text-amber-400" />
              </div>
              {districts.length === 0
                ? <EmptyState label="No districts mapped yet. Start a mission to claim territory." cta="Begin Your First Journey" href="/profession/select" />
                : <HexGrid districts={districts} />
              }
            </div>
            {subName === "Grandmaster" ? (
              /* Already max tier — show status card */
              <div className="bg-gradient-to-br from-[#FFD700]/10 to-[#0d1119] border border-[#FFD700]/35 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,215,0,0.15)] flex flex-col">
                <Crown className="h-6 w-6 text-[#FFD700] mb-3" />
                <h3 className="text-lg font-bold text-[#FFD700] mb-1">Imperial Citizen</h3>
                <p className="text-sm text-white/40 mb-5 flex-1">
                  You hold Grandmaster status. Unlimited missions, GPT-4o evaluations, and elite leaderboard badge are all active.
                </p>
                <Link href="/user/subscription"
                  className="block text-center text-xs font-mono uppercase tracking-wider text-[#FFD700]/60 hover:text-[#FFD700] transition-colors border border-[#FFD700]/20 rounded-lg py-2.5">
                  Manage Subscription →
                </Link>
              </div>
            ) : (
              /* Upgrade card — shows next tier */
              <div className={`bg-gradient-to-br rounded-2xl p-6 flex flex-col ${
                subName === "Architect"
                  ? "from-[#FFD700]/10 to-[#0d1119] border border-[#FFD700]/30 shadow-[0_0_18px_rgba(255,215,0,0.12)]"
                  : "from-[#7C3AED]/15 to-[#0d1119] border border-[#7C3AED]/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]"
              }`}>
                {subName === "Architect"
                  ? <Crown className="h-6 w-6 text-[#FFD700] mb-3" />
                  : <Crown className="h-6 w-6 text-amber-400 mb-3" />
                }
                <h3 className="text-lg font-bold mb-1">
                  {subName === "Architect" ? "Ascend to Grandmaster" : "Ascend to Architect"}
                </h3>
                <p className="text-sm text-muted-foreground mb-5 flex-1">
                  {subName === "Architect"
                    ? "Unlock GPT-4o evaluations, unlimited Brainiac guidance, and elite leaderboard status."
                    : "Unlock advanced missions, premium badges, and priority Brainiac access."}
                </p>
                <Button
                  className={`w-full font-bold ${
                    subName === "Architect"
                      ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black shadow-[0_0_14px_rgba(255,215,0,0.3)]"
                      : "bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_14px_rgba(124,58,237,0.3)]"
                  }`}
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                >
                  {upgradeLoading
                    ? "Preparing…"
                    : subName === "Architect"
                    ? "Upgrade — $49.99/mo"
                    : "Upgrade — $19.99/mo"}
                </Button>
                <Link href="/user/subscription"
                  className="block mt-3 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition-colors">
                  View all plans →
                </Link>
                <Link href={(profileId || userId) ? `/profile/${encodeURIComponent(profileId || userId || "")}` : "/"}
                  className="block mt-1.5 text-center text-[10px] font-mono text-muted-foreground/50 hover:text-amber-400 transition-colors">
                  View public profile →
                </Link>
              </div>
            )}
          </div>

          {/* ── ACTIVITY ── */}
          <div className="bg-[#0d1119] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-amber-400">Recent Activity</h2>
                <p className="text-xs text-muted-foreground font-mono">Imperial timeline</p>
              </div>
              <Activity className="h-5 w-5 text-[#A78BFA]" />
            </div>
            {activity.length === 0
              ? <EmptyState label="No activity logged yet." />
              : <Timeline items={activity.slice(0, 12)} />
            }
          </div>

        </div>
      )}
    </DashboardShell>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function AnimatedXP({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <div className="text-2xl font-black text-amber-400 font-mono">{display.toLocaleString()} XP</div>;
}

function StreakFlame({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
      className="absolute top-3 right-3 text-orange-400 text-lg">🔥</motion.div>
  );
}

function StatTile({ label, value, accent, icon: Icon }: { label: string; value: string; accent: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d1119] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </motion.div>
  );
}

function DistrictProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const tier = pct >= 75 ? "gold" : pct >= 35 ? "purple" : "slate";
  const stroke = tier === "gold" ? "#FFD700" : tier === "purple" ? "#A78BFA" : "#475569";
  const glow = tier === "gold"
    ? "drop-shadow(0 0 6px rgba(255,215,0,0.7))"
    : tier === "purple"
    ? "drop-shadow(0 0 5px rgba(167,139,250,0.6))"
    : "none";
  return (
    <svg width={size} height={size} className="shrink-0" style={{ filter: glow }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={stroke} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="700" fontFamily="monospace" fill={stroke}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function HexGrid({ districts }: { districts: District[] }) {
  return (
    <div className="space-y-3">
      {districts.slice(0, 12).map((d, i) => {
        const pct = Math.max(0, Math.min(100, d.completionPercentage));
        const tier = pct >= 75 ? "gold" : pct >= 35 ? "purple" : "slate";
        const barColor = tier === "gold" ? "bg-amber-400" : tier === "purple" ? "bg-[#A78BFA]" : "bg-slate-600";
        const borderColor = tier === "gold" ? "border-[#FFD700]/25" : tier === "purple" ? "border-[#A78BFA]/20" : "border-white/6";
        const glowClass = tier === "gold"
          ? "hover:shadow-[0_0_18px_rgba(255,215,0,0.15)]"
          : tier === "purple"
          ? "hover:shadow-[0_0_14px_rgba(167,139,250,0.15)]"
          : "";
        const xpText = tier === "gold" ? "text-amber-400" : tier === "purple" ? "text-[#A78BFA]" : "text-white/40";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className={`flex items-center gap-4 rounded-xl border ${borderColor} bg-[#0A0E14] px-4 py-3 transition-shadow ${glowClass}`}
          >
            <DistrictProgressRing pct={pct} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{d.districtName}</p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.04 + 0.1 }}
                />
              </div>
            </div>

            <div className="text-right shrink-0">
              {d.totalPossibleXP > 0 ? (
                <>
                  <p className={`text-sm font-bold font-mono ${xpText}`}>
                    {d.earnedXP.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-white/20">
                    / {d.totalPossibleXP.toLocaleString()} XP
                  </p>
                </>
              ) : (
                <p className={`text-sm font-bold font-mono ${xpText}`}>
                  {d.earnedXP > 0 ? `${d.earnedXP.toLocaleString()} XP` : "—"}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Timeline({ items }: { items: ActivityLog[] }) {
  return (
    <ol className="relative border-l-2 border-white/10 ml-2 space-y-4 max-h-[28rem] overflow-y-auto pr-2">
      {items.map((a, i) => (
        <li key={i} className="ml-4">
          <div className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(255,215,0,0.7)] border border-amber-300" />
          <div className="bg-black/30 border border-white/5 rounded-lg px-4 py-3">
            <div className="text-sm">{a.activity}</div>
            <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
              {a.createdAt && <span>{formatRel(a.createdAt)}</span>}
              {a.performedBy && <span>by {a.performedBy}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ label, cta, href }: { label: string; cta?: string; href?: string }) {
  return (
    <div className="py-10 text-center flex flex-col items-center gap-4">
      <p className="text-sm text-white/30 font-mono border border-dashed border-white/10 rounded-xl px-6 py-5 w-full">{label}</p>
      {cta && href && (
        <Link href={href}>
          <Button variant="outline" size="sm" className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10">{cta}</Button>
        </Link>
      )}
    </div>
  );
}

/* ─── Normalizers ────────────────────────────────────────────────────────── */
function normStats(d: any): Stats {
  if (!d || typeof d !== "object") return { totalXP: 0, dayStreak: 0, problemsSolvedCount: 0, currentSubscription: 0 };
  return {
    totalXP: Number(d.totalXP ?? d.totalXp ?? d.xp ?? 0),
    dayStreak: Number(d.dayStreak ?? d.streak ?? 0),
    problemsSolvedCount: Number(d.problemsSolvedCount ?? d.problemsSolved ?? 0),
    currentSubscription: Number(d.currentSubscription ?? 0),
  };
}
function normDashStats(d: any): DashboardStats {
  return {
    totalDistricts: Number(d.totalDistricts ?? 0),
    claimedCount: Number(d.claimedCount ?? 0),
    inProgressCount: Number(d.inProgressCount ?? 0),
    dayStreak: Number(d.dayStreak ?? d.streak ?? 0),
    problemsSolved: Number(d.problemsSolved ?? d.problemsSolvedCount ?? 0),
    subscription: String(d.subscription ?? "Initiate"),
    hasBadges: Boolean(d.hasBadges),
    hasDistricts: Boolean(d.hasDistricts),
    totalXP: Number(d.totalXP ?? d.xp ?? 0),
  };
}
function normDistricts(d: any): District[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.districts) ? d.districts : [];
  return arr.map((x: any) => {
    const earnedXP = Number(x.earnedXP ?? x.earned ?? x.xp ?? x.totalXP ?? 0);
    const totalPossibleXP = Number(x.totalPossibleXP ?? x.total ?? x.totalXp ?? x.maxXP ?? 0);
    /* Backend may not return completionPercentage — compute it from XP ratio */
    const computedPct = totalPossibleXP > 0
      ? Math.min(100, Math.max(0, (earnedXP / totalPossibleXP) * 100))
      : 0;
    const completionPercentage = x.completionPercentage != null
      ? Math.min(100, Math.max(0, Number(x.completionPercentage)))
      : x.percent != null
      ? Math.min(100, Math.max(0, Number(x.percent)))
      : x.completionPercent != null
      ? Math.min(100, Math.max(0, Number(x.completionPercent)))
      : computedPct;
    return {
      districtName: x.districtName || x.name || x.title || "District",
      earnedXP,
      totalPossibleXP,
      completionPercentage,
    };
  });
}
function normActivity(d: any): ActivityLog[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.logs) ? d.logs : [];
  return arr.map((x: any) => ({
    activity: x.activity || x.title || x.message || "Activity",
    createdAt: x.createdAt || x.at || x.timestamp,
    performedBy: x.performedBy || x.by,
  }));
}
function normBadgesFromRaw(d: any): { name?: string; description?: string; rarity?: number }[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.badges) ? d.badges : [];
  return arr.map((x: any) => ({
    name: x.name || x.badgeName || x.title,
    description: x.description,
    rarity: x.rarity !== undefined ? Number(x.rarity) : x.tier !== undefined ? Number(x.tier) : 0,
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
