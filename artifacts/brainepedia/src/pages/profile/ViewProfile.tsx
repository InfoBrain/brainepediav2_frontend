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
  Sparkles,
  Twitter,
  Facebook,
} from "lucide-react";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

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

export default function ViewProfile() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [p, b, m] = await Promise.all([
        api.profiles.get(userId),
        api.userBadges.forUser(userId),
        api.userProgresses.map(userId),
      ]);
      if (cancelled) return;
      if (p.ok) setProfile(normProfile(p.data));
      else setError(p.error || "Profile not found.");
      if (b.ok) setBadges(normBadges(b.data));
      if (m.ok) setDistricts(normDistricts(m.data));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E14] text-foreground flex items-center justify-center">
        <BrainiacSpinner text="Brainiac fetching dossier…" />
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0E14] text-foreground flex flex-col items-center justify-center gap-4">
        <div className="text-amber-400 font-mono uppercase tracking-wider text-sm">
          {error || "Profile unavailable."}
        </div>
        <Link href="/">
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

  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider hover:text-amber-300">
            <ArrowLeft className="h-4 w-4" /> Brainepedia
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
                </p>
              </div>
            </div>
            {badges.length === 0 ? (
              <Empty text="No badges earned yet." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 [perspective:1000px]">
                {badges.slice(0, 16).map((b, i) => {
                  const k = rarityKey(b.rarity);
                  const r = RARITY_COLOR[k];
                  return (
                    <motion.div
                      key={b.id || i}
                      initial={{ opacity: 0, rotateY: -20 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ rotateY: 12, rotateX: -6, scale: 1.05 }}
                      className="group [transform-style:preserve-3d]"
                    >
                      <div className={`relative rounded-xl p-[2px] bg-gradient-to-br ${r.ring} ${r.glow}`}>
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
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
    </div>
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
    userId: d.userId || d.id,
    firstName: d.firstName,
    surName: d.surName || d.surname || d.lastName,
    middleName: d.middleName,
    aboutMe: d.aboutMe || d.bio,
    currentTitle: d.currentTitle || d.title,
    profession: d.profession,
    imageUrl: d.imageUrl || d.avatarUrl || d.profileImage,
    facebook: d.facebook,
    linkedIn: d.linkedIn || d.linkedin,
    github: d.github,
    twitter: d.twitter,
    totalXP: Number(d.totalXP ?? d.totalXp ?? 0),
    currentSubscription: Number(d.currentSubscription ?? 0),
  };
}
function normBadges(d: any): Badge[] {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.badges) ? d.badges : [];
  return arr.map((x: any) => ({
    id: x.id || x.badgeId,
    name: x.name || x.badgeName || x.title,
    description: x.description,
    rarity: x.rarity || x.tier,
    iconUrl: x.iconUrl || x.imageUrl,
    earnedAt: x.earnedAt || x.createdAt,
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
