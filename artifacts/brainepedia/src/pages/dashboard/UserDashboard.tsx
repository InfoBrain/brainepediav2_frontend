import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Map, Trophy, Activity, Clock, CreditCard, Sparkles, Flame, Target, Crown,
  User as UserIcon, LayoutDashboard, Compass, TrendingUp, CheckCircle2,
  Medal, Star, Zap, Share2, Link2, ExternalLink, Shield, MessageSquare,
  BriefcaseBusiness, Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { XPRing } from "@/components/dashboard/XPRing";
import { Leaderboard, type LeaderboardUser, type CurrentUserRank } from "@/components/dashboard/Leaderboard";
import { MissionActivityFeed } from "@/components/dashboard/MissionActivityFeed";
import { OngoingMissionsSection } from "@/components/dashboard/OngoingMissionsSection";
import { SocialFeedPanel } from "@/components/feed/SocialFeedPanel";
import { api } from "@/lib/api";
import { getUser, getUserId, getProfileId } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { normalizeUserMissionStatistics } from "@/lib/missionStatistics";
import { normalizeSubscriptionDetails, type NormalizedSubscriptionDetails } from "@/lib/subscription";
import { BrainiacCreditsCard } from "@/components/credits/BrainiacCreditsCard";
import { useOptionalBrainiacCredits } from "@/hooks/useBrainiacCredits";

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
type MissionStats = {
  totalAssignedMissions: number;
  completedMissions: number;
  pendingMissionsCount: number;
  inProgressMissions: number;
  totalXpEarned: number;
  missionSuccessRate: number;
  recentMissions: unknown[];
};
type District = {
  districtName: string;
  earnedXP: number;
  totalPossibleXP: number;
  completionPercentage: number;
};
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
type VXIdentity = {
  fullName: string;
  avatarUrl: string | null;
  activeProfession: string;
  totalAccumulatedXp: number;
  verifiedExperienceYears: number;
  professionalTitle: string;
  displayString: string;
};

/* ─── Constants ──────────────────────────────────────────────────────────── */
const SUB_NAMES: Record<number, string> = { 0: "Initiate", 1: "Architect", 2: "Architect" };

const SUB_STYLE: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Architect:   { bg: "bg-[#00D2FF]/12", text: "text-[#00D2FF]", border: "border-[#00D2FF]/40", glow: "shadow-[0_0_14px_rgba(0,210,255,0.4)]" },
  Grandmaster: { bg: "bg-[#FFD700]/15", text: "text-[#B7791F] dark:text-[#FFD700]", border: "border-[#FFD700]/40", glow: "shadow-[0_0_14px_rgba(255,215,0,0.35)]" },
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
  const credits = useOptionalBrainiacCredits();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [missionStats, setMissionStats] = useState<MissionStats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vxIdentity, setVxIdentity] = useState<VXIdentity | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<NormalizedSubscriptionDetails | null>(null);
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
      const [s, m, pDirect, b, ds, lb, vi, ms, subDetails] = await Promise.all([
        api.profiles.stats(userId),
        api.profiles.map(userId),
        api.profiles.get(pid),
        api.userBadges.forUser(userId),
        api.dashboard.stats(userId),
        api.dashboard.leaderboard(userId, 5),
        api.identity.professionalIdentity(userId),
        api.dashboard.userMissionStatistics(userId),
        api.subscriptions.details(userId),
      ]);
      if (cancelled) return;

      const stats = s.ok ? normStats(s.data) : null;
      if (stats) setStats(stats);
      if (m.ok) setDistricts(normDistricts(m.data));

      // Dashboard stats (richer endpoint)
      if (ds.ok && ds.data && typeof ds.data === "object") {
        setDashStats(normDashStats(ds.data));
      }
      if (ms.ok && ms.data && typeof ms.data === "object") {
        setMissionStats(normMissionStats(ms.data));
      }
      if (subDetails.ok) {
        setSubscriptionDetails(normalizeSubscriptionDetails(subDetails.data));
      }

      // VX professional identity
      if (vi.ok && vi.data && typeof vi.data === "object") {
        const v = vi.data as any;
        setVxIdentity({
          fullName: v.fullName || v.FullName || "",
          avatarUrl: v.avatarUrl || v.AvatarUrl || null,
          activeProfession: v.activeProfession || v.ActiveProfession || "",
          totalAccumulatedXp: Number(v.totalAccumulatedXp ?? v.TotalAccumulatedXp ?? 0),
          verifiedExperienceYears: Number(v.verifiedExperienceYears ?? v.VerifiedExperienceYears ?? 0),
          professionalTitle: v.professionalTitle || v.ProfessionalTitle || "",
          displayString: v.displayString || v.DisplayString || "",
        });
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
        nickName: mappedNick || "Member",
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
        userId: u.userId || u.UserId || u.id || u.Id || null,
        professionalTitle: u.professionalTitle || u.ProfessionalTitle || null,
        verifiedExperienceYears: Number(u.verifiedExperienceYears ?? u.VerifiedExperienceYears ?? 0),
      };
    });
    setTopUsers(users.slice(0, 5));

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
    if (!userId) return;
    setLeaderboardLoading(true);
    const lb = await api.dashboard.leaderboard(userId, 5);
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
    if (subName === "Architect") {
      navigate("/user/subscription");
      return;
    }
    setUpgradeLoading(true);
    const targetTierName = "Architect";
    /* Use numeric tier values to match the subscription page's working flow */
    const TIER_NUMS: Record<string, number> = { Initiate: 0, Architect: 1 };
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
      toast({ title: "Upgrade failed", description: res.error || "Payment initialization failed.", variant: "destructive" });
    }
  };

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/public-profile/${userId}`;
    if (navigator.share) {
      navigator.share({ title: "My Brainepedia Dossier", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      toast({ title: "Link copied!", description: "Your public dossier link has been copied to clipboard." });
    }
  };

  /* Derived values */
  const totalXP    = dashStats?.totalXP ?? stats?.totalXP ?? 0;
  const dayStreak  = dashStats?.dayStreak ?? stats?.dayStreak ?? 0;
  const solved     = missionStats?.completedMissions ?? dashStats?.problemsSolved ?? stats?.problemsSolvedCount ?? 0;
  const rawSubName = subscriptionDetails?.currentTier ?? dashStats?.subscription ?? SUB_NAMES[stats?.currentSubscription ?? 0] ?? "Initiate";
  const subName    = rawSubName;
  const subStyle   = SUB_STYLE[subName] ?? SUB_STYLE.Initiate;
  const subscriptionStatus = getSubscriptionStatus(subscriptionDetails);
  const hasBadges  = dashStats?.hasBadges ?? earnedBadges.length > 0;
  const hasDistricts = dashStats?.hasDistricts ?? districts.length > 0;
  const totalDist  = dashStats?.totalDistricts ?? districts.length;
  const claimedDist= dashStats?.claimedCount ?? districts.filter(d => d.completionPercentage >= 100).length;
  const inProgDist = dashStats?.inProgressCount ?? districts.filter(d => d.completionPercentage > 0 && d.completionPercentage < 100).length;
  const level      = Math.floor(totalXP / 1000) + 1;
  const rank       = currentUserRank?.rank ?? null;

  const profileName = `${profile?.firstName || ""} ${profile?.surName || profile?.lastName || ""}`.trim();
  const accountName = [user?.firstName, user?.lastName || user?.surName].filter(Boolean).join(" ").trim();
  const displayName = profileName || accountName || user?.email || "Member";
  const nickName    = profile?.nickName || displayName;
  const displayTitle= profile?.currentTitle || "Brainepedia Member";
  const avatarUrl   = profile?.avatarUrl || profile?.imageUrl || null;
  const initial     = displayName.charAt(0).toUpperCase();

  const firstName = (profile?.firstName || nickName || "there").split(" ")[0];
  const lagosHour = (new Date().getUTCHours() + 1) % 24;
  const greeting = lagosHour < 12 ? "Good morning" : lagosHour < 17 ? "Good afternoon" : "Good evening";
  const strengthChecks = [
    Boolean(profile?.firstName),
    Boolean(profile?.currentTitle),
    Boolean(avatarUrl),
    Boolean(vxIdentity?.activeProfession),
    earnedBadges.length > 0,
    solved > 0,
  ];
  const profileStrength = Math.round((strengthChecks.filter(Boolean).length / strengthChecks.length) * 100);
  const verified = (vxIdentity?.verifiedExperienceYears ?? 0) > 0 || earnedBadges.length > 0;
  const vxYears = vxIdentity?.verifiedExperienceYears ?? 0;
  const locationLine = [displayTitle, vxIdentity?.activeProfession].filter(Boolean).join(" · ");

  return (
    <DashboardShell nav={USER_NAV} title="Home" theme="user" showBrainiac showHeading={false}>
      {loading ? <BrainiacSpinner /> : (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7d4ccc]">Professional overview</p>
              <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight text-[#182137]">{greeting}, {firstName}.</h1>
              <p className="mt-1 max-w-xl text-sm text-[#70798d]">Your next opportunity starts with demonstrating what you can do.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs" className="inline-flex h-10 items-center rounded-[10px] border border-[#e6e8ef] bg-white px-4 text-sm font-bold text-[#182137] shadow-sm">
                Explore Jobs
              </Link>
              <Link href="/profession/select" className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(125,76,204,0.28)]">
                <Target className="h-4 w-4" /> Start a Mission
              </Link>
            </div>
          </div>

          <section className="flex flex-col gap-4 rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)] lg:flex-row lg:items-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[#7d4ccc] text-lg font-extrabold text-white">{initial}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#168a68]">{verified ? "Verified professional" : "Professional"}</p>
              <h2 className="text-lg font-extrabold text-[#182137]">{displayName}</h2>
              <p className="text-sm text-[#70798d]">{locationLine}</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-[#7d4ccc]">{profileStrength}%</span>
                <span className="text-[#70798d]">Profile strength</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#efe8f8]">
                <div className="h-full rounded-full bg-[#7d4ccc]" style={{ width: `${profileStrength}%` }} />
              </div>
              <Link href="/profile/edit" className="mt-2 inline-flex text-sm font-bold text-[#7d4ccc]">Complete profile →</Link>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewMetric icon={Zap} label="Experience points" value={totalXP.toLocaleString()} sub={dayStreak > 0 ? `${dayStreak}-day streak` : "From missions and assessments"} tint="bg-[#f5f0fc] text-[#7d4ccc]" />
            <OverviewMetric icon={Shield} label="Verified experience" value={vxYears > 0 ? vxYears.toLocaleString() : "—"} sub={vxIdentity?.professionalTitle || "Years of verified experience"} tint="bg-[#edf4ff] text-[#276ef1]" />
            <OverviewMetric icon={Trophy} label="Badges earned" value={earnedBadges.length} sub={newBadges.length > 0 ? `${newBadges.length} newly unlocked` : rank ? `Rank #${rank}` : "Milestones from your work"} tint="bg-[#fff6e8] text-[#d88c1b]" />
            <OverviewMetric icon={Target} label="Completed missions" value={solved} sub={`${missionStats?.inProgressMissions ?? 0} currently active`} tint="bg-[#eefaf4] text-[#168a68]" />
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <section className="rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
              <SocialFeedPanel variant="preview" />
            </section>
            <div className="space-y-4">
              <JobsForYou />
              <section className="rounded-2xl bg-gradient-to-br from-[#5b35c5] to-[#7d4ccc] p-5 text-white shadow-[0_12px_30px_rgba(125,76,204,0.28)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/80">Powered by Brainiac</p>
                <h2 className="mt-2 text-xl font-extrabold">Find jobs that fit you</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/85">Compare your verified skills with open opportunities.</p>
                <Link href="/jobs/compatibility" className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-white px-4 text-sm font-bold text-[#5b35c5]">
                  Analyse compatibility →
                </Link>
              </section>
              <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#182137]">Recommended missions</h2>
                  <Link href="/user/missions" className="text-sm font-bold text-[#7d4ccc]">View all</Link>
                </div>
                <p className="mt-2 text-sm text-[#70798d]">
                  {missionStats?.pendingMissionsCount ?? 0} pending · {missionStats?.inProgressMissions ?? 0} in progress · {missionStats?.totalAssignedMissions ?? 0} assigned
                </p>
                <Link href="/profession/select" className="mt-3 inline-flex text-sm font-bold text-[#7d4ccc]">Start a mission →</Link>
              </section>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {credits && (
              <BrainiacCreditsCard
                compact
                balance={credits.balance}
                loading={credits.loading}
                error={credits.error}
                usageHref="/user/credits"
                onRefresh={() => void credits.refresh()}
                onUpgrade={() => navigate("/user/subscription")}
                onRecharge={() => void credits.startRecharge("User")}
                actionLoading={credits.rechargeLoading}
              />
            )}
            <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
              <h2 className="text-base font-extrabold text-[#182137]">Verified identity</h2>
              {vxIdentity?.displayString ? (
                <p className="mt-2 text-sm font-semibold text-[#182137]">{vxIdentity.displayString}</p>
              ) : (
                <p className="mt-2 text-sm text-[#70798d]">Complete missions to build a verified experience record employers can review.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleCopyProfileLink} disabled={!userId}>
                  <Share2 className="mr-2 h-4 w-4" /> Share dossier
                </Button>
                <Link href={(profileId || userId) ? `/profile/${encodeURIComponent(profileId || userId || "")}` : "/user/portfolio"} className="inline-flex h-10 items-center rounded-[10px] px-3 text-sm font-bold text-[#7d4ccc]">
                  Public profile
                </Link>
              </div>
            </section>
          </div>

          <div className="grid items-start gap-4 2xl:grid-cols-2">
            <section className="rounded-2xl border border-[#e6e8ef] bg-[#0d1119] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-extrabold">Top problem solvers</h2>
                {rank && <p className="text-sm font-extrabold text-[#d88c1b]">Your rank #{rank}</p>}
              </div>
              <Leaderboard
                topUsers={topUsers.filter(u => u.totalXP > 0).slice(0, 5)}
                currentUser={currentUserRank}
                loading={leaderboardLoading}
                onUserClick={(uid) => navigate(`/public-profile/${uid}`)}
              />
            </section>
            <div className="space-y-4">
              {userId && <OngoingMissionsSection userId={userId} />}
              <MissionActivityFeed />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="flex flex-col items-center rounded-2xl border border-[#e6e8ef] bg-[#0d1119] p-5">
              <h2 className="mb-3 w-full text-base font-extrabold">XP progress</h2>
              <XPRing totalXP={totalXP} size={190} />
              <Link href="/user/xp-progress" className="mt-3 text-sm font-bold text-[#7d4ccc]">Open XP ledger</Link>
            </section>
            <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#182137]">District status</h2>
                <Link href="/profession/select" className="text-sm font-bold text-[#7d4ccc]">Learning map</Link>
              </div>
              {!hasDistricts ? (
                <EmptyState label="No territories claimed yet." cta="Explore professions" href="/profession/select" />
              ) : (
                <div className="mt-4 space-y-4">
                  {[
                    { label: "Claimed", value: claimedDist },
                    { label: "In progress", value: inProgDist },
                    { label: "Total districts", value: totalDist },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-[#626b7d]">{bar.label}</span>
                        <span className="font-extrabold text-[#182137]">{bar.value} / {totalDist}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#eef1f6]">
                        <div className="h-full rounded-full bg-[#7d4ccc]" style={{ width: totalDist > 0 ? `${(bar.value / totalDist) * 100}%` : "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)] lg:col-span-2">
              <h2 className="text-base font-extrabold text-[#182137]">Learning and discovery</h2>
              <p className="mt-2 text-sm text-[#70798d]">Browse districts, discover problem nodes, and grow verified experience across professions.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/profession/select" className="inline-flex h-10 items-center rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-bold text-white">Explore missions</Link>
                <Link href="/user/vx-progress" className="inline-flex h-10 items-center rounded-[10px] border border-[#e6e8ef] px-4 text-sm font-bold text-[#182137]">VX progress</Link>
                <Link href="/user/badges" className="inline-flex h-10 items-center rounded-[10px] border border-[#e6e8ef] px-4 text-sm font-bold text-[#182137]">
                  {hasBadges ? `${earnedBadges.length} badges` : "Achievements"}
                </Link>
              </div>
            </section>
            <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
              <h2 className="text-base font-extrabold text-[#182137]">{subName} {subscriptionStatus.status === "Expired" ? "expired" : "plan"}</h2>
              <SubscriptionStatusDetails plan={subName} status={subscriptionStatus.status} expiryDate={subscriptionStatus.expiryDate} />
              <Button className="mt-3 w-full" onClick={handleUpgrade} disabled={upgradeLoading}>
                {upgradeLoading ? "Preparing…" : subscriptionStatus.status === "Expired" ? "Make payment" : subName === "Architect" ? "Manage plan" : "Upgrade plan"}
              </Button>
              <Link href="/user/subscription" className="mt-3 block text-center text-sm font-bold text-[#7d4ccc]">View all plans</Link>
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tint: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tracking-tight text-[#182137]">{value}</p>
        <p className="mt-1 text-sm font-bold text-[#182137]">{label}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-[#70798d]">{sub}</p>}
      </div>
    </div>
  );
}

function JobsForYou() {
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: string; location: string }>>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.jobs.feed(1, 3).then((res) => {
      if (cancelled) return;
      const root = res.ok ? (res.data as any) : null;
      const rows = Array.isArray(root) ? root : root?.items ?? root?.data ?? root?.jobs ?? root?.results ?? [];
      const list = (Array.isArray(rows) ? rows : []).slice(0, 3).map((job: any) => ({
        id: String(job?.id ?? job?.jobId ?? job?.jobPostingId ?? job?.Id ?? ""),
        title: job?.title || job?.jobTitle || job?.Title || "Untitled role",
        company: job?.companyName || job?.company || job?.employerName || "Employer",
        location: job?.location || job?.Location || "Remote / flexible",
      })).filter((job: { id: string }) => job.id);
      setJobs(list);
      setLoadingJobs(false);
    });
    return () => { cancelled = true; };
  }, []);

  const tones = ["bg-[#f5f0fc] text-[#7d4ccc]", "bg-[#edf4ff] text-[#276ef1]", "bg-[#eefaf4] text-[#168a68]"];

  return (
    <section className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-[#182137]">Jobs for you</h2>
        <Link href="/jobs" className="text-sm font-bold text-[#7d4ccc]">View all</Link>
      </div>
      {loadingJobs ? (
        <p className="py-6 text-sm text-[#70798d]">Loading open roles…</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e6e8ef] px-3 py-6 text-center">
          <p className="text-sm font-semibold text-[#182137]">No roles loaded yet</p>
          <Link href="/jobs" className="mt-2 inline-flex text-sm font-bold text-[#7d4ccc]">Explore the job feed</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job, index) => (
            <Link key={job.id} href={`/jobs/${encodeURIComponent(job.id)}`} className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-[#f7f8fb]">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[index % tones.length]}`}>
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-[#182137]">{job.title}</span>
                <span className="block truncate text-xs text-[#70798d]">{job.company} · {job.location}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SubscriptionStatusDetails({ plan, expiryDate, status }: { plan: string; expiryDate: string; status: string }) {
  return (
    <div className="mb-5 grid gap-2 rounded-xl border border-white/8 bg-white/4 p-3 text-sm">
      <DetailRow label="Current Plan" value={plan} />
      <DetailRow label="Expiry Date" value={expiryDate} />
      <DetailRow label="Status" value={status} />
    </div>
  );
}

function GuidanceCards() {
  const cards = [
    { title: "Complete your Portfolio", href: "/user/portfolio", icon: UserIcon },
    { title: "Start a Mission", href: "/profession/select", icon: Target },
    { title: "Improve your Rank", href: "/user/xp-progress", icon: Trophy },
    { title: "Apply for Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { title: "Join Discussions", href: "/forum", icon: MessageSquare },
    { title: "Jobs That Fit Me", href: "/jobs/compatibility", icon: Sparkles },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-white/6 bg-[#0d1119] p-4 transition hover:border-amber-400/30 hover:bg-amber-400/5">
            <Icon className="mb-3 h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white">{card.title}</h3>
          </Link>
        );
      })}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function getSubscriptionStatus(details: NormalizedSubscriptionDetails | null): { status: string; expiryDate: string; badgeClass: string } {
  if (!details) {
    return { status: "Active", expiryDate: "-", badgeClass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" };
  }
  const expiryDate = details.expiryDate || "-";
  const expiry = details.expiryDateRaw ? new Date(details.expiryDateRaw) : null;
  const daysUntilExpiry = expiry && !Number.isNaN(expiry.getTime())
    ? Math.ceil((expiry.getTime() - Date.now()) / 86_400_000)
    : null;
  if (details.expired) {
    return { status: "Expired", expiryDate, badgeClass: "border-red-400/30 bg-red-400/10 text-red-300" };
  }
  if (daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
    return { status: "Expiring Soon", expiryDate, badgeClass: "border-amber-400/30 bg-amber-400/10 text-amber-300" };
  }
  return { status: "Active", expiryDate, badgeClass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" };
}

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
function normMissionStats(data: any): MissionStats {
  const stats = normalizeUserMissionStatistics(data);
  return {
    totalAssignedMissions: stats.totalAssignedMissions,
    completedMissions: stats.completedMissions,
    pendingMissionsCount: stats.pendingMissionsCount,
    inProgressMissions: stats.inProgressMissions,
    totalXpEarned: stats.totalXpEarned,
    missionSuccessRate: stats.missionSuccessRate,
    recentMissions: stats.recentMissions,
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
function normBadgesFromRaw(d: any): { name?: string; description?: string; rarity?: number }[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.badges) ? d.badges : [];
  return arr.map((x: any) => ({
    name: x.name || x.badgeName || x.title,
    description: x.description,
    rarity: x.rarity !== undefined ? Number(x.rarity) : x.tier !== undefined ? Number(x.tier) : 0,
  }));
}
