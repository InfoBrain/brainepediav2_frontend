import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Trophy, Shield, Zap, Globe, Twitter, Linkedin, Link2,
  Copy, CheckCircle2, ArrowLeft, Star, Target, Medal,
  Download, BookOpen, Calendar, Award, User, Eye, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ── Types ── */
type BadgeItem = {
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  rarity?: string | number;
  Rarity?: string | number;
  iconUrl?: string | null;
  IconUrl?: string | null;
};

type MissionItem = {
  missionTitle?: string;
  MissionTitle?: string;
  title?: string;
  Title?: string;
  districtName?: string;
  DistrictName?: string;
  problemNodeId?: string;
  ProblemNodeId?: string;
  score?: number;
  Score?: number;
  completionDate?: string;
  CompletionDate?: string;
  completedAt?: string;
};

type PublicProfileData = {
  DisplayName?: string; displayName?: string;
  ProfilePictureUrl?: string | null; profilePictureUrl?: string | null;
  ActiveProfession?: string; activeProfession?: string;
  ProfessionalTitle?: string; professionalTitle?: string;
  TotalXp?: number; totalXp?: number; TotalXP?: number; totalXP?: number;
  VerifiedExperienceYears?: number; verifiedExperienceYears?: number;
  GlobalLeaderboardRank?: number; globalLeaderboardRank?: number;
  EarnedBadges?: BadgeItem[]; earnedBadges?: BadgeItem[];
  CompletedMissions?: MissionItem[]; completedMissions?: MissionItem[];
};

/* ── Rarity helpers ── */
const RARITY_STYLE: Record<string, { border: string; text: string; bg: string; glow: string; label: string }> = {
  legendary: { border: "border-[#FFD700]/40", text: "text-[#FFD700]", bg: "bg-[#FFD700]/8", glow: "shadow-[0_0_20px_rgba(255,215,0,0.25)]", label: "Legendary" },
  epic:      { border: "border-[#9D4EDD]/40", text: "text-[#9D4EDD]", bg: "bg-[#9D4EDD]/8", glow: "shadow-[0_0_16px_rgba(157,78,221,0.25)]", label: "Epic" },
  rare:      { border: "border-[#00D2FF]/40", text: "text-[#00D2FF]", bg: "bg-[#00D2FF]/8", glow: "shadow-[0_0_14px_rgba(0,210,255,0.2)]", label: "Rare" },
  common:    { border: "border-white/10",     text: "text-white/40",  bg: "bg-white/3",       glow: "",                                           label: "Common" },
};
function rarityStyle(r?: string | number) {
  if (typeof r === "number") {
    const keys = ["common", "rare", "epic", "legendary"];
    return RARITY_STYLE[keys[Math.min(r, 3)] ?? "common"] ?? RARITY_STYLE.common;
  }
  return RARITY_STYLE[(String(r || "common")).toLowerCase()] ?? RARITY_STYLE.common;
}

/* ── Avatar ── */
function Avatar({ name, url, size = 80 }: { name: string; url?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img src={url} alt={name} onError={() => setErr(true)}
        className="rounded-2xl object-cover border-2 border-[#00D2FF]/40 shadow-[0_0_28px_rgba(0,210,255,0.2)]"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#00D2FF] flex items-center justify-center font-bold text-white border-2 border-[#00D2FF]/40 shadow-[0_0_28px_rgba(0,210,255,0.2)]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Skeleton ── */
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#080b10] text-white px-4 py-8 max-w-4xl mx-auto animate-pulse space-y-6">
      <div className="h-10 w-32 rounded-lg bg-white/5" />
      <div className="rounded-2xl border border-white/6 bg-white/3 p-8 flex gap-6">
        <div className="w-24 h-24 rounded-2xl bg-white/8 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 rounded bg-white/8" />
          <div className="h-4 w-32 rounded bg-white/5" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-20 rounded-full bg-white/5" />
            <div className="h-6 w-24 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/3" />)}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || "";
  const [, navigate] = useLocation();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [performance, setPerformance] = useState<any | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState("");

  /* resolve helper fields */
  const name       = profile?.DisplayName || profile?.displayName || "Brainepedia Member";
  const avatarUrl  = profile?.ProfilePictureUrl || profile?.profilePictureUrl || null;
  const profession = profile?.ActiveProfession || profile?.activeProfession || "";
  const title      = profile?.ProfessionalTitle || profile?.professionalTitle || "";
  const totalXP    = profile?.TotalXp ?? profile?.totalXp ?? profile?.TotalXP ?? profile?.totalXP ?? 0;
  const vxYears    = profile?.VerifiedExperienceYears ?? profile?.verifiedExperienceYears ?? 0;
  const rankNum    = profile?.GlobalLeaderboardRank ?? profile?.globalLeaderboardRank ?? 0;
  const portfolioRoot = (profile as any)?.portfolio ?? (profile as any)?.Portfolio ?? profile;
  const personalStatement = displayText((portfolioRoot as any)?.personalStatement ?? (portfolioRoot as any)?.PersonalStatement ?? (portfolioRoot as any)?.aboutMe ?? (portfolioRoot as any)?.AboutMe, "");
  const education = list((portfolioRoot as any)?.education ?? (portfolioRoot as any)?.Education);
  const experience = list((portfolioRoot as any)?.workExperience ?? (portfolioRoot as any)?.WorkExperience ?? (portfolioRoot as any)?.experience ?? (portfolioRoot as any)?.Experience);
  const skills = list((portfolioRoot as any)?.skills ?? (portfolioRoot as any)?.Skills);
  const projects = list((portfolioRoot as any)?.projects ?? (portfolioRoot as any)?.Projects);
  const services = list((portfolioRoot as any)?.services ?? (portfolioRoot as any)?.Services);
  const interests = list((portfolioRoot as any)?.interests ?? (portfolioRoot as any)?.Interests);
  const missionStats = (profile as any)?.missionStats ?? (profile as any)?.MissionStats ?? {};
  const achievements = list((profile as any)?.achievements ?? (profile as any)?.Achievements);
  const badges     = profile?.EarnedBadges ?? profile?.earnedBadges ?? (profile as any)?.badges ?? [];
  const missions   = profile?.CompletedMissions ?? profile?.completedMissions ?? (profile as any)?.completedMissions ?? (profile as any)?.missionHistory ?? [];

  const publicUrl  = `${window.location.origin}/public-profile/${userId}`;

  /* ── SEO ── */
  useEffect(() => {
    if (!profile) return;
    document.title = `${name} — ${title || profession} | Brainepedia`;
    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", `${name} is a ${profession} with ${vxYears.toFixed(1)} years of Verified Experience on Brainepedia.`);
    setMeta("keywords", `Brainepedia, ${profession}, career, verified experience, ${name}`);
    setMeta("author", "InfoBrain");
    setMeta("og:title", `${name} — ${title} | Brainepedia`, true);
    setMeta("og:description", `VX-${vxYears.toFixed(1)} · ${profession} · ${totalXP.toLocaleString()} XP`, true);
    setMeta("og:image", avatarUrl || "https://demo.brainepedia.com/opengraph.jpg", true);
    setMeta("og:url", publicUrl, true);
    setMeta("og:type", "profile", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", `${name} — ${title}`);
    setMeta("twitter:description", `${vxYears.toFixed(1)} years Verified Experience on Brainepedia`);
  }, [profile]);

  /* ── Fetch ── */
  useEffect(() => {
    if (!userId) { setError("Invalid profile link."); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const res = await api.profiles.publicPortfolio(userId, { public: true });
      if (res.ok && res.data) {
        setProfile(res.data as PublicProfileData);
      } else {
        setError("This profile is not available or doesn't exist.");
      }
      setLoading(false);
    })();
  }, [userId]);

  /* ── Copy ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* ── Share ── */
  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`, "_blank", "noopener,noreferrer");
  };
  const shareTwitter = () => {
    const text = `Check out ${name}'s professional career dossier on Brainepedia — ${vxYears.toFixed(1)} years of Verified Experience as ${profession}.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`, "_blank", "noopener,noreferrer");
  };
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${name} — ${title}`, text: `${vxYears.toFixed(1)} VX years on Brainepedia`, url: publicUrl });
    } else {
      handleCopy();
    }
  };

  const viewPerformance = async (problemNodeId: string) => {
    if (!problemNodeId) return;
    setPerformance(null);
    setPerformanceError("");
    setPerformanceLoading(true);
    const res = await api.evaluations.getNodeResult(problemNodeId, userId, { suppressUnauthorized: true });
    setPerformanceLoading(false);
    if (!res.ok) {
      setPerformanceError(res.error || "Unable to load mission performance.");
      return;
    }
    setPerformance(res.data);
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center text-white px-4">
        <div className="text-center max-w-sm">
          <User className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-lg font-bold text-white/60">{error}</p>
          <button onClick={() => navigate(getUser() ? "/user/dashboard" : "/")} className="mt-6 px-6 py-2.5 rounded-xl bg-[#00D2FF]/10 border border-[#00D2FF]/20 text-[#00D2FF] text-sm font-mono hover:bg-[#00D2FF]/20 transition-colors">
            ← Back to Brainepedia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(0,210,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,1) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(getUser() ? "/user/dashboard" : "/")}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm font-mono transition-colors">
            <ArrowLeft className="w-4 h-4" /> {getUser() ? "Dashboard" : "Brainepedia"}
          </button>
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <Shield className="w-3 h-3" /> Verified Dossier
          </div>
        </div>

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-[#00D2FF]/15 bg-gradient-to-br from-[#00D2FF]/5 via-[#0d1119] to-[#9D4EDD]/5 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00D2FF]/4 via-transparent to-[#9D4EDD]/4 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar name={name} url={avatarUrl} size={96} />

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-mono text-[#00D2FF]/50 uppercase tracking-[0.3em] mb-1">Public Career Dossier</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{name}</h1>
              {title && <p className="text-base text-white/60 mt-0.5">{title}</p>}
              {profession && <p className="text-sm text-white/40 font-mono mt-0.5">{profession}</p>}

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-4">
                {vxYears > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/8 text-[#00D2FF] text-sm font-black font-mono">
                    <Shield className="w-3.5 h-3.5" /> VX-{vxYears.toFixed(1)}
                  </span>
                )}
                {rankNum > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/8 text-[#FFD700] text-sm font-mono">
                    <Medal className="w-3.5 h-3.5" /> Rank #{rankNum}
                  </span>
                )}
                {totalXP > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/8 text-[#9D4EDD] text-sm font-mono">
                    <Zap className="w-3.5 h-3.5" /> {totalXP.toLocaleString()} XP
                  </span>
                )}
              </div>
            </div>

            {/* Share actions */}
            <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00D2FF]/8 border border-[#00D2FF]/20 text-[#00D2FF] text-xs font-mono hover:bg-[#00D2FF]/15 transition-all whitespace-nowrap">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button onClick={shareLinkedIn}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-mono hover:bg-blue-600/20 transition-all">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
              <button onClick={shareTwitter}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-mono hover:bg-white/10 transition-all">
                <Twitter className="w-3.5 h-3.5" /> X
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── PROFESSIONAL OVERVIEW ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h2 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#FFD700]" /> Professional Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Profession", value: profession || "—", icon: <Globe className="w-4 h-4" />, color: "text-[#00D2FF]" },
              { label: "Verified Exp.", value: vxYears > 0 ? `${vxYears.toFixed(1)} yrs` : "—", icon: <Shield className="w-4 h-4" />, color: "text-[#00D2FF]" },
              { label: "Total XP", value: totalXP > 0 ? totalXP.toLocaleString() : "—", icon: <Zap className="w-4 h-4" />, color: "text-[#FFD700]" },
              { label: "Global Rank", value: rankNum > 0 ? `#${rankNum}` : "—", icon: <Medal className="w-4 h-4" />, color: "text-[#FFD700]" },
              { label: "Challenges Done", value: missions.length > 0 ? missions.length : "—", icon: <Target className="w-4 h-4" />, color: "text-[#9D4EDD]" },
              { label: "Badges Earned", value: badges.length > 0 ? badges.length : "—", icon: <Award className="w-4 h-4" />, color: "text-[#9D4EDD]" },
              { label: "Professional Title", value: title || "—", icon: <BookOpen className="w-4 h-4" />, color: "text-white/50" },
              { label: "Rank Title", value: title || (vxYears > 3 ? "Senior" : vxYears > 1 ? "Mid-Level" : vxYears > 0 ? "Junior" : "—"), icon: <Trophy className="w-4 h-4" />, color: "text-white/50" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
                className="rounded-xl border border-white/6 bg-[#0d1119] p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={item.color}>{item.icon}</span>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{item.label}</p>
                </div>
                <p className={`text-sm font-bold ${item.color} truncate`}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── BADGES ── */}
        <PortfolioSection title="Personal Statement" icon={<User className="w-3.5 h-3.5 text-[#00D2FF]" />} empty="No personal statement added yet.">
          {personalStatement && <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">{personalStatement}</p>}
        </PortfolioSection>

        <PortfolioSection title="Education" icon={<BookOpen className="w-3.5 h-3.5 text-[#FFD700]" />} count={education.length} empty="No education entries added yet.">
          <CardGrid items={education} fields={["institution", "degree", "courseOfStudy", "fromDate", "endDate"]} />
        </PortfolioSection>

        <PortfolioSection title="Experience" icon={<BriefcaseIcon />} count={experience.length} empty="No work experience entries added yet.">
          <CardGrid items={experience} fields={["company", "role", "location", "start", "end", "description"]} />
        </PortfolioSection>

        <PortfolioSection title="Skills" icon={<Star className="w-3.5 h-3.5 text-[#9D4EDD]" />} count={skills.length} empty="No skills added yet.">
          <div className="grid gap-3 sm:grid-cols-2">
            {skills.map((skill, index) => {
              const rating = Math.max(0, Math.min(100, Number((skill as any)?.rating ?? (skill as any)?.Rating ?? 0)));
              return (
                <div key={index} className="rounded-xl border border-white/6 bg-[#0d1119] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold">{displayText((skill as any)?.skill ?? (skill as any)?.name ?? (skill as any)?.Skill, "Skill")}</p>
                    <span className="text-xs font-mono text-[#00D2FF]">{rating}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[#00D2FF]" style={{ width: `${rating}%` }} /></div>
                </div>
              );
            })}
          </div>
        </PortfolioSection>

        <PortfolioSection title="Projects" icon={<CodeIcon />} count={projects.length} empty="No projects added yet.">
          <CardGrid items={projects} fields={["projectName", "description", "projectUrl"]} />
        </PortfolioSection>

        <PortfolioSection title="Services" icon={<SparkleIcon />} count={services.length} empty="No services added yet.">
          <CardGrid items={services} fields={["service", "description"]} />
        </PortfolioSection>

        <PortfolioSection title="Interests" icon={<Star className="w-3.5 h-3.5 text-[#00D2FF]" />} count={interests.length} empty="No interests added yet.">
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, index) => (
              <span key={index} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70">
                {displayText((interest as any)?.interest ?? (interest as any)?.name ?? interest, "Interest")}
              </span>
            ))}
          </div>
        </PortfolioSection>

        <PortfolioSection title="Mission Stats" icon={<Target className="w-3.5 h-3.5 text-[#9D4EDD]" />} empty="">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(missionStats).slice(0, 8).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-white/6 bg-[#0d1119] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">{splitLabel(key)}</p>
                <p className="mt-1 font-bold text-[#00D2FF]">{displayText(value, "—")}</p>
              </div>
            ))}
          </div>
        </PortfolioSection>

        {/* ── BADGES ── */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-[#FFD700]" /> Earned Badges
            <span className="text-[#FFD700]/50">{badges.length > 0 ? `(${badges.length})` : ""}</span>
          </h2>
          {badges.length === 0 ? (
            <div className="rounded-xl border border-white/6 bg-[#0d1119] p-10 text-center">
              <Trophy className="w-10 h-10 text-white/8 mx-auto mb-3" />
              <p className="text-sm text-white/20 font-mono">No badges earned yet.</p>
              <p className="text-xs text-white/10 font-mono mt-1">Badges are unlocked by completing missions and hitting milestones.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((b, i) => {
                const bName = b.name || b.Name || "Badge";
                const bDesc = b.description || b.Description || "";
                const bRarity = b.rarity || b.Rarity;
                const bIcon = b.iconUrl || b.IconUrl;
                const rs = rarityStyle(bRarity);
                return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    className={`rounded-xl border ${rs.border} ${rs.bg} ${rs.glow} p-4 text-center`}>
                    {bIcon
                      ? <img src={bIcon} alt={bName} className="w-10 h-10 mx-auto mb-2 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      : <Trophy className={`w-10 h-10 mx-auto mb-2 ${rs.text}`} />
                    }
                    <p className="text-xs font-bold text-white truncate">{bName}</p>
                    <p className={`text-[10px] font-mono mt-0.5 ${rs.text}`}>{rs.label}</p>
                    {bDesc && <p className="text-[10px] text-white/25 mt-1 line-clamp-2">{bDesc}</p>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        <PortfolioSection title="Achievements" icon={<Award className="w-3.5 h-3.5 text-[#FFD700]" />} count={achievements.length} empty="No achievements returned yet.">
          <CardGrid items={achievements} fields={["title", "name", "description", "createdAt"]} />
        </PortfolioSection>

        {/* ── COMPLETED MISSIONS ── */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[#9D4EDD]" /> Completed Challenges
            <span className="text-[#9D4EDD]/50">{missions.length > 0 ? `(${missions.length})` : ""}</span>
          </h2>
          {missions.length === 0 ? (
            <div className="rounded-xl border border-white/6 bg-[#0d1119] p-10 text-center">
              <Target className="w-10 h-10 text-white/8 mx-auto mb-3" />
              <p className="text-sm text-white/20 font-mono">No challenges completed yet.</p>
              <p className="text-xs text-white/10 font-mono mt-1">Completed challenges will appear here once the user completes their first challenge.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/6 bg-[#0d1119] divide-y divide-white/5 overflow-hidden">
              {missions.slice(0, 20).map((m, i) => {
                const mTitle = m.missionTitle || m.MissionTitle || m.title || m.Title || "Challenge";
                const dName  = m.districtName  || m.DistrictName  || "";
                const score  = m.score ?? m.Score ?? 0;
                const date   = m.completionDate || m.CompletionDate || m.completedAt || "";
                const problemNodeId = m.problemNodeId || m.ProblemNodeId || "";
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.03 }}
                    className="flex flex-col gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors sm:flex-row sm:items-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{mTitle}</p>
                      {dName && <p className="text-xs text-white/35 font-mono mt-0.5 truncate">{dName}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 text-left sm:justify-end sm:text-right">
                      <div>
                        {score > 0 && (
                          <p className="text-sm font-bold font-mono text-[#00D2FF]">{score}%</p>
                        )}
                        {date && (
                          <p className="text-[10px] text-white/25 font-mono flex items-center gap-1 sm:justify-end mt-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {problemNodeId && (
                        <button
                          onClick={() => viewPerformance(problemNodeId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#00D2FF]/25 bg-[#00D2FF]/8 px-3 py-1.5 text-xs font-mono text-[#00D2FF] transition hover:bg-[#00D2FF]/15"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Performance
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ── SHARE FOOTER ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl border border-white/6 bg-[#0d1119] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-[#00D2FF]/60" />
            <h2 className="text-xs font-mono text-white/30 uppercase tracking-widest">Share this Dossier</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8 bg-white/3 min-w-0">
              <Globe className="w-3.5 h-3.5 text-white/20 shrink-0" />
              <span className="text-xs font-mono text-white/30 truncate">{publicUrl}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D2FF]/10 border border-[#00D2FF]/20 text-[#00D2FF] text-xs font-mono hover:bg-[#00D2FF]/20 transition-all whitespace-nowrap">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button onClick={shareLinkedIn}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-mono hover:bg-blue-600/20 transition-all">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
              <button onClick={shareTwitter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-mono hover:bg-white/10 transition-all">
                <Twitter className="w-3.5 h-3.5" /> X
              </button>
              <button onClick={handleNativeShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 text-[#9D4EDD] text-xs font-mono hover:bg-[#9D4EDD]/20 transition-all">
                <Download className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>
        </motion.div>

        <Dialog open={Boolean(performance) || performanceLoading || Boolean(performanceError)} onOpenChange={(open) => {
          if (!open) {
            setPerformance(null);
            setPerformanceError("");
          }
        }}>
          <DialogContent className="max-w-2xl bg-[#0d1119] border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Mission Performance</DialogTitle>
              <DialogDescription>Evaluation result for this completed mission.</DialogDescription>
            </DialogHeader>
            {performanceLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 py-16 text-sm text-white/40">
                <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" />
                Loading mission performance...
              </div>
            ) : performanceError ? (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">
                {performanceError}
              </div>
            ) : performance ? (
              <PerformanceResult result={performance} />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* ── Footer ── */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] font-mono text-white/15">
            Powered by{" "}
            <a href="https://demo.brainepedia.com" className="text-[#00D2FF]/40 hover:text-[#00D2FF]/70 transition-colors">Brainepedia</a>
            {" "}· AI-Powered Career Growth Platform
          </p>
        </div>
      </div>
    </div>
  );
}

function PerformanceResult({ result }: { result: any }) {
  const root = result?.data ?? result?.result ?? result?.evaluation ?? result;
  const passValue = root?.passed ?? root?.isPassed ?? root?.IsPassed ?? root?.Passed ?? root?.passFail ?? root?.PassFail ?? root?.status ?? root?.Status;
  const passed = typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue);
  const rows: [string, string][] = [
    ["Mission Title", displayText(root?.missionTitle ?? root?.MissionTitle ?? root?.title ?? root?.Title, "Mission")],
    ["Score", displayText(root?.score ?? root?.Score ?? root?.percentageScore ?? root?.PercentageScore, "—")],
    ["Strengths", resultText(root?.strengths ?? root?.Strengths ?? root?.Feedback?.Strengths, "No strengths returned.")],
    ["Weaknesses", resultText(root?.weaknesses ?? root?.Weaknesses ?? root?.Feedback?.Weaknesses, "No weaknesses returned.")],
    ["Improvement Areas", resultText(root?.improvementAreas ?? root?.ImprovementAreas ?? root?.areasForImprovement ?? root?.Feedback?.ImprovementAreas, "No improvement areas returned.")],
    ["AI Evaluation Summary", resultText(root?.aiEvaluationSummary ?? root?.AiEvaluationSummary ?? root?.summary ?? root?.Summary ?? root?.rawAiReasoning ?? root?.RawAiReasoning ?? root?.aiReasoning ?? root?.AiReasoning, "No AI evaluation summary returned.")],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-white/35">Pass Status</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${passed ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
          {passed ? "Passed" : "Not Passed"}
        </span>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-white/35">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{value}</p>
        </div>
      ))}
    </div>
  );
}

function resultText(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => displayText(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  if (value && typeof value === "object") {
    const items = Object.values(value).map((item) => displayText(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  return displayText(value, fallback);
}

function displayText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const output = String(value).trim();
  return output || fallback;
}

function PortfolioSection({ title, icon, count, empty, children }: { title: string; icon: ReactNode; count?: number; empty: string; children: ReactNode }) {
  const hasContent = count !== undefined ? count > 0 : Boolean(children);
  if (!hasContent && !empty) return null;
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/30">
        {icon} {title} {count !== undefined && count > 0 ? <span className="text-[#00D2FF]/50">({count})</span> : null}
      </h2>
      {!hasContent ? (
        <div className="rounded-xl border border-white/6 bg-[#0d1119] p-8 text-center text-sm text-white/20 font-mono">{empty}</div>
      ) : (
        <div className="rounded-xl border border-white/6 bg-[#0d1119] p-5">{children}</div>
      )}
    </motion.section>
  );
}

function CardGrid({ items, fields }: { items: any[]; fields: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <article key={index} className="rounded-xl border border-white/6 bg-white/[0.03] p-4">
          <h3 className="mb-3 font-bold text-white">{displayText(item?.projectName ?? item?.ProjectName ?? item?.company ?? item?.Company ?? item?.institution ?? item?.Institution ?? item?.service ?? item?.Service ?? item?.title ?? item?.name, "Portfolio item")}</h3>
          <div className="grid gap-2">
            {fields.map((field) => {
              const value = item?.[field] ?? item?.[field.charAt(0).toUpperCase() + field.slice(1)];
              if (!value) return null;
              return (
                <div key={field}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">{splitLabel(field)}</p>
                  <p className="text-sm text-white/70">{field.toLowerCase().includes("date") || field === "start" || field === "end" ? formatMaybeDate(value) : displayText(value)}</p>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [];
}

function splitLabel(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim();
}

function formatMaybeDate(value: any): string {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? displayText(value) : date.toLocaleDateString();
}

function BriefcaseIcon() {
  return <span className="inline-block h-3.5 w-3.5 rounded-sm border border-[#00D2FF] text-[#00D2FF]" />;
}

function CodeIcon() {
  return <span className="font-mono text-[#9D4EDD]">&lt;/&gt;</span>;
}

function SparkleIcon() {
  return <span className="text-[#FFD700]">✦</span>;
}
