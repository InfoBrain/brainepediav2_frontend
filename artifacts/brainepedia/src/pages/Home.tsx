import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Professions } from "@/components/landing/Professions";
import { XPLedger } from "@/components/landing/XPLedger";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Link } from "wouter";
import { BarChart3, BriefcaseBusiness, Building2, ClipboardCheck, Search, ShieldCheck, Sparkles, Target, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Nav />
      <main>
        <Hero />
        <VisualProof />
        <EmployerValue />
        <JobsTeaser />
        <HowItWorks />
        <Professions />
        <XPLedger />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function VisualProof() {
  const stats = [
    { label: "Proof-first growth", value: "XP + VX", icon: Trophy },
    { label: "Real challenges", value: "Problem Nodes", icon: Target },
    { label: "Recruiter-ready", value: "Public Dossiers", icon: ShieldCheck },
  ];
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-[0_0_30px_rgba(0,210,255,0.08)]">
            <Icon className="mb-4 h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <h2 className="mt-1 text-2xl font-black">{value}</h2>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmployerValue() {
  const features = [
    { label: "Candidate Discovery", icon: Search },
    { label: "Job Listings", icon: BriefcaseBusiness },
    { label: "Assessments", icon: ClipboardCheck },
    { label: "Team Training", icon: Users },
    { label: "Corporate Challenges", icon: Target },
    { label: "Grandmaster Plans", icon: Sparkles },
  ];
  return (
    <section id="employers" className="container mx-auto px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-mono text-primary">
            <Building2 className="h-4 w-4" /> Employers
          </div>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Build Better Teams with Proven Talent</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Hire from real mission evidence instead of guesswork. Brainepedia connects talent discovery, assessments, team training, and corporate challenges in one Grandmaster workflow.
          </p>
          <Button asChild size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/register?role=employer">Start Hiring</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ label, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-5">
              <Icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-bold">{label}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JobsTeaser() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-primary/10 p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-mono uppercase tracking-[0.2em] text-accent">Job Feed</p>
            <h2 className="mt-2 text-3xl font-black">Find roles that value proof.</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Browse company, position, location, salary, profession, and posted date before applying with your verified experience.</p>
          </div>
          <Button asChild size="lg" variant="outline">
            <Link href="/jobs"><BarChart3 className="mr-2 h-4 w-4" /> Browse Jobs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
