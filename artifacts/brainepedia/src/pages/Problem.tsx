import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function ProblemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Nav />
      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block px-3 py-1 bg-destructive/10 border border-destructive/20 text-destructive font-mono text-sm mb-8">
              CHAPTER 02 // THE RECKONING
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
              The career system you trusted is lying to you.
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed">
              Three uncomfortable truths about how the modern world measures competence.
            </p>
          </motion.div>
        </section>

        {/* The Three Lies */}
        <section className="space-y-32 mb-32">
          {/* Lie 1 */}
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center"
            >
              <div className="flex-1 order-2 md:order-1">
                <h2 className="text-4xl font-bold mb-6">Courses don't prove skill.</h2>
                <p className="text-xl text-muted-foreground mb-6">
                  Watching a 40-hour tutorial series and copying the instructor's code doesn't make you an engineer. It makes you a typist.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The certification industrial complex has convinced millions that completing a course is the same as acquiring a skill. It isn't. When faced with a blank editor and a novel problem, the illusion shatters.
                </p>
              </div>
              <div className="flex-1 order-1 md:order-2 w-full">
                <div className="aspect-square rounded-2xl bg-destructive/5 border border-destructive/20 flex flex-col items-center justify-center p-12 text-center">
                  <span className="text-7xl font-bold text-destructive mb-4">87%</span>
                  <p className="text-lg text-muted-foreground font-mono">of certificate holders fail real-world equivalency tasks.*</p>
                  <span className="text-xs text-muted-foreground opacity-50 mt-8">*Illustrative data based on technical interview pass rates.</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Lie 2 */}
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center"
            >
              <div className="flex-1 w-full">
                <div className="aspect-square rounded-2xl bg-orange-500/5 border border-orange-500/20 flex flex-col items-center justify-center p-12 text-center">
                  <span className="text-7xl font-bold text-orange-500 mb-4">$140k</span>
                  <p className="text-lg text-muted-foreground font-mono">Average debt for a credential that is increasingly ignored.</p>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">Degrees take years and still don't translate.</h2>
                <p className="text-xl text-muted-foreground mb-6">
                  By the time a curriculum is approved, the industry has moved on.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You spend four years learning theory, only to graduate into a market that demands practical execution. The gap between academic success and professional competence has never been wider.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Lie 3 */}
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center"
            >
              <div className="flex-1 order-2 md:order-1">
                <h2 className="text-4xl font-bold mb-6">Portfolios can be faked.</h2>
                <p className="text-xl text-muted-foreground mb-6">
                  In the age of AI and template-cloning, static artifacts carry zero trust.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Recruiters spend 6 seconds on a resume because they know most of it is exaggerated. A beautiful GitHub repo doesn't prove you wrote the code. A stunning Figma file doesn't prove you understand UX. Trust has evaporated from the hiring process.
                </p>
              </div>
              <div className="flex-1 order-1 md:order-2 w-full">
                <div className="aspect-square rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center p-12 text-center">
                  <span className="text-7xl font-bold text-primary mb-4">0</span>
                  <p className="text-lg text-muted-foreground font-mono">Inherent trust remaining in unverified portfolio pieces.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Cost Section */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-card border border-border/50 rounded-3xl p-12"
          >
            <h3 className="text-3xl font-bold mb-12 text-center">What this costs you</h3>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <div className="text-accent font-mono mb-2">01 // YEARS LOST</div>
                <p className="text-muted-foreground">Time spent acquiring credentials that don't move the needle on your career.</p>
              </div>
              <div>
                <div className="text-accent font-mono mb-2">02 // OPPORTUNITIES MISSED</div>
                <p className="text-muted-foreground">Being filtered out by ATS systems because you lack traditional markers, despite having the skill.</p>
              </div>
              <div>
                <div className="text-accent font-mono mb-2">03 // SALARY GAP</div>
                <p className="text-muted-foreground">Accepting lower pay because you cannot definitively prove your senior-level capabilities.</p>
              </div>
              <div>
                <div className="text-accent font-mono mb-2">04 // IMPOSTER SYNDROME</div>
                <p className="text-muted-foreground">The quiet anxiety that comes from knowing your credentials don't match your actual execution ability.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Split Section */}
        <section className="container mx-auto px-4 mb-32">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-px bg-border/50 overflow-hidden rounded-2xl border border-border/50">
            <div className="bg-background p-12">
              <h3 className="text-2xl font-bold mb-6 text-foreground">Who this system is NOT for</h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3"><span className="text-destructive mt-1">✕</span> People looking for shortcuts or hacks.</li>
                <li className="flex items-start gap-3"><span className="text-destructive mt-1">✕</span> Those who prefer watching videos to doing the work.</li>
                <li className="flex items-start gap-3"><span className="text-destructive mt-1">✕</span> Anyone satisfied with average competence.</li>
              </ul>
            </div>
            <div className="bg-card p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
              <h3 className="text-2xl font-bold mb-6 text-foreground">Who this system IS for</h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span> Operators ready to test their limits.</li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span> Builders who want their work to speak for itself.</li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span> Professionals seeking undeniable proof of their mastery.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-8">There's another way.</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/">
                <Button variant="ghost" className="text-muted-foreground">← Back to start</Button>
              </Link>
              <Link href="/solution">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(0,210,255,0.3)]">
                  Discover the Solution →
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