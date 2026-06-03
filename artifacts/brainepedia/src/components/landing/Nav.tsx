import { buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";
import logo from "@assets/branepedia_white_logo_(1)_1777483519569.png";
import { cn } from "@/lib/utils";
import { getUser, getUserRole, getDashboardPath } from "@/lib/auth";

export function Nav() {
  const user = getUser();
  const role = getUserRole();
  const dashboardPath = role ? getDashboardPath(role) : "/auth/login";

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
        <div className="hidden md:flex items-center gap-8">
          <Link href="/problem" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">The Problem</Link>
          <Link href="/solution" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">The System</Link>
          <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</Link>
          <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
          <Link href="/forum" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Community</Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href={dashboardPath}
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] border border-primary/50"
              )}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground hover:text-foreground")}>
                Log In
              </Link>
              <Link href="/auth/register" className={cn(buttonVariants({ variant: "default" }), "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] border border-primary/50")}>
                Enter City
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
