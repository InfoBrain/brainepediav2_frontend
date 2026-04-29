import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Terminal, Shield, Trophy } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-12">
        <motion.div 
          className="flex-1 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-6">
            <Terminal className="w-4 h-4" />
            <span>SYSTEM.INIT: RECRUITMENT_PROTOCOL</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Stop Learning.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Start Proving.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
            The world's first AI-driven career RPG. Solve real-world missions. Earn Verified Experience (VX) that recruiters trust.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/register" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(0,210,255,0.4)] border border-primary")}>
              Enter the Imperial City
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-border/50 hover:bg-white/5">
              Watch Brainiac in Action
            </Button>
          </div>
        </motion.div>

        {/* Hero Visual - Holographic Dashboard */}
        <motion.div 
          className="flex-1 w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="relative rounded-lg border border-primary/30 bg-card/50 backdrop-blur-xl p-6 shadow-[0_0_50px_rgba(0,210,255,0.1)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            
            <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <span className="font-mono text-sm font-bold text-primary">OP-7</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-none">OPERATOR STATUS</h3>
                  <span className="font-mono text-xs text-primary">LEVEL 42 ARCHITECT</span>
                </div>
              </div>
              <Shield className="w-6 h-6 text-accent" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-mono">VERIFIED_XP</span>
                  <span className="text-accent font-mono font-bold">14,250</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden border border-border/50">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-blue-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-3 rounded bg-background/50 border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">MISSIONS_CLEARED</div>
                  <div className="text-2xl font-bold text-foreground">128</div>
                </div>
                <div className="p-3 rounded bg-accent/5 border border-accent/20">
                  <div className="text-xs text-accent font-mono mb-1">GLOBAL_RANK</div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    <span className="text-2xl font-bold text-accent">Top 4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
