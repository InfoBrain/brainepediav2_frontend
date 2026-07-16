import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/** Keyframe path for the simulated mouse cursor (% of container w/h) */
const CURSOR_PATH = [
  { x: 55, y: 30, t: 0 },     // hover over mission list
  { x: 52, y: 38, t: 1.4 },   // move to mission card
  { x: 52, y: 38, t: 2.0 },   // click — pause
  { x: 60, y: 50, t: 3.2 },   // scroll to challenge section
  { x: 38, y: 62, t: 4.6 },   // move to Brainiac AI chat input
  { x: 38, y: 62, t: 5.5 },   // click to type hint request
  { x: 45, y: 72, t: 7.0 },   // hover over submit button
  { x: 45, y: 72, t: 7.8 },   // click submit
  { x: 50, y: 55, t: 9.2 },   // watch AI evaluation panel appear
  { x: 50, y: 42, t: 11.0 },  // XP reward notification
  { x: 55, y: 30, t: 13.0 },  // back to mission list — loop
];

function useCursorPos(playing: boolean) {
  const [pos, setPos] = useState({ x: CURSOR_PATH[0].x, y: CURSOR_PATH[0].y });
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const totalDuration = CURSOR_PATH[CURSOR_PATH.length - 1].t; // seconds

  useEffect(() => {
    if (!playing) return;
    const animate = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = ((now - startRef.current) / 1000) % totalDuration;

      // find surrounding keyframes
      let from = CURSOR_PATH[0];
      let to = CURSOR_PATH[1];
      for (let i = 0; i < CURSOR_PATH.length - 1; i++) {
        if (elapsed >= CURSOR_PATH[i].t && elapsed < CURSOR_PATH[i + 1].t) {
          from = CURSOR_PATH[i];
          to = CURSOR_PATH[i + 1];
          break;
        }
      }
      const seg = to.t - from.t;
      const progress = seg > 0 ? (elapsed - from.t) / seg : 1;
      // ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setPos({
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [playing, totalDuration]);

  return pos;
}

function CursorDot({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20 transition-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
    >
      {/* SVG arrow cursor */}
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L2 18L6.5 13.5L10 20L12.5 18.5L9 12L15 12L2 2Z" fill="white" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const cursor = useCursorPos(playing);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

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
            <span>Verified Career Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Stop Learning.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Start Proving.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
            The world's first AI-driven career platform. Solve real-world challenges. Earn Verified Experience (VX) that recruiters trust.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/register" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(0,210,255,0.4)] border border-primary")}>
              Get Started
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-border/50 hover:bg-white/5">
              Watch Brainiac in Action
            </Button>
          </div>
        </motion.div>

        {/* Hero Visual — screen recording */}
        <motion.div
          className="flex-1 w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Browser chrome wrapper */}
          <div className="rounded-xl border border-primary/30 bg-[#0A0E14] shadow-[0_0_50px_rgba(0,210,255,0.15)] overflow-hidden">
            {/* top bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-[#0d1117]">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 flex-1 rounded-md bg-white/5 px-3 py-0.5 text-[11px] font-mono text-muted-foreground">
                brainepedia.com/missions
              </span>
            </div>

            {/* video area with cursor overlay */}
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              <video
                ref={videoRef}
                src="/hero-walkthrough.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              {/* animated cursor */}
              <CursorDot x={cursor.x} y={cursor.y} />
              {/* subtle top accent */}
              <div className="pointer-events-none absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            </div>
          </div>

          {/* caption below card */}
          <p className="mt-3 text-center text-xs font-mono text-muted-foreground tracking-[0.15em] uppercase">
            Live mission walkthrough · muted autoplay
          </p>
        </motion.div>
      </div>
    </section>
  );
}
