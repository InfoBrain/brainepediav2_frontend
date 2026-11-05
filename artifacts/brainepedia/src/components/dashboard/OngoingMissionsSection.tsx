import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Compass, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  normalizeUserMissionStatistics,
  openContinuableMission,
  type MissionRecord,
} from "@/lib/missionStatistics";

type Props = {
  userId: string;
  className?: string;
};

export function OngoingMissionsSection({ userId, className }: Props) {
  const [, navigate] = useLocation();
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openingId, setOpeningId] = useState("");
  const [openError, setOpenError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(false);
      const res = await api.dashboard.userMissionStatistics(userId);
      if (cancelled) return;
      if (!res.ok) {
        setError(true);
        setMissions([]);
        setLoading(false);
        return;
      }
      setMissions(normalizeUserMissionStatistics(res.data).continuableMissions);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const openMission = async (mission: MissionRecord) => {
    const key = `${mission.problemNodeId}-${mission.employerChallengeAssignmentId || ""}`;
    setOpeningId(key);
    setOpenError("");
    const result = await openContinuableMission(userId, mission);
    setOpeningId("");
    if (result.ok && result.href) {
      navigate(result.href);
      return;
    }
    setOpenError(result.error || "Unable to open this mission.");
  };

  return (
    <div className={`bg-[#0d1119] border border-white/6 rounded-2xl p-6 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#182137] dark:text-amber-400">Continue a mission</h2>
          <p className="text-xs text-muted-foreground font-mono">Pending assignments and work already in progress</p>
        </div>
        <Target className="h-5 w-5 text-[#7d4ccc] dark:text-amber-400" />
      </div>
      {openError && <p className="mb-4 text-sm text-red-300">{openError}</p>}

      {loading ? (
        <div className="flex items-center gap-3 py-8 text-white/40 font-mono text-sm justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading missions…
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-white/35 font-mono">Could not load missions you can continue.</p>
          <p className="text-xs text-white/20 font-mono mt-1">Other dashboard sections are still available.</p>
        </div>
      ) : missions.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center gap-4">
          <p className="text-sm text-white/35 font-mono">No missions waiting</p>
          <p className="text-xs text-white/25 font-mono">Start a mission to see pending and in-progress work here.</p>
          <Link href="/profession/select">
            <Button variant="outline" size="sm" className="gap-2 border-[#d7c8ed] text-[#7d4ccc] hover:bg-[#f5f0fc] dark:border-amber-400/40 dark:text-amber-400 dark:hover:bg-amber-400/10">
              <Compass className="h-4 w-4" />
              Explore Missions
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {missions.map((mission, index) => (
            <ContinuableMissionCard
              key={`${mission.problemNodeId}-${mission.employerChallengeAssignmentId || index}`}
              mission={mission}
              index={index}
              busy={openingId === `${mission.problemNodeId}-${mission.employerChallengeAssignmentId || ""}`}
              onOpen={() => void openMission(mission)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContinuableMissionCard({
  mission,
  index,
  busy,
  onOpen,
}: {
  mission: MissionRecord;
  index: number;
  busy: boolean;
  onOpen: () => void;
}) {
  const pending = mission.status === "Pending" || !mission.experienceSessionId;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col gap-4 rounded-xl border border-[#e6e8ef] bg-white p-5 transition-colors hover:border-[#c9d8f8] dark:border-white/8 dark:bg-[#0A0E14] dark:hover:border-[#00D2FF]/25"
    >
      <div>
        <h3 className="text-sm font-bold leading-snug text-[#182137] dark:text-white">{mission.challengeName}</h3>
        <p className="mt-1 font-mono text-xs text-[#70798d]">{mission.companyName} · {mission.missionSource}</p>
      </div>
      <p className="font-mono text-xs text-[#626b7d] dark:text-white/45">{pending ? "Not started" : "In progress"}</p>
      <button
        type="button"
        onClick={onOpen}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c9d8f8] bg-[#edf4ff] px-4 py-2.5 text-xs font-bold text-[#276ef1] transition-colors hover:bg-[#dce8ff] disabled:opacity-60 dark:border-[#00D2FF]/30 dark:bg-[#00D2FF]/8 dark:font-mono dark:text-[#00D2FF] dark:hover:bg-[#00D2FF]/15"
        aria-label={`${pending ? "Start" : "Continue"} mission: ${mission.challengeName}`}
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Start mission" : "Continue mission"} →
      </button>
    </motion.div>
  );
}
