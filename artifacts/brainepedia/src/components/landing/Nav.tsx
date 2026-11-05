import { buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";
import lightLogo from "@assets/branepedia_mark_color.png";
import darkLogo from "@assets/branepedia_mark_white.png";
import { cn } from "@/lib/utils";
import { getUser, getUserRole, getDashboardPath } from "@/lib/auth";
import { useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", type: "link" },
  { href: "/#how-it-works", label: "How It Works", type: "anchor" },
  { href: "/#professionals", label: "For Professionals", type: "anchor" },
  { href: "/#employers", label: "For Employers", type: "anchor" },
  { href: "/#jobs-preview", label: "Explore Jobs", type: "anchor" },
  { href: "/#community", label: "Community", type: "anchor" },
] as const;

const MORE_LINKS = [
  { href: "/problem", label: "The Problem", type: "link" },
  { href: "/solution", label: "The Solution", type: "link" },
  { href: "/#pricing", label: "Pricing", type: "anchor" },
  { href: "/feed", label: "Feed", type: "link" },
  { href: "/forum", label: "Forum", type: "link" },
  { href: "/jobs", label: "All jobs", type: "link" },
] as const;

function scrollToHomeSection(event: MouseEvent<HTMLAnchorElement>, href: string, onDone?: () => void) {
  const [, hash] = href.split("#");
  if (!hash) return;
  if (window.location.pathname !== "/") return;
  const target = document.getElementById(hash);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", href);
  onDone?.();
}

export function Nav() {
  const user = getUser();
  const role = getUserRole();
  const dashboardPath = role ? getDashboardPath(role) : "/auth/login";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 h-[68px] w-full border-b border-[#e6e8ef] bg-white/95 backdrop-blur-md dark:border-border dark:bg-background/90">
      <div className="mx-auto flex h-full w-[min(1280px,calc(100%-28px))] items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <img src={lightLogo} alt="" className="h-9 w-auto shrink-0 object-contain dark:hidden" />
          <img src={darkLogo} alt="" className="hidden h-9 w-auto shrink-0 object-contain dark:block" />
          <span className="text-base font-extrabold tracking-tight text-[#182137] dark:text-white">Brainepedia</span>
        </Link>
        <div className="ml-auto hidden items-center gap-4 xl:flex">
          {NAV_LINKS.map((item) => (
            item.type === "anchor" ? (
              <a key={item.href} href={item.href} onClick={(event) => scrollToHomeSection(event, item.href)} className="text-[13px] font-bold text-[#5f687d] transition-colors hover:text-[#7d4ccc]">{item.label}</a>
            ) : (
              <Link key={item.href} href={item.href} className="text-[13px] font-bold text-[#5f687d] transition-colors hover:text-[#7d4ccc]">{item.label}</Link>
            )
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-[#667084] transition-colors hover:bg-[#f5f0fc] hover:text-[#7d4ccc] xl:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {user ? (
            <Link
              href={dashboardPath}
              className={cn(
                buttonVariants({ variant: "default" }),
                "hidden sm:inline-flex"
              )}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex text-muted-foreground hover:text-foreground")}>
                Login
              </Link>
              <Link href="/auth/register" className={cn(buttonVariants({ variant: "default" }), "hidden sm:inline-flex")}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-[#e6e8ef] bg-white px-4 py-4 shadow-lg xl:hidden">
          <div className="container mx-auto grid gap-2">
            {NAV_LINKS.map((item) => (
              item.type === "anchor" ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => scrollToHomeSection(event, item.href, () => setMobileOpen(false))}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-primary"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-primary"
                >
                  {item.label}
                </Link>
              )
            ))}
            {MORE_LINKS.map((item) => (
              item.type === "anchor" ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => scrollToHomeSection(event, item.href, () => setMobileOpen(false))}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-[#5f687d] hover:bg-[#f5f0fc] hover:text-[#7d4ccc]"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-[#5f687d] hover:bg-[#f5f0fc] hover:text-[#7d4ccc]"
                >
                  {item.label}
                </Link>
              )
            ))}
            <div className="mt-3 grid gap-2 border-t border-[#e6e8ef] pt-3 sm:hidden">
              {user ? (
                <Link
                  href={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className={cn(buttonVariants({ variant: "default" }), "w-full bg-primary text-primary-foreground hover:bg-primary/90")}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className={cn(buttonVariants({ variant: "ghost" }), "w-full text-muted-foreground hover:text-foreground")}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className={cn(buttonVariants({ variant: "default" }), "w-full bg-primary text-primary-foreground hover:bg-primary/90")}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
