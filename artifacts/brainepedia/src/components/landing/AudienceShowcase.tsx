import { Link } from "wouter";
import {
  Building2,
  GraduationCap,
  BriefcaseBusiness,
  Code2,
  Users,
  UserRound,
  LayoutDashboard,
  MessageSquare,
  Trophy,
  Award,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AUDIENCES = [
  {
    id: "professionals",
    icon: UserRound,
    title: "For Professionals",
    summary: "Prove skills through missions, earn XP and VX, and build a recruiter-ready dossier.",
    bullets: ["Mission dashboard", "District progress", "Public portfolio"],
    href: "/auth/register",
    cta: "Start proving skills",
  },
  {
    id: "employers",
    icon: Building2,
    title: "For Employers",
    summary: "Discover verified talent, post jobs, run assessments, and train teams.",
    bullets: ["Candidate Explorer", "Job management", "Corporate challenges"],
    href: "/auth/register?role=employer",
    cta: "Start hiring",
  },
  {
    id: "organizations",
    icon: Users,
    title: "For Organizations",
    summary: "Scale workforce development with team analytics, seats, and private challenges.",
    bullets: ["Team roster", "Grandmaster seats", "Team analytics"],
    href: "/auth/register?role=employer",
    cta: "Explore corporate",
  },
  {
    id: "universities",
    icon: GraduationCap,
    title: "For Universities",
    summary: "Bridge curriculum and employability with verifiable mission outcomes.",
    bullets: ["Structured districts", "Leaderboards", "Certificates pathway"],
    href: "/how-it-works",
    cta: "See how it works",
  },
  {
    id: "recruiters",
    icon: BriefcaseBusiness,
    title: "For Recruiters",
    summary: "Filter candidates by XP, VX, badges, and completed assessments — not just CV keywords.",
    bullets: ["Saved candidates", "Dossier review", "Application pipeline"],
    href: "/jobs",
    cta: "Browse talent signals",
  },
  {
    id: "technical-teams",
    icon: Code2,
    title: "For Technical Teams",
    summary: "Run code and prose missions with anti-cheat, Monaco editor, and AI evaluation.",
    bullets: ["Problem nodes", "Assessment engine", "Mission statistics"],
    href: "/solution",
    cta: "Explore missions",
  },
] as const;

const PLATFORM_VIEWS = [
  {
    title: "Mission Dashboard",
    description: "Track assigned missions, XP earned, and success rate in one view.",
    icon: Target,
    accent: "from-[#FFD700]/20 to-transparent",
    screenshot: "/screenshots/mission.png",
  },
  {
    title: "User Dashboard",
    description: "Your personal learning hub — XP, districts, leaderboard rank at a glance.",
    icon: LayoutDashboard,
    accent: "from-[#00D2FF]/20 to-transparent",
    screenshot: "/screenshots/dashboard.png",
  },
  {
    title: "Jobs & Applications",
    description: "Apply with verified experience instead of unverifiable credentials.",
    icon: BriefcaseBusiness,
    accent: "from-emerald-500/15 to-transparent",
    screenshot: "/screenshots/jobs.png",
  },
  {
    title: "Portfolio & CV",
    description: "Build a live recruiter-facing portfolio from your real mission evidence.",
    icon: Award,
    accent: "from-cyan-500/15 to-transparent",
    screenshot: "/screenshots/portfolio.png",
  },
  {
    title: "Mission Results",
    description: "AI-evaluated feedback and scores after every completed challenge.",
    icon: Trophy,
    accent: "from-amber-500/15 to-transparent",
    screenshot: "/screenshots/results.png",
  },
  {
    title: "Forum & Discussions",
    description: "Share knowledge, ask questions, and build community reputation.",
    icon: MessageSquare,
    accent: "from-[#7C3AED]/20 to-transparent",
    screenshot: "/screenshots/forum.png",
  },
];

export function AudienceShowcase() {
  return (
    <section className="container mx-auto px-4 py-16" aria-labelledby="audience-heading">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-sm font-mono uppercase tracking-[0.2em] text-primary">Built for every stakeholder</p>
        <h2 id="audience-heading" className="mt-3 text-3xl font-black md:text-4xl">
          One platform. Six ways to win.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Whether you are proving skills, hiring talent, or running corporate training — Brainepedia meets you where you are.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {AUDIENCES.map(({ id, icon: Icon, title, summary, bullets, href, cta }) => (
          <article
            key={id}
            className="flex flex-col rounded-2xl border border-white/10 bg-card/50 p-6 shadow-[0_0_24px_rgba(0,210,255,0.06)] transition-colors hover:border-primary/30"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
              {bullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-6 w-fit">
              <Link href={href}>{cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PlatformScreenshots() {
  return (
    <section className="border-y border-white/5 bg-[#07090F]/60 py-16" aria-labelledby="platform-views-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-accent">Platform preview</p>
          <h2 id="platform-views-heading" className="mt-3 text-3xl font-black md:text-4xl">
            See the experience before you sign up
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_VIEWS.map(({ title, description, icon: Icon, accent, screenshot }) => (
            <div
              key={title}
              className={`overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accent} to-[#0d1119]`}
            >
              <div className="border-b border-white/10 bg-[#0A0E14]/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" aria-hidden="true" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" aria-hidden="true" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">brainepedia.com</span>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/20" style={{ aspectRatio: "16/9" }}>
                  {screenshot ? (
                    <img
                      src={screenshot}
                      alt={`${title} screenshot`}
                      className="h-full w-full object-contain object-top"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon className="h-12 w-12 text-primary/60" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
