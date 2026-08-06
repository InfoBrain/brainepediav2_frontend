import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ConversationIntent,
  SubmissionStage,
  type MissionWorkspaceDto,
  type ReadinessDto,
} from "@/lib/missionExecutionTypes";
import {
  completeCheckpoint,
  fetchMentorHistory,
  fetchReadiness,
  fetchWorkspace,
  finalSubmit,
  markBriefReviewed,
  registerEvidence,
  requestReview,
  resolveSubmissionIdForSession,
  saveDraft,
  sendMentorMessage,
  fetchReflection,
} from "@/lib/missionExecutionService";
import { MissionBriefPanel } from "@/components/mission-workspace/MissionBriefPanel";
import { CheckpointChecklist } from "@/components/mission-workspace/CheckpointChecklist";
import { WorkArea } from "@/components/mission-workspace/WorkArea";
import { EvidencePanel } from "@/components/mission-workspace/EvidencePanel";
import {
  BrainiacMentorPanel,
  mapHistoryToChat,
} from "@/components/mission-workspace/BrainiacMentorPanel";
import { ReadinessChecklist } from "@/components/mission-workspace/ReadinessChecklist";
import { SubmitBar } from "@/components/mission-workspace/SubmitBar";

type StagedFile = { id: string; file: File };

type ChatMessage = {
  role: "user" | "mentor";
  text: string;
  suggestedActions?: string[];
  xpAwarded?: number;
};

const AUTO_SAVE_MS = 30_000;
const DEFAULT_CODE = "";

export default function MissionWorkspacePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [approach, setApproach] = useState("");
  const [codeSnippet, setCodeSnippet] = useState(DEFAULT_CODE);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mentorCollapsed, setMentorCollapsed] = useState(false);
  const [confirmingBrief, setConfirmingBrief] = useState(false);
  const [completingCheckpointId, setCompletingCheckpointId] = useState<string | null>(null);
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mentorSending, setMentorSending] = useState(false);
  const [readiness, setReadiness] = useState<ReadinessDto | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [resumeChecked, setResumeChecked] = useState(false);
  const hydratedRef = useRef(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    data: workspace,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mission-workspace", sessionId],
    queryFn: async () => {
      const res = await fetchWorkspace(sessionId);
      if (!res.ok) throw new Error(res.error || "Failed to load workspace");
      return res.data;
    },
    enabled: Boolean(sessionId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const refreshWorkspace = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["mission-workspace", sessionId] });
    await refetch();
  }, [queryClient, sessionId, refetch]);

  const loadReadiness = useCallback(async () => {
    if (!sessionId) return;
    setReadinessLoading(true);
    const res = await fetchReadiness(sessionId);
    setReadinessLoading(false);
    if (res.ok) setReadiness(res.data);
  }, [sessionId]);

  const hydrateFromDraft = useCallback((ws: MissionWorkspaceDto) => {
    if (hydratedRef.current) return;
    const draft = ws.latestDraft;
    if (draft) {
      setApproach(draft.approachExplanation || "");
      setCodeSnippet(draft.codeSnippet || DEFAULT_CODE);
      setLastSavedAt(draft.lastSavedAt || null);
    }
    hydratedRef.current = true;
  }, []);

  /* Resume routing */
  useEffect(() => {
    if (!workspace || resumeChecked) return;
    const ws = workspace;
    setResumeChecked(true);

    async function handleResume() {
      if (ws.submissionStage === SubmissionStage.FinalSubmitted) {
        const submissionId = await resolveSubmissionIdForSession(sessionId);
        if (submissionId) {
          navigate(`/mission/evaluating/${submissionId}/${sessionId}`);
          return;
        }
      }

      if (ws.submissionStage === SubmissionStage.Evaluated) {
        const reflectionRes = await fetchReflection(sessionId);
        if (reflectionRes.ok && !reflectionRes.data) {
          navigate(`/mission/reflection/${sessionId}`);
          return;
        }
      }

      hydrateFromDraft(ws);
    }

    handleResume();
  }, [workspace, sessionId, navigate, resumeChecked, hydrateFromDraft]);

  useEffect(() => {
    if (workspace && !resumeChecked) return;
    if (workspace) hydrateFromDraft(workspace);
  }, [workspace, hydrateFromDraft, resumeChecked]);

  /* Mentor history */
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetchMentorHistory(sessionId).then((res) => {
      if (!cancelled && res.ok && res.data.length > 0) {
        setChatMessages(mapHistoryToChat(res.data));
      }
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  /* Readiness polling */
  useEffect(() => {
    loadReadiness();
    const id = setInterval(loadReadiness, 15_000);
    return () => clearInterval(id);
  }, [loadReadiness]);

  const persistDraft = useCallback(async (silent = false) => {
    if (!sessionId) return;
    if (!silent) setSavingDraft(true);
    const res = await saveDraft({
      experienceSessionId: sessionId,
      approachExplanation: approach,
      codeSnippet,
    });
    if (!silent) setSavingDraft(false);
    if (res.ok) {
      const d = res.data as Record<string, unknown>;
      const ts = String(d?.lastSavedAt ?? d?.LastSavedAt ?? new Date().toISOString());
      setLastSavedAt(ts);
      if (!silent) {
        toast({ title: "Draft saved", description: "Your progress is saved." });
      }
    } else if (!silent) {
      toast({ title: "Could not save draft", description: res.error, variant: "destructive" });
    }
  }, [sessionId, approach, codeSnippet, toast]);

  /* Auto-save */
  useEffect(() => {
    if (!sessionId) return;
    autoSaveRef.current = setInterval(() => persistDraft(true), AUTO_SAVE_MS);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [sessionId, persistDraft]);

  async function handleConfirmBrief() {
    setConfirmingBrief(true);
    const res = await markBriefReviewed(sessionId);
    setConfirmingBrief(false);
    if (res.ok) {
      toast({ title: "Brief confirmed", description: "Checkpoints are now available." });
      await refreshWorkspace();
      await loadReadiness();
    } else {
      toast({ title: "Could not confirm brief", description: res.error, variant: "destructive" });
    }
  }

  async function handleCompleteCheckpoint(checkpointProgressId: string, notes?: string) {
    setCompletingCheckpointId(checkpointProgressId);
    const res = await completeCheckpoint(sessionId, checkpointProgressId, notes);
    setCompletingCheckpointId(null);
    if (res.ok) {
      toast({
        title: "Checkpoint complete",
        description: "+10 XP — keep going!",
      });
      await refreshWorkspace();
      await loadReadiness();
    } else {
      toast({ title: "Checkpoint failed", description: res.error, variant: "destructive" });
    }
  }

  async function handleAddEvidence(payload: {
    title: string;
    description: string;
    evidenceType: number;
    url: string;
  }) {
    setAddingEvidence(true);
    const res = await registerEvidence({
      experienceSessionId: sessionId,
      ...payload,
    });
    setAddingEvidence(false);
    if (res.ok) {
      toast({ title: "Evidence added", description: "+10 XP" });
      await refreshWorkspace();
      await loadReadiness();
      return true;
    }
    toast({ title: "Could not add evidence", description: res.error, variant: "destructive" });
    return false;
  }

  async function handleMentorSend(message: string, intent: number) {
    setMentorSending(true);
    setChatMessages((m) => [...m, { role: "user", text: message }]);
    const res = await sendMentorMessage({
      experienceSessionId: sessionId,
      userMessage: message,
      intent,
      currentApproach: approach,
      currentDraft: codeSnippet,
    });
    if (res.ok) {
      const data = res.data;
      setChatMessages((m) => [
        ...m,
        {
          role: "mentor",
          text: data.response,
          suggestedActions: data.suggestedNextActions,
          xpAwarded: data.xpAwarded,
        },
      ]);
      if (data.xpAwarded > 0) {
        toast({ title: `+${data.xpAwarded} XP`, description: "Mentor interaction" });
        await refreshWorkspace();
      }
    } else {
      setChatMessages((m) => [
        ...m,
        { role: "mentor", text: "I couldn't respond right now. Try again in a moment." },
      ]);
    }
    setMentorSending(false);
  }

  async function handleRequestReview() {
    setRequestingReview(true);
    const res = await requestReview(sessionId);
    setRequestingReview(false);
    if (res.ok) {
      toast({
        title: "Review requested",
        description: "Brainiac will coach you before final submission.",
      });
      await refreshWorkspace();
    } else {
      toast({ title: "Request failed", description: res.error, variant: "destructive" });
    }
  }

  async function handleFinalSubmit() {
    setShowSubmitModal(false);
    setSubmitting(true);
    await persistDraft(true);

    const fd = new FormData();
    fd.append("experienceSessionId", sessionId);
    fd.append("ExperienceSessionId", sessionId);
    fd.append("approachExplanation", approach);
    fd.append("ApproachExplanation", approach);
    fd.append("codeSnippet", codeSnippet);
    fd.append("CodeSnippet", codeSnippet);
    stagedFiles.forEach((sf) => fd.append("evidenceFiles", sf.file));
    stagedFiles.forEach((sf) => fd.append("EvidenceFiles", sf.file));

    const res = await finalSubmit(fd);
    setSubmitting(false);

    if (res.ok) {
      const rd = res.data as Record<string, unknown>;
      const submissionId = String(rd?.submissionId ?? rd?.SubmissionId ?? rd?.id ?? rd?.Id ?? "");
      if (submissionId) {
        navigate(`/mission/evaluating/${submissionId}/${sessionId}`);
        return;
      }
      const resolved = await resolveSubmissionIdForSession(sessionId);
      if (resolved) navigate(`/mission/evaluating/${resolved}/${sessionId}`);
      else toast({ title: "Submitted", description: "Submission received. Check your results shortly." });
    } else {
      toast({
        title: "Submission blocked",
        description: res.error || "Readiness requirements not met.",
        variant: "destructive",
      });
      await loadReadiness();
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#060a10] text-white flex items-center justify-center">
        <p className="text-sm font-mono text-white/40">Invalid session.</p>
      </div>
    );
  }

  if (isLoading && !workspace) {
    return (
      <div className="min-h-screen bg-[#060a10] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#00D2FF] animate-spin" />
        <p className="text-sm font-mono text-white/40">Loading mission workspace…</p>
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="min-h-screen bg-[#060a10] text-white flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-red-400/60" />
        <p className="text-sm font-mono text-white/50 text-center">
          {(error as Error)?.message || "Could not load workspace."}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-mono text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const isReady = readiness?.isReady ?? workspace.isReadyForFinalSubmission;

  return (
    <div className="min-h-screen bg-[#060a10] text-white flex flex-col">
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/30 backdrop-blur z-20">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono text-white/20">|</span>
        <span className="text-xs font-mono text-white/50 truncate flex-1">
          {workspace.missionTitle}
        </span>
        <a
          href={`/app/session/${sessionId}/solve`}
          className="text-[10px] font-mono text-white/25 hover:text-white/50 hidden sm:inline"
        >
          Legacy workspace
        </a>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full max-h-[calc(100vh-56px)] grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">
          {/* Left: brief + checkpoints */}
          <div className="lg:col-span-3 flex flex-col gap-3 lg:overflow-y-auto lg:max-h-full">
            <MissionBriefPanel
              missionTitle={workspace.missionTitle}
              missionBrief={workspace.missionBrief}
              currentPhase={workspace.currentPhase}
              progressPercentage={workspace.progressPercentage}
              briefReviewed={workspace.briefReviewed}
              employerChallenge={Boolean(workspace.employerChallengeAssignmentId)}
              onConfirmBrief={handleConfirmBrief}
              confirming={confirmingBrief}
            />
            <CheckpointChecklist
              checkpoints={workspace.checkpoints}
              briefReviewed={workspace.briefReviewed}
              completingId={completingCheckpointId}
              onComplete={handleCompleteCheckpoint}
            />
          </div>

          {/* Center: work area */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-h-[400px] lg:max-h-full lg:overflow-hidden">
            <WorkArea
              approachExplanation={approach}
              codeSnippet={codeSnippet}
              onApproachChange={setApproach}
              onCodeChange={setCodeSnippet}
              onSaveDraft={() => persistDraft(false)}
              saving={savingDraft}
              lastSavedAt={lastSavedAt}
            />
            <ReadinessChecklist readiness={readiness} loading={readinessLoading} />
            <SubmitBar
              sessionXpEarned={workspace.sessionXpEarned}
              isReady={isReady}
              submissionStage={workspace.submissionStage}
              onRequestReview={handleRequestReview}
              onSubmitFinal={() => setShowSubmitModal(true)}
              requestingReview={requestingReview}
              submitting={submitting}
            />
          </div>

          {/* Right: evidence + mentor */}
          <div className="lg:col-span-4 flex flex-col gap-3 lg:overflow-y-auto lg:max-h-full">
            <EvidencePanel
              evidence={workspace.evidence}
              stagedFiles={stagedFiles}
              onAddLinkEvidence={handleAddEvidence}
              onStageFiles={(files) =>
                setStagedFiles((prev) => [
                  ...prev,
                  ...files.map((file) => ({ id: crypto.randomUUID(), file })),
                ])
              }
              onRemoveStagedFile={(id) => setStagedFiles((prev) => prev.filter((f) => f.id !== id))}
              adding={addingEvidence}
            />
            <BrainiacMentorPanel
              messages={chatMessages}
              sending={mentorSending}
              onSend={handleMentorSend}
              onSuggestedAction={(action) => handleMentorSend(action, ConversationIntent.DecisionSupport)}
              collapsed={mentorCollapsed}
              onToggleCollapse={() => setMentorCollapsed((c) => !c)}
            />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-modal-title"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 id="submit-modal-title" className="text-lg font-bold font-mono">
                  Submit final deliverable?
                </h2>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                This sends your work for technical review — like handing off to a client. You won't be able to edit after submission.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 font-mono text-xs border-white/15"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Keep working
                </Button>
                <Button
                  className="flex-1 font-mono text-xs bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
