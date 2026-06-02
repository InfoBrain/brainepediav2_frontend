import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export function Brainiac() {
  return (
    <section className="py-32 relative bg-card/30" id="brainiac">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Meet Brainiac.</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Mentorship, not answers. Brainiac evaluates your submissions with the scrutiny of a principal engineer. It finds your blind spots, highlights your inefficiencies, and issues a final verdict.
            </p>
            <ul className="space-y-4">
              {[
                "Analyzes architecture, not just syntax.",
                "Flags security vulnerabilities and edge cases.",
                "Grades against industry-standard benchmarks.",
                "Issues independently verified Verified Experience (VX) scores.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="flex-1 w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="rounded-lg bg-[#0A0E14] border border-border overflow-hidden shadow-2xl font-mono text-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Terminal className="w-4 h-4" />
                  <span>brainiac-eval.sh</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-accent/80" />
                  <div className="w-3 h-3 rounded-full bg-primary/80" />
                </div>
              </div>
              <div className="p-6 space-y-4 text-muted-foreground">
                <div><span className="text-primary">&gt;</span> Analyzing submission: <span className="text-foreground">auth_middleware.ts</span></div>
                <div className="animate-pulse">...</div>
                <div><span className="text-primary">[PASS]</span> Token validation logic</div>
                <div><span className="text-primary">[PASS]</span> Error handling bounds</div>
                <div><span className="text-accent">[WARN]</span> Rate limiting implementation is O(N) where O(1) is expected.</div>
                <div className="pt-4 border-t border-border/50">
                  <div className="text-foreground">VERDICT: <span className="text-accent">PARTIAL_SUCCESS</span></div>
                  <div>XP_AWARDED: <span className="text-primary">450</span></div>
                  <div>FEEDBACK: "Implement a Redis-backed token bucket to resolve the rate-limiting bottleneck."</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
