import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, FilePlus2, Loader2, RefreshCw, Target } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api, type CreateJobRequest } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CreateJob() {
  const { toast } = useToast();
  const [form, setForm] = useState<CreateJobRequest>({
    title: "",
    description: "",
    location: "",
    salaryRange: "",
    professionName: "",
    linkAssessmentNodeId: "",
  });
  const [professions, setProfessions] = useState<any[]>([]);
  const [problemNodes, setProblemNodes] = useState<any[]>([]);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  const [loadingProblemNodes, setLoadingProblemNodes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    async function loadProfessions() {
      setLoadingProfessions(true);
      const res = await api.professions.list();
      setLoadingProfessions(false);
      if (res.ok) setProfessions(asList(res.data));
    }
    loadProfessions();
  }, []);

  const update = (key: keyof CreateJobRequest, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "professionName" ? { linkAssessmentNodeId: "" } : {}),
    }));
  };

  useEffect(() => {
    if (!form.professionName) {
      setProblemNodes([]);
      return;
    }
    let cancelled = false;
    setLoadingProblemNodes(true);
    api.problemNodes.byProfession(form.professionName).then((res) => {
      if (cancelled) return;
      setProblemNodes(res.ok ? asList(res.data) : []);
      setLoadingProblemNodes(false);
    });
    return () => { cancelled = true; };
  }, [form.professionName]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title?.trim() || !form.description?.trim()) {
      toast({ title: "Missing job details", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload: CreateJobRequest = {
      title: form.title?.trim(),
      description: form.description?.trim(),
      location: form.location?.trim() || null,
      salaryRange: form.salaryRange?.trim() || null,
      professionName: form.professionName?.trim() || null,
      linkAssessmentNodeId: form.linkAssessmentNodeId?.trim() || null,
    };
    const res = await api.jobs.createJob(payload);
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Unable to create job", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setCreated(true);
    toast({ title: "Job created", description: "Your posting is ready for verified candidates." });
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Create Job" subtitle="// jobs.create-verified-role" theme="employer">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
          <div className="mb-6">
            <p className="mb-2 text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Verified hiring</p>
            <h2 className="text-2xl font-black">Publish a role that rewards practical proof.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect salary, location, profession, and optional assessment data without changing backend payloads.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input id="job-title" value={form.title || ""} onChange={(event) => update("title", event.target.value)} placeholder="Senior Product Designer" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <select
                id="profession"
                value={form.professionName || ""}
                onChange={(event) => update("professionName", event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{loadingProfessions ? "Loading professions..." : "Select profession"}</option>
                {professions.map((profession, index) => {
                  const name = text(profession?.name ?? profession?.professionName ?? profession?.title, "");
                  return name ? <option key={profession?.professionId ?? profession?.id ?? index} value={name}>{name}</option> : null;
                })}
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salary-range">Salary range</Label>
                <Input id="salary-range" value={form.salaryRange || ""} onChange={(event) => update("salaryRange", event.target.value)} placeholder="$80k - $120k" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location || ""} onChange={(event) => update("location", event.target.value)} placeholder="Remote, Lagos, London..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment-id">Assessment Mission</Label>
              <select
                id="assessment-id"
                value={form.linkAssessmentNodeId || ""}
                onChange={(event) => update("linkAssessmentNodeId", event.target.value)}
                disabled={!form.professionName || loadingProblemNodes}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                <option value="">
                  {!form.professionName
                    ? "Select a profession first"
                    : loadingProblemNodes
                      ? "Loading assessment missions..."
                      : "Optional assessment mission"}
                </option>
                {problemNodes.map((node, index) => {
                  const id = text(node?.problemNodeId ?? node?.id, "");
                  const title = text(node?.title ?? node?.name, "Untitled mission");
                  const district = text(node?.districtName ?? node?.district?.name, "District");
                  const xp = text(node?.experiencePoints ?? node?.xp, "0");
                  return id ? <option key={id || index} value={id}>{title} · {district} · {xp} XP</option> : null;
                })}
              </select>
              {form.linkAssessmentNodeId && (
                <MissionPreview node={problemNodes.find((node) => String(node?.problemNodeId ?? node?.id) === form.linkAssessmentNodeId)} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job description</Label>
              <Textarea
                id="description"
                value={form.description || ""}
                onChange={(event) => update("description", event.target.value)}
                rows={8}
                placeholder="Describe the role, success outcomes, and how verified experience will be assessed."
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
            Create job
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#00D2FF]/15 bg-[#00D2FF]/10 p-5">
            <BriefcaseBusiness className="mb-3 h-8 w-8 text-[#00D2FF]" />
            <h3 className="font-bold">Assessment linking</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a profession first, then choose a Swagger-backed problem node assessment. The job stores only the ProblemNodeId.
            </p>
          </div>
          {created && (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
              <h3 className="font-bold text-emerald-300">Posting created</h3>
              <p className="mt-2 text-sm text-muted-foreground">Review applicants and manage the role from My Job Postings.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/employer/jobs"><RefreshCw className="mr-2 h-4 w-4" /> View postings</Link>
              </Button>
            </div>
          )}
        </aside>
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
        {text(node?.title ?? node?.name, "Assessment mission")}
      </div>
      <div className="mb-2 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
        <span>District: {text(node?.districtName ?? node?.district?.name, "—")}</span>
        <span>XP: {text(node?.experiencePoints ?? node?.xp, "0")}</span>
      </div>
      <p className="line-clamp-3 text-sm text-muted-foreground">
        {text(node?.missionBrief ?? node?.context, "No mission brief available.")}
      </p>
    </div>
  );
}
