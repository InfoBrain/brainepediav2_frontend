import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { readMissionAssignmentContext } from "@/lib/missionAssignmentContext";
import { normProblemNodeDetail } from "@/lib/problemNodeTypes";
import { resolveWorkspaceType, WorkspaceType } from "@/lib/workspaceType";
import type { MissionWorkInput } from "@/lib/checkpointRequirements";
import { resolveCheckpointAction, validateCheckpoint } from "@/lib/checkpointRequirements";
import {
  resolveContinueTarget,
  brainiacPromptForAction,
  missingRequirementToTarget,
  type NavigationTarget,
} from "@/lib/missionNavigation";
import {
  ConversationIntent,
  SubmissionStage,
  type MissionWorkspaceDto,
  type ReadinessDto,
} from "@/lib/missionExecutionTypes";
import {
  MissionStage,
  getCheckpointProgress,
  resolveMissionStage,
  resolveNextAction,
  stageToJourneyStep,
  type JourneyStep,
} from "@/lib/missionStage";
import {
  completeCheckpoint,
  fetchMentorHistory,
  fetchReadiness,
  fetchWorkspace,
  finalSubmit,
  markBriefReviewed,
  registerEvidence,
  resolveSubmissionIdForSession,
  reviewDraftWithMentor,
  saveDraft,
  sendMentorMessage,
  fetchReflection,
} from "@/lib/missionExecutionService";
import { MissionHeader } from "@/components/mission-workspace/MissionHeader";
import { MissionJourney } from "@/components/mission-workspace/MissionJourney";
import { MissionProgressPanel } from "@/components/mission-workspace/MissionProgressPanel";
import { NextActionCard } from "@/components/mission-workspace/NextActionCard";
import { BrainiacDrawer } from "@/components/mission-workspace/BrainiacDrawer";
import type { ChatMessage } from "@/components/mission-workspace/BrainiacDrawer";
import { EvidenceDrawer } from "@/components/mission-workspace/EvidenceDrawer";
import { BriefStage } from "@/components/mission-workspace/stages/BriefStage";
import { CheckpointWorkStage } from "@/components/mission-workspace/stages/CheckpointWorkStage";
import { BuildStage } from "@/components/mission-workspace/stages/BuildStage";
import { ReviewStage } from "@/components/mission-workspace/stages/ReviewStage";

// Re-export mapHistoryToChat from BrainiacMentorPanel for mentor history hydration
import { mapHistoryToChat as mapHistory } from "@/components/mission-workspace/BrainiacMentorPanel";

type StagedFile = { id: string; file: File };

const AUTO_SAVE_MS = 30_000;
const DEFAULT_CODE = "";

function buildApproachPayload(
  approach: string,
  understandingSummary: string,
  constraintReflection: string,
  planContent: string,
  structuredSections: Record<string, string>,
): string {
  const parts = [approach.trim()];
  if (understandingSummary.trim()) parts.push(`\n\n[Understanding]\n${understandingSummary.trim()}`);
  if (constraintReflection.trim()) parts.push(`\n\n[Constraints]\n${constraintReflection.trim()}`);
  if (planContent.trim()) parts.push(`\n\n[Plan]\n${planContent.trim()}`);
  const struct = Object.entries(structuredSections).filter(([, v]) => v.trim());
  if (struct.length) {
    parts.push(
      `\n\n[Structured Work]\n${struct.map(([k, v]) => `${k}: ${v}`).join("\n\n")}`,
    );
  }
  return parts.filter(Boolean).join("");
}

function buildDeliverablePayload(
  codeSnippet: string,
  workspaceType: WorkspaceType,
  structuredSections: Record<string, string>,
): string {
  const entries = Object.entries(structuredSections).filter(([, v]) => v.trim());
  if (
    workspaceType === WorkspaceType.Business ||
    workspaceType === WorkspaceType.Marketing ||
    workspaceType === WorkspaceType.Education ||
    workspaceType === WorkspaceType.ProjectManagement
  ) {
    if (entries.length === 0) return codeSnippet;
    const formatted = entries.map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
    return codeSnippet.trim() ? `${codeSnippet}\n\n${formatted}` : formatted;
  }
  if (workspaceType === WorkspaceType.Data) {
    const analysis = structuredSections.analysis ?? codeSnippet;
    const findings = structuredSections.findings ?? "";
    return [analysis, findings ? `\n\n## Findings\n${findings}` : ""].join("");
  }
  return codeSnippet;
}

function parseApproachDraft(approach: string): {
  baseApproach: string;
  understandingSummary: string;
  constraintReflection: string;
  planContent: string;
  structuredSections: Record<string, string>;
} {
  const extract = (tag: string) => {
    const re = new RegExp(`\\[${tag}\\]\\n([\\s\\S]*?)(?=\\n\\n\\[|$)`);
    const m = approach.match(re);
    return m ? m[1].trim() : "";
  };

  let baseApproach = approach;
  for (const tag of ["Understanding", "Constraints", "Plan", "Structured Work"]) {
    baseApproach = baseApproach.replace(new RegExp(`\\n\\n\\[${tag}\\][\\s\\S]*?(?=\\n\\n\\[|$)`, ""), "");
  }

  const structuredSections: Record<string, string> = {};
  const structuredRaw = extract("Structured Work");
  if (structuredRaw) {
    structuredRaw.split(/\n\n/).forEach((block) => {
      const idx = block.indexOf(":");
      if (idx > 0) {
        const key = block.slice(0, idx).trim();
        const value = block.slice(idx + 1).trim();
        if (key) structuredSections[key] = value;
      }
    });
  }

  return {
    baseApproach: baseApproach.trim(),
    understandingSummary: extract("Understanding"),
    constraintReflection: extract("Constraints"),
    planContent: extract("Plan"),
    structuredSections,
  };
}

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

function friendlyError(message?: string): string {
  const msg = message || "";
  const lower = msg.toLowerCase();
  if (lower.includes("403") || lower.includes("plan") || lower.includes("limit")) {
    return "Your current plan has reached its mission limit.";
  }
  if (lower.includes("401") || lower.includes("expired") || lower.includes("unauthorized")) {
    return "Your session has expired. Please sign in again.";
  }
  if (lower.includes("400") || lower.includes("complete") || lower.includes("requirement")) {
    return msg || "Complete the remaining mission steps before submitting.";
  }
  return msg || "Something went wrong. Please try again.";
}

export default function MissionWorkspacePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [approach, setApproach] = useState("");
  const [codeSnippet, setCodeSnippet] = useState(DEFAULT_CODE);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [brainiacOpen, setBrainiacOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [confirmingBrief, setConfirmingBrief] = useState(false);
  const [completingCheckpointId, setCompletingCheckpointId] = useState<string | null>(null);
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mentorSending, setMentorSending] = useState(false);
  const [reviewingDraft, setReviewingDraft] = useState(false);
  const [mentorReviewFeedback, setMentorReviewFeedback] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessDto | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [stageOverride, setStageOverride] = useState<MissionStage | null>(null);
  const [xpFlash, setXpFlash] = useState<number | null>(null);
  const [understandingSummary, setUnderstandingSummary] = useState("");
  const [constraintReflection, setConstraintReflection] = useState("");
  const [planContent, setPlanContent] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [structuredSections, setStructuredSections] = useState<Record<string, string>>({});
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [focusCheckpointId, setFocusCheckpointId] = useState<string | null>(null);
  const [focusSection, setFocusSection] = useState<"deliverable" | "approach" | "evidence" | undefined>();
  const userId = getUserId();
  const hydratedRef = useRef(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Prevents auto-clearing stageOverride immediately after intentional back-navigation */
  const skipStageClearRef = useRef(false);

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

  const employerChallengeId =
    workspace?.employerChallengeAssignmentId ||
    readMissionAssignmentContext(workspace?.problemNodeId ?? "").employerChallengeAssignmentId ||
    undefined;

  const { data: problemNode } = useQuery({
    queryKey: ["problem-node", workspace?.problemNodeId, employerChallengeId],
    queryFn: async () => {
      const res = await api.problemNodes.get(workspace!.problemNodeId, {
        employerChallengeAssignmentId: employerChallengeId ?? null,
      });
      if (!res.ok) return null;
      return normProblemNodeDetail(res.data);
    },
    enabled: Boolean(workspace?.problemNodeId),
    staleTime: 60_000,
  });

  const workspaceType = useMemo(() => {
    if (!problemNode && !workspace) return WorkspaceType.Generic;
    return resolveWorkspaceType({
      professionName: problemNode?.professionName,
      districtName: problemNode?.districtName,
      missionTitle: workspace?.missionTitle ?? problemNode?.title,
      missionBrief: workspace?.missionBrief ?? problemNode?.missionBrief,
      context: problemNode?.context,
      constraints: problemNode?.constraints,
      expectedOutcomes: problemNode?.expectedOutcomes,
    });
  }, [problemNode, workspace]);

  const missionWorkInput: MissionWorkInput = useMemo(
    () => ({
      approachExplanation: approach,
      codeSnippet,
      constraintReflection,
      planContent,
      understandingSummary,
      reviewConfirmed,
      evidence: workspace?.evidence ?? [],
      briefReviewed: workspace?.briefReviewed ?? false,
    }),
    [
      approach,
      codeSnippet,
      constraintReflection,
      planContent,
      understandingSummary,
      reviewConfirmed,
      workspace?.evidence,
      workspace?.briefReviewed,
    ],
  );

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
      const parsed = parseApproachDraft(draft.approachExplanation || "");
      setApproach(parsed.baseApproach || draft.approachExplanation || "");
      setUnderstandingSummary(parsed.understandingSummary);
      setConstraintReflection(parsed.constraintReflection);
      setPlanContent(parsed.planContent);
      if (Object.keys(parsed.structuredSections).length > 0) {
        setStructuredSections(parsed.structuredSections);
      }
      setCodeSnippet(draft.codeSnippet || DEFAULT_CODE);
      setLastSavedAt(draft.lastSavedAt || null);
    }
    hydratedRef.current = true;
  }, []);

  const computedStage = workspace
    ? resolveMissionStage(workspace, readiness, approach, codeSnippet)
    : MissionStage.Brief;
  const activeStage = stageOverride ?? computedStage;

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

  /* Clear stage override only when computed stage naturally catches up (forward progress) */
  useEffect(() => {
    if (!stageOverride) return;
    if (skipStageClearRef.current) {
      skipStageClearRef.current = false;
      return;
    }
    const order = [MissionStage.Brief, MissionStage.Planning, MissionStage.Building, MissionStage.Review, MissionStage.Submission];
    if (order.indexOf(computedStage) === order.indexOf(stageOverride)) {
      setStageOverride(null);
    }
  }, [computedStage, stageOverride]);

  /* Mentor history */
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetchMentorHistory(sessionId).then((res) => {
      if (!cancelled && res.ok && res.data.length > 0) {
        setChatMessages(mapHistory(res.data));
      }
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  /* Readiness polling — only when past brief */
  useEffect(() => {
    if (!workspace?.briefReviewed) return;
    loadReadiness();
    const id = setInterval(loadReadiness, 15_000);
    return () => clearInterval(id);
  }, [loadReadiness, workspace?.briefReviewed]);

  const persistDraft = useCallback(async (silent = false) => {
    if (!sessionId) return;
    if (!silent) setSavingDraft(true);
    const approachPayload = buildApproachPayload(
      approach,
      understandingSummary,
      constraintReflection,
      planContent,
      structuredSections,
    );
    const deliverablePayload = buildDeliverablePayload(codeSnippet, workspaceType, structuredSections);
    const res = await saveDraft({
      experienceSessionId: sessionId,
      approachExplanation: approachPayload,
      codeSnippet: deliverablePayload,
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
      toast({ title: "Could not save draft", description: friendlyError(res.error), variant: "destructive" });
    }
  }, [sessionId, approach, codeSnippet, understandingSummary, constraintReflection, planContent, structuredSections, workspaceType, toast]);

  const navigateToTarget = useCallback(
    (target: NavigationTarget) => {
      skipStageClearRef.current = true;
      setFocusCheckpointId(null);
      setFocusSection(undefined);

      switch (target.type) {
        case "brief":
          setStageOverride(MissionStage.Brief);
          break;
        case "checkpoint":
          setStageOverride(MissionStage.Planning);
          setFocusCheckpointId(target.checkpointId);
          break;
        case "workspace":
          setStageOverride(MissionStage.Building);
          setFocusSection(target.section);
          if (target.section === "evidence") setEvidenceOpen(true);
          setTimeout(() => {
            const id =
              target.section === "evidence"
                ? "workspace-evidence"
                : target.section === "approach"
                  ? "workspace-approach"
                  : "workspace-deliverable";
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 250);
          break;
        case "review":
          setStageOverride(MissionStage.Review);
          break;
        case "brainiac":
          setBrainiacOpen(true);
          break;
      }
    },
    [],
  );

  const handleJourneyStep = useCallback((step: JourneyStep) => {
    skipStageClearRef.current = true;
    setFocusCheckpointId(null);
    setFocusSection(undefined);
    switch (step) {
      case "brief":
        setStageOverride(MissionStage.Brief);
        break;
      case "plan":
        setStageOverride(MissionStage.Planning);
        break;
      case "build":
        setStageOverride(MissionStage.Building);
        break;
      case "review":
      case "submit":
        setStageOverride(MissionStage.Review);
        break;
    }
  }, []);

  const handleContinueWorking = useCallback(() => {
    if (!workspace) return;
    const target = resolveContinueTarget(
      readiness,
      workspace.checkpoints,
      workspace.briefReviewed,
    );
    navigateToTarget(target);
  }, [workspace, readiness, navigateToTarget]);

  const handleStructuredSectionChange = useCallback((key: string, value: string) => {
    setStructuredSections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleGoToRequirement = useCallback(
    (requirement: string) => {
      navigateToTarget(missingRequirementToTarget(requirement));
    },
    [navigateToTarget],
  );

  useEffect(() => {
    if (!sessionId || activeStage === MissionStage.Brief) return;
    autoSaveRef.current = setInterval(() => persistDraft(true), AUTO_SAVE_MS);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [sessionId, persistDraft, activeStage]);

  function flashXp(amount: number) {
    setXpFlash(amount);
    setTimeout(() => setXpFlash(null), 2500);
  }

  async function handleConfirmBrief() {
    setConfirmingBrief(true);
    const res = await markBriefReviewed(sessionId);
    setConfirmingBrief(false);
    if (res.ok) {
      flashXp(5);
      toast({ title: "Brief confirmed", description: "Let's plan your approach." });
      setStageOverride(MissionStage.Planning);
      await refreshWorkspace();
      await loadReadiness();
    } else {
      toast({ title: "Could not confirm brief", description: friendlyError(res.error), variant: "destructive" });
    }
  }

  /* Default Brainiac open during active work (desktop) */
  useEffect(() => {
    if (isMobile) return;
    if (activeStage === MissionStage.Planning || activeStage === MissionStage.Building) {
      setBrainiacOpen(true);
    }
  }, [activeStage, isMobile]);

  async function handleCompleteCheckpoint(checkpointProgressId: string, notes?: string) {
    const checkpoint = workspace?.checkpoints.find((c) => c.checkpointProgressId === checkpointProgressId);
    if (checkpoint) {
      const validation = validateCheckpoint(checkpoint, missionWorkInput);
      if (!validation.canComplete) {
        toast({ title: "Complete the work first", description: validation.reason, variant: "destructive" });
        return;
      }
    }

    await persistDraft(true);
    setCompletingCheckpointId(checkpointProgressId);
    const res = await completeCheckpoint(sessionId, checkpointProgressId, notes);
    setCompletingCheckpointId(null);
    if (res.ok) {
      flashXp(10);
      toast({ title: "+10 XP", description: "Checkpoint complete — keep going!" });
      await refreshWorkspace();
      await loadReadiness();
    } else {
      toast({ title: "Checkpoint failed", description: friendlyError(res.error), variant: "destructive" });
    }
  }

  async function handleAddEvidence(payload: {
    title: string;
    description: string;
    evidenceType: number;
    url: string;
  }) {
    setAddingEvidence(true);
    const res = await registerEvidence({ experienceSessionId: sessionId, ...payload });
    setAddingEvidence(false);
    if (res.ok) {
      flashXp(10);
      toast({ title: "+10 XP", description: "Evidence added" });
      await refreshWorkspace();
      await loadReadiness();
      return true;
    }
    toast({ title: "Could not add evidence", description: friendlyError(res.error), variant: "destructive" });
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
        flashXp(data.xpAwarded);
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

  async function handleReviewDraft() {
    setReviewingDraft(true);
    const draftContent = `${approach}\n\n---\n\n${codeSnippet}`;
    const res = await reviewDraftWithMentor(sessionId, draftContent);
    setReviewingDraft(false);
    if (res.ok) {
      const feedback = res.data.response;
      setMentorReviewFeedback(feedback);
      setChatMessages((m) => [
        ...m,
        { role: "mentor", text: feedback, suggestedActions: res.data.suggestedNextActions },
      ]);
      if (res.data.xpAwarded > 0) {
        flashXp(res.data.xpAwarded);
        await refreshWorkspace();
      }
    } else {
      toast({ title: "Review unavailable", description: friendlyError(res.error), variant: "destructive" });
    }
  }

  async function handleFinalSubmit() {
    setShowSubmitModal(false);
    setSubmitting(true);
    await persistDraft(true);

    const approachPayload = buildApproachPayload(
      approach,
      understandingSummary,
      constraintReflection,
      planContent,
      structuredSections,
    );
    const deliverablePayload = buildDeliverablePayload(codeSnippet, workspaceType, structuredSections);

    const fd = new FormData();
    fd.append("experienceSessionId", sessionId);
    fd.append("ExperienceSessionId", sessionId);
    fd.append("approachExplanation", approachPayload);
    fd.append("ApproachExplanation", approachPayload);
    fd.append("codeSnippet", deliverablePayload);
    fd.append("CodeSnippet", deliverablePayload);
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
      else toast({ title: "Submitted", description: "Your work has been submitted for review." });
    } else {
      toast({
        title: "Submission blocked",
        description: friendlyError(res.error || "Complete the remaining mission steps before submitting."),
        variant: "destructive",
      });
      await loadReadiness();
    }
  }

  function handlePrimaryAction() {
    switch (activeStage) {
      case MissionStage.Brief:
        handleConfirmBrief();
        break;
      case MissionStage.Planning:
        break;
      case MissionStage.Building:
        setStageOverride(MissionStage.Review);
        break;
      case MissionStage.Review:
        if (readiness?.isReady || workspace?.isReadyForFinalSubmission) {
          setShowSubmitModal(true);
        } else {
          handleContinueWorking();
        }
        break;
      case MissionStage.Submission:
        setShowSubmitModal(true);
        break;
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
          {friendlyError((error as Error)?.message || "Could not load workspace.")}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-mono text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const progress = getCheckpointProgress(workspace.checkpoints);
  const nextAction = resolveNextAction(workspace, readiness, approach, codeSnippet);
  const journeyStep = stageToJourneyStep(activeStage);
  const maxReachableStep = stageToJourneyStep(computedStage);
  const hideNextCta = activeStage === MissionStage.Planning;

  const currentCheckpoint = workspace.checkpoints.find((c) => !c.isCompleted);
  const currentCheckpointAction = currentCheckpoint
    ? resolveCheckpointAction(currentCheckpoint)
    : null;
  const brainiacContextPrompt = brainiacPromptForAction(
    currentCheckpointAction ?? "generic_work",
    activeStage,
  );

  return (
    <div className="min-h-screen bg-[#060a10] text-white flex flex-col">
      <MissionHeader
        missionTitle={workspace.missionTitle}
        employerChallenge={Boolean(workspace.employerChallengeAssignmentId)}
        sessionXpEarned={workspace.sessionXpEarned}
      />

      <MissionJourney
        currentStep={journeyStep}
        maxReachableStep={maxReachableStep}
        onStepSelect={handleJourneyStep}
      />

      {/* XP flash animation */}
      <AnimatePresence>
        {xpFlash !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] text-sm font-mono font-bold shadow-lg"
          >
            +{xpFlash} XP
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden">
        <div className="h-full max-h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto">
          {/* Left: progress panel (desktop) / collapsible (mobile) */}
          {activeStage !== MissionStage.Brief && (
            <MissionProgressPanel
              currentStep={journeyStep}
              checkpoints={workspace.checkpoints}
              progressPct={progress.pct}
              sessionXpEarned={workspace.sessionXpEarned}
            />
          )}

          {/* Center: current stage */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {activeStage !== MissionStage.Planning && activeStage !== MissionStage.Brief && (
              <NextActionCard
                action={nextAction}
                onPrimaryAction={handlePrimaryAction}
                hideCta={hideNextCta}
                primaryDisabled={confirmingBrief}
                primaryLoading={confirmingBrief}
              />
            )}

            <AnimatePresence mode="wait">
              {activeStage === MissionStage.Brief && (
                <BriefStage
                  missionTitle={workspace.missionTitle}
                  missionBrief={workspace.missionBrief}
                  employerChallenge={Boolean(workspace.employerChallengeAssignmentId)}
                  onConfirmBrief={handleConfirmBrief}
                  confirming={confirmingBrief}
                  onAskBrainiac={() => setBrainiacOpen(true)}
                />
              )}

              {activeStage === MissionStage.Planning && (
                <>
                  <NextActionCard action={nextAction} hideCta />
                  <CheckpointWorkStage
                    checkpoints={workspace.checkpoints}
                    completingId={completingCheckpointId}
                    onComplete={handleCompleteCheckpoint}
                    work={missionWorkInput}
                    workspaceType={workspaceType}
                    problemNode={problemNode}
                    approach={approach}
                    codeSnippet={codeSnippet}
                    onApproachChange={setApproach}
                    onCodeChange={setCodeSnippet}
                    onUnderstandingChange={setUnderstandingSummary}
                    onConstraintReflectionChange={setConstraintReflection}
                    onPlanContentChange={setPlanContent}
                    onReviewConfirmedChange={setReviewConfirmed}
                    onOpenEvidence={() => setEvidenceOpen(true)}
                    onBlurSave={() => persistDraft(true)}
                    codeLanguage={codeLanguage}
                    onLanguageChange={setCodeLanguage}
                    structuredSections={structuredSections}
                    onStructuredSectionChange={handleStructuredSectionChange}
                    evidence={workspace.evidence}
                    focusCheckpointId={focusCheckpointId}
                    focusSection={focusSection}
                  />
                </>
              )}

              {activeStage === MissionStage.Building && (
                <BuildStage
                  problemNode={problemNode ?? null}
                  missionBrief={workspace.missionBrief}
                  workspaceType={workspaceType}
                  approachExplanation={approach}
                  codeSnippet={codeSnippet}
                  onApproachChange={setApproach}
                  onCodeChange={setCodeSnippet}
                  onSaveDraft={() => persistDraft(false)}
                  onOpenEvidence={() => setEvidenceOpen(true)}
                  saving={savingDraft}
                  lastSavedAt={lastSavedAt}
                  evidence={workspace.evidence}
                  codeLanguage={codeLanguage}
                  onLanguageChange={setCodeLanguage}
                  structuredSections={structuredSections}
                  onStructuredSectionChange={handleStructuredSectionChange}
                  focusSection={focusSection}
                />
              )}

              {(activeStage === MissionStage.Review || activeStage === MissionStage.Submission) && (
                  <ReviewStage
                    workspace={workspace}
                    problemNode={problemNode}
                    readiness={readiness}
                    readinessLoading={readinessLoading}
                    approach={approach}
                    codeSnippet={codeSnippet}
                    onReviewWithBrainiac={handleReviewDraft}
                    reviewingDraft={reviewingDraft}
                    mentorFeedback={mentorReviewFeedback}
                    onSubmitFinal={() => setShowSubmitModal(true)}
                    onContinueWorking={handleContinueWorking}
                    onGoToRequirement={handleGoToRequirement}
                    submitting={submitting}
                  />
                )}
            </AnimatePresence>
          </div>

          {/* Right: Brainiac drawer (desktop inline) */}
          {!isMobile && (
            <BrainiacDrawer
              messages={chatMessages}
              sending={mentorSending}
              onSend={handleMentorSend}
              onSuggestedAction={(action) => handleMentorSend(action, ConversationIntent.DecisionSupport)}
              open={brainiacOpen}
              onOpenChange={setBrainiacOpen}
              contextPrompt={brainiacContextPrompt}
            />
          )}
        </div>
      </main>

      {/* Mobile Brainiac bottom sheet */}
      {isMobile && (
        <BrainiacDrawer
          messages={chatMessages}
          sending={mentorSending}
          onSend={handleMentorSend}
          onSuggestedAction={(action) => handleMentorSend(action, ConversationIntent.DecisionSupport)}
          open={brainiacOpen}
          onOpenChange={setBrainiacOpen}
          isMobile
          contextPrompt={brainiacContextPrompt}
        />
      )}

      {/* Mobile sticky action bar */}
      {isMobile && activeStage !== MissionStage.Brief && activeStage !== MissionStage.Planning && (
        <div className="sticky bottom-0 z-20 p-3 border-t border-white/5 bg-[#060a10]/95 backdrop-blur">
          <Button
            onClick={handlePrimaryAction}
            className="w-full font-mono text-sm bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] gap-1"
          >
            {nextAction.ctaLabel}
          </Button>
        </div>
      )}

      <EvidenceDrawer
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        onAddLinkEvidence={handleAddEvidence}
        onStageFiles={(files) =>
          setStagedFiles((prev) => [
            ...prev,
            ...files.map((file) => ({ id: crypto.randomUUID(), file })),
          ])
        }
        stagedFiles={stagedFiles}
        onRemoveStagedFile={(id) => setStagedFiles((prev) => prev.filter((f) => f.id !== id))}
        adding={addingEvidence}
      />

      {/* Final submit confirmation */}
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
                  Ready to send?
                </h2>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                Your solution will be submitted to the team lead for review. You won't be able to edit this submission after sending.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 font-mono text-xs border-white/15"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 font-mono text-xs bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Solution →"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/*
 * LEGACY UX:
 * The previous workspace rendered all mission sections simultaneously in a 3-column grid
 * (MissionBriefPanel, CheckpointChecklist, WorkArea, EvidencePanel, ReadinessChecklist,
 * SubmitBar, BrainiacMentorPanel). This created cognitive overload.
 * Those components are preserved in src/components/mission-workspace/ for reference
 * and potential reuse elsewhere. The new progressive workspace controls when each
 * section is rendered based on mission stage.
 */
