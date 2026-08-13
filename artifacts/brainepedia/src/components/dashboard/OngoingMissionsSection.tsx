import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Compass, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { asList } from "@/lib/jobData";
import { storeMissionAssignmentContext } from "@/lib/missionAssignmentContext";
import { fetchWorkspace } from "@/lib/missionExecutionService";
import {
  applyCheckpointProgress,
  normOngoingMissionFromSession,
  type OngoingMission,
} from "@/lib/ongoingMissionTypes";

type Props = {
  userId: string;
  className?: string;
};

export function OngoingMissionsSection({ userId, className }: Props) {
  const [missions, setMissions] = useState<OngoingMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(false);

      const res = await api.experienceSessions.list();
      if (cancelled) return;

      if (!res.ok) {
        setError(true);
        setMissions([]);
        setLoading(false);
        return;
      }

      const rawSessions = asList(res.data);
      const ongoing = rawSessions
        .filter((s) => {
          const sessionUserId = String(
            (s as Record<string, unknown>).userId ??
              (s as Record<string, unknown>).UserId ??
              (s as Record<string, unknown>).applicationUserId ??
              "",
          );
          return !sessionUserId || sessionUserId === userId;
        })
        .map(normOngoingMissionFromSession)
        .filter((m): m is OngoingMission => Boolean(m));

      const enriched = await Promise.all(
        ongoing.slice(0, 8).map(async (mission) => {
          try {
            const ws = await fetchWorkspace(mission.sessionId);
            if (ws.ok && ws.data?.checkpoints?.length) {
              return applyCheckpointProgress(mission, ws.data.checkpoints);
            }
          } catch {
            /* keep session-level progress */
          }
          return mission;
        }),
      );

      if (!cancelled) {
        setMissions(enriched);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className={`bg-[#0d1119] border border-white/6 rounded-2xl p-6 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-amber-400">Ongoing Missions</h2>
          <p className="text-xs text-muted-foreground font-mono">Continue where you left off</p>
        </div>
        <Target className="h-5 w-5 text-amber-400" />
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8 text-white/40 font-mono text-sm justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading missions…
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-white/35 font-mono">Could not load ongoing missions.</p>
          <p className="text-xs text-white/20 font-mono mt-1">Other dashboard sections are still available.</p>
        </div>
      ) : missions.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center gap-4">
          <p className="text-sm text-white/35 font-mono">No missions in progress</p>
          <p className="text-xs text-white/25 font-mono">Start a mission to see your active work here.</p>
          <Link href="/profession/select">
            <Button variant="outline" size="sm" className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 gap-2">
              <Compass className="h-4 w-4" />
              Explore Missions
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {missions.map((mission, i) => (
            <OngoingMissionCard key={mission.sessionId} mission={mission} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function OngoingMissionCard({ mission, index }: { mission: OngoingMission; index: number }) {
  const workspaceHref = `/app/session/${encodeURIComponent(mission.sessionId)}/workspace`;
  const subtitle = [mission.professionName, mission.districtName].filter(Boolean).join(" · ");
  const hasCheckpointProgress = mission.totalCheckpoints > 0;
  const progressLabel = hasCheckpointProgress
    ? `${mission.completedCheckpoints} / ${mission.totalCheckpoints} checkpoints`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border border-white/8 bg-[#0A0E14] p-5 flex flex-col gap-4 hover:border-[#00D2FF]/25 transition-colors"
    >
      <div>
        <h3 className="text-sm font-bold text-white leading-snug">{mission.title}</h3>
        {subtitle && <p className="text-xs text-white/40 font-mono mt-1">{subtitle}</p>}
      </div>

      <div className="space-y-2">
        {progressLabel && (
          <p className="text-xs font-mono text-white/45">Progress: {progressLabel}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] transition-all duration-700"
              style={{ width: `${mission.progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#00D2FF] shrink-0">{mission.progressPercentage}% complete</span>
        </div>
      </div>

      <Link
        href={workspaceHref}
        onClick={() => {
          storeMissionAssignmentContext({
            problemNodeId: mission.problemNodeId,
            employerChallengeAssignmentId: mission.employerChallengeAssignmentId ?? null,
            assignmentRequired: Boolean(mission.employerChallengeAssignmentId),
          });
        }}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#00D2FF]/30 bg-[#00D2FF]/8 px-4 py-2.5 text-xs font-mono text-[#00D2FF] hover:bg-[#00D2FF]/15 transition-colors"
        aria-label={`Continue mission: ${mission.title}`}
      >
        Continue Mission →
      </Link>
    </motion.div>
  );
}
