import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  MapPin,
  Target,
  UploadCloud,
  Cpu,
  Award,
  ArrowRight,
} from "lucide-react";

export function HowItWorksPage() {
  const steps = [
    {
      icon: UserPlus,
      title: "Choose a Profession",
      def: "Pick a track. Software Engineer, Legal Counsel, Product Architect, Diagnostic Medicine.",
      expand:
        "Your profession defines the kind of districts you can enter, the kind of evidence you'll submit, and the rubric Brainiac will use to evaluate you. You can hold rank in more than one — but each one is earned independently.",
      example:
        "Anya picks Software Engineer. Her ledger now expects code, system designs, and architectural defenses as evidence.",
    },
    {
      icon: MapPin,
      title: "Enter a District",
      def: "Districts are themed challenge zones within the platform.",
      expand:
        "Districts cluster challenges by domain — Payments, Distributed Systems, Litigation, Cardiology, Checkout UX. Entry-level districts are open to Initiates. Specialized districts unlock with rank.",
      example:
        "Anya enters the Payments District. Five active challenges are available, each with its own overview.",
    },
    {
      icon: Target,
      title: "Solve a Mission",
      def: "Read the brief. Ship the work. No tutorial, no scaffold, no hand-holding.",
      expand:
        "Missions are real-world problems written by senior practitioners. They include constraints, edge cases, success criteria, and a deadline window. You solve them in your own environment, your own way.",
      example:
        "Anya is asked to refactor a legacy idempotency layer in a payments service. She has 72 hours.",
    },
    {
      icon: UploadCloud,
      title: "Submit Evidence",
      def: "Upload artifacts that prove what you did and why.",
      expand:
        "Evidence is mission-specific: code repositories, design files, written briefs, recorded walkthroughs, architectural diagrams, legal memoranda. Anything Brainiac needs to evaluate the work — and the thinking behind it.",
      example:
        "Anya pushes her refactor, attaches a 200-word architectural rationale, and submits a diff against the original.",
    },
    {
      icon: Cpu,
      title: "Brainiac Evaluates",
      def: "An AI senior reviewer scores your submission across multiple dimensions.",
      expand:
        "Brainiac doesn't grade for completion — it grades for quality. Every evaluation includes a rubric breakdown, line-level feedback, and a verdict that explains exactly why you did or did not earn the VX.",
      example:
        "Brainiac flags an unhandled retry race condition, scores Anya 88/100, and awards 320 XP + 1 VX in Payments.",
    },
    {
      icon: Award,
      title: "Earn XP + VX",
      def: "Your operator profile updates. Permanently. Publicly. Verifiably.",
      expand:
        "XP advances your rank. VX accumulates against specific competencies and remains attached to the underlying mission and evaluation. Recruiters can audit any unit of VX you claim.",
      example:
        "Anya is now a Level 14 Operator with 3 VX in Payments. Her ledger entry links to the mission, the diff, and the evaluation.",
    },
  ];

  const rubric = [
    { name: "Correctness", score: 92 },
    { name: "Architecture", score: 84 },
    { name: "Efficiency", score: 78 },
    { name: "Edge Cases", score: 71 },
    { name: "Communication", score: 95 },
  ];

  const ranks = [
    { label: "Initiate", level: "L1 – L9", note: "Entry-level districts only." },
    { label: "Operator", level: "L10 – L29", note: "Cleared at least 10 missions across one or more professions." },
    { label: "Architect", level: "L30 – L59", note: "Verified mastery in a specialization. Recognized by recruiters." },
    { label: "Master Operator", level: "L60+", note: "Top 1% of operators. Eligible to author missions of their own." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Nav />
      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-32 relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/30 text-accent font-mono text-sm mb-8">
              CHAPTER 04 // THE LOOP
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
              One loop.{" "}
              <span className="bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent inline-block pb-2">
                Infinite mastery.
              </span>
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed">
              Every operator follows the same six-step path. Each loop earns Verified Experience that compounds.
            </p>
          </motion.div>
        </section>

        {/* The Six Steps */}
        <section className="container mx-auto px-4 mb-32">
          <div className="max-w-5xl mx-auto space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                className="grid md:grid-cols-[80px_1fr] gap-6 p-8 bg-card border border-border/50 rounded-2xl hover:border-primary/40 transition-colors group"
              >
                <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-6">
                  <div className="font-mono text-sm text-muted-foreground">
                    STEP_0{i + 1}
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,210,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] transition-shadow">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                  <p className="text-primary/80 font-mono text-sm mb-4">{s.def}</p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {s.expand}
                  </p>
                  <div className="border-l-2 border-accent/40 pl-4 text-sm text-muted-foreground/80 italic">
                    In practice: {s.example}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Challenge Overview Anatomy */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="font-mono text-sm text-accent mb-4">// ANATOMY OF A CHALLENGE</div>
              <h2 className="text-4xl font-bold">What a challenge overview actually contains.</h2>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden font-mono text-sm">
              <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-muted-foreground">CHALLENGE_OVERVIEW // PAYMENTS_DISTRICT // PMT_4471</span>
                </div>
                <span className="text-accent">ACTIVE</span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="text-muted-foreground text-xs mb-2">OBJECTIVE</div>
                  <div className="text-foreground">
                    Refactor the idempotency layer of a high-throughput payments service to eliminate a known retry race condition under partial-failure conditions.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs mb-2">CONSTRAINTS</div>
                    <ul className="text-foreground/90 space-y-1 text-xs">
                      <li>• Zero downtime migration</li>
                      <li>• Backwards-compatible API</li>
                      <li>• Postgres + Redis only</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-2">EVIDENCE REQUIRED</div>
                    <ul className="text-foreground/90 space-y-1 text-xs">
                      <li>• Pull request with diff</li>
                      <li>• 200-word rationale</li>
                      <li>• Test coverage report</li>
                    </ul>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                  <div>
                    <div className="text-muted-foreground text-xs mb-2">DEADLINE</div>
                    <div className="text-accent">72H</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-2">XP REWARD</div>
                    <div className="text-primary">+320 XP</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-2">VX CATEGORY</div>
                    <div className="text-accent">PAYMENTS_INFRA</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Rubric Preview */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="font-mono text-sm text-accent mb-4">// BRAINIAC EVALUATION RUBRIC</div>
              <h2 className="text-4xl font-bold">How Brainiac scores your work.</h2>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 font-mono text-sm">
              {rubric.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground">{r.name.toUpperCase()}</span>
                    <span className="text-primary">{r.score}/100</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.08 + 0.2, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_rgba(0,210,255,0.5)]"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* The Compounding Effect */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="font-mono text-sm text-accent mb-4">// THE COMPOUNDING EFFECT</div>
              <h2 className="text-4xl font-bold">Each loop makes the next one heavier.</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                XP advances your rank. VX accumulates against your specializations. Together, they form a record no resume can fake.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {ranks.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-xl border bg-card relative overflow-hidden ${
                    i === ranks.length - 1
                      ? "border-accent/50 shadow-[0_0_25px_rgba(255,215,0,0.1)]"
                      : "border-border/50"
                  }`}
                >
                  <div className={`font-mono text-xs mb-3 ${i === ranks.length - 1 ? "text-accent" : "text-primary"}`}>
                    {r.level}
                  </div>
                  <div className="text-2xl font-bold mb-2">{r.label}</div>
                  <div className="text-sm text-muted-foreground">{r.note}</div>
                  {i < ranks.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-4 h-4 text-border -translate-y-1/2 z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Closing CTA */}
        <section className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-8">Ready to begin?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/solution">
                <Button variant="ghost" className="text-muted-foreground">
                  ← Back to the System
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(0,210,255,0.3)]"
                >
                  Get Started →
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
