import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertCircle, RefreshCw, Map, Home } from "lucide-react";
import { DistrictCard, type District } from "@/components/profession/DistrictCard";
import { CopyrightBar } from "@/components/ui/CopyrightBar";
import { api } from "@/lib/api";
import { getUserId, getDashboardPath, isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type CityData = {
  professionId: string;
  name: string;
  iconUrl?: string | null;
  districts: District[];
};

function normCity(raw: any): CityData {
  const districts: District[] = Array.isArray(raw?.districts)
    ? raw.districts.map((d: any) => ({
        districtId: d.districtId || d.id || crypto.randomUUID(),
        name: d.name || d.districtName || "Unknown District",
        description: d.description || null,
        completionPercentage: Math.min(100, Math.max(0, Number(d.completionPercentage ?? d.completion ?? 0))),
        isLocked: Boolean(d.isLocked ?? false),
      }))
    : [];
  return {
    professionId: raw?.professionId || "",
    name: raw?.name || raw?.professionName || "Unknown Profession",
    iconUrl: raw?.iconUrl || null,
    districts,
  };
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col gap-3 p-5 rounded-2xl border border-white/10 bg-[#0d1117]"
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-32 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 animate-pulse" />
      <div className="h-2 w-3/4 rounded-full bg-white/5 animate-pulse" />
      <div className="mt-auto space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-white/5 animate-pulse" />
      </div>
    </motion.div>
  );
}

export default function DistrictMap() {
  const params = useParams<{ professionId: string }>();
  const professionId = params.professionId || "";
  const [, navigate] = useLocation();
  const userId = getUserId();

  const { data, isLoading, isError, refetch } = useQuery<CityData>({
    queryKey: ["profession-city", professionId, userId],
    queryFn: async () => {
      // Try the city endpoint first
      const cityRes = await api.professions.city(professionId, userId);
      if (cityRes.ok && cityRes.data) return normCity(cityRes.data);

      // Fallback: combine profession info + district list
      const [profRes, distRes] = await Promise.all([
        api.professions.get(professionId),
        api.districts.byProfession(professionId),
      ]);
      const prof = profRes.ok ? profRes.data : null;
      const dists = distRes.ok && Array.isArray(distRes.data) ? distRes.data : [];
      return normCity({ ...prof, districts: dists });
    },
    enabled: Boolean(professionId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // Separate lightweight query just for the profession name (no spinner flicker)
  const { data: fallbackProf } = useQuery({
    queryKey: ["profession-fallback", professionId],
    queryFn: async () => {
      const res = await api.professions.get(professionId);
      return res.ok ? res.data : null;
    },
    enabled: !data && Boolean(professionId),
    staleTime: 5 * 60 * 1000,
  });

  const profName = data?.name || (fallbackProf as { name?: string } | null)?.name || "Profession";
  const districts = data?.districts ?? [];

  // Find the recommended district (lowest non-zero completion, or first unstarted)
  const recommended = districts.reduce<District | null>((best, d) => {
    if (d.isLocked || d.completionPercentage >= 100) return best;
    if (!best) return d;
    if (d.completionPercentage > 0 && (best.completionPercentage === 0 || d.completionPercentage < best.completionPercentage)) return d;
    return best;
  }, null);

  const handleDistrictClick = (d: District) => {
    navigate(`/district/${d.districtId}`);
  };

  const dashPath = isAuthenticated() ? getDashboardPath() : "/";

  return (
    <div className="min-h-screen bg-[#060a10] text-white relative overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 px-4 md:px-8 py-4 border-b border-white/5 bg-black/20 backdrop-blur">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-mono text-white/30 min-w-0">
          <Link href={dashPath} className="hover:text-white/60 transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" /> Dashboard
          </Link>
          <span>/</span>
          <Link href="/profession/select" className="hover:text-white/60 transition-colors">
            Professions
          </Link>
          <span>/</span>
          <span className="text-white/50 truncate max-w-[120px]">{profName}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/profession/select">
            <Button variant="ghost" size="sm" className="gap-1.5 text-white/40 hover:text-white text-xs font-mono">
              <ArrowLeft className="w-3.5 h-3.5" /> Professions
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-2">
            {data?.iconUrl && (
              <img src={data.iconUrl} alt={profName} className="w-10 h-10 object-contain drop-shadow-lg" />
            )}
            <div>
              <p className="text-[10px] font-mono text-purple-400 tracking-[0.3em] uppercase mb-0.5">
                <Map className="w-3 h-3 inline mr-1" />District Map
              </p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
                {profName}
              </h1>
            </div>
          </div>
          <p className="text-white/40 text-sm font-mono">
            Explore districts and master real-world skills
          </p>

          {/* Stats row */}
          {districts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mt-5"
            >
              {[
                { label: "Total Districts", value: districts.length },
                { label: "In Progress", value: districts.filter(d => d.completionPercentage > 0 && d.completionPercentage < 100).length },
                { label: "Mastered", value: districts.filter(d => d.completionPercentage >= 100).length },
                {
                  label: "Avg. Completion",
                  value: `${Math.round(districts.reduce((s, d) => s + d.completionPercentage, 0) / districts.length)}%`,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col px-4 py-2 rounded-xl border border-white/10 bg-white/3 min-w-[100px]">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
                  <span className="text-lg font-bold text-white/80">{value}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ─── LOADING ─── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        )}

        {/* ─── ERROR ─── */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400/60" />
            <p className="text-white/50 font-mono text-sm">Unable to load districts</p>
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

        {/* ─── EMPTY ─── */}
        {!isLoading && !isError && districts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center"
          >
            <Map className="w-14 h-14 text-white/10" />
            <p className="text-white/40 font-mono text-sm max-w-xs">
              No districts available for this profession yet.
              <br />
              Check back soon — the city is being built.
            </p>
            <Link href="/profession/select">
              <Button variant="outline" size="sm" className="border-white/20 text-white/50 hover:text-white gap-2 mt-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Choose another profession
              </Button>
            </Link>
          </motion.div>
        )}

        {/* ─── DISTRICT GRID ─── */}
        {!isLoading && !isError && districts.length > 0 && (
          <>
            {/* Recommended banner */}
            <AnimatePresence>
              {recommended && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-2.5 mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 text-xs font-mono text-amber-400"
                >
                  <span className="text-base">★</span>
                  <span>
                    Recommended next: <strong>{recommended.name}</strong>
                    {recommended.completionPercentage > 0 && (
                      <> — {recommended.completionPercentage}% complete</>
                    )}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {districts.map((d, i) => (
                <DistrictCard
                  key={d.districtId}
                  district={d}
                  index={i}
                  isRecommended={d.districtId === recommended?.districtId}
                  onClick={handleDistrictClick}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <CopyrightBar className="relative z-10 border-t border-white/5" />
    </div>
  );
}
