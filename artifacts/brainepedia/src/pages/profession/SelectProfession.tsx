import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Zap, Map, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import { ProfessionCard, type Profession } from "@/components/profession/ProfessionCard";
import { SkeletonCard } from "@/components/profession/SkeletonCard";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { CopyrightBar } from "@/components/ui/CopyrightBar";

const PROFESSION_KEY = "brainepedia.selected.profession";

function getSelectedProfession(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(PROFESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSelectedProfession(p: Profession) {
  localStorage.setItem(PROFESSION_KEY, JSON.stringify({ id: p.professionId, name: p.name }));
}

export default function SelectProfession() {
  usePageTitle("Start a Mission");
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<string | null>(() => getSelectedProfession()?.id ?? null);
  const [search, setSearch] = useState("");

  const {
    data: professions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Profession[]>({
    queryKey: ["professions"],
    queryFn: async () => {
      const res = await api.professions.list();
      if (!res.ok) throw new Error(res.error || "Failed");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (professions ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (p: Profession) => {
    saveSelectedProfession(p);
    setSelected(p.professionId);
    // brief highlight then navigate
    setTimeout(() => navigate(`/profession/${p.professionId}`), 300);
  };

  const handleContinue = () => {
    if (!selected) return;
    navigate(`/profession/${selected}`);
  };

  const isAuth = isAuthenticated();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-[#182137] dark:bg-[#060a10] dark:text-white">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/3 rounded-full blur-3xl" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#e6e8ef] px-6 py-4 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-[#7d4ccc] dark:font-mono dark:tracking-widest dark:text-cyan-400">Brainepedia</span>
        </div>
        {isAuth && (
          <button
            onClick={() => navigate("/user/dashboard")}
            className="text-xs font-bold text-[#70798d] transition-colors hover:text-[#182137] dark:font-mono dark:text-white/40 dark:hover:text-white/70"
          >
            ← Back to Dashboard
          </button>
        )}
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* ─── HERO HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#7d4ccc] dark:font-mono dark:tracking-[0.3em] dark:text-cyan-400">
            Start a Mission
          </p>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[#182137] dark:bg-gradient-to-r dark:from-white dark:via-cyan-100 dark:to-amber-200 dark:bg-clip-text dark:text-transparent md:text-5xl">
            Start a Mission
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[#70798d] dark:text-white/50">
            Start solving real-world problems in your chosen field
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {[
              { icon: Map, label: "Progress through districts", color: "border-[#c9d8f8] bg-[#edf4ff] text-[#276ef1] dark:border-white/10 dark:bg-white/5 dark:text-cyan-400" },
              { icon: Zap, label: "Solve real-world challenges", color: "border-[#f0ddb4] bg-[#fff6e5] text-[#b87412] dark:border-white/10 dark:bg-white/5 dark:text-amber-400" },
              { icon: Trophy, label: "Earn XP and badges", color: "border-[#e0d2f3] bg-[#f5f0fc] text-[#7d4ccc] dark:border-white/10 dark:bg-white/5 dark:text-purple-400" },
            ].map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-bold dark:font-mono ${color}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ─── SEARCH ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-8 max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a91a1] dark:text-white/30" />
          <input
            type="text"
            placeholder="Search professions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#e6e8ef] bg-white py-2.5 pl-9 pr-4 text-sm text-[#182137] transition-all placeholder:text-[#8a91a1] focus:border-[#7d4ccc] focus:outline-none dark:border-white/10 dark:bg-white/5 dark:font-mono dark:text-white dark:placeholder:text-white/25 dark:focus:border-cyan-400/50 dark:focus:bg-white/8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-lg leading-none"
            >
              ×
            </button>
          )}
        </motion.div>

        {/* ─── STATES ─── */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        )}

        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400/60" />
            <p className="font-semibold text-[#182137] dark:font-mono dark:text-white/60">{error?.message || "Unable to load professions"}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-white/20 text-white/60 hover:text-white gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </motion.div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-20 text-center"
          >
            <p className="text-sm text-[#70798d] dark:font-mono dark:text-white/40">
              {search ? `No professions match "${search}"` : "No professions available yet"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
              >
                Clear search
              </button>
            )}
          </motion.div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <ProfessionCard
                  key={p.professionId}
                  profession={p}
                  selected={selected === p.professionId}
                  onClick={handleSelect}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ─── CONTINUE BAR ─── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4"
            >
              <div className="flex items-center gap-4 rounded-2xl border border-[#e6e8ef] bg-white/95 px-6 py-3 shadow-[0_12px_30px_rgba(28,33,54,0.12)] backdrop-blur-md dark:border-cyan-400/30 dark:bg-[#0d1117]/95 dark:shadow-cyan-500/20">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-bold text-[#70798d] dark:font-mono dark:text-white/40">Selected:</span>
                  <span className="text-sm font-extrabold text-[#7d4ccc] dark:font-mono dark:font-semibold dark:text-cyan-300">
                    {professions?.find((p) => p.professionId === selected)?.name ?? "…"}
                  </span>
                </div>
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-1.5 rounded-xl bg-[#7d4ccc] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6538ad] dark:bg-cyan-500 dark:font-mono dark:text-black dark:shadow-lg dark:shadow-cyan-500/30 dark:hover:bg-cyan-400"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom padding so content is not hidden behind the sticky bar */}
        {selected && <div className="h-24" />}
      </main>

      <CopyrightBar className="relative z-10 border-t border-white/5" />
    </div>
  );
}
