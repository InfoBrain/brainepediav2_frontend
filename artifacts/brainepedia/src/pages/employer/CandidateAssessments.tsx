import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserCheck, Send, Loader2, CheckCircle, Clock, Search, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
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
  problemNodeId: z.string().min(1, "Problem Node ID required"),
});
type FormData = z.infer<typeof schema>;

type Assessment = {
  id: string;
  candidateName: string;
  email: string;
  problemNodeId: string;
  status: string;
  completedAt?: string;
  invitedAt?: string;
};

export default function CandidateAssessments() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<FormData | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchAssessments = async () => {
    setLoading(true);
    const res = await api.employers.listAssessments();
    if (res.ok) setAssessments(normAssessments(res.data));
    setLoading(false);
  };

  useEffect(() => { fetchAssessments(); }, []);

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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-[0_0_12px_rgba(255,215,0,0.3)]" style={{ background: "#FFD700", color: "#000" }}>
                  <Send className="h-4 w-4 mr-2" />
                  Invite Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Private Mission</DialogTitle>
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
                    <Label>Problem Node ID</Label>
                    <Input {...register("problemNodeId")} placeholder="Paste the Problem Node ID" />
                    {errors.problemNodeId && <p className="text-destructive text-xs">{errors.problemNodeId.message}</p>}
                  </div>
                  <Button type="submit" className="w-full font-bold" style={{ background: "#FFD700", color: "#000" }}>
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
                    <th className="text-left px-4 py-3">Problem Node</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Invited</th>
                    <th className="text-left px-4 py-3">Completed</th>
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
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono break-all max-w-[160px] truncate">
                          {a.problemNodeId}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${badge.className}`}>
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {a.invitedAt ? new Date(a.invitedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
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
              Send a private mission invitation to <strong>{confirmData?.candidateEmail}</strong>?
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
    problemNodeId: x.problemNodeId ?? x.nodeId ?? "",
    status: x.status ?? x.state ?? "Invited",
    completedAt: x.completedAt ?? x.completionDate,
    invitedAt: x.invitedAt ?? x.sentAt ?? x.createdAt,
  }));
}
