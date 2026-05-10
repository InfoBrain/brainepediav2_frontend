import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
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
  Github,
  Globe,
  Linkedin,
  Pin,
  PinOff,
  Sparkles,
  Twitter,
  Facebook,
} from "lucide-react";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { api } from "@/lib/api";
import { getDashboardPath, getProfileId, isAuthenticated } from "@/lib/auth";
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
  const [badges, setBadges] = useState<Badge[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const isOwn = Boolean(profileIdParam) && profileIdParam === (getProfileId() ?? "");

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

      const actualUserId: string =
        profileData.userId ||
        profileData.UserId ||
        profileData.id ||
        profileIdParam;

      const [b, m] = await Promise.all([
        api.userBadges.forUser(actualUserId),
        api.userProgresses.map(actualUserId),
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
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Total XP</div>
              <div className="text-3xl font-bold text-amber-400 inline-flex items-center gap-1">
                <Sparkles className="h-5 w-5" />
                {(profile.totalXP ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </motion.section>

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
