import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserCheck, Send, Loader2, CheckCircle, Clock, Search, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { professionName: "", problemNodeId: "" },
  });
  const selectedProfession = watch("professionName");
  const selectedProblemNodeId = watch("problemNodeId");
  const candidateEmail = watch("candidateEmail");
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const inviteReady =
    Boolean(firstName?.trim()) &&
    Boolean(lastName?.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail || "") &&
    Boolean(selectedProfession) &&
    Boolean(selectedProblemNodeId);

  const fetchAssessments = async () => {
    setLoading(true);
    const res = await api.employers.listAssessments();
    if (res.ok) setAssessments(normAssessments(res.data));
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
    const res = await api.employers.assignMission(confirmData);
    setConfirmData(null);
    if (res.ok) {
      toast({ title: "Invitation sent", description: `Assessment dispatched to ${confirmData.candidateEmail}.` });
      reset();
      setOpen(false);
      fetchAssessments();
    } else {
      toast({ title: "Failed to assign", description: res.error, variant: "destructive" });
    }
  };

  const filtered = assessments.filter(
    (a) =>
      !search ||
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("complet") || s.includes("done") || s.includes("pass"))
      return { label: "Completed", className: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle };
    if (s.includes("progress") || s.includes("started") || s.includes("attempt"))
      return { label: "In Progress", className: "bg-[#00D2FF]/10 text-[#00D2FF] border-[#00D2FF]/20", icon: Clock };
    return { label: "Invited", className: "bg-white/5 text-muted-foreground border-white/10", icon: Send };
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
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
                      className="flex h-10 w-full truncate rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
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
                    disabled={isSubmitting || !inviteReady}
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const badge = statusBadge(a.status);
                    const Icon = badge.icon;
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
    </DashboardShell>
  );
}

function normAssessments(d: any): Assessment[] {
  const arr = Array.isArray(d) ? d : d?.assessments ?? d?.candidates ?? d?.items ?? [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.assessmentId ?? Math.random()),
    candidateName: x.candidateName ?? x.name ?? (`${x.firstName ?? ""} ${x.lastName ?? ""}`.trim() || "Candidate"),
    email: x.email ?? x.candidateEmail ?? "",
    assessment: x.assessment ?? x.assessmentName ?? x.missionName ?? x.problemNodeTitle ?? x.problemNode?.title ?? x.problemNodeId ?? "Assessment",
    status: x.status ?? x.state ?? "Invited",
    completionStatus: x.completionStatus ?? x.resultStatus ?? (x.completedAt || x.completionDate ? "Completed" : "Pending"),
    completedAt: x.completedAt ?? x.completionDate,
    assignedAt: x.dateAssigned ?? x.assignedAt ?? x.invitedAt ?? x.sentAt ?? x.createdAt,
  }));
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
