import { buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";
import logo from "@assets/branepedia_white_logo_(1)_1777483519569.png";
import { cn } from "@/lib/utils";
import { getUser, getUserRole, getDashboardPath } from "@/lib/auth";
import { useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", type: "link" },
  { href: "/#problem", label: "The Problem", type: "anchor" },
  { href: "/#solution", label: "The Solution", type: "anchor" },
  { href: "/#how-it-works", label: "How It Works", type: "anchor" },
  { href: "/jobs", label: "Jobs", type: "link" },
  { href: "/forum", label: "Community", type: "link" },
  { href: "/#pricing", label: "Pricing", type: "anchor" },
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
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="Brainepedia"
            className="h-8 w-auto drop-shadow-[0_0_8px_rgba(0,210,255,0.35)] group-hover:drop-shadow-[0_0_12px_rgba(0,210,255,0.6)] transition-all duration-300"
          />
          <span className="font-bold text-xl tracking-tight text-foreground">Brainepedia</span>
        </Link>
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((item) => (
            item.type === "anchor" ? (
              <a key={item.href} href={item.href} onClick={(event) => scrollToHomeSection(event, item.href)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{item.label}</a>
            ) : (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{item.label}</Link>
            )
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
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
                "hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] border border-primary/50"
              )}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex text-muted-foreground hover:text-foreground")}>
                Login
              </Link>
              <Link href="/auth/register" className={cn(buttonVariants({ variant: "default" }), "hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] border border-primary/50")}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/95 px-4 py-4 shadow-lg lg:hidden">
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
            <div className="mt-3 grid gap-2 border-t border-border/40 pt-3 sm:hidden">
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
