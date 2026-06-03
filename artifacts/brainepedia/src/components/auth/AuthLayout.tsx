import { motion } from "framer-motion";
import { Link } from "wouter";
import logo from "@assets/branepedia_white_logo_(1)_1777483519569.png";
import { ReactNode } from "react";
import { CopyrightBar } from "@/components/ui/CopyrightBar";

interface AuthLayoutProps {
  children: ReactNode;
  quote: string;
}

export function AuthLayout({ children, quote }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden">
    <div className="flex flex-col md:flex-row flex-1 relative">
      {/* Absolute Back Link */}
      <div className="absolute top-6 left-6 z-50 leading-none">
        <Link href="/" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-primary transition-colors">
          ← Back to brainepedia.com
        </Link>
      </div>

      {/* LEFT PANEL (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] relative flex-col justify-between p-12 bg-gradient-to-b from-background via-background to-secondary/20 border-r border-border/50">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute left-0 top-1/4 -z-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"></div>
        </div>

        <div className="relative z-10 pt-10">
          <img src={logo} alt="Brainepedia" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(0,210,255,0.4)]" />
        </div>

        <div className="relative z-10 max-w-sm">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={quote} // re-animates when quote changes
            className="text-4xl font-bold leading-tight mb-4 text-foreground/90"
          >
            "{quote}"
          </motion.h2>
          <div className="w-12 h-1 bg-primary/50 shadow-[0_0_10px_rgba(0,210,255,0.5)]"></div>
        </div>

        <div className="relative z-10 mt-auto">
          <p className="font-mono text-xs text-muted-foreground opacity-60">
            Secure login · Brainepedia
          </p>
        </div>
      </div>

      {/* RIGHT PANEL (Form Area) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Mobile Logo */}
        <div className="md:hidden w-full flex justify-center mb-12 mt-12">
          <img src={logo} alt="Brainepedia" className="h-8 w-auto drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]" />
        </div>

        <motion.div 
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
    <CopyrightBar className="border-t border-white/5 bg-background" />
    </div>
  );
}
