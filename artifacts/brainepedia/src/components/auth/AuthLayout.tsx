import { Link } from "wouter";
import whiteLogo from "@assets/branepedia_mark_white.png";
import colorLogo from "@assets/branepedia_mark_color.png";
import { ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CopyrightBar } from "@/components/ui/CopyrightBar";

interface AuthLayoutProps {
  children: ReactNode;
  wide?: boolean;
}

export function AuthLayout({ children, wide = false }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-white text-[#182137]">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(360px,0.82fr)_minmax(500px,1.18fr)]">
        <Link
          href="/"
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 text-xs font-bold text-[#7d4ccc] lg:text-white/75"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>

        <aside className="relative hidden min-h-[100dvh] flex-col justify-between bg-[radial-gradient(circle_at_15%_15%,#8054c1,transparent_38%),linear-gradient(145deg,#292744,#1c2035)] px-10 pb-10 pt-24 text-white lg:flex xl:px-14">
          <img src={whiteLogo} alt="Brainepedia" className="h-20 w-auto max-w-[8rem] shrink-0 self-start object-contain" />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ddd0f5]">Prove your competence</p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-5xl">
              Your next opportunity starts with what you can demonstrate.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#cccbd8]">
              Build verified experience, discover meaningful work, or recruit talent with evidence.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-[13px] border border-white/15 bg-white/[0.07] p-4">
            <ShieldCheck className="h-6 w-6 shrink-0 text-[#9de4c6]" />
            <div>
              <p className="text-sm font-extrabold">Verified Experience</p>
              <p className="text-xs text-[#c6c7d1]">Practical work. Evaluated outcomes. Clearer decisions.</p>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center overflow-y-auto px-4 py-20 sm:px-8 lg:px-[7vw]">
          <div className={wide ? "w-full max-w-[680px]" : "w-full max-w-[480px]"}>
            <img src={colorLogo} alt="Brainepedia" className="mb-6 h-9 w-auto shrink-0 object-contain lg:hidden" />
            {children}
          </div>
        </main>
      </div>
      <CopyrightBar className="border-t border-[#e6e8ef] bg-white" />
    </div>
  );
}

export function AuthIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7d4ccc]">{eyebrow}</p>
      <h2 className="mt-2 text-[1.85rem] font-extrabold leading-tight tracking-tight text-[#182137]">{title}</h2>
      {children ? <p className="mt-2 text-sm leading-relaxed text-[#70798d]">{children}</p> : null}
    </div>
  );
}
