import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Shield, Zap, Globe, Twitter, Linkedin, Link2,
  Copy, CheckCircle2, ArrowLeft, Star, Target, Medal,
  Download, BookOpen, Calendar, Award, User, Eye, Loader2,
  MapPin, Mail, Github, MessageCircle, BadgeCheck, ChevronDown,
  Briefcase, Sparkles, Code2, Menu, X,
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    setMobileNavOpen(false);
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
      <div className="flex min-h-screen items-center justify-center bg-[#080b10] px-4 text-white">
        <div className="max-w-sm text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-white/10" />
          <p className="text-lg font-bold text-white/60">{error}</p>
          <button onClick={() => navigate(getUser() ? "/user/dashboard" : "/")} className="mt-6 rounded-xl border border-[#00D2FF]/20 bg-[#00D2FF]/10 px-6 py-2.5 font-mono text-sm text-[#00D2FF] transition hover:bg-[#00D2FF]/20">
            ← Back to Brainepedia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(0,210,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Sticky navigation */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#080b10]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => navigate(getUser() ? "/user/dashboard" : "/")} className="flex items-center gap-2 font-mono text-xs text-white/40 transition hover:text-white/80">
            <ArrowLeft className="h-4 w-4" /> Brainepedia
          </button>
          <div className="hidden items-center gap-1 overflow-x-auto lg:flex">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeSection === section.id ? "bg-[#00D2FF]/15 text-[#00D2FF]" : "text-white/45 hover:text-white/80"
                }`}
              >
                {section.label}
              </button>
            ))}
            <Link href={virtualSelfUrl} className="whitespace-nowrap rounded-lg border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 px-3 py-1.5 text-xs font-medium text-[#9D4EDD] transition hover:bg-[#9D4EDD]/20">
              Chat with Virtual Self
            </Link>
          </div>
          <button className="rounded-lg p-2 text-white/60 lg:hidden" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle navigation">
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 lg:hidden">
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {visibleSections.map((section) => (
                  <button key={section.id} onClick={() => scrollTo(section.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    {section.label}
                  </button>
                ))}
                <Link href={virtualSelfUrl} className="rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 px-3 py-1 text-xs text-[#9D4EDD]">
                  Chat with Virtual Self
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="relative mx-auto max-w-6xl space-y-16 px-4 py-10">
        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-[#00D2FF]/15 bg-gradient-to-br from-[#00D2FF]/8 via-[#0d1119] to-[#9D4EDD]/8 p-6 sm:p-10">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <Avatar name={name} url={avatarUrl} size={120} />
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </span>
                )}
                {subscription && (
                  <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFD700]">
                    {subscription}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">{name}</h1>
              {title && <p className="mt-1 text-lg text-white/70">{title}</p>}
              {rankTitle && title !== rankTitle && <p className="mt-0.5 text-sm font-mono text-[#FFD700]/80">{rankTitle}</p>}
              {profession && <p className="mt-1 text-sm text-white/45">{profession}</p>}
              {location && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/50">
                  <MapPin className="h-4 w-4 text-[#00D2FF]" /> {location}
                </p>
              )}
              <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                {vxYears > 0 && <StatPill icon={<Shield className="h-3.5 w-3.5" />} label={`VX ${vxYears.toFixed(1)}`} color="text-[#00D2FF]" />}
                {totalXP > 0 && <StatPill icon={<Zap className="h-3.5 w-3.5" />} label={`${totalXP.toLocaleString()} XP`} color="text-[#9D4EDD]" />}
                {rankNum > 0 && <StatPill icon={<Medal className="h-3.5 w-3.5" />} label={`Rank #${rankNum}`} color="text-[#FFD700]" />}
                {badges.length > 0 && <StatPill icon={<Trophy className="h-3.5 w-3.5" />} label={`${badges.length} Badges`} color="text-white/60" />}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
              <Link href={virtualSelfUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9D4EDD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8B35C7]">
                <MessageCircle className="h-4 w-4" /> Chat with Virtual Self
              </Link>
              <button onClick={shareProfile} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm transition hover:bg-white/10">
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
                {copied ? "Copied!" : "Share Profile"}
              </button>
              <button onClick={downloadCvPlaceholder} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/10">
                <Download className="h-4 w-4" /> Download CV
              </button>
            </div>
          </div>
        </motion.section>

        {/* Overview */}
        <Section id="overview" title="Overview" icon={<Star className="h-4 w-4 text-[#FFD700]" />} refCb={(el) => { sectionRefs.current.overview = el; }}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard label="Profession" value={profession || "—"} />
            <OverviewCard label="Verified Experience" value={vxYears > 0 ? `${vxYears.toFixed(1)} years` : "—"} />
            <OverviewCard label="Total XP" value={totalXP > 0 ? totalXP.toLocaleString() : "—"} />
            <OverviewCard label="Missions Completed" value={missions.length > 0 ? String(missions.length) : "—"} />
          </div>
          {badges.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-mono uppercase tracking-wider text-white/35">Community Highlights</p>
              <div className="flex flex-wrap gap-2">
                {badges.slice(0, 6).map((badge: any, index: number) => (
                  <span key={index} className="rounded-full border border-[#FFD700]/20 bg-[#FFD700]/8 px-3 py-1 text-xs text-[#FFD700]">
                    {badge?.name || badge?.Name || "Badge"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {personalStatement && (
          <Section id="about" title="About" icon={<User className="h-4 w-4 text-[#00D2FF]" />} refCb={(el) => { sectionRefs.current.about = el; }}>
            <p className="whitespace-pre-wrap text-sm leading-8 text-white/75">{personalStatement}</p>
          </Section>
        )}

        {experience.length > 0 && (
          <Section id="experience" title="Experience" icon={<Briefcase className="h-4 w-4 text-[#00D2FF]" />} refCb={(el) => { sectionRefs.current.experience = el; }}>
            <ExperienceTimeline items={experience} />
          </Section>
        )}

        {education.length > 0 && (
          <Section id="education" title="Education" icon={<BookOpen className="h-4 w-4 text-[#FFD700]" />} refCb={(el) => { sectionRefs.current.education = el; }}>
            <EducationTimeline items={education} />
          </Section>
        )}

        {skills.length > 0 && (
          <Section id="skills" title="Skills" icon={<Star className="h-4 w-4 text-[#9D4EDD]" />} refCb={(el) => { sectionRefs.current.skills = el; }}>
            <div className="grid gap-4 sm:grid-cols-2">
              {skills.map((skill, index) => {
                const rating = Math.max(0, Math.min(100, Number(skill?.rating ?? skill?.Rating ?? 0)));
                const skillName = fieldValue(skill, "mySkill", "MySkill", "skill", "name", "Skill");
                return (
                  <article key={index} className="rounded-xl border border-white/6 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold">{skillName}</p>
                      <span className="font-mono text-sm text-[#00D2FF]">{rating}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${rating}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]" />
                    </div>
                  </article>
                );
              })}
            </div>
          </Section>
        )}

        {services.length > 0 && (
          <Section id="services" title="Services" icon={<Sparkles className="h-4 w-4 text-[#FFD700]" />} refCb={(el) => { sectionRefs.current.services = el; }}>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((item, index) => (
                <article key={index} className="rounded-xl border border-white/6 bg-white/[0.03] p-5 transition hover:border-[#00D2FF]/20">
                  <h3 className="font-bold">{fieldValue(item, "myServices", "MyServices", "service", "Service", "title")}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/65">{fieldValue(item, "description", "Description")}</p>
                </article>
              ))}
            </div>
          </Section>
        )}

        {projects.length > 0 && (
          <Section id="projects" title="Projects" icon={<Code2 className="h-4 w-4 text-[#9D4EDD]" />} refCb={(el) => { sectionRefs.current.projects = el; }}>
            <ProjectsGrid items={projects} />
          </Section>
        )}

        {interests.length > 0 && (
          <Section id="interests" title="Interests" icon={<HeartIcon />} refCb={(el) => { sectionRefs.current.interests = el; }}>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span key={index} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  {fieldValue(interest, "interest", "Interest", "name")}
                </span>
              ))}
            </div>
          </Section>
        )}

        {missions.length > 0 && (
          <Section id="missions" title="Mission Achievements" icon={<Target className="h-4 w-4 text-[#9D4EDD]" />} refCb={(el) => { sectionRefs.current.missions = el; }}>
            <div className="space-y-3">
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
                  <article key={index} className="overflow-hidden rounded-xl border border-white/6 bg-white/[0.03]">
                    <button type="button" onClick={() => setExpandedMission(expanded ? null : index)} className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-white/[0.02]">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{mTitle}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                          <span>{district}</span>
                          <span>{prof}</span>
                          <span>{difficulty}</span>
                          {xp != null && <span>{Number(xp).toLocaleString()} XP</span>}
                          {score != null && <span>{score}% score</span>}
                          {date && <span>{new Date(date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {passed != null && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${passed ? "border-emerald-400/30 text-emerald-300" : "border-red-400/30 text-red-300"}`}>
                            {passed ? "Passed" : "Not Passed"}
                          </span>
                        )}
                        <ChevronDown className={`h-4 w-4 text-white/30 transition ${expanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                          <div className="space-y-3 p-4 pt-2">
                            {feedback && (
                              <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-sm text-white/70">
                                <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-white/35">Feedback</p>
                                {feedback}
                              </div>
                            )}
                            {problemNodeId && (
                              <button onClick={() => viewPerformance(problemNodeId)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#00D2FF]/25 bg-[#00D2FF]/8 px-3 py-1.5 text-xs font-mono text-[#00D2FF] hover:bg-[#00D2FF]/15">
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
          <Section id="contact" title="Contact" icon={<Mail className="h-4 w-4 text-[#00D2FF]" />} refCb={(el) => { sectionRefs.current.contact = el; }}>
            <div className="grid gap-3 sm:grid-cols-2">
              {email && <ContactItem icon={<Mail className="h-4 w-4" />} label="Email" value={email} href={`mailto:${email}`} />}
              {linkedIn && <ContactItem icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={linkedIn} href={linkedIn.startsWith("http") ? linkedIn : `https://${linkedIn}`} />}
              {github && <ContactItem icon={<Github className="h-4 w-4" />} label="GitHub" value={github} href={github.startsWith("http") ? github : `https://${github}`} />}
              {location && <ContactItem icon={<MapPin className="h-4 w-4" />} label="Location" value={location} />}
            </div>
          </Section>
        )}

        <footer className="border-t border-white/5 pt-8 text-center">
          <p className="font-mono text-[10px] text-white/15">
            Powered by <a href="https://demo.brainepedia.com" className="text-[#00D2FF]/40 hover:text-[#00D2FF]/70">Brainepedia</a> · AI-Powered Career Growth Platform
          </p>
        </footer>
      </div>

      <Dialog open={Boolean(performance) || performanceLoading || Boolean(performanceError)} onOpenChange={(open) => { if (!open) { setPerformance(null); setPerformanceError(""); } }}>
        <DialogContent className="max-w-2xl border border-white/10 bg-[#0d1119] text-white">
          <DialogHeader>
            <DialogTitle>Mission Performance</DialogTitle>
            <DialogDescription>Evaluation result for this completed mission.</DialogDescription>
          </DialogHeader>
          {performanceLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 py-16 text-sm text-white/40">
              <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading mission performance...
            </div>
          ) : performanceError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">{performanceError}</div>
          ) : performance ? (
            <PerformanceResult result={performance} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ id, title, icon, children, refCb }: { id: string; title: string; icon: ReactNode; children: ReactNode; refCb: (el: HTMLElement | null) => void }) {
  return (
    <motion.section id={id} ref={refCb} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4 }} className="scroll-mt-28">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-mono uppercase tracking-[0.2em] text-white/35">
        {icon} {title}
      </h2>
      <div className="rounded-2xl border border-white/6 bg-[#0d1119]/80 p-5 sm:p-6">{children}</div>
    </motion.section>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-2 text-lg font-bold text-[#00D2FF]">{value}</p>
    </div>
  );
}

function StatPill({ icon, label, color }: { icon: ReactNode; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono ${color}`}>
      {icon} {label}
    </span>
  );
}

function ContactItem({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-4 transition hover:border-[#00D2FF]/20">
      <span className="text-[#00D2FF]">{icon}</span>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">{label}</p>
        <p className="mt-1 text-sm break-all text-white/75">{value}</p>
      </div>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" className="block">{content}</a>;
  return content;
}

function Avatar({ name, url, size = 80 }: { name: string; url?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return <img src={url} alt={name} onError={() => setErr(true)} className="rounded-2xl border-2 border-[#00D2FF]/40 object-cover shadow-[0_0_28px_rgba(0,210,255,0.2)]" style={{ width: size, height: size }} />;
  }
  return (
    <div className="flex items-center justify-center rounded-2xl border-2 border-[#00D2FF]/40 bg-gradient-to-br from-[#7C3AED] to-[#00D2FF] font-bold text-white shadow-[0_0_28px_rgba(0,210,255,0.2)]" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8 px-4 py-10">
      <div className="h-64 rounded-3xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5" />)}
      </div>
      <div className="h-48 rounded-2xl bg-white/5" />
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

function EducationTimeline({ items }: { items: any[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <article key={index} className="relative rounded-xl border border-white/6 bg-white/[0.03] p-4 pl-6">
          <span className="absolute left-3 top-5 h-full w-px bg-[#FFD700]/20" />
          <span className="absolute left-2.5 top-5 h-2 w-2 rounded-full bg-[#FFD700]" />
          <h3 className="font-bold">{fieldValue(item, "institution", "Institution")}</h3>
          <p className="mt-1 text-sm text-[#FFD700]/80">{fieldValue(item, "degree", "Degree")}</p>
          <p className="text-sm text-white/60">{fieldValue(item, "courseOfStudy", "CourseOfStudy")}</p>
          <p className="mt-2 font-mono text-xs text-white/35">{formatDateRange(item)}</p>
        </article>
      ))}
    </div>
  );
}

function ExperienceTimeline({ items }: { items: any[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const tillDate = Boolean(item?.tillDate ?? item?.TillDate);
        return (
          <article key={index} className="relative rounded-xl border border-white/6 bg-white/[0.03] p-4 pl-6">
            <span className="absolute left-3 top-5 h-full w-px bg-[#00D2FF]/20" />
            <span className="absolute left-2.5 top-5 h-2 w-2 rounded-full bg-[#00D2FF]" />
            <h3 className="font-bold">{fieldValue(item, "companyName", "CompanyName", "company")}</h3>
            <p className="mt-1 text-sm text-[#00D2FF]/80">{fieldValue(item, "jobRole", "JobRole", "role")}</p>
            {fieldValue(item, "location", "Location", "", "") !== "—" && <p className="text-sm text-white/50">{fieldValue(item, "location", "Location")}</p>}
            <p className="mt-2 font-mono text-xs text-white/35">{formatDateRange(item, tillDate)}</p>
            {fieldValue(item, "jobDescription", "JobDescription", "description", "") !== "—" && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{fieldValue(item, "jobDescription", "JobDescription", "description")}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ProjectsGrid({ items }: { items: any[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => {
        const mediaUrl = item?.projectFileUrl ?? item?.ProjectFileUrl ?? item?.imageUrl ?? item?.ImageUrl;
        const isVideo = Boolean(item?.isVideo ?? item?.IsVideo);
        const projectUrl = fieldValue(item, "projectUrl", "ProjectUrl", "", "");
        return (
          <article key={index} className="overflow-hidden rounded-xl border border-white/6 bg-white/[0.03] transition hover:border-[#9D4EDD]/25">
            {mediaUrl && (
              <div className="border-b border-white/6 bg-black/20">
                {isVideo ? <video src={mediaUrl} controls className="max-h-48 w-full object-cover" /> : <img src={mediaUrl} alt={fieldValue(item, "projectName", "ProjectName")} className="max-h-48 w-full object-cover" />}
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold">{fieldValue(item, "projectName", "ProjectName")}</h3>
              <p className="mt-2 text-sm leading-7 text-white/70">{fieldValue(item, "description", "Description")}</p>
              {projectUrl !== "—" && (
                <a href={projectUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs text-[#00D2FF] hover:underline">Visit Project</a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function HeartIcon() {
  return <span className="text-[#00D2FF]">♥</span>;
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
