import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, X, MessageCircle, Sparkles } from "lucide-react";
import { clearToken, getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logoUrl from "@assets/branepedia_logo_1777539679828.png";
import { CopyrightBar } from "@/components/ui/CopyrightBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
};

type Theme = "user" | "admin" | "employer";

const themeMap: Record<
  Theme,
  {
    accent: string;
    accentText: string;
    accentBorder: string;
    accentGlow: string;
    badge: string;
  }
> = {
  user: {
    accent: "bg-[#FFD700]/10",
    accentText: "text-[#FFD700]",
    accentBorder: "border-[#FFD700]/30",
    accentGlow: "shadow-[0_0_20px_rgba(255,215,0,0.25)]",
    badge: "bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/40",
  },
  admin: {
    accent: "bg-[#6366F1]/10",
    accentText: "text-[#A5B4FC]",
    accentBorder: "border-[#6366F1]/30",
    accentGlow: "shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    badge: "bg-[#475569]/30 text-slate-300 border-slate-500/40",
  },
  employer: {
    accent: "bg-[#00D2FF]/10",
    accentText: "text-[#00D2FF]",
    accentBorder: "border-[#00D2FF]/30",
    accentGlow: "shadow-[0_0_20px_rgba(0,210,255,0.25)]",
    badge: "bg-[#00D2FF]/10 text-[#00D2FF] border-[#00D2FF]/40",
  },
};

export function DashboardShell({
  nav,
  title,
  subtitle,
  headerRight,
  theme = "user",
  showBrainiac = false,
  children,
}: {
  nav: NavItem[];
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  theme?: Theme;
  showBrainiac?: boolean;
  children: ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const t = themeMap[theme];
  const [user, setUser] = useState(getUser);

  useEffect(() => {
    const handleAuthChange = () => setUser(getUser());
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const requestLogout = () => setLogoutOpen(true);

  const confirmLogout = () => {
    clearToken();
    setLocation("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#0d1119] sticky top-0 h-screen">
        <SidebarContent
          nav={nav}
          location={location}
          theme={t}
          onNavigate={() => setMobileOpen(false)}
          onLogout={requestLogout}
        />
      </aside>

      {/* Sidebar - mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#0d1119] border-r border-white/5 z-50 md:hidden flex flex-col"
            >
              <SidebarContent
                nav={nav}
                location={location}
                theme={t}
                onNavigate={() => setMobileOpen(false)}
                onLogout={requestLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0A0E14]/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 md:px-8 py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground font-mono truncate">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {headerRight}
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span>{user?.email || user?.userName || "operator"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={requestLogout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
        <CopyrightBar className="border-t border-white/5" />
      </div>

      {showBrainiac && <BrainiacWidget />}

      {/* Logout confirmation dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="bg-[#0d1119] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Sign out of Brainepedia?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Your session will end and you'll need to log back in to continue your mission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/5">
              Stay in
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-destructive/80 hover:bg-destructive text-white border-0"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SidebarContent({
  nav,
  location,
  theme,
  onNavigate,
  onLogout,
}: {
  nav: NavItem[];
  location: string;
  theme: typeof themeMap.user;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <img src={logoUrl} alt="Brainepedia" className="h-9 w-9" />
        <div>
          <div className="font-bold tracking-wide text-sm">Brainepedia</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
            Imperial Console
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map((item, i) => {
          const active = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          const showSectionHeader =
            !!item.section && (i === 0 || nav[i - 1].section !== item.section);
          return (
            <div key={`${item.href}__${item.label}`}>
              {showSectionHeader && (
                <div className="px-3 pt-4 pb-1.5 text-[9px] uppercase tracking-[0.18em] font-mono text-muted-foreground/50 select-none">
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? `${theme.accent} ${theme.accentText} ${theme.accentBorder} border`
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );
}

function BrainiacWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="mb-3 w-72 bg-[#13182240] backdrop-blur-md border border-[#7C3AED]/40 rounded-xl p-4 shadow-[0_0_30px_rgba(124,58,237,0.35)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#A78BFA]" />
              <div className="text-xs font-mono uppercase tracking-wider text-[#A78BFA]">
                Brainiac
              </div>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              Tip: Complete a mission today to climb the District ranking. Need a hint? Just ask.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:scale-105 transition-transform"
        title="Brainiac AI"
      >
        <MessageCircle className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}
