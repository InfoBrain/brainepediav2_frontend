import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  missionActivityLabel,
  missionActivitySubtext,
  normMissionActivityPage,
  type MissionActivityItem,
} from "@/lib/missionActivityTypes";

function formatRel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

type Props = {
  className?: string;
};

export function MissionActivityFeed({ className }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [items, setItems] = useState<MissionActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPage = useCallback(async (pageNumber: number, append = false) => {
    const res = await api.activityLogs.missionActivities({ pageNumber, pageSize: 20 });
    if (!res.ok) {
      if (!append) {
        setError(true);
        setItems([]);
      }
      return false;
    }
    const pageData = normMissionActivityPage(res.data);
    setError(false);
    setHasNext(pageData.hasNext);
    setPage(pageData.currentPage);
    setItems((prev) => (append ? [...prev, ...pageData.items] : pageData.items));
    return true;
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPage(1).finally(() => setLoading(false));
  }, [loadPage]);

  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];
    if (prefersReducedMotion || items.length <= 5) return items.slice(0, 8);
    const windowSize = 5;
    const result: MissionActivityItem[] = [];
    for (let i = 0; i < windowSize; i++) {
      result.push(items[(visibleIndex + i) % items.length]);
    }
    return result;
  }, [items, visibleIndex, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || items.length <= 5) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      return;
    }
    tickerRef.current = setInterval(() => {
      setVisibleIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [items.length, prefersReducedMotion]);

  const handleLoadMore = async () => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    await loadPage(page + 1, true);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className={`bg-[#0d1119] border border-white/6 rounded-2xl p-6 ${className ?? ""}`}>
        <div className="flex items-center gap-3 text-white/40 font-mono text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading mission activity…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-[#0d1119] border border-white/6 rounded-2xl p-6 ${className ?? ""}`}>
        <h2 className="text-lg font-bold text-amber-400">Recent Mission Activity</h2>
        <p className="mt-4 text-sm text-white/40 font-mono border border-dashed border-white/10 rounded-xl px-6 py-5">
          Mission activity is temporarily unavailable.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`bg-[#0d1119] border border-white/6 rounded-2xl p-6 ${className ?? ""}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-amber-400">Recent Mission Activity</h2>
            <p className="text-xs text-muted-foreground font-mono">Community mission feed</p>
          </div>
          <Activity className="h-5 w-5 text-[#A78BFA]" />
        </div>
        <div className="py-8 text-center">
          <p className="text-sm text-white/40 font-mono">No mission activity yet.</p>
          <p className="text-xs text-white/25 font-mono mt-1">Be the first to complete a mission.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0d1119] border border-white/6 rounded-2xl p-6 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-amber-400">Recent Mission Activity</h2>
          <p className="text-xs text-muted-foreground font-mono">Community mission feed</p>
        </div>
        <Activity className="h-5 w-5 text-[#A78BFA]" />
      </div>

      <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-1" aria-label="Recent mission activity">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleItems.map((item) => {
            const label = missionActivityLabel(item);
            const sub = missionActivitySubtext(item);
            const isXp = sub.startsWith("+");
            return (
              <motion.li
                key={`${item.id}-${item.createdAt ?? ""}`}
                layout
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex gap-3 items-start rounded-xl border border-white/5 bg-black/25 px-4 py-3"
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    label === "completed" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-[#A78BFA] shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 leading-snug">
                    <span className="font-semibold text-white">{item.userName}</span>
                    {label === "completed" ? " completed " : label === "started" ? " started " : " — "}
                    <span className="text-white/70">&quot;{item.missionTitle}&quot;</span>
                  </p>
                  {sub && (
                    <p className={`mt-1 text-xs font-mono flex items-center gap-1 ${isXp ? "text-[#FFD700]" : "text-white/35"}`}>
                      {isXp && <Zap className="h-3 w-3" />}
                      {sub}
                    </p>
                  )}
                  {item.createdAt && (
                    <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-white/25">
                      {formatRel(item.createdAt)}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {hasNext && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="font-mono text-xs border-white/10 text-white/50 hover:text-amber-400 hover:border-amber-400/30"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more activity"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
