import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, Loader2, Save, Target } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api, type UpdateJobRequest } from "@/lib/api";
import { asList, defaultExpiryDate, expiryDateOf, text, todayString } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor, htmlToPlainText } from "@/components/editor/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditJob() {
  const [, params] = useRoute("/employer/jobs/:jobId/edit");
  const [, navigate] = useLocation();
  const jobId = params?.jobId ? decodeURIComponent(params.jobId) : "";
  const { toast } = useToast();
  const [form, setForm] = useState<UpdateJobRequest>({
    title: "",
    description: "",
    location: "",
    salaryRange: "",
    professionName: "",
    linkAssessmentNodeId: "",
    expiryDate: defaultExpiryDate(),
  });
  const [professions, setProfessions] = useState<any[]>([]);
  const [problemNodes, setProblemNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  const [loadingProblemNodes, setLoadingProblemNodes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadProfessions() {
      setLoadingProfessions(true);
      const res = await api.professions.list();
      if (cancelled) return;
      setLoadingProfessions(false);
      if (res.ok) {
        setProfessions(asList(res.data));
      } else {
        toast({ title: "Unable to load professions", description: res.error, variant: "destructive" });
      }
    }
    loadProfessions();
    return () => { cancelled = true; };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!jobId) return;
      setLoading(true);
      setError("");
      const res = await api.jobs.myJob(jobId);
      if (cancelled) return;
      setLoading(false);
      let job = res.data as any;
      if (!res.ok && res.status === 404) {
        const postings = await api.jobs.myPostings();
        if (cancelled) return;
        job = postings.ok ? (Array.isArray(postings.data) ? postings.data : (postings.data as any)?.jobs ?? (postings.data as any)?.postings ?? (postings.data as any)?.data ?? []).find((item: any) => String(item?.jobId ?? item?.jobPostingId ?? item?.postingId ?? item?.id ?? "") === jobId) : null;
      } else if (!res.ok) {
        setError(res.error || "Unable to load job.");
        return;
      }
      if (!job) {
        setError(res.error || "Unable to load job.");
        return;
      }
      setForm({
        title: text(job?.title ?? job?.jobTitle, ""),
        description: text(job?.description ?? job?.details, ""),
        professionName: text(job?.professionName ?? job?.profession ?? job?.ProfessionName ?? job?.Profession, ""),
        linkAssessmentNodeId: text(
          job?.linkAssessmentNodeId ??
            job?.linkedAssessmentNodeId ??
            job?.problemNodeId ??
            job?.assessmentNodeId ??
            job?.LinkAssessmentNodeId ??
            job?.ProblemNodeId,
          "",
        ),
        location: text(job?.location, ""),
        salaryRange: text(job?.salaryRange ?? job?.salary, ""),
        expiryDate: text(expiryDateOf(job), defaultExpiryDate()).slice(0, 10),
      });
    }
    load();
    return () => { cancelled = true; };
  }, [jobId]);

  useEffect(() => {
    if (!form.professionName) {
      setProblemNodes([]);
      setLoadingProblemNodes(false);
      return;
    }
    let cancelled = false;
    setLoadingProblemNodes(true);
    api.problemNodes.byProfession(form.professionName).then((res) => {
      if (cancelled) return;
      setLoadingProblemNodes(false);
      if (res.ok) {
        setProblemNodes(asList(res.data));
      } else {
        setProblemNodes([]);
        toast({ title: "Unable to load assessment missions", description: res.error, variant: "destructive" });
      }
    });
    return () => { cancelled = true; };
  }, [form.professionName, toast]);

  const update = (key: keyof UpdateJobRequest, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "professionName" ? { linkAssessmentNodeId: "" } : {}),
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobId) return;
    if (!form.title?.trim() || !htmlToPlainText(form.description || "")) {
      toast({ title: "Missing job details", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    if (form.expiryDate && form.expiryDate < todayString()) {
      toast({ title: "Invalid expiry date", description: "Expiry Date cannot be earlier than today.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await api.jobs.updateJob(jobId, {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      professionName: form.professionName?.trim() || null,
      linkAssessmentNodeId: form.linkAssessmentNodeId?.trim() || null,
      location: form.location?.trim() || null,
      salaryRange: form.salaryRange?.trim() || null,
      expiryDate: form.expiryDate || defaultExpiryDate(),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Unable to update job", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Job updated", description: res.message || "Your posting changes were saved." });
    navigate("/employer/jobs");
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Edit Job" subtitle="// jobs.edit-posting" theme="employer">
      <div className="space-y-6">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/employer/jobs"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Job Postings</Link>
        </Button>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading job...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
        ) : (
          <form onSubmit={submit} className="max-w-4xl rounded-2xl border border-white/5 bg-[#0d1119] p-6">
            <div className="mb-6">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Editable posting fields</p>
              <h2 className="mt-1 text-2xl font-black">Update job details</h2>
              <p className="mt-2 text-sm text-muted-foreground">All create-job fields are editable, including profession, assessment problem node, expiry date, and rich description.</p>
            </div>
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-job-title">Job Title</Label>
                <Input id="edit-job-title" value={form.title || ""} onChange={(event) => update("title", event.target.value)} required className="border-white/15 bg-white/[0.04]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job-profession">Profession</Label>
                <Select
                  value={form.professionName || ""}
                  onValueChange={(value) => update("professionName", value)}
                  disabled={loadingProfessions}
                >
                  <SelectTrigger id="edit-job-profession" className="h-10 border-white/15 bg-white/[0.04]">
                    <SelectValue placeholder={loadingProfessions ? "Loading professions..." : "Select profession"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
                  {professions.map((profession, index) => {
                    const name = text(profession?.name ?? profession?.Name ?? profession?.professionName ?? profession?.title, "");
                    return name ? <SelectItem key={profession?.professionId ?? profession?.id ?? index} value={name}>{name}</SelectItem> : null;
                  })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-job-location">Location</Label>
                  <Input id="edit-job-location" value={form.location || ""} onChange={(event) => update("location", event.target.value)} className="border-white/15 bg-white/[0.04]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-job-salary">Salary Range</Label>
                  <Input id="edit-job-salary" value={form.salaryRange || ""} onChange={(event) => update("salaryRange", event.target.value)} className="border-white/15 bg-white/[0.04]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job-expiry">Expiry Date</Label>
                <Input
                  id="edit-job-expiry"
                  type="date"
                  min={todayString()}
                  value={form.expiryDate || ""}
                  onChange={(event) => update("expiryDate", event.target.value)}
                  required
                  className="border-white/15 bg-white/[0.04]"
                />
                <p className="text-xs text-muted-foreground">Choose today or a future date.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job-assessment">Assessment Problem Node</Label>
                <Select
                  value={form.linkAssessmentNodeId || "none"}
                  onValueChange={(value) => update("linkAssessmentNodeId", value === "none" ? "" : value)}
                  disabled={!form.professionName || loadingProblemNodes}
                >
                  <SelectTrigger id="edit-job-assessment" className="min-h-10 border-white/15 bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60">
                    <SelectValue
                      placeholder={!form.professionName
                        ? "Select a profession first"
                        : loadingProblemNodes
                          ? "Loading assessment missions..."
                          : "Optional assessment mission"}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
                  <SelectItem value="none">
                    {!form.professionName
                      ? "Select a profession first"
                      : loadingProblemNodes
                        ? "Loading assessment missions..."
                        : "Optional assessment mission"}
                  </SelectItem>
                  {form.linkAssessmentNodeId && !problemNodes.some((node) => String(node?.problemNodeId ?? node?.id ?? node?.ProblemNodeId ?? node?.Id ?? "") === form.linkAssessmentNodeId) && (
                    <SelectItem value={form.linkAssessmentNodeId}>Current linked assessment</SelectItem>
                  )}
                  {problemNodes.map((node, index) => {
                    const id = text(node?.problemNodeId ?? node?.ProblemNodeId ?? node?.id ?? node?.Id, "");
                    const title = text(node?.title ?? node?.Title ?? node?.name ?? node?.Name, "Untitled mission");
                    const district = text(node?.districtName ?? node?.DistrictName ?? node?.district?.name ?? node?.District?.Name, "District");
                    const xp = text(node?.experiencePoints ?? node?.ExperiencePoints ?? node?.xp ?? node?.XP, "0");
                    return id ? <SelectItem key={id || index} value={id}>{title} · {district} · {xp} XP</SelectItem> : null;
                  })}
                  </SelectContent>
                </Select>
                {form.linkAssessmentNodeId && (
                  <MissionPreview node={problemNodes.find((node) => String(node?.problemNodeId ?? node?.ProblemNodeId ?? node?.id ?? node?.Id) === form.linkAssessmentNodeId)} />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job-description">Description</Label>
                <RichTextEditor
                  id="edit-job-description"
                  value={form.description || ""}
                  onChange={(html) => update("description", html)}
                  placeholder="Update the role, responsibilities, requirements, benefits, and assessment instructions."
                  className="border-white/15 bg-white/[0.04]"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}

function MissionPreview({ node }: { node: any }) {
  if (!node) return null;
  return (
    <div className="rounded-xl border border-[#00D2FF]/20 bg-[#00D2FF]/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#00D2FF]">
        <Target className="h-4 w-4" />
        {text(node?.title ?? node?.Title ?? node?.name ?? node?.Name, "Assessment mission")}
      </div>
      <div className="mb-2 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
        <span>District: {text(node?.districtName ?? node?.DistrictName ?? node?.district?.name ?? node?.District?.Name, "—")}</span>
        <span>XP: {text(node?.experiencePoints ?? node?.ExperiencePoints ?? node?.xp ?? node?.XP, "0")}</span>
      </div>
      <p className="line-clamp-3 text-sm text-muted-foreground">
        {text(node?.missionBrief ?? node?.MissionBrief ?? node?.context ?? node?.Context, "No mission brief available.")}
      </p>
    </div>
  );
}
