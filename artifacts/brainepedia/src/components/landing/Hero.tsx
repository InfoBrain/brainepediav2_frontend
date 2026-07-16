import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-10">
        {/* Copy */}
        <motion.div
          className="flex-shrink-0 lg:w-[42%] text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-6">
            <Terminal className="w-4 h-4" />
            <span>Verified Career Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Stop Learning.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Start Proving.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
            The world's first AI-driven career platform. Solve real-world challenges. Earn Verified Experience (VX) that recruiters trust.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(0,210,255,0.4)] border border-primary"
              )}
            >
              Get Started
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-border/50 hover:bg-white/5">
              Watch Brainiac in Action
            </Button>
          </div>
        </motion.div>

        {/* Video — takes the remaining width, bold and large */}
        <motion.div
          className="flex-1 w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-primary/30 bg-[#0A0E14] shadow-[0_0_60px_rgba(0,210,255,0.18)] overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#0d1117]">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs font-mono text-muted-foreground">
                brainepedia.com/missions
              </span>
            </div>

            {/* Video */}
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              <video
                src="/hero-walkthrough.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              {/* top accent line */}
              <div className="pointer-events-none absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
