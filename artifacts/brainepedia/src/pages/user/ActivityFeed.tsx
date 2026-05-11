import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Map,
  Trophy,
  User as UserIcon,
  Shield,
  UserCog,
  Zap,
  Filter,
  ChevronDown,
  Compass,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profession/select", label: "Choose Path", icon: Compass },
  { href: "/user/map", label: "Imperial Map", icon: Map },
  { href: "/profile/edit", label: "My Profile", icon: UserIcon },
  { href: "/user/badges", label: "My Badges", icon: Trophy },
  { href: "/user/activity", label: "Activity Feed", icon: Activity },
  { href: "/user/subscription", label: "Subscription", icon: CreditCard },
];

type ActivityLog = {
  activity: string;
  createdAt?: string;
  performedBy?: string;
  type: EventType;
  submissionId?: string;
};

type UserSubmission = {
  submissionId: string;
  missionTitle: string;
  difficultyName?: string;
  submittedAt?: string;
  netXpGained?: number;
  isPassed?: boolean;
  score?: number;
};

type EventType = "badge" | "profile" | "subscription" | "xp" | "system" | "other";

const EVENT_TYPES: { key: EventType | "all"; label: string }[] = [
  { key: "all", label: "All Events" },
  { key: "badge", label: "Badges" },
  { key: "profile", label: "Profile" },
  { key: "subscription", label: "Subscription" },
  { key: "xp", label: "XP & Progress" },
  { key: "system", label: "System" },
  { key: "other", label: "Other" },
];

const TYPE_CONFIG: Record<
  EventType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  badge: {
    icon: Trophy,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
  },
  profile: {
    icon: UserCog,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
  },
  subscription: {
    icon: CreditCard,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  xp: {
    icon: Zap,
    color: "text-yellow-300",
    bg: "bg-yellow-300/10",
    border: "border-yellow-300/30",
  },
  system: {
    icon: Shield,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
  },
  other: {
    icon: Activity,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
  },
};

function classifyEvent(activity: string): EventType {
  const s = activity.toLowerCase();
  if (s.includes("badge") || s.includes("trophy") || s.includes("award") || s.includes("achievement")) return "badge";
  if (s.includes("profile") || s.includes("avatar") || s.includes("name") || s.includes("bio") || s.includes("photo")) return "profile";
  if (s.includes("subscription") || s.includes("plan") || s.includes("payment") || s.includes("billing") || s.includes("upgrade") || s.includes("downgrade")) return "subscription";
  if (s.includes("xp") || s.includes("experience") || s.includes("streak") || s.includes("problem") || s.includes("district") || s.includes("progress") || s.includes("level") || s.includes("mission") || s.includes("submission") || s.includes("completed") || s.includes("passed") || s.includes("failed")) return "xp";
  if (s.includes("login") || s.includes("logout") || s.includes("register") || s.includes("password") || s.includes("account") || s.includes("verified")) return "system";
  return "other";
}

function normActivityLogs(d: any): ActivityLog[] {
  const arr = Array.isArray(d) ? d : d?.logs || d?.data || [];
  return arr.map((x: any) => {
    const activity = x.activity || x.title || x.message || "Activity";
    return {
      activity,
      createdAt: x.createdAt || x.at || x.timestamp || undefined,
      performedBy: x.performedBy || x.by || undefined,
      type: classifyEvent(activity),
      submissionId: x.submissionId || x.SubmissionId || undefined,
    };
  });
}

function normSubmissions(d: any): UserSubmission[] {
  const arr = Array.isArray(d) ? d : d?.submissions || d?.data || [];
  return arr.map((x: any) => {
    const evalData = x.evaluation || x.evaluationResult || {};
    return {
      submissionId: x.submissionId || x.id || "",
      missionTitle: x.missionTitle || x.problemNode?.title || "Mission",
      difficultyName: x.difficultyName || x.problemNode?.difficultyName || "",
      submittedAt: x.submittedAt || x.createdAt,
      netXpGained: Number(x.netXpGained ?? x.xpGained ?? evalData?.netXpGained ?? 0),
      isPassed: Boolean(evalData?.isPassed ?? x.isPassed),
      score: Number(evalData?.score ?? x.score ?? 0),
    };
  }).filter((s: UserSubmission) => Boolean(s.submissionId));
}

function formatAbsolute(ts?: string): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function formatDateGroup(ts: string): string {
  try {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today.getTime());
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  } catch {
    return ts.slice(0, 10);
  }
}

function groupByDate(logs: ActivityLog[]): { label: string; entries: ActivityLog[] }[] {
  const keys: string[] = [];
  const groups: Record<string, ActivityLog[]> = {};
  for (const log of logs) {
    const key = log.createdAt ? log.createdAt.slice(0, 10) : "Unknown date";
    if (!groups[key]) {
      keys.push(key);
      groups[key] = [];
    }
    groups[key].push(log);
  }
  return keys.map((key) => ({
    label: groups[key][0].createdAt ? formatDateGroup(groups[key][0].createdAt!) : "Unknown date",
    entries: groups[key],
  }));
}

const PAGE_SIZE = 20;
const SUB_PAGE_SIZE = 10;

type SubStatusFilter = "all" | "passed" | "failed";

export default function ActivityFeed() {
  const [, navigate] = useLocation();
  const userId = getUserId();
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(false);
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [page, setPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [subStatusFilter, setSubStatusFilter] = useState<SubStatusFilter>("all");
  const [subDifficultyFilter, setSubDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setSubLoading(true);

    api.activityLogs.forUser(userId).then((res) => {
      setLoading(false);
      if (res.ok) setAllLogs(normActivityLogs(res.data));
    });

    api.submissions.forUser(userId).then((res) => {
      setSubLoading(false);
      if (res.ok) setSubmissions(normSubmissions(res.data));
      else setSubError(true);
    });
  }, [userId, navigate]);

  const filtered = useMemo(
    () => (filter === "all" ? allLogs : allLogs.filter((l) => l.type === filter)),
    [allLogs, filter]
  );

  const paged = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const grouped = useMemo(() => groupByDate(paged), [paged]);
  const hasMore = paged.length < filtered.length;

  const difficultyOptions = useMemo(() => {
    const names = Array.from(new Set(submissions.map((s) => s.difficultyName).filter(Boolean))) as string[];
    return names.sort();
  }, [submissions]);

  const filteredSubs = useMemo(() => {
    return submissions.filter((s) => {
      if (subStatusFilter === "passed" && !s.isPassed) return false;
      if (subStatusFilter === "failed" && s.isPassed) return false;
      if (subDifficultyFilter !== "all" && s.difficultyName !== subDifficultyFilter) return false;
      return true;
    });
  }, [submissions, subStatusFilter, subDifficultyFilter]);

  const pagedSubs = useMemo(() => filteredSubs.slice(0, subPage * SUB_PAGE_SIZE), [filteredSubs, subPage]);
  const hasMoreSubs = pagedSubs.length < filteredSubs.length;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allLogs.length };
    for (const l of allLogs) c[l.type] = (c[l.type] || 0) + 1;
    return c;
  }, [allLogs]);

  function handleFilterChange(next: EventType | "all") {
    setFilter(next);
    setPage(1);
    setFilterOpen(false);
  }

  function handleSubStatusChange(next: SubStatusFilter) {
    setSubStatusFilter(next);
    setSubPage(1);
  }

  function handleSubDifficultyChange(next: string) {
    setSubDifficultyFilter(next);
    setSubPage(1);
  }

  const isSubFiltered = subStatusFilter !== "all" || subDifficultyFilter !== "all";

  const activeFilterLabel = EVENT_TYPES.find((t) => t.key === filter)?.label ?? "All Events";

  return (
    <DashboardShell nav={nav} title="Activity Feed" subtitle="// full.history">
      <div className="space-y-10">

        {/* ── PAST SUBMISSIONS ── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00D2FF]" />
              Mission History
            </h2>
            {!subLoading && submissions.length > 0 && (
              <span className="text-xs font-mono text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {subLoading && (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 text-[#00D2FF] animate-spin" />
            </div>
          )}

          {!subLoading && subError && (
            <div className="rounded-xl border border-dashed border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
              <XCircle className="h-8 w-8 text-red-400/40 mx-auto mb-2" />
              <p className="text-sm text-red-400/70">Could not load mission history.</p>
              <p className="text-xs text-white/20 mt-1">Please refresh the page to try again.</p>
            </div>
          )}

          {!subLoading && !subError && submissions.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/2 px-6 py-8 text-center">
              <Zap className="h-8 w-8 text-white/15 mx-auto mb-2" />
              <p className="text-sm text-white/30">No mission submissions yet.</p>
              <p className="text-xs text-white/20 mt-1">Complete missions to see your results here.</p>
            </div>
          )}

          {!subLoading && !subError && submissions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl border border-white/8 bg-white/3">
              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 mr-0.5">Status</span>
                {(["all", "passed", "failed"] as SubStatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubStatusChange(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors border ${
                      subStatusFilter === s
                        ? s === "passed"
                          ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-400"
                          : s === "failed"
                          ? "bg-red-400/15 border-red-400/40 text-red-400"
                          : "bg-[#00D2FF]/15 border-[#00D2FF]/40 text-[#00D2FF]"
                        : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    {s === "all" ? "All" : s === "passed" ? "Passed" : "Failed"}
                  </button>
                ))}
              </div>

              {/* Difficulty filter */}
              {difficultyOptions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 mr-0.5">Difficulty</span>
                  <button
                    onClick={() => handleSubDifficultyChange("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors border ${
                      subDifficultyFilter === "all"
                        ? "bg-[#9D4EDD]/15 border-[#9D4EDD]/40 text-[#9D4EDD]"
                        : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    All
                  </button>
                  {difficultyOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => handleSubDifficultyChange(d)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors border ${
                        subDifficultyFilter === d
                          ? "bg-[#9D4EDD]/15 border-[#9D4EDD]/40 text-[#9D4EDD]"
                          : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {/* Active filter summary + clear */}
              {isSubFiltered && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white/30">
                    {filteredSubs.length} / {submissions.length} shown
                  </span>
                  <button
                    onClick={() => { handleSubStatusChange("all"); handleSubDifficultyChange("all"); }}
                    className="text-[11px] font-mono text-[#00D2FF]/70 hover:text-[#00D2FF] transition-colors underline underline-offset-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {!subLoading && !subError && isSubFiltered && filteredSubs.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/2 px-6 py-8 text-center">
              <Filter className="h-8 w-8 text-white/15 mx-auto mb-2" />
              <p className="text-sm text-white/30">No missions match this filter.</p>
              <button
                onClick={() => { handleSubStatusChange("all"); handleSubDifficultyChange("all"); }}
                className="mt-3 text-xs font-mono text-[#00D2FF]/70 hover:text-[#00D2FF] transition-colors underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}

          {!subLoading && !subError && submissions.length > 0 && filteredSubs.length > 0 && (
            <div className="space-y-3">
              {pagedSubs.map((sub, i) => (
                <motion.div
                  key={sub.submissionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-gray-800 bg-[#0d1119]/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-gray-700 transition-colors"
                >
                  {/* Pass/fail indicator */}
                  <div className="shrink-0">
                    {sub.isPassed ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{sub.missionTitle}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      {sub.difficultyName && (
                        <span className="text-[11px] font-mono text-white/30">{sub.difficultyName}</span>
                      )}
                      {sub.score !== undefined && sub.score > 0 && (
                        <span className={`text-[11px] font-mono ${sub.isPassed ? "text-emerald-400" : "text-red-400"}`}>
                          {sub.score}%
                        </span>
                      )}
                      {(sub.netXpGained ?? 0) > 0 && (
                        <span className="text-[11px] font-mono text-[#FFD700] flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5" />
                          +{sub.netXpGained} XP
                        </span>
                      )}
                      {sub.submittedAt && (
                        <span className="text-[11px] font-mono text-white/25 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatAbsolute(sub.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Result link */}
                  <Link
                    href={`/app/submission/${sub.submissionId}/result`}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00D2FF]/30 bg-[#00D2FF]/8 text-[#00D2FF] text-xs font-mono font-medium hover:bg-[#00D2FF]/15 hover:border-[#00D2FF]/50 transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Result
                  </Link>
                </motion.div>
              ))}

              {hasMoreSubs && (
                <div className="flex justify-center pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubPage((p) => p + 1)}
                    className="bg-[#0d1119] border-gray-700 text-gray-400 hover:text-white hover:border-[#00D2FF]/50 text-xs"
                  >
                    Load more
                    <span className="ml-1.5 text-gray-600">({filteredSubs.length - pagedSubs.length} remaining)</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── DIVIDER ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">Activity Log</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* ── ACTIVITY LOG SECTION ── */}
        <section className="space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#FFD700]" />
                Activity Feed
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {loading
                  ? "Loading history…"
                  : `${filtered.length} event${filtered.length !== 1 ? "s" : ""}${filter !== "all" ? " (filtered)" : ""}`}
              </p>
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOpen((v) => !v)}
                className="flex items-center gap-2 bg-[#0d1119] border-gray-700 text-gray-300 hover:text-white hover:border-[#FFD700]/50 min-w-[160px] justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  {activeFilterLabel}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </Button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1 w-48 rounded-xl border border-gray-700 bg-[#0d1119] shadow-xl z-20 overflow-hidden"
                  >
                    {EVENT_TYPES.map((t) => {
                      const cnt = counts[t.key] ?? 0;
                      const active = filter === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => handleFilterChange(t.key)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                            active
                              ? "bg-[#FFD700]/10 text-[#FFD700]"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{t.label}</span>
                          <span className={`text-xs font-mono ${active ? "text-[#FFD700]/70" : "text-gray-600"}`}>
                            {cnt}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 text-[#FFD700] animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="h-24 w-24 rounded-full bg-[#0d1119] border-2 border-dashed border-gray-700 flex items-center justify-center mb-5">
                <Activity className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">
                {filter === "all" ? "No activity yet" : `No ${activeFilterLabel.toLowerCase()} events`}
              </h3>
              <p className="text-sm text-gray-600 max-w-xs">
                {filter === "all"
                  ? "Your actions will appear here as you progress through the Empire."
                  : "Try selecting a different filter to see other events."}
              </p>
              {filter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange("all")}
                  className="mt-4 text-[#FFD700] hover:text-[#FFD700]/80"
                >
                  Show all events
                </Button>
              )}
            </motion.div>
          )}

          {/* Timeline */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-8">
              {grouped.map((group) => (
                <div key={group.label}>
                  {/* Date group header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>

                  {/* Entries */}
                  <ol className="relative border-l border-gray-800 ml-2 space-y-0">
                    {group.entries.map((log, i) => {
                      const cfg = TYPE_CONFIG[log.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          className="relative pl-8 pb-6 last:pb-0"
                        >
                          {/* Timeline dot */}
                          <div
                            className={`absolute -left-3 top-0.5 h-6 w-6 rounded-full flex items-center justify-center border ${cfg.border} ${cfg.bg}`}
                          >
                            <Icon className={`h-3 w-3 ${cfg.color}`} />
                          </div>

                          {/* Content */}
                          <div className="rounded-xl border border-gray-800 bg-[#0d1119]/60 px-4 py-3 hover:border-gray-700 transition-colors">
                            <p className="text-sm text-gray-200 leading-snug">{log.activity}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                              {log.createdAt && (
                                <span className="text-[11px] font-mono text-gray-600">
                                  {formatAbsolute(log.createdAt)}
                                </span>
                              )}
                              {log.performedBy && (
                                <span className="text-[11px] text-gray-600">
                                  by <span className="text-gray-500">{log.performedBy}</span>
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.color}`}
                              >
                                {log.type}
                              </span>
                              {log.submissionId && (
                                <Link
                                  href={`/app/submission/${log.submissionId}/result`}
                                  className="flex items-center gap-1 text-[11px] font-mono text-[#00D2FF] hover:text-[#00D2FF]/80 transition-colors"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                  View Result
                                </Link>
                              )}
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-[#0d1119] border-gray-700 text-gray-400 hover:text-white hover:border-[#FFD700]/50"
                  >
                    Load more
                    <span className="ml-2 text-xs text-gray-600">
                      ({filtered.length - paged.length} remaining)
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
