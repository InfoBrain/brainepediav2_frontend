import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GraduationCap, Plus, Calendar, Users, RefreshCw, Eye } from "lucide-react";
import { Link } from "wouter";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingState, ButtonLoading } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { useApiFeedback } from "@/hooks/useApiFeedback";

const schema = z.object({
  challengeName: z.string().min(1, "Challenge name required"),
  problemNodeId: z.string().min(1, "Problem Node ID required"),
  endDate: z.string().min(1, "End date required"),
});
type FormData = z.infer<typeof schema>;

type Challenge = {
  id: string;
  assignmentId: string;
  challengeName: string;
  problemNodeId: string;
  problemNodeTitle?: string;
  targetProfession?: string;
  endDate: string;
  participantCount?: number;
  completedCount?: number;
  professions?: string[];
  createdAt?: string;
};

type Participant = {
  id: string;
  userId: string;
  fullName: string;
  profession: string;
  attemptedAt?: string;
  completed: boolean;
  score: string;
  passed: boolean;
  problemNodeId: string;
};

type ChallengeParticipants = {
  challengeName: string;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  participants: Participant[];
};

export default function PrivateChallenges() {
  const { showSuccess, showError } = useApiFeedback();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [professions, setProfessions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [problemNodes, setProblemNodes] = useState<any[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [selectedProfessionName, setSelectedProfessionName] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<ChallengeParticipants | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultLoadingUserId, setResultLoadingUserId] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchChallenges = async () => {
    setLoading(true);
    setError("");
    const res = await api.employers.listChallenges();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load challenges.");
      setChallenges([]);
      return;
    }
    setChallenges(normChallenges(res.data));
  };

  useEffect(() => {
    fetchChallenges();
    api.professions.list().then((res) => {
      if (res.ok) setProfessions(asList(res.data));
    });
  }, []);

  useEffect(() => {
    if (!selectedProfessionId) {
      setDistricts([]);
      setSelectedDistrictId("");
      return;
    }
    setLoadingDistricts(true);
    api.districts.byProfession(selectedProfessionId).then((res) => {
      setDistricts(res.ok ? asList(res.data) : []);
      setLoadingDistricts(false);
    });
  }, [selectedProfessionId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setProblemNodes([]);
      setValue("problemNodeId", "");
      return;
    }
    setLoadingNodes(true);
    api.problemNodes.byDistrict(selectedDistrictId).then((res) => {
      setProblemNodes(res.ok ? asList(res.data) : []);
      setLoadingNodes(false);
    });
  }, [selectedDistrictId, setValue]);

  const onSubmit = async (data: FormData) => {
    const res = await api.employers.createChallenge(data);
    if (res.ok) {
      showSuccess({
        title: "Challenge created",
        description: `"${data.challengeName}" is now live.`,
      });
      reset();
      setSelectedProfessionId("");
      setSelectedProfessionName("");
      setSelectedDistrictId("");
      setOpen(false);
      fetchChallenges();
    } else {
      showError(res.error || "Please try again.", { title: "Failed to create challenge" });
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  const openChallenge = async (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setParticipants(null);
    setParticipantsError("");
    setParticipantsLoading(true);
    const res = await api.employers.challengeParticipants(challenge.assignmentId || challenge.id);
    setParticipantsLoading(false);
    if (res.ok) {
      setParticipants(normParticipants(res.data, challenge));
    } else {
      setParticipantsError(res.error || "Unable to load participants.");
      showError(res.error || "Please try again.", { title: "Unable to load participants" });
    }
  };

  const viewResult = async (participant: Participant) => {
    const problemNodeId = participant.problemNodeId || selectedChallenge?.problemNodeId;
    if (!problemNodeId || !participant.userId) return;
    setResultLoading(true);
    setResultLoadingUserId(participant.userId);
    setResult(null);
    const res = await api.evaluations.getNodeResult(problemNodeId, participant.userId);
    setResultLoading(false);
    setResultLoadingUserId("");
    if (res.ok) setResult(res.data);
    else showError(res.error || "Please try again.", { title: "Unable to load assessment result" });
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Challenges" subtitle="// employer.team.training" theme="employer">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Create private team training challenges using profession, district, and mission selections.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchChallenges} disabled={loading} aria-label="Refresh challenges">
              <ButtonLoading loading={loading}>
                <RefreshCw className="h-4 w-4" />
              </ButtonLoading>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-[0_0_12px_rgba(157,78,221,0.35)]" style={{ background: "#9D4EDD", color: "#fff" }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Team Challenge</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label>Challenge Name</Label>
                    <Input {...register("challengeName")} placeholder="Q3 Engineering Assessment" />
                    {errors.challengeName && <p className="text-destructive text-xs">{errors.challengeName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Profession</Label>
                    <select
                      value={selectedProfessionId}
                      onChange={(event) => {
                        const id = event.target.value;
                        const profession = professions.find((item) => String(item?.professionId ?? item?.id) === id);
                        setSelectedProfessionId(id);
                        setSelectedProfessionName(text(profession?.name ?? profession?.professionName ?? profession?.title, ""));
                        setSelectedDistrictId("");
                        setProblemNodes([]);
                        setValue("problemNodeId", "");
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select profession</option>
                      {professions.map((profession, index) => {
                        const id = text(profession?.professionId ?? profession?.id, "");
                        const name = text(profession?.name ?? profession?.professionName ?? profession?.title, "");
                        return id && name ? <option key={id || index} value={id}>{name}</option> : null;
                      })}
                    </select>
                    {selectedProfessionName && <p className="text-xs text-muted-foreground">Selected: {selectedProfessionName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>District</Label>
                    <select
                      value={selectedDistrictId}
                      onChange={(event) => setSelectedDistrictId(event.target.value)}
                      disabled={!selectedProfessionId || loadingDistricts}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="">{loadingDistricts ? "Loading districts..." : "Select district"}</option>
                      {districts.map((district, index) => {
                        const id = text(district?.districtId ?? district?.id, "");
                        const name = text(district?.name ?? district?.districtName, "");
                        return id && name ? <option key={id || index} value={id}>{name}</option> : null;
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Problem Node</Label>
                    <select
                      {...register("problemNodeId")}
                      disabled={!selectedDistrictId || loadingNodes}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="">{loadingNodes ? "Loading problem nodes..." : "Select problem node"}</option>
                      {problemNodes.map((node, index) => {
                        const id = text(node?.problemNodeId ?? node?.id, "");
                        const title = text(node?.title ?? node?.name, "Problem node");
                        const xp = text(node?.experiencePoints ?? node?.xp, "0");
                        return id ? <option key={id || index} value={id}>{title} · {xp} XP</option> : null;
                      })}
                    </select>
                    {errors.problemNodeId && <p className="text-destructive text-xs">{errors.problemNodeId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input {...register("endDate")} type="date" min={new Date().toISOString().split("T")[0]} />
                    {errors.endDate && <p className="text-destructive text-xs">{errors.endDate.message}</p>}
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isSubmitting}
                    style={{ background: "#9D4EDD" }}>
                    <ButtonLoading loading={isSubmitting}>
                      {isSubmitting ? "Creating…" : "Create Challenge"}
                    </ButtonLoading>
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading challenges…" variant="card" rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchChallenges} dashboardHref="/employer/overview" />
        ) : challenges.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No challenges yet"
            description="Create your first private team training challenge to assess and develop your workforce."
            actionLabel="Create Challenge"
            onAction={() => setOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map((ch) => {
              const expired = isExpired(ch.endDate);
              return (
                <div
                  key={ch.id}
                  className="bg-[#0d1119] border border-white/5 rounded-xl p-5 space-y-3 transition hover:border-[#9D4EDD]/50 hover:bg-[#9D4EDD]/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#9D4EDD]/15 flex items-center justify-center shrink-0 border border-[#9D4EDD]/30">
                        <GraduationCap className="h-4 w-4 text-[#9D4EDD]" />
                      </div>
                      <h3 className="font-semibold text-sm leading-tight">{ch.challengeName}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                      expired
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}>
                      {expired ? "Expired" : "Active"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 font-sans text-sm text-white/80">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Problem Node Title</p>
                      <p className="mt-1 font-semibold">{ch.problemNodeTitle || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 font-sans text-sm text-white/80">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Target Profession</p>
                      <p className="mt-1 font-semibold">{ch.targetProfession || ch.professions?.join(", ") || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Ends {new Date(ch.endDate).toLocaleDateString()}
                    </div>
                    {ch.participantCount !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        Total assigned employees: {ch.participantCount}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      Completed count: {ch.completedCount ?? 0}
                    </div>
                    {ch.professions && ch.professions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ch.professions.map((p, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px]">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground/60 font-mono break-all">
                    Node: {ch.problemNodeId}
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full" disabled={!ch.assignmentId}>
                    <Link href={participantsHref(ch)}>
                    <Users className="mr-2 h-3.5 w-3.5" />
                    View Participants
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={Boolean(selectedChallenge)} onOpenChange={(open) => !open && setSelectedChallenge(null)}>
        <DialogContent className="max-w-5xl bg-[#0d1119] border border-white/10">
          <DialogHeader>
            <DialogTitle>{selectedChallenge?.challengeName ?? "Challenge Participants"}</DialogTitle>
            <DialogDescription>Challenge summary, participant attempts, and completed results.</DialogDescription>
          </DialogHeader>
          {participantsLoading ? (
            <LoadingState label="Loading participants..." variant="table" rows={5} />
          ) : participantsError ? (
            <ErrorState
              message={participantsError}
              onRetry={() => selectedChallenge && openChallenge(selectedChallenge)}
              dashboardHref="/employer/overview"
              compact
            />
          ) : participants ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <SummaryCard label="Challenge Name" value={participants.challengeName} />
                <SummaryCard label="Total Assigned" value={participants.totalAssigned.toLocaleString()} />
                <SummaryCard label="Total Completed" value={participants.totalCompleted.toLocaleString()} />
                <SummaryCard label="Completion Rate" value={`${participants.completionRate}%`} />
              </div>
              {participants.participants.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No participants yet"
                  description="Team members assigned to this challenge will appear here once they attempt the mission."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Profession</th>
                        <th className="px-4 py-3">Attempted At</th>
                        <th className="px-4 py-3">Completed</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Passed</th>
                        <th className="px-4 py-3">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.participants.map((participant) => {
                        const isResultLoading = resultLoading && resultLoadingUserId === participant.userId;
                        return (
                          <tr key={participant.id} className="border-b border-white/5 last:border-0">
                            <td className="px-4 py-3 font-medium">{participant.fullName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{participant.profession}</td>
                            <td className="px-4 py-3">{participant.attemptedAt ? new Date(participant.attemptedAt).toLocaleString() : "—"}</td>
                            <td className="px-4 py-3">{participant.completed ? "Completed" : "Not Completed"}</td>
                            <td className="px-4 py-3">{participant.score}</td>
                            <td className="px-4 py-3">{participant.passed ? "Passed" : "Not Passed"}</td>
                            <td className="px-4 py-3">
                              {participant.completed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isResultLoading}
                                  onClick={() => viewResult(participant)}
                                >
                                  <ButtonLoading loading={isResultLoading}>
                                    <><Eye className="mr-2 h-3.5 w-3.5" /> View Result</>
                                  </ButtonLoading>
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(result) || resultLoading} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent className="max-w-2xl bg-[#0d1119] border border-white/10">
          <DialogHeader>
            <DialogTitle>Assessment Result</DialogTitle>
            <DialogDescription>Completed challenge evaluation outcome.</DialogDescription>
          </DialogHeader>
          {resultLoading ? (
            <LoadingState label="Loading assessment result..." variant="spinner" />
          ) : result ? (
            <AssessmentResult result={result} />
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function normChallenges(d: any): Challenge[] {
  const arr = Array.isArray(d) ? d : d?.challenges ?? d?.items ?? [];
  return arr.map((x: any) => ({
    id: String(x.employerChallengeAssignmentId ?? x.EmployerChallengeAssignmentId ?? x.assignmentId ?? x.AssignmentId ?? x.id ?? x.challengeId ?? ""),
    assignmentId: String(x.employerChallengeAssignmentId ?? x.EmployerChallengeAssignmentId ?? x.assignmentId ?? x.AssignmentId ?? ""),
    challengeName: x.challengeName ?? x.name ?? "Challenge",
    problemNodeId: x.problemNodeId ?? x.ProblemNodeId ?? x.nodeId ?? x.NodeId ?? "",
    problemNodeTitle: x.problemNodeTitle ?? x.problemNodeName ?? x.problemNode?.title ?? x.ProblemNodeTitle,
    targetProfession: x.targetProfession ?? x.profession ?? x.professionName ?? x.TargetProfession,
    endDate: x.endDate ?? x.expiryDate ?? new Date().toISOString(),
    participantCount: x.totalAssignedEmployees ?? x.TotalAssignedEmployees ?? x.participantCount ?? x.participants,
    completedCount: x.completedCount ?? x.CompletedCount ?? x.totalCompleted ?? x.completed,
    professions: Array.isArray(x.professions) ? x.professions : [],
    createdAt: x.createdAt ?? x.dateCreated,
  }));
}

function participantsHref(challenge: Challenge): string {
  const params = new URLSearchParams();
  if (challenge.problemNodeId) params.set("problemNodeId", challenge.problemNodeId);
  if (challenge.challengeName) params.set("challengeName", challenge.challengeName);
  const query = params.toString();
  return `/employer/challenges/${encodeURIComponent(challenge.assignmentId)}/participants${query ? `?${query}` : ""}`;
}

function normParticipants(data: any, challenge: Challenge): ChallengeParticipants {
  const root = data?.data ?? data?.summary ?? data;
  const participants = (Array.isArray(root?.participants) ? root.participants : Array.isArray(root) ? root : root?.items ?? []).map((item: any) =>
    normParticipant(item, challenge.problemNodeId),
  );
  const totalAssigned = Number(root?.totalAssigned ?? root?.TotalAssigned ?? root?.totalAssignedEmployees ?? root?.TotalAssignedEmployees ?? participants.length);
  const totalCompleted = Number(root?.totalCompleted ?? root?.TotalCompleted ?? root?.completedCount ?? root?.CompletedCount ?? participants.filter((p: Participant) => p.completed).length);
  const completionRate = Number(root?.completionRate ?? root?.CompletionRate ?? (totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0));
  return {
    challengeName: text(root?.challengeName ?? root?.ChallengeName ?? challenge.challengeName, challenge.challengeName),
    totalAssigned,
    totalCompleted,
    completionRate,
    participants,
  };
}

function normParticipant(item: any, fallbackProblemNodeId: string): Participant {
  const completed = Boolean(item?.completed ?? item?.Completed ?? item?.hasCompleted ?? item?.HasCompleted ?? item?.completedAt ?? item?.CompletedAt);
  const passValue = item?.passed ?? item?.Passed ?? item?.isPassed ?? item?.IsPassed ?? item?.passStatus ?? item?.PassStatus;
  return {
    id: String(item?.id ?? item?.participantId ?? item?.ParticipantId ?? item?.userId ?? item?.UserId ?? Math.random()),
    userId: text(item?.userId ?? item?.UserId ?? item?.participantUserId ?? item?.ParticipantUserId ?? item?.employeeUserId ?? item?.EmployeeUserId, ""),
    fullName: text(item?.fullName ?? item?.FullName ?? item?.name ?? item?.Name ?? `${item?.firstName ?? item?.FirstName ?? ""} ${item?.lastName ?? item?.LastName ?? ""}`.trim(), "Participant"),
    profession: text(item?.profession ?? item?.Profession ?? item?.professionName ?? item?.ProfessionName, "—"),
    attemptedAt: item?.attemptedAt ?? item?.AttemptedAt ?? item?.submittedAt ?? item?.SubmittedAt ?? item?.completedAt ?? item?.CompletedAt,
    completed,
    score: text(item?.score ?? item?.Score ?? item?.evaluationScore ?? item?.EvaluationScore, "—"),
    passed: typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue),
    problemNodeId: text(item?.problemNodeId ?? item?.ProblemNodeId ?? fallbackProblemNodeId, ""),
  };
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function AssessmentResult({ result }: { result: any }) {
  const root = result?.data ?? result?.result ?? result?.evaluation ?? result;
  const passValue = root?.passed ?? root?.isPassed ?? root?.IsPassed ?? root?.Passed ?? root?.passFail ?? root?.PassFail ?? root?.status ?? root?.Status;
  const passed = typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue);
  const rows: [string, string][] = [
    ["Mission Title", text(root?.missionTitle ?? root?.MissionTitle ?? root?.title ?? root?.Title, "Assessment mission")],
    ["Score", text(root?.score ?? root?.Score ?? root?.percentageScore ?? root?.PercentageScore, "—")],
    ["Strengths", resultText(root?.strengths ?? root?.Strengths ?? root?.Feedback?.Strengths, "No strengths returned.")],
    ["Weaknesses", resultText(root?.weaknesses ?? root?.Weaknesses ?? root?.Feedback?.Weaknesses, "No weaknesses returned.")],
    ["Improvement Areas", resultText(root?.improvementAreas ?? root?.ImprovementAreas ?? root?.areasForImprovement ?? root?.Feedback?.ImprovementAreas, "No improvement areas returned.")],
    ["AI Evaluation Summary", resultText(root?.aiEvaluationSummary ?? root?.AiEvaluationSummary ?? root?.summary ?? root?.Summary ?? root?.rawAiReasoning ?? root?.RawAiReasoning ?? root?.aiReasoning ?? root?.AiReasoning, "No AI evaluation summary returned.")],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pass Status</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${passed ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
          {passed ? "Passed" : "Not Passed"}
        </span>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

function resultText(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => text(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  if (value && typeof value === "object") {
    const items = Object.values(value).map((item) => text(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  return text(value, fallback);
}
