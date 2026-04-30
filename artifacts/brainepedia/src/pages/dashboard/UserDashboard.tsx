import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Map, Trophy, Activity, CreditCard, Sparkles, Flame, Target, Crown, User as UserIcon, LayoutDashboard, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { api } from "@/lib/api";
import { getUser, getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const nav: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profession/select", label: "Choose Path", icon: Compass },
  { href: "/user/map", label: "Imperial Map", icon: Map },
  { href: "/profile/edit", label: "My Profile", icon: UserIcon },
  { href: "/user/badges", label: "My Badges", icon: Trophy },
  { href: "/user/activity", label: "Activity Feed", icon: Activity },
  { href: "/user/subscription", label: "Subscription", icon: CreditCard },
];

type Stats = {
  totalXP: number;
  dayStreak: number;
  problemsSolvedCount: number;
  currentSubscription: number;
};
type District = {
  districtName: string;
  earnedXP: number;
  totalPossibleXP: number;
  completionPercentage: number;
};
type ActivityLog = { activity: string; createdAt?: string; performedBy?: string };

const SUB_NAMES: Record<number, string> = {
  0: "Initiate",
  1: "Architect",
  2: "Grandmaster",
};

type Profile = {
  firstName?: string;
  surName?: string;
  lastName?: string;
  email?: string;
  currentTitle?: string;
  avatarUrl?: string;
  imageUrl?: string;
  currentSubscription?: number;
};

type BadgeMilestone = {
  name: string;
  description: string;
  rarity: number;
  check: (s: Stats) => boolean;
};

type EarnedBadge = {
  name: string;
  description: string;
  rarityKey: string;
  isNew?: boolean;
};

const RARITY_COLOR: Record<string, { ring: string; glow: string; label: string; labelText: string }> = {
  legendary: {
    ring: "from-amber-400 to-yellow-600",
    glow: "shadow-[0_0_22px_rgba(255,215,0,0.7)]",
    label: "text-amber-400",
    labelText: "Legendary",
  },
  epic: {
    ring: "from-[#A78BFA] to-[#7C3AED]",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.6)]",
    label: "text-[#A78BFA]",
    labelText: "Epic",
  },
  rare: {
    ring: "from-cyan-400 to-blue-600",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]",
    label: "text-cyan-400",
    labelText: "Rare",
  },
  common: {
    ring: "from-slate-400 to-slate-600",
    glow: "",
    label: "text-slate-400",
    labelText: "Common",
  },
};

function numericRarityToKey(rarity: number): string {
  return ["common", "rare", "epic", "legendary"][Math.min(rarity, 3)] ?? "common";
}

// ---------------------------------------------------------------------------
// localStorage badge cache — keyed per user so multi-account devices are safe.
// All operations are wrapped in try/catch so an unavailable storage (e.g.
// private-browsing or quota exceeded) degrades gracefully to a no-op cache.
// ---------------------------------------------------------------------------
const BADGE_CACHE_PREFIX = "brainepedia:awarded_badges:";

function getCachedBadgeNames(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${BADGE_CACHE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set<string>(parsed as string[]);
  } catch {
    // localStorage unavailable or JSON malformed — treat as empty cache
  }
  return new Set();
}

function cacheBadgeName(userId: string, name: string): void {
  try {
    const key = `${BADGE_CACHE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let existing: string[] = [];
    try {
      const parsed = JSON.parse(raw ?? "[]");
      if (Array.isArray(parsed)) existing = parsed as string[];
    } catch {
      existing = [];
    }
    if (!existing.includes(name)) {
      localStorage.setItem(key, JSON.stringify([...existing, name]));
    }
  } catch {
    // localStorage unavailable — silently skip
  }
}

function seedBadgeCache(userId: string, names: string[]): void {
  try {
    const key = `${BADGE_CACHE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let existing: string[] = [];
    try {
      const parsed = JSON.parse(raw ?? "[]");
      if (Array.isArray(parsed)) existing = parsed as string[];
    } catch {
      existing = [];
    }
    const merged = Array.from(new Set([...existing, ...names]));
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    // localStorage unavailable — silently skip
  }
}

const BADGE_MILESTONES: BadgeMilestone[] = [
  {
    name: "First Blood",
    description: "Earned your first XP in the empire",
    rarity: 0,
    check: (s) => s.totalXP > 0,
  },
  {
    name: "Problem Solver",
    description: "Conquered your first problem node",
    rarity: 1,
    check: (s) => s.problemsSolvedCount >= 1,
  },
  {
    name: "Streak Keeper",
    description: "Maintained a 3-day activity streak",
    rarity: 1,
    check: (s) => s.dayStreak >= 3,
  },
  {
    name: "Centurion",
    description: "Crossed the 100 XP threshold",
    rarity: 1,
    check: (s) => s.totalXP >= 100,
  },
  {
    name: "Week Warrior",
    description: "Held the line for 7 consecutive days",
    rarity: 2,
    check: (s) => s.dayStreak >= 7,
  },
  {
    name: "XP Veteran",
    description: "Accumulated 500 total XP",
    rarity: 2,
    check: (s) => s.totalXP >= 500,
  },
  {
    name: "Architect Tier",
    description: "Ascended to the Architect subscription rank",
    rarity: 2,
    check: (s) => s.currentSubscription >= 1,
  },
  {
    name: "Imperial Champion",
    description: "Reached 1 000 XP — a true empire builder",
    rarity: 3,
    check: (s) => s.totalXP >= 1000,
  },
];


export default function UserDashboard() {
  const [, navigate] = useLocation();
  const userId = getUserId();
  const user = getUser();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const newBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  useEffect(() => {
    // Do not run data fetches without a valid user ID
    if (!userId) return;

    // Seed hero card immediately from auth user stored at login
    if (user) {
      setProfile(prev => prev ?? {
        firstName: user.firstName,
        surName: user.lastName || user.surName,
        currentTitle: undefined,
        avatarUrl: undefined,
        imageUrl: undefined,
        currentSubscription: undefined,
      });
    }

    const userEmail = user?.email || "";
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [s, m, a, pDirect, b] = await Promise.all([
        api.profiles.stats(userId),
        api.profiles.map(userId),
        api.activityLogs.forUser(userId),
        api.profiles.get(userId),
        api.userBadges.forUser(userId),
      ]);
      if (cancelled) return;

      const stats = s.ok ? normStats(s.data) : null;
      if (stats) setStats(stats);
      if (m.ok) setDistricts(normDistricts(m.data));
      if (a.ok) setActivity(normActivity(a.data));

      // Resolve profile: direct lookup or fallback — match by email since userId is null in API
      if (pDirect.ok && pDirect.data && typeof pDirect.data === "object") {
        setProfile(pDirect.data as Profile);
      } else {
        const all = await api.profiles.search({});
        if (!cancelled && all.ok && Array.isArray(all.data)) {
          const found = all.data.find((x: any) =>
            (userEmail && x.email?.toLowerCase() === userEmail.toLowerCase()) ||
            x.userId === userId
          );
          if (found) setProfile(found as Profile);
        }
      }

      if (stats && userId) {
        const rawBadges = normBadgesFromRaw(b.ok ? b.data : null);
        const serverNames = rawBadges.map((x) => x.name).filter(Boolean) as string[];

        // Seed localStorage cache with whatever the server returned (union, never shrinks)
        if (serverNames.length > 0) seedBadgeCache(userId, serverNames);

        // Combined guard: server list OR localStorage cache — whichever has the name wins
        const cachedNames = getCachedBadgeNames(userId);
        const existingNames = new Set<string>([...serverNames, ...cachedNames]);

        // Build the existing badge list for the showcase panel
        const existingBadgeList: EarnedBadge[] = rawBadges
          .filter((x) => x.name)
          .map((x) => ({
            name: x.name!,
            description: x.description || "",
            rarityKey: numericRarityToKey(x.rarity ?? 0),
            isNew: false,
          }));

        const toAward = BADGE_MILESTONES.filter(
          (milestone) => milestone.check(stats) && !existingNames.has(milestone.name)
        );
        if (toAward.length > 0) {
          // Award each badge and only surface it in the UI when the API call succeeds
          const awardResults = await Promise.all(
            toAward.map(async (milestone) => {
              const [awardRes] = await Promise.all([
                api.userBadges.award({
                  userId,
                  name: milestone.name,
                  description: milestone.description,
                  rarity: milestone.rarity,
                }),
                api.activityLogs.create({
                  userId,
                  activity: `Unlocked badge: ${milestone.name} — ${milestone.description}`,
                }),
              ]);
              // Persist to localStorage on success OR on 409 (conflict = the
              // server already has this badge, e.g. from a prior attempt where
              // the server succeeded but the client received an error response).
              // This closes the gap where a transient network failure on an
              // award that actually persisted would leave the cache un-updated.
              const alreadyExists = awardRes.status === 409;
              if (awardRes.ok || alreadyExists) cacheBadgeName(userId, milestone.name);
              return { milestone, success: awardRes.ok };
            })
          );

          if (!cancelled) {
            const refreshed = await api.activityLogs.forUser(userId);
            if (!cancelled && refreshed.ok) setActivity(normActivity(refreshed.data));

            // Only celebrate badges that were successfully persisted
            const confirmedMilestones = awardResults
              .filter((r) => r.success)
              .map((r) => r.milestone);

            if (confirmedMilestones.length > 0) {
              const freshBadges: EarnedBadge[] = confirmedMilestones.map((m) => ({
                name: m.name,
                description: m.description,
                rarityKey: numericRarityToKey(m.rarity),
                isNew: true,
              }));

              // Notify for each successfully awarded badge via toast
              freshBadges.forEach((badge) => {
                const r = RARITY_COLOR[badge.rarityKey] ?? RARITY_COLOR.common;
                toast({
                  title: `🏆 Badge Unlocked: ${badge.name}`,
                  description: `${badge.description} · ${r.labelText}`,
                });
              });

              // Merge new badges into showcase (new ones first), clear isNew after delay
              setNewBadges(freshBadges);
              setEarnedBadges([...freshBadges, ...existingBadgeList]);

              if (newBadgeTimerRef.current) clearTimeout(newBadgeTimerRef.current);
              newBadgeTimerRef.current = setTimeout(() => {
                setNewBadges([]);
                setEarnedBadges((prev) =>
                  prev.map((badge) => ({ ...badge, isNew: false }))
                );
              }, 6000);
            } else {
              setEarnedBadges(existingBadgeList);
            }
          }
        } else if (!cancelled) {
          setEarnedBadges(existingBadgeList);
        }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
      if (newBadgeTimerRef.current) clearTimeout(newBadgeTimerRef.current);
    };
  }, [userId]);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    const callbackUrl = `${window.location.origin}${import.meta.env.BASE_URL}user/subscription/success`;
    const res = await api.subscriptions.initialize({ tier: "Architect", callbackUrl, redirectUrl: callbackUrl });
    setUpgradeLoading(false);
    const data = res.data as { checkoutUrl?: string; authorization_url?: string } | null;
    const url = data?.checkoutUrl || data?.authorization_url;
    if (res.ok) {
      if (userId) {
        api.activityLogs.create({
          userId,
          activity: "Initiated subscription upgrade to Architect tier",
        });
      }
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: "Subscription initialised",
          description: "Check your dashboard for updated status.",
        });
      }
    } else {
      toast({
        title: "Upgrade failed",
        description: res.error || "Couldn't start the upgrade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalXP = stats?.totalXP ?? 0;
  const dayStreak = stats?.dayStreak ?? 0;
  const solved = stats?.problemsSolvedCount ?? 0;
  const sub = SUB_NAMES[stats?.currentSubscription ?? 0] || "Initiate";
  const displayName = profile
    ? `${profile.firstName || ""} ${profile.surName || profile.lastName || ""}`.trim() ||
      user?.firstName || user?.email || "Operative"
    : user?.firstName
    ? `${user.firstName} ${user?.lastName || ""}`.trim()
    : user?.email || "Operative";
  const displayTitle = profile?.currentTitle || "Brainepedia Operative";
  const avatarUrl = profile?.avatarUrl || profile?.imageUrl || null;
  const initial = displayName.charAt(0).toUpperCase();

  const headerRight = (
    <div className="hidden md:flex items-center gap-4">
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">XP</div>
        <div className="text-base font-bold text-amber-400">{totalXP.toLocaleString()}</div>
      </div>
      <div className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/40">
        {sub}
      </div>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-9 w-9 rounded-full object-cover border-2 border-amber-400/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]"
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center font-bold text-white border-2 border-amber-400/60 shadow-[0_0_12px_rgba(255,215,0,0.4)]">
          {initial}
        </div>
      )}
    </div>
  );

  return (
    <DashboardShell
      nav={nav}
      title="Command Center"
      subtitle="// imperial.dashboard.user"
      headerRight={headerRight}
      theme="user"
      showBrainiac
    >
      {loading ? (
        <BrainiacSpinner />
      ) : (
        <div className="space-y-6">
          {/* Hero User Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-5 bg-gradient-to-r from-[#0d1119] to-[#0d1119]/60 border border-white/5 rounded-xl p-5"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_18px_rgba(255,215,0,0.3)] flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center text-2xl font-bold text-white border-2 border-amber-400/60 shadow-[0_0_18px_rgba(255,215,0,0.3)] flex-shrink-0">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-white truncate">{displayName}</p>
              <p className="text-sm text-gray-400 truncate">{displayTitle}</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${
                sub === "Grandmaster"
                  ? "bg-amber-400/20 text-amber-400 border-amber-400/40"
                  : sub === "Architect"
                  ? "bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/40"
                  : "bg-gray-800 text-gray-400 border-gray-700"
              }`}>
                {sub}
              </span>
              <Link
                href="/profile/edit"
                className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition-colors"
              >
                Edit Profile →
              </Link>
            </div>
          </motion.div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Total XP" value={totalXP.toLocaleString()} accent="text-amber-400" icon={Sparkles} />
            <StatTile label="Day Streak" value={String(dayStreak)} accent="text-orange-400" icon={Flame} />
            <StatTile label="Problems Solved" value={solved.toLocaleString()} accent="text-[#A78BFA]" icon={Target} />
            <StatTile label="Subscription" value={sub} accent="text-[#FFD700]" icon={Crown} />
          </div>

          {/* Badge Showcase Panel */}
          {earnedBadges.length > 0 && (
            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-amber-400">Badge Showcase</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    {newBadges.length > 0
                      ? `${newBadges.length} new badge${newBadges.length > 1 ? "s" : ""} unlocked!`
                      : "Your latest honours"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {newBadges.length > 0 && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-400/20 text-amber-400 border border-amber-400/40"
                    >
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
                      <motion.div
                        key={badge.name}
                        initial={badge.isNew ? { opacity: 0, scale: 0.7, y: 12 } : false}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: badge.isNew ? i * 0.12 : 0 }}
                        className="relative"
                      >
                        <div className={`rounded-xl p-[2px] bg-gradient-to-br ${r.ring} ${r.glow}`}>
                          <div className="bg-[#0A0E14] rounded-[10px] p-3 flex flex-col items-center justify-center text-center gap-1.5 min-h-[90px]">
                            <Trophy className={`h-6 w-6 ${r.label}`} />
                            <div className="text-xs font-bold leading-tight line-clamp-2 text-white">
                              {badge.name}
                            </div>
                            <div className={`text-[9px] font-mono uppercase tracking-wider ${r.label}`}>
                              {r.labelText}
                            </div>
                          </div>
                        </div>
                        {badge.isNew && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-400 border border-black flex items-center justify-center"
                          >
                            <span className="text-[8px] font-bold text-black leading-none">✦</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="mt-4 text-right">
                <Link
                  href="/user/badges"
                  className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition-colors"
                >
                  View all badges →
                </Link>
              </div>
            </div>
          )}

          {/* Imperial Map (hex grid) + Subscription card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-amber-400">Imperial Map</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    Districts under your conquest
                  </p>
                </div>
                <Map className="h-5 w-5 text-amber-400" />
              </div>
              {districts.length === 0 ? (
                <Empty text="No districts mapped yet. Start a mission to claim territory." />
              ) : (
                <HexGrid districts={districts} />
              )}
            </div>

            {/* Subscription upgrade */}
            <div className="bg-gradient-to-br from-[#7C3AED]/15 to-[#0d1119] border border-[#7C3AED]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Crown className="h-6 w-6 text-amber-400 mb-3" />
              <h3 className="text-lg font-bold mb-1">Ascend to Architect</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Unlock advanced missions, premium badges, and priority Brainiac access.
              </p>
              <Button
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                onClick={handleUpgrade}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? "Preparing…" : "Upgrade — $19/mo"}
              </Button>
              <Link
                href={userId ? `/profile/${encodeURIComponent(userId)}` : "/"}
                className="block mt-3 text-center text-xs font-mono text-muted-foreground hover:text-amber-400 transition-colors"
              >
                View your public profile →
              </Link>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-amber-400">Recent Activity</h2>
                <p className="text-xs text-muted-foreground font-mono">Imperial timeline</p>
              </div>
              <Activity className="h-5 w-5 text-[#A78BFA]" />
            </div>
            {activity.length === 0 ? (
              <Empty text="No activity logged yet." />
            ) : (
              <Timeline items={activity.slice(0, 12)} />
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0d1119] border border-white/5 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </motion.div>
  );
}

function HexGrid({ districts }: { districts: District[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-3">
      {districts.slice(0, 12).map((d, i) => {
        const pct = Math.max(0, Math.min(100, d.completionPercentage));
        const tier = pct >= 75 ? "high" : pct >= 35 ? "mid" : "low";
        const ringColor =
          tier === "high"
            ? "from-amber-400 to-amber-600"
            : tier === "mid"
            ? "from-[#A78BFA] to-[#7C3AED]"
            : "from-slate-500 to-slate-700";
        const glow =
          tier === "high"
            ? "shadow-[0_0_18px_rgba(255,215,0,0.55)]"
            : tier === "mid"
            ? "shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            : "shadow-none";
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.04 }}
            className="relative group"
          >
            <div
              className={`hex-cell bg-gradient-to-br ${ringColor} p-[2px] ${glow} cursor-pointer`}
              style={{
                clipPath:
                  "polygon(25% 5%, 75% 5%, 98% 50%, 75% 95%, 25% 95%, 2% 50%)",
              }}
            >
              <div
                className="bg-[#0A0E14] h-full w-full p-3 flex flex-col items-center justify-center text-center"
                style={{
                  clipPath:
                    "polygon(25% 5%, 75% 5%, 98% 50%, 75% 95%, 25% 95%, 2% 50%)",
                }}
              >
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground truncate max-w-full px-1">
                  {d.districtName}
                </div>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  {Math.round(pct)}%
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {d.earnedXP.toLocaleString()} / {d.totalPossibleXP.toLocaleString()}
                </div>
              </div>
            </div>
            <style>{`.hex-cell{aspect-ratio:1/1.05}`}</style>
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

function Empty({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
      {text}
    </div>
  );
}

function normStats(d: any): Stats {
  if (!d || typeof d !== "object") {
    return { totalXP: 0, dayStreak: 0, problemsSolvedCount: 0, currentSubscription: 0 };
  }
  return {
    totalXP: Number(d.totalXP ?? d.totalXp ?? d.xp ?? 0),
    dayStreak: Number(d.dayStreak ?? d.streak ?? 0),
    problemsSolvedCount: Number(d.problemsSolvedCount ?? d.problemsSolved ?? 0),
    currentSubscription: Number(d.currentSubscription ?? 0),
  };
}
function normDistricts(d: any): District[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.districts) ? d.districts : [];
  return arr.map((x: any) => ({
    districtName: x.districtName || x.name || "District",
    earnedXP: Number(x.earnedXP ?? x.earned ?? 0),
    totalPossibleXP: Number(x.totalPossibleXP ?? x.total ?? 0),
    completionPercentage: Number(x.completionPercentage ?? x.percent ?? 0),
  }));
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
