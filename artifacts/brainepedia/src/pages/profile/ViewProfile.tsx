import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Crown,
  Flame,
  Github,
  Globe,
  Linkedin,
  Pin,
  PinOff,
  Sparkles,
  Target,
  Twitter,
  Facebook,
  GitCompare,
  X,
} from "lucide-react";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { api } from "@/lib/api";
import { getDashboardPath, getProfileId, getUserId, isAuthenticated } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { CopyrightBar } from "@/components/ui/CopyrightBar";

type Profile = {
  userId?: string;
  firstName?: string;
  surName?: string;
  middleName?: string;
  aboutMe?: string;
  currentTitle?: string;
  profession?: string;
  imageUrl?: string;
  facebook?: string;
  linkedIn?: string;
  github?: string;
  twitter?: string;
  totalXP?: number;
  currentSubscription?: number;
  problemsSolvedCount?: number;
  dayStreak?: number;
  experience?: number;
};
type Badge = {
  id?: string;
  name?: string;
  description?: string;
  rarity?: string;
  iconUrl?: string;
  earnedAt?: string;
};
type District = {
  districtName: string;
  earnedXP: number;
  totalPossibleXP: number;
  completionPercentage: number;
};

const SUBS: Record<number, string> = { 0: "Initiate", 1: "Architect", 2: "Grandmaster" };

const RARITY_COLOR: Record<string, { ring: string; glow: string; label: string }> = {
  legendary: {
    ring: "from-amber-400 to-yellow-600",
    glow: "shadow-[0_0_22px_rgba(255,215,0,0.7)]",
    label: "text-amber-400",
  },
  epic: {
    ring: "from-[#A78BFA] to-[#7C3AED]",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.6)]",
    label: "text-[#A78BFA]",
  },
  rare: {
    ring: "from-cyan-400 to-blue-600",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]",
    label: "text-cyan-400",
  },
  common: {
    ring: "from-slate-400 to-slate-600",
    glow: "",
    label: "text-slate-400",
  },
};

function rarityKey(r?: string): keyof typeof RARITY_COLOR {
  const s = (r || "common").toLowerCase();
  if (s in RARITY_COLOR) return s as keyof typeof RARITY_COLOR;
  return "common";
}

const PIN_STORAGE_PREFIX = "brainepedia.pinned.badges.";
const MAX_PINS = 3;

function loadPinned(profileId: string): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_PREFIX + profileId);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function savePinned(profileId: string, pins: Set<string>) {
  try {
    localStorage.setItem(PIN_STORAGE_PREFIX + profileId, JSON.stringify([...pins]));
  } catch {
    // ignore
  }
}

export default function ViewProfile() {
  const params = useParams<{ userId: string }>();
  const profileIdParam = params.userId ?? "";
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileTitle = profile
    ? `${[profile.firstName, profile.surName].filter(Boolean).join(" ") || "Operative"}'s Profile`
    : "Public Profile";
  usePageTitle(profileTitle);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  const myUserId = getUserId() ?? "";
  const myProfileId = getProfileId() ?? "";
  const isOwn =
    Boolean(profileIdParam) &&
    (profileIdParam === myUserId || profileIdParam === myProfileId);
  const canCompare = !isOwn && isAuthenticated();

  useEffect(() => {
    if (!profileIdParam) return;
    setPinnedIds(loadPinned(profileIdParam));
  }, [profileIdParam]);

  useEffect(() => {
    if (!profileIdParam) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");

      let profileData: any = null;

      const p = await api.profiles.get(profileIdParam);
      if (!cancelled) {
        if (p.ok && p.data && typeof p.data === "object") {
          profileData = p.data;
          setProfile(normProfile(profileData));
        } else {
          const all = await api.profiles.search({});
          if (!cancelled) {
            if (all.ok && Array.isArray(all.data)) {
              const found = all.data.find(
                (x: any) => x.userId === profileIdParam || x.profileId === profileIdParam
              );
              if (found) {
                profileData = found;
                setProfile(normProfile(found));
              } else {
                setError("Profile not found.");
                setLoading(false);
                return;
              }
            } else {
              setError(p.error || "Profile not found.");
              setLoading(false);
              return;
            }
          }
        }
      }

      if (cancelled || !profileData) return;

      // Profile endpoint sometimes returns userId: null — resolve the real
      // userId via auth when viewing own profile, otherwise scan known fields.
      const actualUserId: string =
        profileData.userId ||
        profileData.UserId ||
        profileData.ownerId ||
        profileData.OwnerId ||
        profileData.accountId ||
        profileData.id ||
        (isOwn ? myUserId : null) ||
        profileIdParam;

      const [b, m] = await Promise.all([
        api.userBadges.forUser(actualUserId, { suppressUnauthorized: true }),
        api.userProgresses.map(actualUserId, { suppressUnauthorized: true }),
      ]);

      if (!cancelled) {
        if (b.ok) setBadges(normBadges(b.data));
        if (m.ok) setDistricts(normDistricts(m.data));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileIdParam]);

  function togglePin(badgeId: string) {
    if (!badgeId) return;
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(badgeId)) {
        next.delete(badgeId);
      } else {
        if (next.size >= MAX_PINS) return prev;
        next.add(badgeId);
      }
      savePinned(profileIdParam, next);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E14] text-foreground flex items-center justify-center">
        <BrainiacSpinner text="Brainiac fetching dossier…" />
      </div>
    );
  }
  if (error || !profile) {
    const backPath = isAuthenticated() ? getDashboardPath() : "/";
    return (
      <div className="min-h-screen bg-[#0A0E14] text-foreground flex flex-col items-center justify-center gap-4">
        <div className="text-amber-400 font-mono uppercase tracking-wider text-sm">
          {error || "Profile unavailable."}
        </div>
        <Link href={backPath}>
          <Button variant="outline">Return to base</Button>
        </Link>
      </div>
    );
  }

  const fullName = [profile.firstName, profile.middleName, profile.surName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Anonymous Operative";
  const sub = SUBS[profile.currentSubscription ?? 0] || "Initiate";
  const initial = (profile.firstName || "U").charAt(0).toUpperCase();
  const radarData = districts.slice(0, 8).map((d) => ({
    district: d.districtName.length > 12 ? d.districtName.slice(0, 12) + "…" : d.districtName,
    pct: Math.round(d.completionPercentage),
  }));

  const pinnedBadges = badges.filter((b) => b.id && pinnedIds.has(b.id));
  const unpinnedBadges = badges.filter((b) => !b.id || !pinnedIds.has(b.id));

  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href={isAuthenticated() ? getDashboardPath() : "/"} className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider hover:text-amber-300">
            <ArrowLeft className="h-4 w-4" /> {isAuthenticated() ? "Dashboard" : "Brainepedia"}
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            // public.dossier
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-[#1a1530] via-[#0d1119] to-[#0d1119] border border-[#7C3AED]/20 rounded-2xl p-6 md:p-8 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(168,85,247,0.4) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,215,0,0.25) 0, transparent 40%)",
          }} />
          <div className="relative flex flex-col md:flex-row gap-6 items-start">
            {profile.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt={fullName}
                className="h-28 w-28 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_25px_rgba(255,215,0,0.5)]"
              />
            ) : (
              <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center text-4xl font-bold text-white border-2 border-amber-400/60 shadow-[0_0_25px_rgba(255,215,0,0.5)]">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/40 inline-flex items-center gap-1">
                  <Crown className="h-3 w-3" /> {sub}
                </span>
              </div>
              {(profile.currentTitle || profile.profession) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Briefcase className="h-4 w-4" />
                  <span>{[profile.currentTitle, profile.profession].filter(Boolean).join(" · ")}</span>
                </div>
              )}
              {profile.aboutMe && (
                <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed">{profile.aboutMe}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <SocialLink href={profile.github} icon={Github} label="GitHub" />
                <SocialLink href={profile.linkedIn} icon={Linkedin} label="LinkedIn" />
                <SocialLink href={profile.twitter} icon={Twitter} label="Twitter" />
                <SocialLink href={profile.facebook} icon={Facebook} label="Facebook" />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBadge
              icon={<Sparkles className="h-4 w-4 text-amber-400" />}
              label="Total XP"
              value={(profile.totalXP ?? 0).toLocaleString()}
              valueClass="text-amber-400"
            />
            <StatBadge
              icon={<Target className="h-4 w-4 text-cyan-400" />}
              label="Missions Solved"
              value={(profile.problemsSolvedCount ?? 0).toLocaleString()}
              valueClass="text-cyan-400"
            />
            <StatBadge
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              label="Day Streak"
              value={`${profile.dayStreak ?? 0}d`}
              valueClass="text-orange-400"
              streakActive={(profile.dayStreak ?? 0) > 0}
            />
            <StatBadge
              icon={<Briefcase className="h-4 w-4 text-[#A78BFA]" />}
              label="Experience"
              value={`${profile.experience ?? 0} yr${(profile.experience ?? 0) === 1 ? "" : "s"}`}
              valueClass="text-[#A78BFA]"
            />
          </div>

          {canCompare && (
            <div className="relative mt-4 flex justify-end">
              <Button
                onClick={() => setCompareOpen(true)}
                className="inline-flex items-center gap-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/35 border border-[#7C3AED]/50 hover:border-[#7C3AED]/80 text-[#A78BFA] hover:text-white font-mono text-xs uppercase tracking-wider transition-all"
                variant="ghost"
              >
                <GitCompare className="h-4 w-4" />
                Compare with me
              </Button>
            </div>
          )}
        </motion.section>

        {canCompare && compareOpen && (
          <CompareModal
            theirProfile={profile}
            theirName={fullName}
            onClose={() => setCompareOpen(false)}
          />
        )}

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trophy case */}
          <section className="lg:col-span-2 bg-[#0d1119] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-amber-400 inline-flex items-center gap-2">
                  <Award className="h-5 w-5" /> Trophy Case
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {badges.length} badge{badges.length === 1 ? "" : "s"} earned
                  {isOwn && badges.length > 0 && (
                    <span className="ml-2 text-white/30">· pin up to {MAX_PINS} to highlight</span>
                  )}
                </p>
              </div>
            </div>

            {badges.length === 0 ? (
              <Empty text="No badges earned yet." />
            ) : (
              <div className="space-y-6">
                {/* Pinned section */}
                {pinnedBadges.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Pin className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Pinned</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 [perspective:1000px]">
                      {pinnedBadges.map((b, i) => (
                        <BadgeCard
                          key={b.id || i}
                          badge={b}
                          index={i}
                          isPinned
                          isOwn={isOwn}
                          onTogglePin={togglePin}
                          pinnedCount={pinnedIds.size}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rest of badges */}
                {unpinnedBadges.length > 0 && (
                  <div>
                    {pinnedBadges.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">All Badges</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 [perspective:1000px]">
                      {unpinnedBadges.slice(0, 16).map((b, i) => (
                        <BadgeCard
                          key={b.id || i}
                          badge={b}
                          index={i}
                          isPinned={false}
                          isOwn={isOwn}
                          onTogglePin={togglePin}
                          pinnedCount={pinnedIds.size}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Radar chart */}
          <section className="bg-[#0d1119] border border-white/5 rounded-2xl p-6">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#A78BFA] inline-flex items-center gap-2">
                <Globe className="h-5 w-5" /> District Mastery
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Completion radar
              </p>
            </div>
            {radarData.length === 0 ? (
              <Empty text="No district data yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="district"
                      tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "#6B7280", fontSize: 9 }}
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <Radar
                      name="Completion"
                      dataKey="pct"
                      stroke="#FFD700"
                      fill="#7C3AED"
                      fillOpacity={0.45}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </main>
      <CopyrightBar className="border-t border-white/5" />
    </div>
  );
}

function BadgeCard({
  badge: b,
  index: i,
  isPinned,
  isOwn,
  onTogglePin,
  pinnedCount,
}: {
  badge: Badge;
  index: number;
  isPinned: boolean;
  isOwn: boolean;
  onTogglePin: (id: string) => void;
  pinnedCount: number;
}) {
  const k = rarityKey(b.rarity);
  const r = RARITY_COLOR[k];
  const canPin = isPinned || pinnedCount < MAX_PINS;

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -20 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay: i * 0.04 }}
      whileHover={{ rotateY: 12, rotateX: -6, scale: 1.05 }}
      className="group [transform-style:preserve-3d] relative"
    >
      <div className={`relative rounded-xl p-[2px] bg-gradient-to-br ${r.ring} ${r.glow} ${isPinned ? "ring-2 ring-amber-400/40" : ""}`}>
        <div className="bg-[#0A0E14] rounded-[10px] p-4 flex flex-col items-center text-center min-h-[140px]">
          {b.iconUrl ? (
            <img src={b.iconUrl} alt={b.name} className="h-12 w-12 mb-2 object-contain" />
          ) : (
            <div className={`h-12 w-12 mb-2 rounded-full bg-gradient-to-br ${r.ring} flex items-center justify-center`}>
              <Award className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="text-sm font-bold leading-tight line-clamp-2">{b.name || "Badge"}</div>
          <div className={`text-[9px] uppercase tracking-widest font-mono mt-1 ${r.label}`}>
            {k}
          </div>
          {isPinned && (
            <div className="mt-1 inline-flex items-center gap-0.5 text-[8px] font-mono text-amber-400/70 uppercase tracking-widest">
              <Pin className="h-2.5 w-2.5" /> pinned
            </div>
          )}
        </div>
      </div>

      {isOwn && (
        <button
          onClick={() => b.id && onTogglePin(b.id)}
          disabled={!canPin && !isPinned}
          title={isPinned ? "Unpin badge" : canPin ? "Pin badge" : `Max ${MAX_PINS} pinned`}
          className={`
            absolute top-1.5 right-1.5 p-1 rounded-md transition-all
            opacity-0 group-hover:opacity-100
            ${isPinned
              ? "bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
              : canPin
                ? "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }
          `}
        >
          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
      )}
    </motion.div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) return null;
  const url = /^https?:\/\//.test(href) ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/40 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function StatBadge({
  icon,
  label,
  value,
  valueClass,
  streakActive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  streakActive?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
        streakActive
          ? "bg-orange-500/10 border border-orange-500/30 shadow-[0_0_18px_rgba(249,115,22,0.25)]"
          : "bg-white/5 border border-white/8"
      }`}
    >
      <div className="shrink-0">
        {streakActive ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1, 1.15, 1], opacity: 1 }}
            transition={{
              scale: {
                duration: 1.2,
                ease: "easeInOut",
              },
              opacity: { duration: 0.3 },
            }}
            style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.8))" }}
          >
            {icon}
          </motion.div>
        ) : (
          icon
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-none mb-1">
          {label}
        </div>
        <div className={`text-lg font-bold leading-none ${valueClass ?? ""}`}>{value}</div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
      {text}
    </div>
  );
}

function normProfile(d: any): Profile {
  if (!d || typeof d !== "object") return {};
  return {
    userId: d.userId || d.UserId || d.id,
    firstName: d.firstName || d.FirstName,
    surName: d.surName || d.SurName || d.surname || d.lastName || d.LastName,
    middleName: d.middleName || d.MiddleName,
    aboutMe: d.aboutMe || d.AboutMe || d.bio,
    currentTitle: d.currentTitle || d.CurrentTitle || d.title,
    profession: d.profession || d.Profession,
    imageUrl: d.imageUrl || d.ImageUrl || d.avatarUrl || d.profileImage,
    facebook: d.facebook || d.Facebook,
    linkedIn: d.linkedIn || d.LinkedIn || d.linkedin,
    github: d.github || d.Github || d.GitHub,
    twitter: d.twitter || d.Twitter,
    totalXP: Number(d.totalXP ?? d.TotalXP ?? d.totalXp ?? 0),
    currentSubscription: Number(d.currentSubscription ?? d.CurrentSubscription ?? 0),
    problemsSolvedCount: Number(d.problemsSolvedCount ?? d.ProblemsSolvedCount ?? d.missionsSolved ?? d.MissionsSolved ?? 0),
    dayStreak: Number(d.dayStreak ?? d.DayStreak ?? d.streak ?? d.Streak ?? 0),
    experience: Number(d.experience ?? d.Experience ?? d.yearsExperience ?? d.YearsExperience ?? 0),
  };
}

function normalizeRarity(raw: number | string | undefined): string {
  if (raw === undefined || raw === null) return "common";
  if (typeof raw === "number") {
    return ["common", "rare", "epic", "legendary"][Math.min(raw, 3)] ?? "common";
  }
  const s = String(raw).toLowerCase();
  if (s.includes("legend")) return "legendary";
  if (s.includes("epic")) return "epic";
  if (s.includes("rare")) return "rare";
  return "common";
}

function normBadges(d: any): Badge[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.badges) ? d.badges : [];
  return arr.map((x: any) => ({
    id: x.id || x.badgeId || x.userBadgeId || x.Id || x.BadgeId,
    name: x.name || x.badgeName || x.title || x.Name,
    description: x.description || x.Description,
    rarity: normalizeRarity(x.rarity ?? x.Rarity ?? x.tier),
    iconUrl: x.iconUrl || x.imageUrl || x.IconUrl,
    earnedAt: x.earnedAt || x.unlockedAt || x.createdAt,
  }));
}

function normDistricts(d: any): District[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.districts) ? d.districts : [];
  return arr.map((x: any) => ({
    districtName: x.districtName || x.name || "District",
    earnedXP: Number(x.earnedXP ?? 0),
    totalPossibleXP: Number(x.totalPossibleXP ?? 0),
    completionPercentage: Number(x.completionPercentage ?? 0),
  }));
}

type CompareStatRow = {
  icon: React.ReactNode;
  label: string;
  mine: number;
  theirs: number;
  format: (n: number) => string;
  higherIsBetter?: boolean;
  mineClass: string;
  theirsClass: string;
};

function CompareBar({
  mine,
  theirs,
  mineClass,
  theirsClass,
}: {
  mine: number;
  theirs: number;
  mineClass: string;
  theirsClass: string;
}) {
  const total = mine + theirs;
  const minePct = total === 0 ? 50 : Math.round((mine / total) * 100);
  const theirsPct = 100 - minePct;
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full bg-white/5 mt-1">
      <div
        className={`${mineClass} transition-all duration-700`}
        style={{ width: `${minePct}%` }}
      />
      <div
        className={`${theirsClass} transition-all duration-700`}
        style={{ width: `${theirsPct}%` }}
      />
    </div>
  );
}

function CompareModal({
  theirProfile,
  theirName,
  onClose,
}: {
  theirProfile: Profile;
  theirName: string;
  onClose: () => void;
}) {
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const myUserId = getUserId();
    if (!myUserId) {
      setErr("Could not identify your profile.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const p = await api.profiles.get(myUserId);
      if (cancelled) return;
      if (p.ok && p.data && typeof p.data === "object") {
        setMyProfile(normProfile(p.data));
      } else {
        const all = await api.profiles.search({});
        if (cancelled) return;
        if (all.ok && Array.isArray(all.data)) {
          const found = all.data.find(
            (x: any) => x.userId === myUserId || x.profileId === myUserId
          );
          if (found) {
            setMyProfile(normProfile(found));
          } else {
            setErr("Your profile could not be loaded.");
          }
        } else {
          setErr("Your profile could not be loaded.");
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const myName = myProfile
    ? [myProfile.firstName, myProfile.surName].filter(Boolean).join(" ").trim() || "You"
    : "You";

  const stats: CompareStatRow[] = myProfile
    ? [
        {
          icon: <Sparkles className="h-4 w-4 text-amber-400" />,
          label: "Total XP",
          mine: myProfile.totalXP ?? 0,
          theirs: theirProfile.totalXP ?? 0,
          format: (n) => n.toLocaleString(),
          higherIsBetter: true,
          mineClass: "bg-amber-400",
          theirsClass: "bg-amber-600/50",
        },
        {
          icon: <Target className="h-4 w-4 text-cyan-400" />,
          label: "Missions Solved",
          mine: myProfile.problemsSolvedCount ?? 0,
          theirs: theirProfile.problemsSolvedCount ?? 0,
          format: (n) => n.toLocaleString(),
          higherIsBetter: true,
          mineClass: "bg-cyan-400",
          theirsClass: "bg-cyan-700/50",
        },
        {
          icon: <Flame className="h-4 w-4 text-orange-400" />,
          label: "Day Streak",
          mine: myProfile.dayStreak ?? 0,
          theirs: theirProfile.dayStreak ?? 0,
          format: (n) => `${n}d`,
          higherIsBetter: true,
          mineClass: "bg-orange-400",
          theirsClass: "bg-orange-700/50",
        },
        {
          icon: <Briefcase className="h-4 w-4 text-[#A78BFA]" />,
          label: "Experience",
          mine: myProfile.experience ?? 0,
          theirs: theirProfile.experience ?? 0,
          format: (n) => `${n} yr${n === 1 ? "" : "s"}`,
          higherIsBetter: true,
          mineClass: "bg-[#7C3AED]",
          theirsClass: "bg-[#4C1D95]/70",
        },
      ]
    : [];

  return (
    <AnimatePresence>
      <motion.div
        key="compare-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="compare-panel"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-lg bg-[#0d1119] border border-[#7C3AED]/30 rounded-2xl shadow-[0_0_60px_rgba(124,58,237,0.2)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-[#7C3AED]/10 to-transparent">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[#A78BFA]">
              <GitCompare className="h-4 w-4" />
              Operative Comparison
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <BrainiacSpinner text="Loading your profile…" />
              </div>
            ) : err ? (
              <div className="py-10 text-center text-sm text-amber-400 font-mono">{err}</div>
            ) : (
              <>
                {/* Column headers */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-0.5">You</span>
                    <span className="text-sm font-bold leading-tight max-w-[140px] truncate">{myName}</span>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">vs</div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] mb-0.5">Them</span>
                    <span className="text-sm font-bold leading-tight max-w-[140px] truncate text-right">{theirName}</span>
                  </div>
                </div>

                {/* Stat rows */}
                <div className="space-y-5">
                  {stats.map((s) => {
                    const iWin = s.mine > s.theirs;
                    const theyWin = s.theirs > s.mine;
                    const tied = s.mine === s.theirs;
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`text-base font-bold tabular-nums ${iWin ? "text-amber-400" : "text-white/70"}`}>
                            {s.format(s.mine)}
                            {iWin && <span className="ml-1 text-[9px] font-mono uppercase tracking-widest text-amber-400">▲</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40">
                            {s.icon}
                            {s.label}
                            {tied && <span className="text-[9px] text-white/30">·tie</span>}
                          </div>
                          <div className={`text-base font-bold tabular-nums text-right ${theyWin ? "text-[#A78BFA]" : "text-white/70"}`}>
                            {theyWin && <span className="mr-1 text-[9px] font-mono uppercase tracking-widest text-[#A78BFA]">▲</span>}
                            {s.format(s.theirs)}
                          </div>
                        </div>
                        <CompareBar
                          mine={s.mine}
                          theirs={s.theirs}
                          mineClass={s.mineClass}
                          theirsClass={s.theirsClass}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Summary verdict */}
                {(() => {
                  const myWins = stats.filter((s) => s.mine > s.theirs).length;
                  const theirWins = stats.filter((s) => s.theirs > s.mine).length;
                  let verdict = "";
                  let verdictClass = "";
                  if (myWins > theirWins) {
                    verdict = `You lead in ${myWins} of ${stats.length} categories. Keep it up!`;
                    verdictClass = "text-amber-400";
                  } else if (theirWins > myWins) {
                    verdict = `They lead in ${theirWins} of ${stats.length} categories. Time to grind!`;
                    verdictClass = "text-[#A78BFA]";
                  } else {
                    verdict = "You're evenly matched. May the best operative win!";
                    verdictClass = "text-cyan-400";
                  }
                  return (
                    <div className={`mt-5 pt-4 border-t border-white/5 text-center text-xs font-mono ${verdictClass}`}>
                      {verdict}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
