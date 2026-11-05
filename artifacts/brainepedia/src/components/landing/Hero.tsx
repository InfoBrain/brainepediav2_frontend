import { buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Bot, Check, ShieldCheck, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="bg-white pt-24 text-[#182137]">
      <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">
            <Sparkles className="h-3.5 w-3.5" />
            Verified career platform
          </p>
          <h1 className="mx-auto mt-3 max-w-[610px] text-4xl font-extrabold leading-[1.04] tracking-[-0.05em] sm:text-6xl lg:mx-0">
            Stop learning.
            <span className="text-[#7d4ccc]"> Start proving.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[590px] text-base leading-7 text-[#70798d] lg:mx-0">
            Solve real work, earn verified experience, and show employers proof they can trust. Missions, jobs, and your professional profile stay in one place.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/auth/register" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link href="/jobs" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Browse jobs
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-4 text-xs font-bold text-[#687185] lg:justify-start">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#7d4ccc]" /> Verified experience</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#7d4ccc]" /> Mission proof</span>
            <span className="inline-flex items-center gap-1.5"><Bot className="h-4 w-4 text-[#7d4ccc]" /> Brainiac guidance</span>
          </div>
        </div>

        <div className="relative mx-auto grid min-h-[360px] w-full max-w-[560px] place-items-center">
          <div className="absolute h-[430px] w-[430px] rounded-full bg-[radial-gradient(circle,#eee5fa_0,#f4f6ff_47%,transparent_69%)]" />
          <div className="relative z-[1] w-full max-w-[470px] rotate-0 rounded-[19px] border border-[#dcdfea] bg-white p-3 shadow-[0_28px_70px_rgba(39,42,69,0.15)] lg:rotate-[1.5deg]">
            <div className="flex h-7 items-center gap-1.5 border-b border-[#e6e8ef] text-[11px] text-[#9aa1b0]">
              <i className="h-1.5 w-1.5 rounded-full bg-[#e0d7ed]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#e0d7ed]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#e0d7ed]" />
              <span className="ml-auto">brainepedia.com/missions</span>
            </div>
            <div className="overflow-hidden rounded-b-xl bg-[#f7f8fb]" style={{ aspectRatio: "16/10" }}>
              <video src="/hero-walkthrough.mp4" autoPlay muted loop playsInline className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="absolute bottom-2 right-0 z-[2] flex w-[min(335px,92%)] items-center gap-3 rounded-[13px] border border-[#d7c8ed] bg-white p-3 text-left shadow-[0_12px_35px_rgba(28,33,54,0.08)]">
            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#7d4ccc] text-white">
              <Bot className="h-4 w-4" />
            </span>
            <span>
              <small className="block text-[11px] font-extrabold text-[#7d4ccc]">Brainiac</small>
              <strong className="text-sm">Your next mission is ready to prove.</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
