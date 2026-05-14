import { useState, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Home,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Eye,
  Lock,
  ChevronDown,
  Filter,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUserId, getDashboardPath, isAuthenticated } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { CopyrightBar } from "@/components/ui/CopyrightBar";
import { useDifficulties, buildDifficultyLookup, getDifficultyStyle, type DifficultyMeta } from "@/hooks/useDifficulties";

type Mission = {
  problemNodeId: string;
  title: string;
  context: string;
  missionBrief: string;
  constraints: string[];
  expectedOutcomes: string[];
  experiencePoints: number;
  estimatedMinutes: number;
  difficultyId: string;
  difficultyName?: string;
  districtId: string;
  isStarted: boolean;
  isCompleted: boolean;
};

function normMissions(data: any): Mission[] {
  const arr = Array.isArray(data) ? data : data?.data || [];
  return arr.map((x: any) => ({
    problemNodeId: x.problemNodeId || x.id || x.nodeId || "",
    title: x.title || x.name || "Untitled Mission",
    context: x.context || "",
    missionBrief: x.missionBrief || "",
    constraints: Array.isArray(x.constraints) ? x.constraints : [],
    expectedOutcomes: Array.isArray(x.expectedOutcomes) ? x.expectedOutcomes : [],
    experiencePoints: Number(x.experiencePoints ?? 0),
    estimatedMinutes: Number(x.estimatedMinutes ?? 0),
    difficultyId: x.difficultyId || x.difficulty?.difficultyId || x.difficulty?.id || "",
    difficultyName: x.difficultyName || x.difficulty?.name || "",
    districtId: x.districtId || "",
    isStarted: Boolean(x.isStarted),
    isCompleted: Boolean(x.isCompleted),
  }));
}

function normDistrict(data: any) {
  return {
    districtId: data?.districtId || data?.id || "",
    name: data?.name || data?.districtName || "District",
    description: data?.description || "",
    completionPercentage: Number(data?.completionPercentage ?? 0),
  };
}

function getMissionStatus(m: Mission) {
  if (m.isCompleted) return { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" };
  if (m.isStarted) return { label: "In Progress", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" };
  return { label: "New", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/30" };
}

function SkeletonMissionCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-white/10 bg-[#0d1117] p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-2/3 rounded-full bg-white/10 animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="h-3 w-full rounded-full bg-white/5 animate-pulse" />
      <div className="h-3 w-3/4 rounded-full bg-white/5 animate-pulse" />
      <div className="flex gap-4 pt-1">
        <div className="h-5 w-20 rounded-full bg-white/5 animate-pulse" />
        <div className="h-5 w-20 rounded-full bg-white/5 animate-pulse" />
      </div>
      <div className="h-9 w-full rounded-xl bg-white/5 animate-pulse" />
    </motion.div>
  );
}

function MissionCard({ mission, index, onClick, difficultyMeta }: { mission: Mission; index: number; onClick: () => void; difficultyMeta?: DifficultyMeta }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = getMissionStatus(mission);
  const diffStyle = getDifficultyStyle(difficultyMeta?.rankColorHex || "");
  const diffLabel = difficultyMeta?.name || mission.difficultyName;

  const isInProgress = mission.isStarted && !mission.isCompleted;
  const cardBorder = mission.isCompleted
    ? "border-emerald-500/30"
    : isInProgress
    ? "border-amber-500/30"
    : "border-white/10";
  const cardGlow = mission.isCompleted
    ? "hover:shadow-emerald-500/20 hover:border-emerald-500/50"
    : isInProgress
    ? "hover:shadow-amber-500/20 hover:border-amber-500/50"
    : "hover:shadow-cyan-500/10 hover:border-white/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`relative group rounded-2xl border bg-[#0d1117] p-5 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
        ${cardBorder} ${cardGlow}`}
      onClick={onClick}
    >
      {/* In-progress pulse */}
      {isInProgress && (
        <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}

      {/* Top row */}
      <div className="flex items-start gap-2 pr-6 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-cyan-100 transition-colors">
            {mission.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {diffLabel && (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border"
            style={diffStyle}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: diffStyle.color }} />
            {diffLabel}
          </span>
        )}
        <span className={`inline-flex items-center text-[11px] font-mono px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Body */}
      {mission.context && (
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-2 font-sans">
          {mission.context}
        </p>
      )}
      {mission.missionBrief && (
        <p className="text-xs text-white/30 leading-relaxed line-clamp-1 mb-3 font-sans italic">
          {mission.missionBrief}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[#FFD700] text-xs font-mono">
          <Zap className="w-3.5 h-3.5" />
          <span>{mission.experiencePoints} XP</span>
        </div>
        {mission.estimatedMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{mission.estimatedMinutes}m</span>
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-mono transition-all duration-200
          ${mission.isCompleted
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
            : isInProgress
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:scale-[1.01]"
          }`}
      >
        {mission.isCompleted ? (
          <><Eye className="w-4 h-4" /> View Result</>
        ) : isInProgress ? (
          <><RotateCcw className="w-4 h-4" /> Resume Mission</>
        ) : (
          <><Play className="w-4 h-4" /> Start Mission</>
        )}
      </button>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {showTooltip && (mission.constraints.length > 0 || mission.expectedOutcomes.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-72 z-20 rounded-xl border border-white/10 bg-[#0a0e14]/95 backdrop-blur p-4 shadow-2xl pointer-events-none"
          >
            {mission.constraints.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Constraints</p>
                <ul className="space-y-1">
                  {mission.constraints.slice(0, 3).map((c, i) => (
                    <li key={i} className="text-xs text-white/50 flex gap-1.5">
                      <span className="text-amber-400 mt-0.5">⚠</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mission.expectedOutcomes.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Expected Outcomes</p>
                <ul className="space-y-1">
                  {mission.expectedOutcomes.slice(0, 3).map((o, i) => (
                    <li key={i} className="text-xs text-white/50 flex gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type SortKey = "xp-desc" | "time-asc";
type StatusFilter = "all" | "new" | "started" | "completed";

function FilterBar({
  statusFilter,
  setStatusFilter,
  sortKey,
  setSortKey,
}: {
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs font-mono text-white/30 uppercase tracking-wider">Filter</span>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/3 p-1">
        {(["all", "new", "started", "completed"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 capitalize
              ${statusFilter === s
                ? "bg-[#00D2FF]/15 text-[#00D2FF] border border-[#00D2FF]/30"
                : "text-white/30 hover:text-white/60"
              }`}
          >
            {s === "all" ? "All" : s === "new" ? "New" : s === "started" ? "In Progress" : "Completed"}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ChevronDown className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs font-mono text-white/30 uppercase tracking-wider">Sort</span>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="bg-[#0d1117] border border-white/10 text-white/60 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00D2FF]/40"
        >
          <option value="xp-desc">XP: High → Low</option>
          <option value="time-asc">Time: Short → Long</option>
        </select>
      </div>
    </div>
  );
}

function ProgressBar({ completed, total, label }: { completed: number; total: number; label?: string }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-white/50">{label || `You've completed ${pct}% of this district`}</span>
        <span className="text-[#00D2FF]">{completed}/{total}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
        />
      </div>
    </div>
  );
}

export default function MissionListPage() {
  const params = useParams<{ districtId: string }>();
  const districtId = params.districtId || "";
  const [, navigate] = useLocation();
  const userId = getUserId();
  usePageTitle("Missions");
  const dashPath = isAuthenticated() ? getDashboardPath() : "/";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("xp-desc");

  const { data: missions, isLoading: missionsLoading, isError: missionsError, refetch } = useQuery<Mission[]>({
    queryKey: ["missions-by-district", districtId, userId],
    queryFn: async () => {
      const res = await api.problemNodes.byDistrict(districtId, userId);
      if (!res.ok) throw new Error(res.error || "Failed to load missions");
      return normMissions(res.data);
    },
    enabled: Boolean(districtId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: district } = useQuery({
    queryKey: ["district-detail", districtId],
    queryFn: async () => {
      const res = await api.districts.get(districtId);
      return res.ok ? normDistrict(res.data) : null;
    },
    enabled: Boolean(districtId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: difficulties } = useDifficulties();
  const difficultyLookup = buildDifficultyLookup(difficulties);

  const total = missions?.length ?? 0;
  const completed = missions?.filter(m => m.isCompleted).length ?? 0;
  const started = missions?.filter(m => m.isStarted && !m.isCompleted).length ?? 0;
  const totalXp = missions?.reduce((s, m) => s + m.experiencePoints, 0) ?? 0;

  const filtered = useMemo(() => {
    if (!missions) return [];
    let list = [...missions];
    if (statusFilter === "new") list = list.filter(m => !m.isStarted && !m.isCompleted);
    else if (statusFilter === "started") list = list.filter(m => m.isStarted && !m.isCompleted);
    else if (statusFilter === "completed") list = list.filter(m => m.isCompleted);
    if (sortKey === "xp-desc") list.sort((a, b) => b.experiencePoints - a.experiencePoints);
    else if (sortKey === "time-asc") list.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
    return list;
  }, [missions, statusFilter, sortKey]);

  return (
    <div className="min-h-screen bg-[#060a10] text-white relative overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,210,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-4 md:px-8 py-4 border-b border-white/5 bg-black/20 backdrop-blur">
        <nav className="flex items-center gap-1.5 text-xs font-mono text-white/30 min-w-0 flex-1">
          <Link href={dashPath} className="hover:text-white/60 transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" /> Dashboard
          </Link>
          <span>/</span>
          <span className="text-white/40 truncate max-w-[120px]">{district?.name || "District"}</span>
          <span>/</span>
          <span className="text-white/60">Missions</span>
        </nav>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-10">

        {/* Streak banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 text-xs font-mono text-amber-400"
        >
          <Flame className="w-4 h-4" />
          <span>Complete all missions to unlock a district badge</span>
        </motion.div>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-mono text-[#00D2FF] tracking-[0.3em] uppercase mb-1">
                <Target className="w-3 h-3 inline mr-1" />Missions
              </p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
                {district?.name || "District Missions"}
              </h1>
              {district?.description && (
                <p className="text-white/40 text-sm font-sans mt-2 max-w-lg">{district.description}</p>
              )}
            </div>

            {/* Stats */}
            {missions && missions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 flex-wrap"
              >
                {[
                  { label: "Total", value: total },
                  { label: "Completed", value: completed, accent: "text-emerald-400" },
                  { label: "In Progress", value: started, accent: "text-amber-400" },
                  { label: "XP Available", value: `${totalXp}`, accent: "text-[#FFD700]" },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="flex flex-col px-4 py-2.5 rounded-xl border border-white/10 bg-white/3 min-w-[90px] text-center">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
                    <span className={`text-xl font-bold ${accent || "text-white/80"}`}>{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          {missions && missions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-6 p-4 rounded-xl border border-white/10 bg-white/3"
            >
              <ProgressBar completed={completed} total={total} />
            </motion.div>
          )}
        </motion.div>

        {/* Filter bar */}
        {!missionsLoading && !missionsError && (missions?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <FilterBar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortKey={sortKey}
              setSortKey={setSortKey}
            />
          </motion.div>
        )}

        {/* Loading */}
        {missionsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMissionCard key={i} index={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {missionsError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400/60" />
            <p className="text-white/50 font-mono text-sm">Failed to load missions. Please retry.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-white/20 text-white/50 hover:text-white gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </motion.div>
        )}

        {/* Empty state */}
        {!missionsLoading && !missionsError && (missions?.length ?? 0) === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center"
          >
            <Target className="w-14 h-14 text-white/10" />
            <p className="text-white/40 font-mono text-sm max-w-xs">
              No missions available yet in this district.
              <br />
              Check back soon — missions are being crafted.
            </p>
          </motion.div>
        )}

        {/* Filtered empty */}
        {!missionsLoading && !missionsError && (missions?.length ?? 0) > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <Target className="w-10 h-10 text-white/10" />
            <p className="text-white/40 font-mono text-sm">No missions match the current filter.</p>
            <button
              onClick={() => setStatusFilter("all")}
              className="text-xs font-mono text-[#00D2FF] hover:underline"
            >
              Clear filter
            </button>
          </motion.div>
        )}

        {/* Mission grid */}
        {!missionsLoading && !missionsError && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((mission, i) => (
              <MissionCard
                key={mission.problemNodeId}
                mission={mission}
                index={i}
                onClick={() =>
                  mission.isCompleted
                    ? navigate(`/missions/node-results/${mission.problemNodeId}`)
                    : navigate(`/app/mission/${mission.problemNodeId}`)
                }
                difficultyMeta={difficultyLookup[mission.difficultyId]}
              />
            ))}
          </div>
        )}
      </main>

      <CopyrightBar className="relative z-10 border-t border-white/5" />
    </div>
  );
}
