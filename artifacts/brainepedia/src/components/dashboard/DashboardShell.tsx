import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, LogOut, Menu, MessageCircle, MessageSquare, Search, Sparkles, X } from "lucide-react";
import { clearToken, getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logoUrl from "@assets/branepedia_mark_color.png";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { BrainiacCreditsIndicator } from "@/components/credits/BrainiacCreditsIndicator";
import { useOptionalBrainiacCredits } from "@/hooks/useBrainiacCredits";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
  tooltip?: string;
};

type Theme = "user" | "admin" | "employer";

const workspaceCopy: Record<Theme, { label: string; activityHref: string; settingsHref: string; search: string; messagesHref?: string }> = {
  user: {
    label: "Professional workspace",
    activityHref: "/user/activity",
    settingsHref: "/user/settings",
    search: "Search jobs, missions, and community",
    messagesHref: "/forum",
  },
  employer: {
    label: "Employer workspace",
    activityHref: "/feed",
    settingsHref: "/employer/settings",
    search: "Search jobs, candidates, and talent",
    messagesHref: "/feed",
  },
  admin: {
    label: "Administrator workspace",
    activityHref: "/admin/activity-logs",
    settingsHref: "/admin/settings",
    search: "Search admin menus",
  },
};

const accents: Record<Theme, { text: string; soft: string; hover: string; dot: string }> = {
  user: { text: "text-[#7d4ccc]", soft: "bg-[#f5f0fc] text-[#7d4ccc]", hover: "hover:bg-[#f5f0fc] hover:text-[#7d4ccc]", dot: "bg-[#7d4ccc]" },
  employer: { text: "text-[#276ef1]", soft: "bg-[#edf4ff] text-[#276ef1]", hover: "hover:bg-[#edf4ff] hover:text-[#276ef1]", dot: "bg-[#276ef1]" },
  admin: { text: "text-[#7d4ccc]", soft: "bg-[#f5f0fc] text-[#7d4ccc]", hover: "hover:bg-[#f5f0fc] hover:text-[#7d4ccc]", dot: "bg-[#7d4ccc]" },
};

export function DashboardShell({
  nav,
  title,
  subtitle,
  headerRight,
  theme = "user",
  showBrainiac = false,
  showHeading = true,
  children,
}: {
  nav: NavItem[];
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  theme?: Theme;
  showBrainiac?: boolean;
  showHeading?: boolean;
  children: ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const workspace = workspaceCopy[theme];
  const [user, setUser] = useState(getUser);

  useEffect(() => {
    const handleAuthChange = () => setUser(getUser());
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
      if (noticeRef.current && !noticeRef.current.contains(target)) setNoticesOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const requestLogout = () => setLogoutOpen(true);

  const confirmLogout = () => {
    clearToken();
    setLocation("/auth/login");
  };

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return nav.slice(0, 6);
    return nav.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 8);
  }, [nav, query]);

  const mobileItems = useMemo(() => pickMobileNav(nav), [nav]);
  const personName = [user?.firstName, user?.lastName || user?.surName].filter(Boolean).join(" ").trim();
  const displayName = user?.companyName || user?.organisationName || personName || user?.userName || user?.email || "Account";
  const cleanedSubtitle = subtitle?.replace(/^\/\/\s*/, "");
  const accent = accents[theme];

  const goToMatch = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    setLocation(href);
  };

  return (
    <div data-app-canvas className="min-h-screen bg-[#f7f8fb] text-[#182137] dark:bg-background dark:text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#e6e8ef] bg-white dark:border-border dark:bg-card md:flex">
        <SidebarContent
          nav={nav}
          location={location}
          workspaceLabel={workspace.label}
          displayName={displayName}
          accent={accent}
          mark={theme === "employer" ? initials(displayName) : displayName.slice(0, 1).toUpperCase()}
          onNavigate={() => setMobileOpen(false)}
          onLogout={requestLogout}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[rgba(21,24,40,0.35)] md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-[#e6e8ef] bg-white shadow-[12px_0_35px_rgba(25,30,48,0.12)] dark:border-border dark:bg-card md:hidden"
            >
              <SidebarContent
                nav={nav}
                location={location}
                workspaceLabel={workspace.label}
                displayName={displayName}
                accent={accent}
                mark={theme === "employer" ? initials(displayName) : displayName.slice(0, 1).toUpperCase()}
                onNavigate={() => setMobileOpen(false)}
                onLogout={requestLogout}
                showClose
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen min-w-0 flex-col md:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#e6e8ef] bg-white/95 backdrop-blur-md dark:border-border dark:bg-background/90">
          <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#667084] md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div ref={searchRef} className="relative min-w-0 flex-1 md:max-w-md">
              <form
                className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#e6e8ef] bg-[#f8f9fb] px-3 text-[#9298a8] dark:border-border dark:bg-muted"
                onSubmit={(event) => {
                  event.preventDefault();
                  const target = matches[0];
                  if (target) goToMatch(target.href);
                }}
              >
                <Search className="h-4 w-4 shrink-0" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={workspace.search}
                  aria-label={workspace.search}
                  className="w-full bg-transparent text-sm text-[#182137] outline-none placeholder:text-[#9298a8] dark:text-foreground"
                />
              </form>
              {searchOpen && (
                <div className="absolute left-0 right-0 top-[44px] z-40 overflow-hidden rounded-[13px] border border-[#e6e8ef] bg-white shadow-[0_12px_35px_rgba(28,33,54,0.08)] dark:border-border dark:bg-card">
                  {matches.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">No matching menu.</p>
                  ) : (
                    matches.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`${item.href}-${item.label}`}
                          type="button"
                          className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#626b7d] ${accent.hover}`}
                          onClick={() => goToMatch(item.href)}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <HeaderCreditsChip theme={theme} />
              {headerRight}
              {workspace.messagesHref && (
                <Link
                  href={workspace.messagesHref}
                  aria-label={theme === "employer" ? "Open feed" : "Open community"}
                  className="grid h-9 w-9 place-items-center rounded-[10px] text-[#667084] hover:bg-[#f2f3f6] dark:hover:bg-muted"
                >
                  <MessageSquare className="h-4 w-4" />
                </Link>
              )}
              <ThemeToggle />
              <div ref={noticeRef} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#667084]"
                  aria-label="Open updates"
                  onClick={() => {
                    setNoticesOpen((open) => !open);
                    setAccountOpen(false);
                  }}
                >
                  <Bell className="h-4 w-4" />
                </Button>
                {noticesOpen && (
                  <div className="absolute right-0 top-11 z-40 w-72 rounded-[13px] border border-[#e6e8ef] bg-white p-3 shadow-[0_12px_35px_rgba(28,33,54,0.08)] dark:border-border dark:bg-card">
                    <div className="mb-2 flex items-center justify-between text-sm font-extrabold">
                      Updates
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Activity, feed, and audit pages stay in their existing destinations.
                    </p>
                    <div className="mt-3 grid gap-1">
                      <Link href={workspace.activityHref} onClick={() => setNoticesOpen(false)} className={`rounded-lg px-2 py-2 text-sm font-bold ${accent.text} ${accent.hover}`}>
                        Open activity
                      </Link>
                      <Link href="/feed" onClick={() => setNoticesOpen(false)} className={`rounded-lg px-2 py-2 text-sm font-bold ${accent.text} ${accent.hover}`}>
                        Open feed
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-[11px] p-1 hover:bg-[#f2f3f6] dark:hover:bg-muted"
                  aria-label="Account menu"
                  onClick={() => {
                    setAccountOpen((open) => !open);
                    setNoticesOpen(false);
                  }}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold text-white ${accent.dot}`}>
                    {theme === "employer" ? initials(displayName) : displayName.slice(0, 1).toUpperCase()}
                  </span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 z-40 w-60 rounded-[13px] border border-[#e6e8ef] bg-white p-2 shadow-[0_12px_35px_rgba(28,33,54,0.08)] dark:border-border dark:bg-card">
                    <div className="border-b border-[#e6e8ef] px-2 py-2 dark:border-border">
                      <p className="truncate text-sm font-extrabold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email || workspace.label}</p>
                    </div>
                    <Link href={workspace.settingsHref} onClick={() => setAccountOpen(false)} className={`mt-1 flex rounded-lg px-2 py-2 text-sm font-semibold text-[#626b7d] ${accent.hover}`}>
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="flex w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#d34d62] hover:bg-[#fff3f5]"
                      onClick={() => {
                        setAccountOpen(false);
                        requestLogout();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="min-w-0 max-w-full flex-1 overflow-x-clip px-4 py-6 pb-24 md:px-8 md:pb-10" tabIndex={-1}>
          {showHeading && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className={`text-[11px] font-extrabold uppercase tracking-[0.12em] ${accent.text}`}>{workspace.label}</p>
                <h1 className="mt-1 text-[1.7rem] font-extrabold leading-tight tracking-tight">{title}</h1>
                {cleanedSubtitle && <p className="mt-1 text-sm text-muted-foreground">{cleanedSubtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </main>
        <CopyrightBar className="border-t border-[#e6e8ef] dark:border-border" />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-[#e6e8ef] bg-white/95 backdrop-blur-md dark:border-border dark:bg-card/95 md:hidden" aria-label="Primary">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(location, item.href, nav);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? accent.text : "text-[#7b8293]"}`}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-[72px] truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-[#7b8293]"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </nav>

      {showBrainiac && <BrainiacWidget />}

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Brainepedia?</AlertDialogTitle>
            <AlertDialogDescription>
              Your session will end and you'll need to log back in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay in</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function creditsHrefForTheme(theme: Theme): string {
  if (theme === "employer") return "/employer/credits";
  if (theme === "admin") return "/admin/credits";
  return "/user/credits";
}

function HeaderCreditsChip({ theme }: { theme: Theme }) {
  const credits = useOptionalBrainiacCredits();
  if (!credits) return null;
  return (
    <BrainiacCreditsIndicator
      balance={credits.balance}
      loading={credits.loading}
      href={creditsHrefForTheme(theme)}
      label="Credits left"
    />
  );
}

function isActive(location: string, href: string, nav: NavItem[] = []) {
  const path = href.split("?")[0];
  const query = href.includes("?") ? href.slice(href.indexOf("?")) : "";
  const currentPath = location.split("?")[0];
  const currentQuery = location.includes("?") ? location.slice(location.indexOf("?")) : "";
  const matchesPath = currentPath === path || (path !== "/" && currentPath.startsWith(`${path}/`));
  if (!matchesPath) return false;
  if (query) return currentQuery === query;
  const querySibling = nav.some((item) => item.href.startsWith(`${path}?`) && currentQuery === item.href.slice(item.href.indexOf("?")));
  if (querySibling) return false;
  const longer = nav.some((item) => {
    const other = item.href.split("?")[0];
    if (other.length <= path.length) return false;
    return currentPath === other || currentPath.startsWith(`${other}/`);
  });
  return !longer;
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 1).toUpperCase() || "B";
}

function pickMobileNav(nav: NavItem[]) {
  const preferred = [
    "/user/dashboard",
    "/employer/overview",
    "/admin/dashboard",
    "/jobs",
    "/employer/jobs",
    "/user/missions",
    "/employer/applications",
    "/admin/users",
    "/feed",
    "/user/portfolio",
  ];
  const picked: NavItem[] = [];
  for (const href of preferred) {
    const item = nav.find((entry) => entry.href === href);
    if (item && !picked.some((entry) => entry.href === item.href)) picked.push(item);
    if (picked.length === 3) break;
  }
  for (const item of nav) {
    if (picked.length === 3) break;
    if (!picked.some((entry) => entry.href === item.href)) picked.push(item);
  }
  return picked;
}

function SidebarContent({
  nav,
  location,
  workspaceLabel,
  displayName,
  accent,
  mark,
  onNavigate,
  onLogout,
  showClose = false,
  onClose,
}: {
  nav: NavItem[];
  location: string;
  workspaceLabel: string;
  displayName: string;
  accent: { text: string; soft: string; hover: string; dot: string };
  mark: string;
  onNavigate: () => void;
  onLogout: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-[68px] items-center gap-2 border-b border-[#e6e8ef] px-4 dark:border-border">
        <Link href="/" className="flex min-w-0 items-center gap-2" onClick={onNavigate}>
          <img src={logoUrl} alt="" className="h-8 w-auto shrink-0 object-contain" />
          <span className="text-sm font-extrabold tracking-tight">Brainepedia</span>
        </Link>
        {showClose && (
          <button type="button" className="ml-auto grid h-9 w-9 place-items-center rounded-[10px] text-[#667084] hover:bg-[#f5f0fc]" onClick={onClose} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 border-b border-[#e6e8ef] px-4 py-3 dark:border-border">
        <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold text-white ${accent.dot}`}>
          {mark}
        </span>
        <div className="min-w-0">
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.08em] ${accent.text}`}>{workspaceLabel}</p>
          <p className="truncate text-sm font-bold">{displayName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {nav.map((item, i) => {
          const active = isActive(location, item.href, nav);
          const Icon = item.icon;
          const showSectionHeader = !!item.section && (i === 0 || nav[i - 1].section !== item.section);
          return (
            <div key={`${item.href}__${item.label}`}>
              {showSectionHeader && (
                <div className={`px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8c93a2] ${i === 0 ? "pt-1" : "mt-2 border-t border-[#eef0f4] pt-3 dark:border-border"}`}>
                  {item.section}
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[39px] items-center gap-2.5 rounded-lg px-3 text-sm font-bold transition-colors ${
                      active
                        ? accent.soft
                        : `text-[#667084] ${accent.hover}`
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                {item.tooltip && (
                  <TooltipContent side="right" className="max-w-64 border border-[#e6e8ef] bg-white text-[#182137]">
                    {item.tooltip}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="flex min-h-[50px] items-center gap-2 border-t border-[#e6e8ef] px-5 text-sm font-bold text-[#7b8293] hover:text-[#d34d62] dark:border-border"
      >
        <LogOut className="h-4 w-4" />
        <span>Log Out</span>
      </button>
    </>
  );
}

function BrainiacWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-5 md:right-5">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 w-72 rounded-2xl border border-[#d7c8ed] bg-white p-4 text-[#182137] shadow-[0_12px_35px_rgba(28,33,54,0.08)]"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#7d4ccc] text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#7d4ccc]">Brainiac</div>
            </div>
            <p className="text-sm leading-relaxed text-[#60697b]">
              Complete a mission to add verified experience. Open Brainiac from a mission when you want a hint.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7d4ccc] text-white shadow-[0_8px_20px_rgba(125,76,204,0.28)] transition-transform hover:scale-105"
        title="Brainiac AI"
        aria-label="Open Brainiac assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
