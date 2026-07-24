import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Shield, Zap, Linkedin, Link2,
  Copy, CheckCircle2, ArrowLeft, Target, Medal,
  Download, BookOpen, User, Eye, Loader2,
  MapPin, Mail, Github, MessageCircle, BadgeCheck, ChevronDown,
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
import { useToast } from "@/hooks/use-toast";

type MissionItem = {
  missionTitle?: string; MissionTitle?: string; title?: string; Title?: string;
  districtName?: string; DistrictName?: string;
  professionName?: string; ProfessionName?: string; profession?: string; Profession?: string;
  difficulty?: string; Difficulty?: string; difficultyLevel?: string;
  xpEarned?: number; XpEarned?: number; xp?: number; XP?: number;
  completionDate?: string; CompletionDate?: string; completedAt?: string;
  score?: number; Score?: number; evaluationScore?: number; EvaluationScore?: number;
  passed?: boolean; Passed?: boolean; isPassed?: boolean; IsPassed?: boolean;
  problemNodeId?: string; ProblemNodeId?: string;
  feedback?: string; Feedback?: string; aiEvaluationSummary?: string;
};

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "interests", label: "Interests" },
  { id: "missions", label: "Mission Achievements" },
  { id: "contact", label: "Contact" },
] as const;

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedMission, setExpandedMission] = useState<number | null>(null);
  const [performance, setPerformance] = useState<any | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState("");

  const portfolioRoot = (profile as any)?.portfolio ?? (profile as any)?.Portfolio ?? profile;
  const name = profile?.DisplayName || profile?.displayName || profile?.fullName || profile?.FullName || "Brainepedia Member";
  const avatarUrl = profile?.ProfilePictureUrl || profile?.profilePictureUrl || profile?.avatarUrl || null;
  const profession = profile?.ActiveProfession || profile?.activeProfession || portfolioRoot?.profession || portfolioRoot?.Profession || "";
  const title = profile?.ProfessionalTitle || profile?.professionalTitle || portfolioRoot?.currentTitle || portfolioRoot?.CurrentTitle || "";
  const totalXP = Number(profile?.TotalXp ?? profile?.totalXp ?? profile?.TotalXP ?? profile?.totalXP ?? 0);
  const vxYears = Number(profile?.VerifiedExperienceYears ?? profile?.verifiedExperienceYears ?? 0);
  const rankNum = Number(profile?.GlobalLeaderboardRank ?? profile?.globalLeaderboardRank ?? 0);
  const rankTitle = textOf(profile?.rankTitle ?? profile?.RankTitle ?? profile?.currentRank ?? profile?.CurrentRank ?? title);
  const location = textOf(
    portfolioRoot?.city && portfolioRoot?.country
      ? `${portfolioRoot.city}, ${portfolioRoot.country}`
      : portfolioRoot?.location ?? portfolioRoot?.Location ?? portfolioRoot?.address ?? portfolioRoot?.Address ?? portfolioRoot?.country ?? portfolioRoot?.Country,
    "",
  );
  const subscription = textOf(
    profile?.subscriptionTier ?? profile?.SubscriptionTier ?? profile?.currentSubscription ?? profile?.CurrentSubscription ?? profile?.planName ?? profile?.PlanName,
    "",
  );
  const isVerified = Boolean(
    profile?.isVerified ?? profile?.IsVerified ?? profile?.verified ?? profile?.Verified ?? vxYears > 0,
  );
  const personalStatement = textOf(
    portfolioRoot?.personalStatement ?? portfolioRoot?.PersonalStatement ?? portfolioRoot?.aboutMe ?? portfolioRoot?.AboutMe,
    "",
  );
  const education = list(portfolioRoot?.educationHistory ?? portfolioRoot?.EducationHistory ?? portfolioRoot?.education ?? portfolioRoot?.Education);
  const experience = list(
    portfolioRoot?.workHistory ?? portfolioRoot?.WorkHistory ?? portfolioRoot?.workExperience ?? portfolioRoot?.WorkExperience ?? portfolioRoot?.experience ?? portfolioRoot?.Experience,
  );
  const skills = list(portfolioRoot?.skills ?? portfolioRoot?.Skills);
  const projects = list(portfolioRoot?.projects ?? portfolioRoot?.Projects);
  const services = list(portfolioRoot?.servicesOffered ?? portfolioRoot?.ServicesOffered ?? portfolioRoot?.services ?? portfolioRoot?.Services);
  const interests = list(portfolioRoot?.interests ?? portfolioRoot?.Interests);
  const badges = list(profile?.EarnedBadges ?? profile?.earnedBadges ?? profile?.badges ?? profile?.Badges);
  const missions: MissionItem[] = list(
    profile?.CompletedMissions ?? profile?.completedMissions ?? profile?.missionHistory ?? profile?.MissionHistory ?? profile?.completedChallenges,
  );
  const email = textOf(portfolioRoot?.email ?? portfolioRoot?.Email ?? profile?.email ?? profile?.Email, "");
  const linkedIn = textOf(portfolioRoot?.linkedIn ?? portfolioRoot?.LinkedIn ?? portfolioRoot?.linkedin, "");
  const github = textOf(portfolioRoot?.github ?? portfolioRoot?.Github ?? portfolioRoot?.GitHub, "");
  const publicUrl = `${window.location.origin}/public-profile/${userId}`;
  const virtualSelfUrl = `/public-profile/${encodeURIComponent(userId)}/virtual-self`;

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.filter((section) => {
      if (section.id === "about") return Boolean(personalStatement);
      if (section.id === "education") return education.length > 0;
      if (section.id === "experience") return experience.length > 0;
      if (section.id === "skills") return skills.length > 0;
      if (section.id === "services") return services.length > 0;
      if (section.id === "projects") return projects.length > 0;
      if (section.id === "interests") return interests.length > 0;
      if (section.id === "missions") return missions.length > 0;
      if (section.id === "contact") return Boolean(email || linkedIn || github || location);
      return true;
    });
  }, [personalStatement, education, experience, skills, services, projects, interests, missions, email, linkedIn, github, location]);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!profile) return;
    document.title = `${name} — ${title || profession} | Brainepedia`;
    const setMeta = (metaName: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${metaName}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, metaName); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", `${name} is a ${profession} with ${vxYears.toFixed(1)} years of Verified Experience on Brainepedia.`);
    setMeta("og:title", `${name} — ${title} | Brainepedia`, true);
    setMeta("og:description", `VX-${vxYears.toFixed(1)} · ${profession} · ${totalXP.toLocaleString()} XP`, true);
    setMeta("og:image", avatarUrl || "https://demo.brainepedia.com/opengraph.jpg", true);
    setMeta("og:url", publicUrl, true);
  }, [profile, name, title, profession, vxYears, totalXP, avatarUrl, publicUrl]);

  useEffect(() => {
    if (!userId) { setError("Invalid profile link."); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [publicRes, portfolioRes] = await Promise.all([
        api.identity.publicProfile(userId),
        api.profiles.publicPortfolio(userId, { public: true }),
      ]);
      if (publicRes.ok && publicRes.data) {
        setProfile({ ...(publicRes.data as any), portfolio: portfolioRes.ok ? portfolioRes.data : undefined });
      } else if (portfolioRes.ok && portfolioRes.data) {
        setProfile({ ...(portfolioRes.data as any), portfolio: portfolioRes.data });
      } else {
        setError("This profile is not available or doesn't exist.");
      }
      setLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] },
    );
    visibleSections.forEach((section) => {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [visibleSections, loading]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareProfile = () => {
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

  const downloadCvPlaceholder = () => {
    toast({ title: "Download CV", description: "CV download will be available soon." });
  };

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-sm text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-bold text-muted-foreground">{error}</p>
          <button onClick={() => navigate(getUser() ? "/user/dashboard" : "/")} className="mt-6 rounded-xl border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-6 py-2.5 text-sm font-medium text-[#00D2FF] transition hover:border-[#00D2FF]/50 hover:bg-[#00D2FF]/15 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)]">
            ← Back to Brainepedia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Site header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d1119]/95 shadow-lg shadow-black/30 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center">
          <button
            onClick={() => navigate(getUser() ? "/user/dashboard" : "/")}
            className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Brainepedia
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#00D2FF]">Professional Portfolio</p>
          <h1 className="mt-1 text-lg font-bold text-foreground sm:text-xl">{name}</h1>
        </div>
        <nav className="relative border-t border-white/5">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0d1119] to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0d1119] to-transparent sm:hidden" />
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-1 overflow-x-auto px-4 py-2 scrollbar-thin">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? "bg-[#00D2FF] text-black shadow-[0_0_20px_rgba(0,210,255,0.35)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {section.label}
              </button>
            ))}
            <Link
              href={virtualSelfUrl}
              className="whitespace-nowrap rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-medium text-[#A78BFA] transition hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/20 hover:shadow-[0_0_16px_rgba(124,58,237,0.25)]"
            >
              Chat with Virtual Self
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Hero — centered */}
        <section className="card mb-10 overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-center shadow-xl shadow-black/30 transition hover:border-white/15 sm:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <Avatar name={name} url={avatarUrl} size={128} />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
              {subscription && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                  {subscription}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{name}</h2>
            {title && <p className="mt-2 text-lg text-muted-foreground">{title}</p>}
            {rankTitle && title !== rankTitle && <p className="mt-1 text-sm font-medium text-[#00D2FF]">{rankTitle}</p>}
            {profession && <p className="mt-1 text-sm text-muted-foreground/80">{profession}</p>}
            {location && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-[#00D2FF]" /> {location}
              </p>
            )}

            <div className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {vxYears > 0 && <HeroStat label="Verified Exp." value={`${vxYears.toFixed(1)} yrs`} />}
              {totalXP > 0 && <HeroStat label="Total XP" value={totalXP.toLocaleString()} />}
              {rankNum > 0 && <HeroStat label="Global Rank" value={`#${rankNum}`} />}
              {badges.length > 0 && <HeroStat label="Badges" value={String(badges.length)} />}
            </div>

            <div className="mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href={virtualSelfUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7C3AED]/20 transition hover:bg-[#6d28d9] hover:shadow-[#7C3AED]/35"
              >
                <MessageCircle className="h-4 w-4" /> Chat with Virtual Self
              </Link>
              <button
                onClick={shareProfile}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-foreground shadow-sm transition hover:border-[#00D2FF]/30 hover:bg-white/10 hover:shadow-[0_0_16px_rgba(0,210,255,0.1)]"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
                {copied ? "Copied!" : "Share Profile"}
              </button>
              <button
                onClick={downloadCvPlaceholder}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-amber-400/30 hover:bg-white/10 hover:text-foreground"
              >
                <Download className="h-4 w-4" /> Download CV
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          <Section id="overview" title="Overview" refCb={(el) => { sectionRefs.current.overview = el; }}>
            <div className="row grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewCard label="Profession" value={profession || "—"} />
              <OverviewCard label="Verified Experience" value={vxYears > 0 ? `${vxYears.toFixed(1)} years` : "—"} />
              <OverviewCard label="Total XP" value={totalXP > 0 ? totalXP.toLocaleString() : "—"} />
              <OverviewCard label="Missions Completed" value={missions.length > 0 ? String(missions.length) : "—"} />
            </div>
            {badges.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Community Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 8).map((badge: any, index: number) => (
                    <span key={index} className="card rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(255,215,0,0.12)]">
                      {badge?.name || badge?.Name || "Badge"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {personalStatement && (
            <Section id="about" title="About" refCb={(el) => { sectionRefs.current.about = el; }}>
              <p className="text-base leading-8 text-muted-foreground">{personalStatement}</p>
            </Section>
          )}

          {experience.length > 0 && (
            <Section id="experience" title="Experience" refCb={(el) => { sectionRefs.current.experience = el; }}>
              <div className="row grid grid-cols-1 gap-4">
                <ExperienceTimeline items={experience} />
              </div>
            </Section>
          )}

          {education.length > 0 && (
            <Section id="education" title="Education" refCb={(el) => { sectionRefs.current.education = el; }}>
              <div className="row grid grid-cols-1 gap-4 lg:grid-cols-2">
                <EducationTimeline items={education} />
              </div>
            </Section>
          )}

          {skills.length > 0 && (
            <Section id="skills" title="Skills" refCb={(el) => { sectionRefs.current.skills = el; }}>
              <div className="row grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill, index) => {
                  const rating = Math.max(0, Math.min(100, Number(skill?.rating ?? skill?.Rating ?? 0)));
                  const skillName = fieldValue(skill, "mySkill", "MySkill", "skill", "name", "Skill");
                  return (
                    <article key={index} className="card col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#00D2FF]/25 hover:shadow-[0_0_20px_rgba(0,210,255,0.08)]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{skillName}</p>
                        <span className="text-sm font-bold text-[#00D2FF]">{rating}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${rating}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#7C3AED]"
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </Section>
          )}

          {services.length > 0 && (
            <Section id="services" title="Services" refCb={(el) => { sectionRefs.current.services = el; }}>
              <div className="row grid grid-cols-1 gap-4 md:grid-cols-2">
                {services.map((item, index) => (
                  <article key={index} className="card col rounded-2xl border border-white/10 bg-card p-6 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-[#7C3AED]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                    <h3 className="text-lg font-bold text-foreground">{fieldValue(item, "myServices", "MyServices", "service", "Service", "title")}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{fieldValue(item, "description", "Description")}</p>
                  </article>
                ))}
              </div>
            </Section>
          )}

          {projects.length > 0 && (
            <Section id="projects" title="Projects" refCb={(el) => { sectionRefs.current.projects = el; }}>
              <div className="row grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProjectsGrid items={projects} />
              </div>
            </Section>
          )}

          {interests.length > 0 && (
            <Section id="interests" title="Interests" refCb={(el) => { sectionRefs.current.interests = el; }}>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span key={index} className="card rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground shadow-sm transition hover:border-[#00D2FF]/30 hover:text-foreground">
                    {fieldValue(interest, "interest", "Interest", "name")}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {missions.length > 0 && (
            <Section id="missions" title="Mission Achievements" refCb={(el) => { sectionRefs.current.missions = el; }}>
              <div className="row grid grid-cols-1 gap-4">
                {missions.map((mission, index) => {
                  const mTitle = mission.missionTitle || mission.MissionTitle || mission.title || mission.Title || "Mission";
                  const district = mission.districtName || mission.DistrictName || "—";
                  const prof = mission.professionName || mission.ProfessionName || mission.profession || mission.Profession || profession || "—";
                  const difficulty = mission.difficulty || mission.Difficulty || mission.difficultyLevel || "—";
                  const xp = mission.xpEarned ?? mission.XpEarned ?? mission.xp ?? mission.XP;
                  const score = mission.score ?? mission.Score ?? mission.evaluationScore ?? mission.EvaluationScore;
                  const date = mission.completionDate || mission.CompletionDate || mission.completedAt;
                  const passed = mission.passed ?? mission.Passed ?? mission.isPassed ?? mission.IsPassed;
                  const problemNodeId = mission.problemNodeId || mission.ProblemNodeId || "";
                  const feedback = mission.feedback || mission.Feedback || mission.aiEvaluationSummary || "";
                  const expanded = expandedMission === index;
                  return (
                    <article key={index} className="card col overflow-hidden rounded-2xl border border-white/10 bg-card shadow-lg shadow-black/20 transition hover:border-white/15">
                      <button type="button" onClick={() => setExpandedMission(expanded ? null : index)} className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-white/[0.03]">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{mTitle}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-white/5 px-2 py-0.5">{district}</span>
                            <span className="rounded-full bg-white/5 px-2 py-0.5">{prof}</span>
                            <span className="rounded-full bg-white/5 px-2 py-0.5">{difficulty}</span>
                            {xp != null && <span className="rounded-full bg-[#00D2FF]/10 px-2 py-0.5 text-[#00D2FF]">{Number(xp).toLocaleString()} XP</span>}
                            {score != null && <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[#A78BFA]">{score}% score</span>}
                            {date && <span className="rounded-full bg-white/5 px-2 py-0.5">{new Date(date).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {passed != null && (
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${passed ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" : "border-red-400/30 bg-red-400/10 text-red-400"}`}>
                              {passed ? "Passed" : "Not Passed"}
                            </span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                            <div className="space-y-3 p-5 pt-3">
                              {feedback && (
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Feedback</p>
                                  {feedback}
                                </div>
                              )}
                              {problemNodeId && (
                                <button onClick={() => viewPerformance(problemNodeId)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#00D2FF]/25 bg-[#00D2FF]/10 px-3 py-2 text-xs font-medium text-[#00D2FF] transition hover:border-[#00D2FF]/40 hover:bg-[#00D2FF]/15">
                                  <Eye className="h-3.5 w-3.5" /> View full evaluation
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })}
              </div>
            </Section>
          )}

          {(email || linkedIn || github || location) && (
            <Section id="contact" title="Contact" refCb={(el) => { sectionRefs.current.contact = el; }}>
              <div className="row grid grid-cols-1 gap-4 sm:grid-cols-2">
                {email && <ContactItem icon={<Mail className="h-5 w-5" />} label="Email" value={email} href={`mailto:${email}`} />}
                {linkedIn && <ContactItem icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" value={linkedIn} href={linkedIn.startsWith("http") ? linkedIn : `https://${linkedIn}`} />}
                {github && <ContactItem icon={<Github className="h-5 w-5" />} label="GitHub" value={github} href={github.startsWith("http") ? github : `https://${github}`} />}
                {location && <ContactItem icon={<MapPin className="h-5 w-5" />} label="Location" value={location} />}
              </div>
            </Section>
          )}
        </div>

        <footer className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <a href="https://demo.brainepedia.com" className="font-medium text-[#00D2FF] transition hover:text-[#00B8DD] hover:underline">Brainepedia</a> · AI-Powered Career Growth Platform
          </p>
        </footer>
      </main>

      <Dialog open={Boolean(performance) || performanceLoading || Boolean(performanceError)} onOpenChange={(open) => { if (!open) { setPerformance(null); setPerformanceError(""); } }}>
        <DialogContent className="max-w-2xl border border-white/10 bg-[#0d1119] text-foreground">
          <DialogHeader>
            <DialogTitle>Mission Performance</DialogTitle>
            <DialogDescription>Evaluation result for this completed mission.</DialogDescription>
          </DialogHeader>
          {performanceLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading mission performance...
            </div>
          ) : performanceError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-300">{performanceError}</div>
          ) : performance ? (
            <PerformanceResult result={performance} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ id, title, children, refCb }: { id: string; title: string; children: ReactNode; refCb: (el: HTMLElement | null) => void }) {
  return (
    <motion.section id={id} ref={refCb} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4 }} className="scroll-mt-36">
      <div className="card rounded-3xl border border-white/10 bg-card p-6 shadow-xl shadow-black/25 transition hover:border-white/15 sm:p-8">
        <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
        {children}
      </div>
    </motion.section>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card col rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center transition hover:border-[#00D2FF]/25 hover:shadow-[0_0_20px_rgba(0,210,255,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#00D2FF]">{value}</p>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center transition hover:border-[#FFD700]/25 hover:shadow-[0_0_16px_rgba(255,215,0,0.08)]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function ContactItem({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="card col flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-[#00D2FF]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <span className="text-[#00D2FF]">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm break-all text-foreground/90">{value}</p>
      </div>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" className="block h-full">{content}</a>;
  return content;
}

function Avatar({ name, url, size = 80 }: { name: string; url?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return <img src={url} alt={name} onError={() => setErr(true)} className="rounded-full border-4 border-[#0d1119] object-cover shadow-lg shadow-black/40 ring-2 ring-[#00D2FF]/30" style={{ width: size, height: size }} />;
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-[#00D2FF] to-[#7C3AED] font-bold text-black shadow-lg shadow-[#00D2FF]/20 ring-2 ring-[#00D2FF]/30" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8 bg-background px-4 py-10">
      <div className="mx-auto h-80 max-w-3xl rounded-3xl bg-card" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-card" />)}
      </div>
      <div className="h-48 rounded-3xl bg-card" />
    </div>
  );
}

function PerformanceResult({ result }: { result: any }) {
  const root = result?.data ?? result?.result ?? result?.evaluation ?? result;
  const passValue = root?.passed ?? root?.isPassed ?? root?.IsPassed ?? root?.Passed ?? root?.status ?? root?.Status;
  const passed = typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue);
  const rows: [string, string][] = [
    ["Mission Title", textOf(root?.missionTitle ?? root?.MissionTitle ?? root?.title, "Mission")],
    ["Score", textOf(root?.score ?? root?.Score ?? root?.percentageScore, "—")],
    ["Strengths", resultText(root?.strengths ?? root?.Strengths ?? root?.Feedback?.Strengths, "No strengths returned.")],
    ["Weaknesses", resultText(root?.weaknesses ?? root?.Weaknesses ?? root?.Feedback?.Weaknesses, "No weaknesses returned.")],
    ["AI Evaluation Summary", resultText(root?.aiEvaluationSummary ?? root?.AiEvaluationSummary ?? root?.summary ?? root?.rawAiReasoning, "No AI evaluation summary returned.")],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pass Status</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${passed ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" : "border-red-400/30 bg-red-400/10 text-red-400"}`}>
          {passed ? "Passed" : "Not Passed"}
        </span>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EducationTimeline({ items }: { items: any[] }) {
  return (
    <div className="relative space-y-4">
      <div className="absolute left-[1.125rem] top-3 bottom-3 hidden w-px bg-gradient-to-b from-[#7C3AED]/60 via-[#00D2FF]/40 to-transparent sm:block" />
      {items.map((item, index) => (
        <article key={index} className="card col relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 pl-8 transition hover:border-[#7C3AED]/30 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)] sm:pl-10">
          <span className="absolute left-3 top-6 hidden h-3 w-3 rounded-full border-2 border-[#7C3AED] bg-[#0d1119] shadow-[0_0_10px_rgba(124,58,237,0.45)] sm:block" />
          <h3 className="text-lg font-bold text-foreground">{fieldValue(item, "institution", "Institution")}</h3>
          <p className="mt-1 text-sm font-medium text-[#A78BFA]">{fieldValue(item, "degree", "Degree")}</p>
          <p className="text-sm text-muted-foreground">{fieldValue(item, "courseOfStudy", "CourseOfStudy")}</p>
          <p className="mt-3 text-xs font-medium text-muted-foreground/80">{formatDateRange(item)}</p>
        </article>
      ))}
    </div>
  );
}

function ExperienceTimeline({ items }: { items: any[] }) {
  return (
    <div className="relative space-y-4">
      <div className="absolute left-[1.125rem] top-3 bottom-3 hidden w-px bg-gradient-to-b from-[#00D2FF]/60 via-[#7C3AED]/40 to-transparent sm:block" />
      {items.map((item, index) => {
        const tillDate = Boolean(item?.tillDate ?? item?.TillDate);
        return (
          <article key={index} className="card col relative rounded-2xl border border-white/10 bg-card p-6 pl-8 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-[#00D2FF]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:pl-10">
            <span className="absolute left-3 top-7 hidden h-3 w-3 rounded-full border-2 border-[#00D2FF] bg-[#0d1119] shadow-[0_0_10px_rgba(0,210,255,0.45)] sm:block" />
            <h3 className="text-lg font-bold text-foreground">{fieldValue(item, "companyName", "CompanyName", "company")}</h3>
            <p className="mt-1 text-sm font-medium text-[#00D2FF]">{fieldValue(item, "jobRole", "JobRole", "role")}</p>
            {fieldValue(item, "location", "Location", "", "") !== "—" && <p className="text-sm text-muted-foreground">{fieldValue(item, "location", "Location")}</p>}
            <p className="mt-3 text-xs font-medium text-muted-foreground/80">{formatDateRange(item, tillDate)}</p>
            {fieldValue(item, "jobDescription", "JobDescription", "description", "") !== "—" && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{fieldValue(item, "jobDescription", "JobDescription", "description")}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ProjectsGrid({ items }: { items: any[] }) {
  return (
    <>
      {items.map((item, index) => {
        const mediaUrl = item?.projectFileUrl ?? item?.ProjectFileUrl ?? item?.imageUrl ?? item?.ImageUrl;
        const isVideo = Boolean(item?.isVideo ?? item?.IsVideo);
        const projectUrl = fieldValue(item, "projectUrl", "ProjectUrl", "", "");
        return (
          <article key={index} className="card col overflow-hidden rounded-2xl border border-white/10 bg-card shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-[#00D2FF]/25 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            {mediaUrl && (
              <div className="border-b border-white/10 bg-black/20">
                {isVideo ? <video src={mediaUrl} controls className="max-h-52 w-full object-cover" /> : <img src={mediaUrl} alt={fieldValue(item, "projectName", "ProjectName")} className="max-h-52 w-full object-cover" />}
              </div>
            )}
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground">{fieldValue(item, "projectName", "ProjectName")}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{fieldValue(item, "description", "Description")}</p>
              {projectUrl !== "—" && (
                <a href={projectUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-[#00D2FF] transition hover:text-[#00B8DD] hover:underline">Visit Project</a>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}

function textOf(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const output = String(value).trim();
  return output || fallback;
}

function resultText(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => textOf(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  if (value && typeof value === "object") {
    const items = Object.values(value).map((item) => textOf(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  return textOf(value, fallback);
}

function fieldValue(item: any, ...keys: string[]): string {
  for (const key of keys) {
    if (!key) continue;
    const value = item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)];
    if (value !== null && value !== undefined && String(value).trim() !== "") return textOf(value);
  }
  return "—";
}

function formatDateRange(item: any, tillDate = false): string {
  const from = item?.fromDate ?? item?.FromDate ?? item?.start ?? item?.Start;
  const to = item?.endDate ?? item?.EndDate ?? item?.end ?? item?.End;
  const fromText = from ? formatMaybeDate(from) : "—";
  const toText = tillDate || Boolean(item?.tillDate ?? item?.TillDate) ? "Present" : to ? formatMaybeDate(to) : "—";
  return `${fromText} – ${toText}`;
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [];
}

function formatMaybeDate(value: any): string {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? textOf(value) : date.toLocaleDateString();
}
