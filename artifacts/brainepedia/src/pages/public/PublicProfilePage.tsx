import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Trophy, Zap, Linkedin, Link2, CheckCircle2, ArrowLeft, Medal,
  BookOpen, User, MapPin, Mail, Phone, Github, MessageCircle, BadgeCheck,
  Briefcase, GraduationCap, Sparkles, Wrench, FolderKanban, Heart, Target,
  Shield, Award, ExternalLink, FileText, Globe,
} from "lucide-react";
import logoUrl from "@assets/branepedia_mark_color.png";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { extractCompletedMissionResults } from "@/lib/aiCredits";
import { CompletedMissionResults } from "@/components/dossier/CompletedMissionResults";
import type { PublicMissionResultDto } from "@/lib/types/billingCredits";
import { useToast } from "@/hooks/use-toast";

type SectionId =
  | "about"
  | "experience"
  | "education"
  | "skills"
  | "services"
  | "projects"
  | "interests"
  | "missions"
  | "contact";

const NAV_SECTIONS: ReadonlyArray<{ id: SectionId; label: string; icon: React.ElementType }> = [
  { id: "about", label: "About", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "services", label: "Services", icon: Wrench },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "interests", label: "Interests", icon: Heart },
  { id: "missions", label: "Mission results", icon: Target },
  { id: "contact", label: "Contact", icon: Mail },
];

/* Sticky header height; sections scroll to sit under the header + section nav. */
const HEADER_OFFSET_CLASS = "scroll-mt-[8.5rem] lg:scroll-mt-24";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("about");

  const portfolioRoot = (profile as any)?.portfolio ?? (profile as any)?.Portfolio ?? profile;
  const name = profile?.DisplayName || profile?.displayName || profile?.fullName || profile?.FullName || "Brainepedia Member";
  const avatarUrl = profile?.ProfilePictureUrl || profile?.profilePictureUrl || profile?.avatarUrl || null;
  const profession = profile?.ActiveProfession || profile?.activeProfession || portfolioRoot?.profession || portfolioRoot?.Profession || "";
  const title = profile?.ProfessionalTitle || profile?.professionalTitle || portfolioRoot?.currentTitle || portfolioRoot?.CurrentTitle || "";
  const totalXP = Number(profile?.TotalXp ?? profile?.totalXp ?? profile?.TotalXP ?? profile?.totalXP ?? 0);
  const vxYears = Number(profile?.VerifiedExperienceYears ?? profile?.verifiedExperienceYears ?? 0);
  const rankNum = Number(profile?.GlobalLeaderboardRank ?? profile?.globalLeaderboardRank ?? 0);
  const rankTitle = textOf(profile?.rankTitle ?? profile?.RankTitle ?? profile?.currentRank ?? profile?.CurrentRank, "");
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
  const missions: PublicMissionResultDto[] = extractCompletedMissionResults(portfolioRoot);
  const certifications = list(portfolioRoot?.certifications ?? portfolioRoot?.Certifications);
  const email = textOf(portfolioRoot?.email ?? portfolioRoot?.Email ?? profile?.email ?? profile?.Email, "");
  const phone = textOf(portfolioRoot?.phoneNumber ?? portfolioRoot?.PhoneNumber ?? portfolioRoot?.phone ?? portfolioRoot?.Phone, "");
  const linkedIn = textOf(portfolioRoot?.linkedIn ?? portfolioRoot?.LinkedIn ?? portfolioRoot?.linkedin, "");
  const github = textOf(portfolioRoot?.github ?? portfolioRoot?.Github ?? portfolioRoot?.GitHub, "");
  const website = textOf(portfolioRoot?.website ?? portfolioRoot?.Website ?? portfolioRoot?.portfolioUrl ?? portfolioRoot?.PortfolioUrl, "");
  const publicUrl = `${window.location.origin}/public-profile/${encodeURIComponent(userId)}`;
  const virtualSelfUrl = `/public-profile/${encodeURIComponent(userId)}/virtual-self`;
  const hasContact = Boolean(email || phone || linkedIn || github || website || location);
  const homeHref = getUser() ? "/user/dashboard" : "/";

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.filter((section) => {
      switch (section.id) {
        case "about": return Boolean(personalStatement);
        case "education": return education.length > 0 || certifications.length > 0;
        case "experience": return experience.length > 0;
        case "skills": return skills.length > 0;
        case "services": return services.length > 0;
        case "projects": return projects.length > 0;
        case "interests": return interests.length > 0;
        case "missions": return missions.length > 0;
        case "contact": return hasContact;
        default: return true;
      }
    });
  }, [personalStatement, education, certifications, experience, skills, services, projects, interests, missions, hasContact]);

  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
  const navRefs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});
  const navScrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    const headline = [title, profession].filter(Boolean).join(" · ");
    document.title = `${name}${headline ? ` — ${headline}` : ""} | Brainepedia`;
    const setMeta = (metaName: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${metaName}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, metaName); document.head.appendChild(el); }
      el.content = content;
    };
    const description = personalStatement
      ? personalStatement.slice(0, 157).trimEnd() + (personalStatement.length > 157 ? "..." : "")
      : `${name}${profession ? ` is a ${profession}` : ""} with ${vxYears.toFixed(1)} years of verified experience on Brainepedia.`;
    setMeta("description", description);
    setMeta("og:title", `${name}${headline ? ` — ${headline}` : ""} | Brainepedia`, true);
    setMeta("og:description", description, true);
    setMeta("og:image", avatarUrl || "https://demo.brainepedia.com/opengraph.jpg", true);
    setMeta("og:url", publicUrl, true);
    setMeta("og:type", "profile", true);
    setMeta("twitter:card", avatarUrl ? "summary" : "summary_large_image");
  }, [profile, name, title, profession, vxYears, avatarUrl, publicUrl, personalStatement]);

  useEffect(() => {
    if (!userId) { setError("Invalid profile link."); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [publicRes, portfolioRes] = await Promise.all([
        api.identity.publicProfile(userId),
        api.profiles.publicPortfolio(userId, { public: true }),
      ]);
      if (cancelled) return;
      if (portfolioRes.status === 404) {
        setError(portfolioRes.error || "This profile is not available or doesn't exist.");
        setLoading(false);
        return;
      }
      if (portfolioRes.ok && portfolioRes.data) {
        setProfile({
          ...((publicRes.ok && publicRes.data) ? publicRes.data as any : portfolioRes.data as any),
          portfolio: portfolioRes.data,
        });
      } else if (publicRes.ok && publicRes.data) {
        setProfile({ ...(publicRes.data as any), portfolio: undefined });
      } else {
        setError("This profile is not available or doesn't exist.");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (loading || visibleSections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target?.id as SectionId | undefined;
        if (id) setActiveSection(id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.05, 0.25, 0.5] },
    );
    visibleSections.forEach((section) => {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [visibleSections, loading]);

  /* Keep the active pill centred in the horizontally scrolling nav without moving the page. */
  useEffect(() => {
    const scroller = navScrollerRef.current;
    const pill = navRefs.current[activeSection];
    if (!scroller || !pill || scroller.scrollWidth <= scroller.clientWidth) return;
    const target = pill.offsetLeft - scroller.clientWidth / 2 + pill.offsetWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeSection]);

  const scrollTo = (id: SectionId) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: "Link copied", description: "The public profile link is on your clipboard." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Copy failed", description: publicUrl });
    }
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator
        .share({ title: `${name}${title ? ` — ${title}` : ""}`, text: `View ${name}'s verified professional profile on Brainepedia.`, url: publicUrl })
        .catch(() => {});
    } else {
      void copyLink();
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-4 text-[#182137] dark:bg-[#080b10] dark:text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#e6e8ef] bg-white p-8 text-center shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f5f0fc] text-[#7d4ccc] dark:bg-white/5">
            <User className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold">Profile unavailable</h1>
          <p className="mt-2 text-sm text-[#70798d] dark:text-white/55">{error}</p>
          <button
            type="button"
            onClick={() => navigate(homeHref)}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(125,76,204,0.28)] hover:bg-[#6538ad]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Brainepedia
          </button>
        </div>
      </div>
    );
  }

  const hasPortfolioContent = visibleSections.length > 0;
  const stats: Array<{ icon: React.ElementType; label: string; value: string; tint: string }> = [
    { icon: Shield, label: "Verified experience", value: vxYears > 0 ? `${vxYears.toFixed(1)} yrs` : "—", tint: "bg-[#eefaf4] text-[#168a68] dark:bg-emerald-400/10 dark:text-emerald-300" },
    { icon: Zap, label: "Experience points", value: totalXP > 0 ? totalXP.toLocaleString() : "—", tint: "bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]" },
    { icon: Trophy, label: "Global rank", value: rankNum > 0 ? `#${rankNum}` : "—", tint: "bg-[#fff6e8] text-[#b87412] dark:bg-amber-400/10 dark:text-amber-300" },
    { icon: Target, label: "Missions completed", value: missions.length > 0 ? String(missions.length) : "—", tint: "bg-[#edf4ff] text-[#276ef1] dark:bg-sky-400/10 dark:text-sky-300" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#182137] dark:bg-[#080b10] dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#e6e8ef] bg-[rgba(255,255,255,0.92)] backdrop-blur-md dark:border-white/10 dark:bg-[rgba(13,17,25,0.92)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2" aria-label="Back to Brainepedia">
            <img src={logoUrl} alt="" className="h-8 w-auto shrink-0 object-contain" />
            <span className="hidden text-sm font-extrabold tracking-tight sm:inline">Brainepedia</span>
          </Link>
          <span className="hidden h-5 w-px bg-[#e6e8ef] dark:bg-white/10 sm:block" />
          <p className="hidden min-w-0 truncate text-xs font-extrabold uppercase tracking-[0.14em] text-[#7d4ccc] sm:block">Public professional profile</p>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={shareProfile}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#e6e8ef] bg-white px-3 text-sm font-bold text-[#182137] shadow-sm hover:bg-[#f7f8fb] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-[#168a68]" /> : <Link2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
            </button>
            <Link
              href={virtualSelfUrl}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#7d4ccc] px-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(125,76,204,0.28)] hover:bg-[#6538ad]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat with Virtual Self</span>
              <span className="sm:hidden">Chat</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-[#e6e8ef] bg-white shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
          <div className="relative h-28 bg-[linear-gradient(120deg,#7d4ccc_0%,#5b35c5_45%,#276ef1_100%)] sm:h-40">
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.6),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.35),transparent_35%)]" />
          </div>
          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="-mt-12 shrink-0 sm:-mt-16">
                <Avatar name={name} url={avatarUrl} />
              </div>
              <div className="min-w-0 flex-1 sm:pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eefaf4] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#168a68] dark:bg-emerald-400/10 dark:text-emerald-300">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified professional
                    </span>
                  )}
                  {subscription && (
                    <span className="inline-flex items-center rounded-full bg-[#fff6e8] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#b87412] dark:bg-amber-400/10 dark:text-amber-300">
                      {subscription}
                    </span>
                  )}
                  {rankTitle && rankTitle !== title && (
                    <span className="inline-flex items-center rounded-full bg-[#f5f0fc] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#7d4ccc] dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]">
                      {rankTitle}
                    </span>
                  )}
                </div>
                <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
                {(title || profession) && (
                  <p className="mt-1 break-words text-base font-semibold text-[#7d4ccc] dark:text-[#C4B5FD]">
                    {[title, profession].filter((v, i, arr) => v && arr.indexOf(v) === i).join(" · ")}
                  </p>
                )}
                {location && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#70798d] dark:text-white/55">
                    <MapPin className="h-4 w-4 shrink-0" /> {location}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:w-auto sm:flex-row sm:pt-1">
                <Link
                  href={virtualSelfUrl}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(125,76,204,0.28)] hover:bg-[#6538ad]"
                >
                  <MessageCircle className="h-4 w-4" /> Chat with Virtual Self
                </Link>
                <button
                  type="button"
                  onClick={shareProfile}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e6e8ef] bg-white px-4 text-sm font-bold text-[#182137] hover:bg-[#f7f8fb] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-[#168a68]" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "Link copied" : "Share profile"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#e6e8ef] bg-[#fafbfc] p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${stat.tint}`}>
                    <stat.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold leading-none tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase leading-snug tracking-wide text-[#70798d] dark:text-white/50">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section nav — horizontal pills on small screens */}
        {hasPortfolioContent && (
          <nav
            aria-label="Profile sections"
            className="sticky top-16 z-30 -mx-4 mt-4 border-b border-[#e6e8ef] bg-[#f7f8fb]/95 px-4 py-2 backdrop-blur-md dark:border-white/10 dark:bg-[#080b10]/95 sm:-mx-6 sm:px-6 lg:hidden"
          >
            <div ref={navScrollerRef} className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleSections.map((section) => {
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    ref={(el) => { navRefs.current[section.id] = el; }}
                    onClick={() => scrollTo(section.id)}
                    aria-current={active ? "true" : undefined}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? "bg-[#7d4ccc] text-white shadow-[0_6px_14px_rgba(125,76,204,0.25)]"
                        : "border border-[#e6e8ef] bg-white text-[#626b7d] hover:text-[#7d4ccc] dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
            {hasPortfolioContent && (
              <nav aria-label="Profile sections" className="rounded-2xl border border-[#e6e8ef] bg-white p-2 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
                <p className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8c93a2]">On this profile</p>
                {visibleSections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollTo(section.id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${
                        active
                          ? "bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]"
                          : "text-[#667084] hover:bg-[#f5f0fc] hover:text-[#7d4ccc] dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {badges.length > 0 && (
              <div className="rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8c93a2]">Badges</p>
                  <span className="text-xs font-bold text-[#70798d] dark:text-white/50">{badges.length}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {badges.slice(0, 6).map((badge: any, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#fff6e8] text-[#b87412] dark:bg-amber-400/10 dark:text-amber-300">
                        <Medal className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 truncate font-semibold">{badge?.name || badge?.Name || "Badge"}</span>
                    </li>
                  ))}
                </ul>
                {badges.length > 6 && <p className="mt-2 text-xs text-[#70798d] dark:text-white/50">+{badges.length - 6} more</p>}
              </div>
            )}

            {(email || linkedIn || github || website) && (
              <div className="rounded-2xl border border-[#e6e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8c93a2]">Connect</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {email && <IconLink href={`mailto:${email}`} label="Email" icon={<Mail className="h-4 w-4" />} />}
                  {linkedIn && <IconLink href={externalHref(linkedIn)} label="LinkedIn" icon={<Linkedin className="h-4 w-4" />} external />}
                  {github && <IconLink href={externalHref(github)} label="GitHub" icon={<Github className="h-4 w-4" />} external />}
                  {website && <IconLink href={externalHref(website)} label="Website" icon={<Globe className="h-4 w-4" />} external />}
                </div>
              </div>
            )}
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-5">
            {!hasPortfolioContent && (
              <div className="rounded-2xl border border-dashed border-[#e6e8ef] bg-white p-8 text-center dark:border-white/10 dark:bg-[#0d1119]">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f5f0fc] text-[#7d4ccc] dark:bg-white/5">
                  <FileText className="h-6 w-6" />
                </span>
                <h2 className="mt-3 text-base font-extrabold">Portfolio details coming soon</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-[#70798d] dark:text-white/55">
                  {name} hasn't published portfolio details yet. You can still chat with their Virtual Self to learn about their experience.
                </p>
              </div>
            )}

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 lg:hidden">
                {badges.slice(0, 8).map((badge: any, index: number) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full border border-[#f0ddb4] bg-[#fff6e8] px-3 py-1 text-xs font-bold text-[#b87412] dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <Medal className="h-3.5 w-3.5" /> {badge?.name || badge?.Name || "Badge"}
                  </span>
                ))}
              </div>
            )}

            {personalStatement && (
              <Section id="about" icon={User} title="About" refCb={(el) => { sectionRefs.current.about = el; }}>
                <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-[#3c4557] dark:text-white/75">{personalStatement}</p>
              </Section>
            )}

            {experience.length > 0 && (
              <Section id="experience" icon={Briefcase} title="Experience" count={experience.length} refCb={(el) => { sectionRefs.current.experience = el; }}>
                <Timeline>
                  {experience.map((item, index) => {
                    const tillDate = Boolean(item?.tillDate ?? item?.TillDate);
                    const role = fieldValue(item, "jobRole", "JobRole", "role", "title");
                    const company = fieldValue(item, "companyName", "CompanyName", "company");
                    const loc = fieldValue(item, "location", "Location");
                    const desc = fieldValue(item, "jobDescription", "JobDescription", "description");
                    return (
                      <TimelineItem key={index} icon={Briefcase}>
                        <h3 className="break-words text-base font-extrabold">{role !== "—" ? role : company}</h3>
                        {role !== "—" && company !== "—" && <p className="mt-0.5 break-words text-sm font-semibold text-[#7d4ccc] dark:text-[#C4B5FD]">{company}</p>}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#70798d] dark:text-white/55">
                          <Chip>{formatDateRange(item, tillDate)}</Chip>
                          {loc !== "—" && <Chip><MapPin className="h-3 w-3" /> {loc}</Chip>}
                        </div>
                        {desc !== "—" && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#3c4557] dark:text-white/70">{desc}</p>}
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </Section>
            )}

            {(education.length > 0 || certifications.length > 0) && (
              <Section id="education" icon={GraduationCap} title="Education & certifications" count={education.length + certifications.length} refCb={(el) => { sectionRefs.current.education = el; }}>
                {education.length > 0 && (
                  <Timeline>
                    {education.map((item, index) => {
                      const degree = fieldValue(item, "degree", "Degree");
                      const course = fieldValue(item, "courseOfStudy", "CourseOfStudy", "fieldOfStudy");
                      return (
                        <TimelineItem key={index} icon={GraduationCap}>
                          <h3 className="break-words text-base font-extrabold">{fieldValue(item, "institution", "Institution", "school")}</h3>
                          {(degree !== "—" || course !== "—") && (
                            <p className="mt-0.5 break-words text-sm font-semibold text-[#7d4ccc] dark:text-[#C4B5FD]">
                              {[degree, course].filter((v) => v !== "—").join(" · ")}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#70798d] dark:text-white/55">
                            <Chip>{formatDateRange(item)}</Chip>
                          </div>
                        </TimelineItem>
                      );
                    })}
                  </Timeline>
                )}
                {certifications.length > 0 && (
                  <div className={education.length > 0 ? "mt-6" : ""}>
                    <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8c93a2]">Certifications</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {certifications.map((item, index) => (
                        <article key={index} className="flex items-start gap-3 rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff6e8] text-[#b87412] dark:bg-amber-400/10 dark:text-amber-300">
                            <Award className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-extrabold">{fieldValue(item, "name", "Name", "title", "certification")}</h3>
                            <p className="mt-0.5 break-words text-xs text-[#70798d] dark:text-white/55">{fieldValue(item, "issuer", "Issuer", "organization")}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {skills.length > 0 && (
              <Section id="skills" icon={Sparkles} title="Skills" count={skills.length} refCb={(el) => { sectionRefs.current.skills = el; }}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {skills.map((skill, index) => {
                    const ratingRaw = Number(skill?.rating ?? skill?.Rating ?? skill?.proficiency ?? skill?.Proficiency ?? NaN);
                    const hasRating = Number.isFinite(ratingRaw);
                    const rating = Math.max(0, Math.min(100, hasRating ? ratingRaw : 0));
                    const skillName = fieldValue(skill, "mySkill", "MySkill", "skill", "name", "Skill");
                    return (
                      <article key={index} className="rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 break-words text-sm font-extrabold">{skillName}</p>
                          {hasRating && <span className="shrink-0 text-xs font-extrabold text-[#7d4ccc] dark:text-[#C4B5FD]">{rating}%</span>}
                        </div>
                        {hasRating && (
                          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#efe8f8] dark:bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${rating}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                              className="h-full rounded-full bg-[linear-gradient(90deg,#7d4ccc,#276ef1)]"
                            />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </Section>
            )}

            {services.length > 0 && (
              <Section id="services" icon={Wrench} title="Services" count={services.length} refCb={(el) => { sectionRefs.current.services = el; }}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((item, index) => (
                    <article key={index} className="rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf4ff] text-[#276ef1] dark:bg-sky-400/10 dark:text-sky-300">
                          <Wrench className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-extrabold">{fieldValue(item, "myServices", "MyServices", "service", "Service", "title")}</h3>
                          {fieldValue(item, "description", "Description") !== "—" && (
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#3c4557] dark:text-white/70">{fieldValue(item, "description", "Description")}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </Section>
            )}

            {projects.length > 0 && (
              <Section id="projects" icon={FolderKanban} title="Projects" count={projects.length} refCb={(el) => { sectionRefs.current.projects = el; }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectsGrid items={projects} />
                </div>
              </Section>
            )}

            {interests.length > 0 && (
              <Section id="interests" icon={Heart} title="Interests" refCb={(el) => { sectionRefs.current.interests = el; }}>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span key={index} className="rounded-full border border-[#e6e8ef] bg-[#fafbfc] px-3.5 py-1.5 text-sm font-semibold text-[#3c4557] dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                      {fieldValue(interest, "interest", "Interest", "name")}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {missions.length > 0 && (
              <Section
                id="missions"
                icon={Target}
                title="Verified mission results"
                count={missions.length}
                description="Outcomes from Brainepedia missions evaluated by Brainiac AI."
                refCb={(el) => { sectionRefs.current.missions = el; }}
              >
                <CompletedMissionResults results={missions} />
              </Section>
            )}

            {hasContact && (
              <Section id="contact" icon={Mail} title="Contact" refCb={(el) => { sectionRefs.current.contact = el; }}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {email && <ContactItem icon={<Mail className="h-4 w-4" />} label="Email" value={email} href={`mailto:${email}`} />}
                  {phone && <ContactItem icon={<Phone className="h-4 w-4" />} label="Phone" value={phone} href={`tel:${phone}`} />}
                  {linkedIn && <ContactItem icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={linkedIn} href={externalHref(linkedIn)} external />}
                  {github && <ContactItem icon={<Github className="h-4 w-4" />} label="GitHub" value={github} href={externalHref(github)} external />}
                  {website && <ContactItem icon={<Globe className="h-4 w-4" />} label="Website" value={website} href={externalHref(website)} external />}
                  {location && <ContactItem icon={<MapPin className="h-4 w-4" />} label="Location" value={location} />}
                </div>
              </Section>
            )}

            {/* Virtual Self callout */}
            <section className="overflow-hidden rounded-2xl border border-[#e0d2f3] bg-[linear-gradient(135deg,#f5f0fc,#ffffff)] p-5 dark:border-[#7C3AED]/30 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.15),rgba(13,17,25,1))] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7d4ccc] dark:text-[#C4B5FD]">AI digital twin</p>
                  <h2 className="mt-1 text-lg font-extrabold">Ask {name.split(" ")[0]}'s Virtual Self</h2>
                  <p className="mt-1 text-sm text-[#70798d] dark:text-white/60">Get instant answers about experience, skills, and availability, trained on this verified profile.</p>
                </div>
                <Link
                  href={virtualSelfUrl}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(125,76,204,0.28)] hover:bg-[#6538ad]"
                >
                  <MessageCircle className="h-4 w-4" /> Start a conversation
                </Link>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-2 border-t border-[#e6e8ef] pt-6 text-center text-xs text-[#70798d] dark:border-white/10 dark:text-white/45">
          <p>
            Verified on <Link href="/" className="font-bold text-[#7d4ccc] hover:underline">Brainepedia</Link> · AI-powered career growth platform
          </p>
          <p className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Experience on this profile is earned through evaluated missions.</p>
        </footer>
      </main>
    </div>
  );
}

/* ─── Building blocks ────────────────────────────────────────────────────── */

function Section({
  id,
  icon: Icon,
  title,
  count,
  description,
  children,
  refCb,
}: {
  id: SectionId;
  icon: React.ElementType;
  title: string;
  count?: number;
  description?: string;
  children: ReactNode;
  refCb: (el: HTMLElement | null) => void;
}) {
  return (
    <motion.section
      id={id}
      ref={refCb}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35 }}
      className={`${HEADER_OFFSET_CLASS} min-w-0 rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119] sm:p-7`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            {typeof count === "number" && count > 0 && (
              <span className="rounded-full bg-[#f7f8fb] px-2 py-0.5 text-xs font-bold text-[#70798d] dark:bg-white/5 dark:text-white/55">{count}</span>
            )}
          </div>
          {description && <p className="mt-0.5 text-sm text-[#70798d] dark:text-white/55">{description}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function Timeline({ children }: { children: ReactNode }) {
  return <ol className="relative space-y-4 border-l border-[#e6e8ef] pl-6 dark:border-white/10 sm:pl-8">{children}</ol>;
}

function TimelineItem({ icon: Icon, children }: { icon: React.ElementType; children: ReactNode }) {
  return (
    <li className="relative min-w-0">
      <span className="absolute -left-10 top-0 grid h-8 w-8 place-items-center rounded-full border border-[#e6e8ef] bg-white text-[#7d4ccc] shadow-sm dark:border-white/10 dark:bg-[#0d1119] dark:text-[#C4B5FD] sm:-left-12">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-4 dark:border-white/10 dark:bg-white/[0.03]">{children}</div>
    </li>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e6e8ef] bg-white px-2.5 py-0.5 font-semibold dark:border-white/10 dark:bg-white/5">
      {children}
    </span>
  );
}

function ContactItem({ icon, label, value, href, external }: { icon: ReactNode; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <div className="flex h-full items-start gap-3 rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-4 transition-colors hover:border-[#d7c8ed] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#8c93a2]">{label}</p>
        <p className="mt-0.5 break-all text-sm font-semibold">{value}</p>
      </div>
      {href && <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9298a8]" />}
    </div>
  );
  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d4ccc]">
        {content}
      </a>
    );
  }
  return content;
}

function IconLink({ href, label, icon, external }: { href: string; label: string; icon: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-[#e6e8ef] bg-[#fafbfc] text-[#626b7d] transition-colors hover:border-[#d7c8ed] hover:text-[#7d4ccc] dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-white"
    >
      {icon}
    </a>
  );
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const [err, setErr] = useState(false);
  const ring = "h-24 w-24 shrink-0 rounded-2xl border-4 border-white shadow-[0_12px_30px_rgba(28,33,54,0.18)] dark:border-[#0d1119] sm:h-32 sm:w-32";
  if (url && !err) {
    return <img src={url} alt={name} onError={() => setErr(true)} className={`${ring} bg-white object-cover`} />;
  }
  return (
    <div className={`${ring} grid place-items-center bg-[linear-gradient(135deg,#7d4ccc,#276ef1)] text-3xl font-extrabold text-white sm:text-4xl`} aria-hidden="true">
      {initials(name)}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#080b10]">
      <div className="h-16 border-b border-[#e6e8ef] bg-white dark:border-white/10 dark:bg-[#0d1119]" />
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-[#e6e8ef] bg-white dark:border-white/10 dark:bg-[#0d1119]">
          <div className="h-28 bg-[#efe8f8] dark:bg-white/5 sm:h-40" />
          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 h-24 w-24 rounded-2xl bg-[#e6e8ef] dark:bg-white/10 sm:-mt-16 sm:h-32 sm:w-32" />
            <div className="mt-4 h-6 w-48 rounded bg-[#e6e8ef] dark:bg-white/10" />
            <div className="mt-2 h-4 w-64 max-w-full rounded bg-[#eef0f4] dark:bg-white/5" />
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-2xl bg-[#f3f4f7] dark:bg-white/5" />)}
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden h-64 rounded-2xl bg-white dark:bg-[#0d1119] lg:block" />
          <div className="space-y-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-44 rounded-2xl bg-white dark:bg-[#0d1119]" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsGrid({ items }: { items: any[] }) {
  return (
    <>
      {items.map((item, index) => {
        const mediaUrl = item?.projectMediaUrl ?? item?.ProjectMediaUrl ?? item?.projectFileUrl ?? item?.ProjectFileUrl ?? item?.imageUrl ?? item?.ImageUrl;
        const isVideo = Boolean(item?.isVideo ?? item?.IsVideo);
        const isDocument = typeof mediaUrl === "string" && /\.(pdf|docx|txt)(?:$|\?)/i.test(mediaUrl);
        const projectUrl = fieldValue(item, "projectUrl", "ProjectUrl");
        const projectName = fieldValue(item, "projectName", "ProjectName", "name", "title");
        const description = fieldValue(item, "description", "Description");
        return (
          <article key={index} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e6e8ef] bg-[#fafbfc] dark:border-white/10 dark:bg-white/[0.03]">
            {mediaUrl && !isDocument && (
              <div className="border-b border-[#e6e8ef] bg-[#eef0f4] dark:border-white/10 dark:bg-black/30">
                {isVideo
                  ? <video src={mediaUrl} controls className="aspect-video w-full object-cover" />
                  : <img src={mediaUrl} alt={projectName === "—" ? "Project" : projectName} loading="lazy" className="aspect-video w-full object-cover" />}
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="break-words text-sm font-extrabold">{projectName}</h3>
              {description !== "—" && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#3c4557] dark:text-white/70">{description}</p>}
              {(projectUrl !== "—" || (isDocument && mediaUrl)) && (
                <div className="mt-3 flex flex-wrap gap-3 pt-1">
                  {projectUrl !== "—" && (
                    <a href={externalHref(projectUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7d4ccc] hover:underline dark:text-[#C4B5FD]">
                      Visit project <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {isDocument && mediaUrl && (
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7d4ccc] hover:underline dark:text-[#C4B5FD]">
                      Open file <FileText className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name.charAt(0) || "B").toUpperCase();
}

function externalHref(value: string): string {
  const trimmed = value.trim();
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  return `https://${trimmed}`;
}

function textOf(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const output = String(value).trim();
  return output || fallback;
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
  const from = item?.fromDate ?? item?.FromDate ?? item?.startDate ?? item?.StartDate ?? item?.start ?? item?.Start;
  const to = item?.endDate ?? item?.EndDate ?? item?.toDate ?? item?.ToDate ?? item?.end ?? item?.End;
  const fromText = from ? formatMaybeDate(from) : "";
  const toText = tillDate || Boolean(item?.tillDate ?? item?.TillDate) ? "Present" : to ? formatMaybeDate(to) : "";
  if (!fromText && !toText) return "Dates not provided";
  if (!fromText) return toText;
  if (!toText) return fromText;
  return `${fromText} – ${toText}`;
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [];
}

function formatMaybeDate(value: any): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return textOf(value);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
