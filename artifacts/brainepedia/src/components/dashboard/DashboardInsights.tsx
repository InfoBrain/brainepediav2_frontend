import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Crown, Flag, RefreshCw, Rocket, Sparkles, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { useOptionalBrainiacCredits } from "@/hooks/useBrainiacCredits";
import {
  missionActivityLabel,
  missionActivitySubtext,
  normMissionActivityPage,
  type MissionActivityItem,
} from "@/lib/missionActivityTypes";
import type { CurrentUserRank, LeaderboardUser } from "@/components/dashboard/Leaderboard";

const card = "rounded-2xl border border-[#e6e8ef] bg-white shadow-[0_8px_24px_rgba(28,33,54,0.04)] dark:border-white/10 dark:bg-[#0d1119]";
const heading = "text-sm font-extrabold text-[#182137] dark:text-white";
const muted = "text-[#70798d] dark:text-white/50";

function compact(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = (Date.now() - date.getTime()) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

export function TokenUsageCard() {
  const credits = useOptionalBrainiacCredits();
  const balance = credits?.balance ?? null;
  const allocation = Number(balance?.allocation ?? 0);
  const used = Number(balance?.usedCredits ?? 0);
  const remaining = Number(balance?.remainingCredits ?? Math.max(allocation - used, 0));
  const percent = Math.min(100, Math.max(0, Number(balance?.usagePercentage ?? (allocation > 0 ? (used / allocation) * 100 : 0))));
  const low = Boolean(balance?.isExhausted) || (allocation > 0 && remaining / allocation < 0.1);
  const renews = balance?.billingCycleEnd ? new Date(balance.billingCycleEnd) : null;

  return (
    <section className={`${card} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#9D4EDD]/15 dark:text-[#C084FC]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className={heading}>Token usage</h2>
            <p className={`text-[11px] ${muted}`}>{balance?.planName ? `${balance.planName} plan` : "Brainiac AI credits"}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Refresh token usage"
          onClick={() => void credits?.refresh()}
          disabled={!credits || credits.loading}
          className="grid h-7 w-7 place-items-center rounded-lg text-[#70798d] hover:bg-[#f5f0fc] hover:text-[#7d4ccc] disabled:opacity-50 dark:hover:bg-white/5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${credits?.loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!balance ? (
        <p className={`mt-4 text-xs ${muted}`}>{credits?.loading ? "Loading your balance…" : credits?.error || "Usage appears once your wallet is active."}</p>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-2">
            <p className="text-2xl font-extrabold leading-none tracking-tight text-[#182137] dark:text-white">
              {compact(remaining)}
              <span className={`ml-1 text-xs font-semibold ${muted}`}>left</span>
            </p>
            <p className={`text-xs font-bold ${low ? "text-[#b87412]" : "text-[#7d4ccc] dark:text-[#C084FC]"}`}>{Math.round(percent)}% used</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efe8f8] dark:bg-white/10">
            <div
              className={`h-full rounded-full ${low ? "bg-[#d88c1b]" : "bg-[#7d4ccc]"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className={`mt-2 flex items-center justify-between text-[11px] ${muted}`}>
            <span>{compact(used)} of {compact(allocation)} used</span>
            {renews && !Number.isNaN(renews.getTime()) && (
              <span>Renews {renews.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            )}
          </div>
        </>
      )}
      <Link href="/user/credits" className="mt-3 inline-flex text-xs font-bold text-[#7d4ccc] hover:text-[#6538ad] dark:text-[#C084FC]">
        View usage history
      </Link>
    </section>
  );
}

const ROTATE_MS = 4500;

export function MissionActivityCarousel() {
  const [items, setItems] = useState<MissionActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await api.activityLogs.missionActivities({ pageNumber: 1, pageSize: 10 });
      if (cancelled) return;
      setItems(res.ok ? normMissionActivityPage(res.data).items : []);
      setLoading(false);
    };
    void load();
    const onEvaluation = () => void load();
    window.addEventListener("brainepedia:evaluation-complete", onEvaluation);
    return () => {
      cancelled = true;
      window.removeEventListener("brainepedia:evaluation-complete", onEvaluation);
    };
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || items.length < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, items.length]);

  const item = items.length > 0 ? items[index % items.length] : null;
  const label = item ? missionActivityLabel(item) : "";
  const completed = label === "completed";
  const subtext = item ? missionActivitySubtext(item) : "";

  return (
    <section
      className={`${card} p-4`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Mission activity"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-[#eefaf4] text-[#168a68] dark:bg-emerald-400/10 dark:text-emerald-300">
            <Activity className="h-4 w-4" />
            {items.length > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-[#168a68]" />}
          </span>
          <div>
            <h2 className={heading}>Mission activity</h2>
            <p className={`text-[11px] ${muted}`}>Live from the community</p>
          </div>
        </div>
        <Link href="/user/activity" className="text-xs font-bold text-[#7d4ccc] hover:text-[#6538ad] dark:text-[#C084FC]">See all</Link>
      </div>

      <div className="relative mt-3 min-h-[76px] overflow-hidden" aria-live={paused ? "polite" : "off"}>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#f0f1f5] dark:bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#f0f1f5] dark:bg-white/10" />
          </div>
        ) : !item ? (
          <p className={`py-4 text-xs ${muted}`}>No mission activity yet. Completed and started missions appear here.</p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${item.id}-${index}`}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-3 rounded-xl bg-[#f7f8fb] p-3 dark:bg-white/5"
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold ${completed ? "bg-[#eefaf4] text-[#168a68]" : "bg-[#edf4ff] text-[#276ef1]"}`}>
                {completed ? <Flag className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[#182137] dark:text-white/90">
                  <span className="font-extrabold">{item.userName || "A member"}</span>{" "}
                  <span className={muted}>{label || "updated"}</span>{" "}
                  <span className="font-semibold">{item.missionTitle || "a mission"}</span>
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  {subtext && (
                    <span className={`font-bold ${completed && item.xpEarned ? "text-[#7d4ccc] dark:text-[#C084FC]" : muted}`}>{subtext}</span>
                  )}
                  {item.createdAt && <span className={muted}>{relativeTime(item.createdAt)}</span>}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((entry, dot) => (
            <button
              key={`${entry.id}-dot-${dot}`}
              type="button"
              aria-label={`Show activity ${dot + 1} of ${items.length}`}
              aria-current={dot === index % items.length}
              onClick={() => setIndex(dot)}
              className={`h-1.5 rounded-full transition-all ${dot === index % items.length ? "w-5 bg-[#7d4ccc]" : "w-1.5 bg-[#dcd1ee] hover:bg-[#b9a2e3] dark:bg-white/20"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const PODIUM = [
  "bg-[#7d4ccc] text-white",
  "bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#9D4EDD]/20 dark:text-[#C084FC]",
  "bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#9D4EDD]/20 dark:text-[#C084FC]",
];

export function LeaderboardList({
  topUsers,
  currentUser,
  loading,
  onRefresh,
}: {
  topUsers: LeaderboardUser[];
  currentUser?: CurrentUserRank | null;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  const leaderXP = Math.max(1, ...topUsers.map((user) => user.totalXP));
  const meInList = topUsers.some((user) => user.isCurrentUser);

  return (
    <section className={`${card} flex h-full flex-col p-4`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f0fc] text-[#7d4ccc] dark:bg-[#9D4EDD]/15 dark:text-[#C084FC]">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h2 className={heading}>Leaderboard</h2>
            <p className={`text-[11px] ${muted}`}>Top professionals by XP</p>
          </div>
        </div>
        {onRefresh && (
          <button
            type="button"
            aria-label="Refresh leaderboard"
            onClick={onRefresh}
            disabled={loading}
            className="grid h-7 w-7 place-items-center rounded-lg text-[#70798d] hover:bg-[#f5f0fc] hover:text-[#7d4ccc] disabled:opacity-50 dark:hover:bg-white/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <ol className="mt-3 flex-1 space-y-1">
        {loading && topUsers.length === 0 ? (
          Array.from({ length: 5 }).map((_, row) => (
            <li key={row} className="flex items-center gap-3 px-2 py-2">
              <span className="h-7 w-7 animate-pulse rounded-full bg-[#f0f1f5] dark:bg-white/10" />
              <span className="h-3 flex-1 animate-pulse rounded bg-[#f0f1f5] dark:bg-white/10" />
            </li>
          ))
        ) : topUsers.length === 0 ? (
          <li className={`py-6 text-center text-xs ${muted}`}>Rankings appear once members earn XP.</li>
        ) : (
          topUsers.map((user, row) => {
            const me = Boolean(user.isCurrentUser);
            const content = (
              <>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${PODIUM[row] ?? "bg-[#f7f8fb] text-[#70798d] dark:bg-white/5 dark:text-white/50"}`}>
                  {row === 0 ? <Crown className="h-3 w-3" /> : user.rank}
                </span>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf0f6] text-[11px] font-extrabold text-[#4c5568] dark:bg-white/10 dark:text-white/70">
                    {initials(user.nickName)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-[#182137] dark:text-white">{user.nickName}</span>
                    {me && <span className="rounded-full bg-[#7d4ccc] px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-white">You</span>}
                  </span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#f0eaf9] dark:bg-white/10">
                    <span className="block h-full rounded-full bg-[#7d4ccc]" style={{ width: `${Math.max(6, (user.totalXP / leaderXP) * 100)}%` }} />
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs font-extrabold text-[#182137] dark:text-white">
                  {compact(user.totalXP)}
                  <span className={`ml-0.5 font-semibold ${muted}`}>XP</span>
                </span>
              </>
            );
            const rowClass = `flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition ${me ? "bg-[#f5f0fc] ring-1 ring-[#e0d2f3] dark:bg-[#9D4EDD]/10 dark:ring-[#9D4EDD]/30" : "hover:bg-[#f7f8fb] dark:hover:bg-white/5"}`;
            return (
              <li key={`${user.userId ?? user.nickName}-${row}`}>
                {user.userId ? (
                  <Link href={`/public-profile/${encodeURIComponent(user.userId)}`} className={rowClass}>{content}</Link>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            );
          })
        )}
      </ol>

      {currentUser && !meInList && currentUser.rank > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-[#e0d2f3] px-3 py-2 text-xs dark:border-white/10">
          <span className={muted}>Your rank</span>
          <span className="font-extrabold text-[#7d4ccc] dark:text-[#C084FC]">#{currentUser.rank} · {compact(currentUser.xp)} XP</span>
        </div>
      )}
      <Link href="/user/xp-progress" className="mt-3 inline-flex text-xs font-bold text-[#7d4ccc] hover:text-[#6538ad] dark:text-[#C084FC]">
        View XP progress
      </Link>
    </section>
  );
}
