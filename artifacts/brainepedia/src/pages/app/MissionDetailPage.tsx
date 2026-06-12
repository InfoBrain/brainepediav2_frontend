import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Home,
  Zap,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Eye,
  BookOpen,
  Target,
  AlertTriangle,
  Loader2,
  Lock,
  X,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUserId, getDashboardPath, isAuthenticated } from "@/lib/auth";
import { asList } from "@/lib/jobData";
import {
  employerChallengeAssignmentIdOf,
  hasEmployerAssignmentSignal,
  problemNodeIdOf,
  readMissionAssignmentContext,
  storeMissionAssignmentContext,
  type MissionAssignmentContext,
} from "@/lib/missionAssignmentContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CopyrightBar } from "@/components/ui/CopyrightBar";
import { useDifficulties, buildDifficultyLookup, getDifficultyStyle } from "@/hooks/useDifficulties";

type ProblemNode = {
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
  attachmentUrl?: string | null;
  isStarted?: boolean;
  isCompleted?: boolean;
  employerChallengeAssignmentId?: string | null;
  isEmployerAssignedChallenge?: boolean;
};

type ActiveSession = {
  sessionId: string;
  status: string;
};

function normNode(data: any): ProblemNode {
  const parseArr = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch { return v ? [v] : []; }
    }
    return [];
  };
  return {
    problemNodeId: data?.problemNodeId || data?.id || data?.nodeId || "",
    title: data?.title || data?.name || "Untitled Challenge",
    context: data?.context || "",
    missionBrief: data?.missionBrief || "",
    constraints: parseArr(data?.constraints),
    expectedOutcomes: parseArr(data?.expectedOutcomes),
    experiencePoints: Number(data?.experiencePoints ?? 0),
    estimatedMinutes: Number(data?.estimatedMinutes ?? 0),
    difficultyId: data?.difficultyId || data?.difficulty?.difficultyId || data?.difficulty?.id || "",
    difficultyName: data?.difficultyName || data?.difficulty?.name || "",
    districtId: data?.districtId || "",
    attachmentUrl: data?.attachmentUrl || data?.attachment || null,
    isStarted: Boolean(data?.isStarted),
    isCompleted: Boolean(data?.isCompleted),
    employerChallengeAssignmentId: employerChallengeAssignmentIdOf(data) || null,
    isEmployerAssignedChallenge: hasEmployerAssignmentSignal(data),
  };
}

function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-white/10 animate-pulse"
          style={{ width: `${90 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

function UpgradeModal({ onClose, userId }: { onClose: () => void; userId: string | null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!userId) return;
    setLoading(true);
    const res = await api.subscriptions.initializeUpgrade({
      userId,
      newTier: 1,        // Architect (numeric, same as subscription page)
      currency: "NGN",
      source: "paystack",
    });
    setLoading(false);
    const data = res.data as { checkoutUrl?: string; authorization_url?: string } | null;
    const url = data?.checkoutUrl || data?.authorization_url;
    if (res.ok && url) {
      onClose();
      window.location.href = url;
    } else {
      toast({
        title: "Upgrade failed",
        description: res.error || "Could not start the payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-[#0d1117] border border-[#9D4EDD]/40 rounded-2xl p-6 shadow-2xl text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
          disabled={loading}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 rounded-full bg-[#9D4EDD]/20 border border-[#9D4EDD]/40 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-[#9D4EDD]" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Challenge Limit Reached</h3>
        <p className="text-sm text-white/50 mb-1 leading-relaxed">
          You've reached your monthly challenge limit.
          Upgrade to Architect to continue solving challenges.
        </p>
        <p className="text-xs text-[#9D4EDD]/80 font-mono mb-5">$19.99 / month</p>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9D4EDD] to-[#00D2FF] text-white text-sm font-bold font-mono hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
            : "Upgrade to Architect — $19.99/mo"
          }
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-2 py-2 text-xs font-mono text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
        >
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}

function ChecklistSection({
  title,
  icon,
  items,
  variant = "constraint",
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant?: "constraint" | "outcome";
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-bold font-mono text-white/80 uppercase tracking-wider">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.1 }}
            className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed"
          >
            {variant === "constraint" ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function MissionDetailPage() {
  const params = useParams<{ problemNodeId: string }>();
  const problemNodeId = params.problemNodeId || "";
  const [, navigate] = useLocation();
  const userId = getUserId();
  usePageTitle("Challenge");
  const dashPath = isAuthenticated() ? getDashboardPath() : "/";

  const [starting, setStarting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [assignmentContext, setAssignmentContext] = useState<MissionAssignmentContext>(() =>
    readMissionAssignmentContext(problemNodeId),
  );
  const contextAssignmentId = assignmentContext.employerChallengeAssignmentId || "";

  useEffect(() => {
    setAssignmentContext(readMissionAssignmentContext(problemNodeId));
    setStartError(null);
  }, [problemNodeId]);

  const {
    data: node,
    isLoading: nodeLoading,
    isError: nodeError,
    error: nodeErrorDetail,
    refetch,
  } = useQuery<ProblemNode>({
    queryKey: ["problem-node", problemNodeId, contextAssignmentId],
    queryFn: async () => {
      const res = await api.problemNodes.get(problemNodeId, {
        employerChallengeAssignmentId: contextAssignmentId || undefined,
      });
      if (!res.ok) throw new Error(res.error || "Failed to load challenge");
      return normNode(res.data);
    },
    enabled: Boolean(problemNodeId),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  const {
    data: assignedContext,
    isLoading: assignmentContextLoading,
  } = useQuery<MissionAssignmentContext | null>({
    queryKey: ["assigned-mission-context", userId, problemNodeId],
    queryFn: async () => {
      const res = await api.dashboard.assignedChallenges();
      if (!res.ok) return null;
      const match = asList(res.data).find((item) => problemNodeIdOf(item) === problemNodeId);
      if (!match) return null;
      return {
        problemNodeId,
        employerChallengeAssignmentId: employerChallengeAssignmentIdOf(match) || null,
        assignmentRequired: true,
      };
    },
    enabled: Boolean(userId) && Boolean(problemNodeId) && !contextAssignmentId,
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!assignedContext) return;
    setAssignmentContext((prev) => {
      const next: MissionAssignmentContext = {
        problemNodeId,
        employerChallengeAssignmentId:
          assignedContext.employerChallengeAssignmentId || prev.employerChallengeAssignmentId || null,
        assignmentRequired: Boolean(prev.assignmentRequired || assignedContext.assignmentRequired),
      };
      storeMissionAssignmentContext(next);
      return next;
    });
  }, [assignedContext, problemNodeId]);

  useEffect(() => {
    if (!node) return;
    const nodeAssignmentId = node.employerChallengeAssignmentId || "";
    if (!nodeAssignmentId && !node.isEmployerAssignedChallenge) return;
    setAssignmentContext((prev) => {
      const next: MissionAssignmentContext = {
        problemNodeId,
        employerChallengeAssignmentId: nodeAssignmentId || prev.employerChallengeAssignmentId || null,
        assignmentRequired: Boolean(prev.assignmentRequired || node.isEmployerAssignedChallenge || nodeAssignmentId),
      };
      storeMissionAssignmentContext(next);
      return next;
    });
  }, [node, problemNodeId]);

  const {
    data: activeSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useQuery<ActiveSession | null>({
    queryKey: ["active-session", userId, problemNodeId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await api.experienceSessions.getActive(userId, problemNodeId);
      if (!res.ok || !res.data) return null;
      const d = res.data as Record<string, unknown>;
      return { sessionId: String(d.sessionId || d.experienceSessionId || d.id || ""), status: String(d.status || "active") };
    },
    enabled: Boolean(userId) && Boolean(problemNodeId),
    staleTime: 30 * 1000,
    retry: false,
  });

  const { data: difficulties } = useDifficulties();
  const difficultyLookup = buildDifficultyLookup(difficulties);

  const isCompleted = node?.isCompleted ?? false;
  const hasActiveSession = Boolean(activeSession?.sessionId) && activeSession?.status !== "completed";
  const resolvedAssignmentId = assignmentContext.employerChallengeAssignmentId || node?.employerChallengeAssignmentId || "";
  const assignmentRequired = Boolean(assignmentContext.assignmentRequired || node?.isEmployerAssignedChallenge);
  const assignmentMissingMessage =
    "This challenge assignment could not be loaded correctly. Please return to your assignments and try again.";

  function startPayload() {
    if (assignmentRequired && !resolvedAssignmentId) {
      setStartError(assignmentMissingMessage);
      return null;
    }
    return {
      userId: userId || "",
      problemNodeId,
      ...(resolvedAssignmentId ? { employerChallengeAssignmentId: resolvedAssignmentId } : {}),
    };
  }

  // For completed missions: find the latest submissionId via GET /api/Submissions/session/{sessionId}
  const {
    data: latestSubmissionId,
    isLoading: submissionLookupLoading,
  } = useQuery<string | null>({
    queryKey: ["latest-submission", userId, problemNodeId, activeSession?.sessionId],
    queryFn: async () => {
      if (!userId || !problemNodeId) return null;
      const sessionId = activeSession?.sessionId;
      if (!sessionId) return null;
      const res = await api.submissions.getBySession(sessionId);
      if (!res.ok) return null;
      const arr = Array.isArray(res.data)
        ? res.data
        : res.data?.submissions || res.data?.data || [];
      if (!arr.length) return null;
      // Pick submission with highest score, or most recent
      const sorted = [...arr].sort((a: any, b: any) => {
        const aScore = Number(a?.evaluation?.score ?? a?.score ?? 0);
        const bScore = Number(b?.evaluation?.score ?? b?.score ?? 0);
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b?.dateCreated || 0).getTime() - new Date(a?.dateCreated || 0).getTime();
      });
      const best = sorted[0];
      return String(best?.submissionId || best?.id || "");
    },
    enabled: Boolean(userId) && Boolean(problemNodeId) && isCompleted && Boolean(activeSession?.sessionId),
    staleTime: 60 * 1000,
    retry: false,
  });

  async function handleStart() {
    if (!userId) { navigate("/auth/login"); return; }
    setStartError(null);
    const payload = startPayload();
    if (!payload) return;
    setStarting(true);
    const res = await api.experienceSessions.start(payload);
    setStarting(false);

    if (res.ok) {
      const rd = res.data as Record<string, unknown>;
      const sessionId = String(rd?.sessionId || rd?.experienceSessionId || rd?.id || "");
      navigate(`/app/session/${sessionId}/solve`);
      return;
    }

    if (res.status === 403) {
      setShowUpgrade(true);
      return;
    }

    if (res.status === 409) {
      setStartError("You already have an ongoing attempt.");
      refetchSession();
      return;
    }

    setStartError(res.error || "Failed to start challenge. Please try again.");
  }

  async function handleResume() {
    if (!userId) { navigate("/auth/login"); return; }
    setStartError(null);
    const payload = startPayload();
    if (!payload) return;
    setStarting(true);
    // Call start — API returns existing session or creates one
    const res = await api.experienceSessions.start(payload);
    setStarting(false);

    if (res.ok) {
      const rd = res.data as Record<string, unknown>;
      const sessionId = String(rd?.sessionId || rd?.experienceSessionId || rd?.id || "");
      if (sessionId) { navigate(`/app/session/${sessionId}/solve`); return; }
    }

    // 409 = session already exists — use the cached sessionId
    if (activeSession?.sessionId) {
      navigate(`/app/session/${activeSession.sessionId}/solve`);
      return;
    }

    setStartError(res.error || "Failed to resume challenge. Please try again.");
  }

  const diffMeta = node ? difficultyLookup[node.difficultyId] : undefined;
  const diffStyle = getDifficultyStyle(diffMeta?.rankColorHex || "");
  const diffLabel = diffMeta?.name || node?.difficultyName;

  return (
    <div className="min-h-screen bg-[#060a10] text-white relative overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
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
          {node?.districtId && (
            <>
              <Link href={`/app/district/${node.districtId}/missions`} className="hover:text-white/60 transition-colors">
                Challenges
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-white/60 truncate max-w-[160px]">{node?.title || "Challenge"}</span>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/app/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-cyan-400/70 hover:text-cyan-400 text-xs font-mono">
              <TrendingUp className="w-3.5 h-3.5" /> Progress
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">

        {/* Loading */}
        {nodeLoading && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-2/3 rounded-full bg-white/10 animate-pulse" />
              <div className="flex gap-3">
                <div className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
                <div className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d1117] p-5">
              <TextSkeleton lines={4} />
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d1117] p-5">
              <TextSkeleton lines={3} />
            </div>
          </div>
        )}

        {/* Error */}
        {nodeError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400/60" />
            <p className="text-white/50 font-mono text-sm">{nodeErrorDetail?.message || "Unable to load challenge details"}</p>
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

        {/* Content */}
        {!nodeLoading && !nodeError && node && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Prior attempt notice */}
            {node.isStarted && !isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-400/20 bg-amber-400/5 text-xs font-mono text-amber-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                You started this challenge earlier — pick up where you left off.
              </motion.div>
            )}

            {/* Hero header */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-[#00D2FF] tracking-[0.3em] uppercase">
                <Target className="w-3 h-3 inline mr-1" />Task Overview
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {node.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5">
                {diffLabel && (
                  <span
                    className="inline-flex items-center text-xs font-mono px-3 py-1.5 rounded-full border"
                    style={diffStyle}
                  >
                    {diffLabel}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-[#FFD700] text-sm font-mono px-3 py-1.5 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/5">
                  <Zap className="w-3.5 h-3.5" />
                  {node.experiencePoints} XP
                </div>
                {node.estimatedMinutes > 0 && (
                  <div className="flex items-center gap-1.5 text-white/50 text-sm font-mono px-3 py-1.5 rounded-full border border-white/10 bg-white/3">
                    <Clock className="w-3.5 h-3.5" />
                    {node.estimatedMinutes} min
                  </div>
                )}
              </div>
            </div>

            {/* Context section */}
            {node.context && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0d1117] to-[#0a0e14] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-[#00D2FF]" />
                  <h3 className="text-xs font-mono text-white/60 uppercase tracking-widest">Context</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed font-sans">{node.context}</p>
              </motion.div>
            )}

            {/* Mission brief */}
            {node.missionBrief && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-[#9D4EDD]/20 bg-[#9D4EDD]/5 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-[#9D4EDD]" />
                  <h3 className="text-xs font-mono text-[#9D4EDD]/80 uppercase tracking-widest">Your Task</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed font-sans">{node.missionBrief}</p>
              </motion.div>
            )}

            {/* Constraints + Expected Outcomes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChecklistSection
                title="Constraints"
                icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                items={node.constraints}
                variant="constraint"
              />
              <ChecklistSection
                title="Expected Outcomes"
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                items={node.expectedOutcomes}
                variant="outcome"
              />
            </div>

            {/* Attachment */}
            {node.attachmentUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="rounded-xl border border-white/10 bg-[#0d1117] p-5"
              >
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">Attachment</h3>
                {/\.(png|jpg|jpeg|gif|webp|svg)/i.test(node.attachmentUrl) ? (
                  <img
                    src={node.attachmentUrl}
                    alt="Mission attachment"
                    className="w-full rounded-lg object-cover max-h-48"
                  />
                ) : (
                  <a
                    href={node.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#00D2FF] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Download attachment
                  </a>
                )}
              </motion.div>
            )}

            {/* Error message */}
            {startError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-400/20 bg-red-400/5 text-sm text-red-400 font-mono"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {startError}
              </motion.div>
            )}

            {/* CTA section */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/3 to-transparent p-6"
            >
              <p className="text-xs font-mono text-white/30 text-center mb-4">
                You can pause and resume anytime
              </p>

              {sessionLoading || assignmentContextLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 text-[#00D2FF] animate-spin" />
                </div>
              ) : isCompleted ? (
                <div className="space-y-3">
                  {/* Completed banner */}
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 text-sm font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    Challenge Completed — this challenge has been evaluated
                  </div>
                  {/* View Result CTA */}
                  <button
                    onClick={() => navigate(`/missions/node-results/${problemNodeId}`)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-base font-bold font-mono hover:bg-emerald-500/20 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                  >
                    <Eye className="w-5 h-5" />
                    View My Result
                  </button>
                </div>
              ) : hasActiveSession ? (
                <button
                  onClick={handleResume}
                  disabled={starting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-base font-bold font-mono hover:bg-amber-500/20 hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {starting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Resuming…</>
                  ) : (
                    <><RotateCcw className="w-5 h-5" /> Resume Challenge</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[#00D2FF]/20 to-[#9D4EDD]/20 text-white border border-[#00D2FF]/40 text-base font-bold font-mono hover:from-[#00D2FF]/30 hover:to-[#9D4EDD]/30 hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#00D2FF]/10"
                >
                  {starting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Starting…</>
                  ) : (
                    <><Play className="w-5 h-5" /> Start Challenge</>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </main>

      <CopyrightBar className="relative z-10 border-t border-white/5" />

      {/* Upgrade modal */}
      <AnimatePresence>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} userId={userId} />}
      </AnimatePresence>
    </div>
  );
}
