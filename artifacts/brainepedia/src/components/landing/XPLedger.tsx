import { motion } from "framer-motion";
import { BadgeCheck, Hexagon, ShieldAlert } from "lucide-react";

export function XPLedger() {
  return (
    <section className="py-32 bg-card/20 relative" id="ledger">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
        <motion.div
          className="flex-1 w-full"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="rounded-xl border border-border/50 bg-background p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full blur-2xl" />

            <div className="flex items-center justify-between border-b border-border/50 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded bg-card border border-border flex items-center justify-center font-mono text-2xl text-foreground font-bold">
                  JS
                </div>
                <div>
                  <h3 className="text-xl font-bold">J. Smith</h3>
                  <p className="text-primary font-mono text-sm">ARCHITECT_CLASS</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-accent">84,200 VX</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Verified Exp</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 rounded bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <Hexagon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Distributed Systems Core</span>
                </div>
                <span className="font-mono text-sm text-primary">+1,200 VX</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-sm">Zero-Day Patch Simulation</span>
                </div>
                <span className="font-mono text-sm text-primary">+2,500 VX</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-4 border-t border-border/50 border-dashed text-accent">
              <BadgeCheck className="w-5 h-5" />
              <span className="font-bold text-sm tracking-widest uppercase">Verified by Brainiac</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Verified Career Record.</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Your resume is a list of claims. Your Brainepedia VX record is independently verified and tamper-evident proof. Every mission you complete adds to your permanent public profile.
          </p>
          <p className="text-lg text-muted-foreground">
            Recruiters don't have to guess if you know what you're doing. They check your verified record — evaluated by AI, not self-reported.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
