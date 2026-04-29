import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Target, BrainCircuit, ShieldCheck, Database, Quote } from "lucide-react";

export function SolutionPage() {
  const pillars = [
    {
      icon: Target,
      title: "Real Missions",
      tagline: "Briefs, not lectures.",
      body: "Every mission is a self-contained, real-world problem authored by senior practitioners. No tutorials. No hand-holding. You read the brief, you ship the work.",
    },
    {
      icon: BrainCircuit,
      title: "Brainiac AI Evaluation",
      tagline: "A senior reviewer at infinite scale.",
      body: "Brainiac reviews your submission the way a principal engineer, lead designer, or partner attorney would. Architecture, edge cases, communication — all weighted, all scored, all explained.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Experience (VX)",
      tagline: "A credential that survives scrutiny.",
      body: "VX is not a participation trophy. Each unit of VX is bound to a specific mission, scored by Brainiac, and attached to the evidence you submitted. Recruiters can inspect the work behind the badge.",
    },
    {
      icon: Database,
      title: "Immutable Ledger",
      tagline: "Your career, written in stone.",
      body: "Every mission, every score, every evaluation is permanently recorded to your operator ledger. Nothing is editable, nothing is hidden. Your record is your reputation.",
    },
  ];

  const beforeAfter = [
    {
      before: "Stack of certificates that prove you completed a video.",
      after: "A ledger of missions that prove you can ship the work.",
    },
    {
      before: "A resume curated to look senior.",
      after: "A profile recruiters can audit, mission by mission.",
    },
    {
      before: "Anxiety that your credentials don't match your skill.",
      after: "Receipts that match every claim you make.",
    },
    {
      before: "Years of training before anyone takes you seriously.",
      after: "Verified Experience the moment you ship your first mission.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Nav />
      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-32 relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 text-primary font-mono text-sm mb-8">
              CHAPTER 03 // THE SYSTEM
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
              Stop performing.{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block pb-2">
                Start proving.
              </span>
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed">
              Brainepedia is a Proof-of-Competence Platform. Real missions. AI evaluation. Verified Experience that travels with you.
            </p>
          </motion.div>
        </section>

        {/* Four Pillars */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto mb-16 text-center"
          >
            <div className="font-mono text-sm text-accent mb-4">// THE FOUR PILLARS</div>
            <h2 className="text-4xl font-bold">A system built on what is real.</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {pillars.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="relative p-10 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="font-mono text-xs text-muted-foreground mb-6">
                  PILLAR_0{i + 1}
                </div>
                <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,210,255,0.15)]">
                  <p.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{p.title}</h3>
                <p className="text-primary/80 font-mono text-sm mb-4">{p.tagline}</p>
                <p className="text-muted-foreground leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Before / After */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-16">
              <div className="font-mono text-sm text-accent mb-4">// WHAT CHANGES FOR YOU</div>
              <h2 className="text-4xl font-bold">Before Brainepedia. After Brainepedia.</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-border/50 rounded-2xl overflow-hidden border border-border/50">
              <div className="bg-background p-8">
                <div className="font-mono text-xs text-destructive mb-6">// BEFORE</div>
                <ul className="space-y-6">
                  {beforeAfter.map((row, i) => (
                    <li key={i} className="text-muted-foreground border-l-2 border-destructive/30 pl-4">
                      {row.before}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0" />
                <div className="relative z-10">
                  <div className="font-mono text-xs text-primary mb-6">// AFTER</div>
                  <ul className="space-y-6">
                    {beforeAfter.map((row, i) => (
                      <li key={i} className="text-foreground border-l-2 border-primary/60 pl-4">
                        {row.after}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Operator Quote */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-card border border-border/50 rounded-3xl p-12 relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            <Quote className="w-12 h-12 text-primary/40 mb-6" />
            <blockquote className="text-2xl md:text-3xl text-foreground leading-relaxed mb-8 font-light">
              "I went from three years of certificates with nothing to show for them to a Verified Architect badge in four months. The badge got me the interview. The work behind the badge got me the job."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40" />
              <div>
                <div className="font-bold text-foreground">Anya R.</div>
                <div className="font-mono text-sm text-muted-foreground">
                  VERIFIED SOFTWARE ARCHITECT // OPERATOR OP-2418
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Transitional CTA */}
        <section className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-8">But how does it actually work?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/problem">
                <Button variant="ghost" className="text-muted-foreground">
                  ← Back to the Reckoning
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(0,210,255,0.3)]"
                >
                  See the Game Loop →
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
