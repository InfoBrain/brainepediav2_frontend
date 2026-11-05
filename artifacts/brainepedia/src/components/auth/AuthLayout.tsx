import { Link } from "wouter";
import whiteLogo from "@assets/branepedia_white_logo_(1)_1777483519569.png";
import colorLogo from "@assets/branepedia_logo_1777539679828.png";
import { ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CopyrightBar } from "@/components/ui/CopyrightBar";

interface AuthLayoutProps {
  children: ReactNode;
  quote: string;
}

export function AuthLayout({ children, quote }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#182137]">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,0.82fr)_minmax(420px,1.18fr)]">
        <Link
          href="/"
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 text-xs font-bold text-[#7d4ccc] lg:text-[#ddd0f5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to brainepedia.com
        </Link>

        <aside className="relative hidden min-h-[100dvh] flex-col justify-between bg-[radial-gradient(circle_at_15%_15%,#8054c1,transparent_38%),linear-gradient(145deg,#292744,#1c2035)] px-12 pb-10 pt-24 text-white lg:flex">
          <img src={whiteLogo} alt="Brainepedia" className="h-10 w-auto" />
          <div className="max-w-lg">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ddd0f5]">Brainepedia</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-5xl">"{quote}"</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#cccbd8]">
              Prove your skills with missions, then carry that verified experience into jobs, profiles, and employer reviews.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-[13px] border border-white/15 bg-white/10 p-4">
            <ShieldCheck className="h-5 w-5 text-[#9de4c6]" />
            <div>
              <p className="text-sm font-extrabold">Verified career proof</p>
              <p className="text-xs text-[#c6c7d1]">Missions, experience, and applications stay tied to your account.</p>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-20 sm:px-8">
          <div className="w-full max-w-md">
            <img src={colorLogo} alt="Brainepedia" className="mb-8 h-8 w-auto lg:hidden" />
            {children}
          </div>
        </main>
      </div>
      <CopyrightBar className="border-t border-[#e6e8ef] bg-white" />
    </div>
  );
}
