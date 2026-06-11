import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GraduationCap, Plus, Loader2, Calendar, Users, RefreshCw } from "lucide-react";
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

const schema = z.object({
  challengeName: z.string().min(1, "Challenge name required"),
  problemNodeId: z.string().min(1, "Problem Node ID required"),
  endDate: z.string().min(1, "End date required"),
});
type FormData = z.infer<typeof schema>;

type Challenge = {
  id: string;
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

export default function PrivateChallenges() {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [professions, setProfessions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [problemNodes, setProblemNodes] = useState<any[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [selectedProfessionName, setSelectedProfessionName] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchChallenges = async () => {
    setLoading(true);
    const res = await api.employers.listChallenges();
    if (res.ok) setChallenges(normChallenges(res.data));
    setLoading(false);
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
      toast({ title: "Challenge created", description: `"${data.challengeName}" is now live.` });
      reset();
      setSelectedProfessionId("");
      setSelectedProfessionName("");
      setSelectedDistrictId("");
      setOpen(false);
      fetchChallenges();
    } else {
      toast({ title: "Failed to create challenge", description: res.error, variant: "destructive" });
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Challenges" subtitle="// employer.team.training" theme="employer">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Create private team training challenges using profession, district, and mission selections.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchChallenges}>
              <RefreshCw className="h-4 w-4" />
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
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isSubmitting ? "Creating…" : "Create Challenge"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm">Loading challenges…</span>
          </div>
        ) : challenges.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
            No challenges yet. Create your first private challenge above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map((ch) => {
              const expired = isExpired(ch.endDate);
              return (
                <div key={ch.id} className="bg-[#0d1119] border border-white/5 rounded-xl p-5 space-y-3">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normChallenges(d: any): Challenge[] {
  const arr = Array.isArray(d) ? d : d?.challenges ?? d?.items ?? [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.challengeId ?? Math.random()),
    challengeName: x.challengeName ?? x.name ?? "Challenge",
    problemNodeId: x.problemNodeId ?? x.nodeId ?? "",
    problemNodeTitle: x.problemNodeTitle ?? x.problemNodeName ?? x.problemNode?.title ?? x.ProblemNodeTitle,
    targetProfession: x.targetProfession ?? x.profession ?? x.professionName ?? x.TargetProfession,
    endDate: x.endDate ?? x.expiryDate ?? new Date().toISOString(),
    participantCount: x.totalAssignedEmployees ?? x.TotalAssignedEmployees ?? x.participantCount ?? x.participants,
    completedCount: x.completedCount ?? x.CompletedCount ?? x.totalCompleted ?? x.completed,
    professions: Array.isArray(x.professions) ? x.professions : [],
    createdAt: x.createdAt ?? x.dateCreated,
  }));
}
