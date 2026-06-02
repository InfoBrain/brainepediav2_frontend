import { motion } from "framer-motion";
import { BrainCircuit, ShieldCheck, Database, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function Solution() {
  return (
    <section className="py-32 relative overflow-hidden" id="missions">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Real missions. Real validation.</h2>
          <p className="text-xl text-muted-foreground">
            Brainepedia replaces passive learning with active execution. We don't teach you; we test you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
          >
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">AI Evaluation</h3>
            <p className="text-muted-foreground">
              Brainiac, our proprietary AI, reviews your work like a senior engineer. It grades architecture, logic, and efficiency.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
          >
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Verified Experience</h3>
            <p className="text-muted-foreground">
              Earn VX (Verified Experience) instead of meaningless certificates. Recruiters trust VX because it represents actual problem-solving.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-colors group"
          >
            <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Database className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Independently Verified Record</h3>
            <p className="text-muted-foreground">
              Your career progress is independently verified and tamper-evident. A public profile that proves exactly what you're capable of — backed by AI evaluation, not self-reporting.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/solution" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
            Read the full chapter <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
