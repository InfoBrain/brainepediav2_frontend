import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserCheck, Send, Loader2, CheckCircle, Clock, Search, RefreshCw, Eye } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const schema = z.object({
  candidateEmail: z.string().email("Valid email required"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  professionName: z.string().min(1, "Profession required"),
  problemNodeId: z.string().min(1, "Assessment required"),
});
type FormData = z.infer<typeof schema>;

type ProblemNodeOption = {
  id: string;
  title: string;
  districtName: string;
  xp: number;
};

type Assessment = {
  id: string;
  candidateUserId: string;
  problemNodeId: string;
  candidateName: string;
  email: string;
  assessment: string;
  status: string;
  completionStatus: string;
  completedAt?: string;
  assignedAt?: string;
};

export default function CandidateAssessments() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<FormData | null>(null);
  const [professions, setProfessions] = useState<string[]>([]);
  const [problemNodes, setProblemNodes] = useState<ProblemNodeOption[]>([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodesError, setNodesError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { professionName: "", problemNodeId: "" },
  });
  const selectedProfession = watch("professionName");
  const selectedProblemNodeId = watch("problemNodeId");

  const fetchAssessments = async () => {
    setLoading(true);
    const res = await api.employers.listAssessments();
    if (res.ok) {
      setAssessments(normAssessments(res.data));
    } else {
      toast({ title: "Unable to load assessments", description: res.error, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssessments();
    api.professions.list().then((res) => {
      if (!res.ok) {
        toast({ title: "Unable to load professions", description: res.error, variant: "destructive" });
        return;
      }
      setProfessions(
        asList(res.data)
          .map((item) => text(item?.name ?? item?.Name ?? item?.professionName ?? item?.title, ""))
          .filter(Boolean),
      );
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setValue("problemNodeId", "");
    setProblemNodes([]);
    setNodesError("");
    if (!selectedProfession) return;
    (async () => {
      setNodesLoading(true);
      const res = await api.problemNodes.byProfession(selectedProfession);
      if (cancelled) return;
      setNodesLoading(false);
      if (!res.ok) {
        setNodesError(res.error || "Unable to load assessments for this profession.");
        toast({ title: "Unable to load assessments", description: res.error, variant: "destructive" });
        return;
      }
      setProblemNodes(asList(res.data).map(normProblemNode).filter((node) => node.id));
    })();
    return () => { cancelled = true; };
  }, [selectedProfession, setValue, toast]);

  const onFormSubmit = (data: FormData) => {
    setConfirmData(data);
  };

  const onConfirm = async () => {
    if (!confirmData) return;
    const res = await api.employers.assignMission({
      candidateEmail: confirmData.candidateEmail,
      firstName: confirmData.firstName,
      lastName: confirmData.lastName,
      problemNodeId: confirmData.problemNodeId,
    });
    setConfirmData(null);
    if (res.ok) {
      toast({ title: "Invitation sent", description: res.message || `Assessment dispatched to ${confirmData.candidateEmail}.` });
      reset();
      setOpen(false);
      fetchAssessments();
    } else {
      toast({ title: "Failed to assign", description: res.error, variant: "destructive" });
    }
  };

  const viewAssessmentResult = async (assessment: Assessment) => {
    if (!assessment.problemNodeId || !assessment.candidateUserId) return;
    setResultLoading(true);
    setResult(null);
    const res = await api.evaluations.getNodeResult(assessment.problemNodeId, assessment.candidateUserId);
    setResultLoading(false);
    if (!res.ok) {
      toast({ title: "Unable to load assessment result", description: res.error, variant: "destructive" });
      return;
    }
    setResult(res.data);
  };

  const filtered = assessments.filter(
    (a) =>
      !search ||
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("completed"))
      return { label: "Completed", className: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle };
    if (s.includes("progress"))
      return { label: "In Progress", className: "bg-[#00D2FF]/10 text-[#00D2FF] border-[#00D2FF]/20", icon: Clock };
    if (s.includes("pending"))
      return { label: "Pending", className: "bg-amber-500/10 text-amber-300 border-amber-500/20", icon: Clock };
    return { label: "Not Started", className: "bg-white/5 text-muted-foreground border-white/10", icon: Send };
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Candidate Assessments" subtitle="// employer.recruitment.pipeline" theme="employer">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates…" className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchAssessments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={open} onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) {
                reset({ firstName: "", lastName: "", candidateEmail: "", professionName: "", problemNodeId: "" });
                setProblemNodes([]);
                setNodesError("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-[0_0_12px_rgba(255,215,0,0.3)]" style={{ background: "#FFD700", color: "#000" }}>
                  <Send className="h-4 w-4 mr-2" />
                  Invite Candidate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Invite Candidate to Assessment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input {...register("firstName")} />
                      {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input {...register("lastName")} />
                      {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Candidate Email</Label>
                    <Input {...register("candidateEmail")} type="email" placeholder="candidate@example.com" />
                    {errors.candidateEmail && <p className="text-destructive text-xs">{errors.candidateEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Profession</Label>
                    <select
                      {...register("professionName")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select profession</option>
                      {professions.map((profession) => (
                        <option key={profession} value={profession}>{profession}</option>
                      ))}
                    </select>
                    {errors.professionName && <p className="text-destructive text-xs">{errors.professionName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Assessment</Label>
                    <select
                      {...register("problemNodeId")}
                      disabled={!selectedProfession || nodesLoading || Boolean(nodesError)}
                      className="flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {!selectedProfession
                          ? "Select a profession first"
                          : nodesLoading
                          ? "Loading assessments..."
                          : problemNodes.length === 0
                          ? "No assessments available"
                          : "Select assessment"}
                      </option>
                      {problemNodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.title} — {node.districtName} — {node.xp.toLocaleString()} XP
                        </option>
                      ))}
                    </select>
                    {nodesError && <p className="text-destructive text-xs">{nodesError}</p>}
                    {errors.problemNodeId && <p className="text-destructive text-xs">{errors.problemNodeId.message}</p>}
                    {selectedProfession && !nodesLoading && !nodesError && problemNodes.length > 0 && (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
                        {selectedProblemNodeId ? (
                          <AssessmentSummary node={problemNodes.find((node) => node.id === selectedProblemNodeId)} />
                        ) : (
                          "Choose the assessment problem node to invite this candidate."
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedProfession || !selectedProblemNodeId}
                    className="w-full font-bold disabled:opacity-60"
                    style={{ background: "#FFD700", color: "#000" }}
                  >
                    Review & Send
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-[#0d1119] border border-white/5 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-sm">Loading assessments…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg m-4">
              {search ? "No candidates match your search." : "No assessments sent yet. Invite your first candidate above."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Candidate</th>
                    <th className="text-left px-4 py-3">Assessment</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date Assigned</th>
                    <th className="text-left px-4 py-3">Completion Status</th>
                    <th className="text-left px-4 py-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const badge = statusBadge(a.completionStatus);
                    const Icon = badge.icon;
                    const canViewResult = a.completionStatus === "Completed" && a.problemNodeId && a.candidateUserId;
                    return (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#9D4EDD]/20 flex items-center justify-center text-xs font-bold shrink-0">
                              {a.candidateName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{a.candidateName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{a.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[220px] truncate">
                          {a.assessment}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${badge.className}`}>
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {a.completionStatus}{a.completedAt ? ` · ${new Date(a.completedAt).toLocaleDateString()}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          {canViewResult ? (
                            <Button variant="outline" size="sm" onClick={() => viewAssessmentResult(a)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View Result
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
      </div>

      <AlertDialog open={!!confirmData} onOpenChange={(o) => !o && setConfirmData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Assessment Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Send <strong>{selectedAssessmentLabel(confirmData?.problemNodeId, problemNodes)}</strong> to{" "}
              <strong>{confirmData?.candidateEmail}</strong>?
              They will receive an email with access to the challenge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} style={{ background: "#FFD700", color: "#000" }} className="font-bold">
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(result) || resultLoading} onOpenChange={(nextOpen) => !nextOpen && setResult(null)}>
        <DialogContent className="max-w-2xl bg-[#0d1119] border border-white/10">
          <DialogHeader>
            <DialogTitle>Assessment Result</DialogTitle>
            <DialogDescription>Completed problem-node evaluation for this candidate.</DialogDescription>
          </DialogHeader>
          {resultLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" />
              <span className="font-mono">Loading assessment result...</span>
            </div>
          ) : result ? (
            <AssessmentResult result={result} />
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function normAssessments(d: any): Assessment[] {
  const arr = Array.isArray(d) ? d : d?.assessments ?? d?.candidates ?? d?.items ?? [];
  return arr.map((x: any) => {
    const completedAt = x.completedAt ?? x.CompletedAt ?? x.completionDate ?? x.CompletionDate;
    return {
      id: String(x.id ?? x.assessmentId ?? x.AssessmentId ?? Math.random()),
      candidateUserId: text(x.candidateUserId ?? x.CandidateUserId ?? x.userId ?? x.UserId ?? x.profileDetails?.userId ?? x.ProfileDetails?.UserId, ""),
      problemNodeId: text(x.problemNodeId ?? x.ProblemNodeId ?? x.assessmentProblemNodeId ?? x.AssessmentProblemNodeId ?? x.problemNode?.problemNodeId ?? x.problemNode?.id, ""),
      candidateName: candidateDisplayName(x),
      email: x.email ?? x.candidateEmail ?? "",
      assessment: x.assessment ?? x.assessmentName ?? x.missionName ?? x.problemNodeTitle ?? x.problemNode?.title ?? x.problemNodeId ?? "Assessment",
      status: text(x.status ?? x.Status ?? x.state ?? x.State, "Pending"),
      completionStatus: normalizeCompletionStatus(
        x.completionStatus ??
          x.CompletionStatus ??
          x.assessmentStatus ??
          x.AssessmentStatus ??
          x.assessmentCompletionStatus ??
          x.AssessmentCompletionStatus ??
          x.resultStatus ??
          x.ResultStatus,
        completedAt,
      ),
      completedAt,
      assignedAt: x.dateAssigned ?? x.DateAssigned ?? x.assignedAt ?? x.AssignedAt ?? x.invitedAt ?? x.sentAt ?? x.createdAt,
    };
  });
}

function normProblemNode(item: any): ProblemNodeOption {
  const district = item?.district ?? item?.District ?? {};
  return {
    id: String(item?.problemNodeId ?? item?.ProblemNodeId ?? item?.id ?? item?.Id ?? ""),
    title: text(item?.title ?? item?.Title ?? item?.name ?? item?.Name, "Assessment"),
    districtName: text(
      item?.districtName ?? item?.DistrictName ?? district?.name ?? district?.Name ?? item?.professionName,
      "District unavailable",
    ),
    xp: Number(item?.experiencePoints ?? item?.ExperiencePoints ?? item?.xp ?? item?.XP ?? item?.points ?? 0),
  };
}

function AssessmentSummary({ node }: { node?: ProblemNodeOption }) {
  if (!node) return <>Choose the assessment problem node to invite this candidate.</>;
  return (
    <div className="space-y-1">
      <p className="font-semibold text-white">{node.title}</p>
      <p>{node.districtName}</p>
      <p className="font-mono text-[#FFD700]">{node.xp.toLocaleString()} XP</p>
    </div>
  );
}

function selectedAssessmentLabel(problemNodeId: string | undefined, nodes: ProblemNodeOption[]): string {
  if (!problemNodeId) return "this assessment";
  const node = nodes.find((item) => item.id === problemNodeId);
  return node ? node.title : "this assessment";
}

function normalizeCompletionStatus(rawValue: unknown, completedAt?: unknown): "Completed" | "In Progress" | "Pending" | "Not Started" {
  const raw = text(rawValue, "").toLowerCase();
  if (/\b(completed|complete|done|evaluated|submitted)\b/.test(raw)) return "Completed";
  if (/\b(in[-\s]?progress|started|attempting|attempted|ongoing)\b/.test(raw)) return "In Progress";
  if (/\b(pending|assigned|invited|sent|waiting)\b/.test(raw)) return "Pending";
  if (/\b(not[-\s]?started|new|open)\b/.test(raw)) return "Not Started";
  return completedAt ? "Completed" : "Not Started";
}

function candidateDisplayName(item: any): string {
  const profile = item?.profileDetails ?? item?.ProfileDetails ?? {};
  const first = item?.firstName ?? item?.FirstName ?? profile?.firstName ?? profile?.FirstName;
  const last = item?.lastName ?? item?.LastName ?? item?.surName ?? item?.SurName ?? profile?.lastName ?? profile?.LastName;
  const candidates = [
    profile?.fullName,
    profile?.FullName,
    item?.fullName,
    item?.FullName,
    `${first ?? ""} ${last ?? ""}`.trim(),
    item?.candidateName,
    item?.CandidateName,
    item?.name,
    item?.Name,
  ];
  return text(
    candidates
      .map((value) => text(value, ""))
      .find((value) => value && !["candidate", "applicant"].includes(value.toLowerCase())),
    "Name unavailable",
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
    ["Positive Feedback", resultText(root?.positiveFeedback ?? root?.PositiveFeedback ?? root?.feedback ?? root?.Feedback?.PositiveFeedback, "No positive feedback returned.")],
    ["AI Evaluation Summary", resultText(root?.aiEvaluationSummary ?? root?.AiEvaluationSummary ?? root?.summary ?? root?.Summary ?? root?.rawAiReasoning ?? root?.RawAiReasoning ?? root?.aiReasoning ?? root?.AiReasoning, "No AI evaluation summary returned.")],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pass / Fail</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${passed ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
          {passed ? "Pass" : "Fail"}
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
