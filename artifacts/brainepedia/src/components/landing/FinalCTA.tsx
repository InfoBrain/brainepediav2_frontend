import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function FinalCTA() {
  return (
    <section className="py-40 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            The Imperial City is waiting.
          </h2>
          <p className="text-2xl text-muted-foreground mb-12">
            Will you prove yourself? Or will you keep collecting meaningless certificates?
          </p>
          <Link href="/auth/register" className={cn(buttonVariants({ size: "lg" }), "h-16 px-12 text-xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_40px_rgba(255,255,255,0.2)]")}>
            Start Your First Mission
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
