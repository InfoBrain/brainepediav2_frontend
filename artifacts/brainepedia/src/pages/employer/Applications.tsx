import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ClipboardList, Eye, Loader2, RefreshCw, Save, Search, UserCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, candidateName, idOf, initials, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Applications() {
  const [, params] = useRoute("/employer/applications/:jobId");
  const jobId = params?.jobId ? decodeURIComponent(params.jobId) : "";

  if (!jobId) return <ApplicationPostingPicker />;
  return <ApplicationsForJob jobId={jobId} />;
}

function ApplicationPostingPicker() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.jobs.myPostings();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load job postings.");
      return;
    }
    setJobs(asList(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = jobs.filter((job) => text(job?.title ?? job?.jobTitle, "").toLowerCase().includes(query.toLowerCase()));

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Applications" subtitle="// jobs.application-pipeline" theme="employer">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#0d1119] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Choose a posting</h2>
            <p className="text-sm text-muted-foreground">Applications are scoped to a job posting in Swagger.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search postings" className="pl-9" />
          </div>
        </div>

        {loading ? (
          <State label="Loading postings..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <Empty title="No job postings found" body="Create a job posting before reviewing applications." cta="/employer/jobs/create" ctaText="Create job" />
        ) : (
          <div className="grid gap-4">
            {filtered.map((job, index) => {
              const id = idOf(job) || String(index);
              return (
                <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{text(job?.title ?? job?.jobTitle, "Untitled role")}</h3>
                      <p className="text-sm text-muted-foreground">{text(job?.professionName ?? job?.profession, "Open profession")}</p>
                    </div>
                    <Button asChild className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                      <Link href={`/employer/applications/${encodeURIComponent(id)}`}>View applications</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function ApplicationsForJob({ jobId }: { jobId: string }) {
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { newStatus: string; notes: string }>>({});
  const [savingId, setSavingId] = useState("");
  const [job, setJob] = useState<any>(null);
  const [result, setResult] = useState<any | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const [jobRes, res] = await Promise.all([
      api.jobs.myJob(jobId),
      api.jobs.postingApplicants(jobId),
    ]);
    setLoading(false);
    if (jobRes.ok) setJob(jobRes.data);
    if (!res.ok) {
      setError(res.error || "Unable to load applications.");
      setApplications([]);
      return;
    }
    const list = asList(res.data);
    setApplications(list);
    setDrafts(Object.fromEntries(list.map((item: any) => {
      const id = idOf(item);
      return [id, { newStatus: text(item?.status ?? item?.applicationStatus, ""), notes: text(item?.notes, "") === "—" ? "" : text(item?.notes, "") }];
    })));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const updateDraft = (applicationId: string, key: "newStatus" | "notes", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [applicationId]: { ...(prev[applicationId] ?? { newStatus: "", notes: "" }), [key]: value },
    }));
  };

  const save = async (applicationId: string) => {
    const draft = drafts[applicationId] || { newStatus: "", notes: "" };
    setSavingId(applicationId);
    const res = await api.jobs.updateApplicationStatus(applicationId, {
      newStatus: draft.newStatus || null,
      notes: draft.notes || null,
    });
    setSavingId("");
    if (!res.ok) {
      toast({ title: "Unable to update application", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Application updated", description: "Status and notes were saved." });
    load();
  };

  const viewAssessmentResult = async (problemNodeId: string, candidateUserId: string) => {
    setResultLoading(true);
    setResult(null);
    const res = await api.evaluations.getNodeResult(problemNodeId, candidateUserId);
    setResultLoading(false);
    if (!res.ok) {
      toast({ title: "Unable to load assessment result", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setResult(res.data);
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Applications" subtitle="// jobs.application-review" theme="employer">
      <div className="space-y-5">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/employer/applications">Back to postings</Link>
        </Button>

        {loading ? (
          <State label="Loading applications..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : applications.length === 0 ? (
          <Empty title="No applications yet" body="Applicants will appear here after users apply from Job Details." cta="/employer/jobs" ctaText="View postings" />
        ) : (
          <div className="grid gap-4">
            {applications.map((application, index) => {
              const id = idOf(application) || String(index);
              const draft = drafts[id] || { newStatus: "", notes: "" };
              const name = candidateName(application?.candidate ?? application?.applicant ?? application);
              const userId = application?.userId ?? application?.candidateUserId ?? application?.applicantUserId ?? application?.candidate?.userId ?? application?.applicant?.userId;
              const problemNodeId = String(
                application?.problemNodeId ??
                  application?.linkedAssessmentNodeId ??
                  application?.linkAssessmentNodeId ??
                  job?.problemNodeId ??
                  job?.linkedAssessmentNodeId ??
                  job?.linkAssessmentNodeId ??
                  job?.assessmentNodeId ??
                  ""
              );
              const assessmentStatus = text(application?.assessmentStatus ?? application?.assessmentCompletionStatus, "Assessment status unknown");
              const completedAssessment = /complete|passed|submitted|evaluated/i.test(assessmentStatus);
              return (
                <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                  <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00D2FF]/35 to-[#7C3AED]/30 font-bold">
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold">{name}</h3>
                        <p className="text-sm text-muted-foreground">{text(application?.profession ?? application?.candidate?.profession, "Applicant")}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{assessmentStatus}</span>
                          <span className="rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2.5 py-1 text-[#00D2FF]">{text(application?.status ?? application?.applicationStatus, "New")}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {userId && (
                            <Button asChild variant="outline">
                              <Link href={`/employer/candidates/${encodeURIComponent(String(userId))}`}><UserCheck className="mr-2 h-4 w-4" /> Candidate dossier</Link>
                            </Button>
                          )}
                          {completedAssessment && problemNodeId && userId && (
                            <Button variant="outline" onClick={() => viewAssessmentResult(problemNodeId, String(userId))}>
                              <Eye className="mr-2 h-4 w-4" /> View Assessment Result
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={draft.newStatus}
                        onChange={(event) => updateDraft(id, "newStatus", event.target.value)}
                        placeholder="Status (e.g. Shortlisted)"
                        aria-label={`Status for ${name}`}
                      />
                      <Textarea
                        value={draft.notes}
                        onChange={(event) => updateDraft(id, "notes", event.target.value)}
                        placeholder="Internal notes"
                        aria-label={`Notes for ${name}`}
                      />
                      <Button onClick={() => save(id)} disabled={savingId === id} className="w-full bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                        {savingId === id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save status
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <Dialog open={Boolean(result) || resultLoading} onOpenChange={(open) => !open && setResult(null)}>
          <DialogContent className="max-w-2xl bg-[#0d1119] border border-white/10">
            <DialogHeader>
              <DialogTitle>Assessment Result</DialogTitle>
              <DialogDescription>Linked problem-node evaluation for this applicant.</DialogDescription>
            </DialogHeader>
            {resultLoading ? (
              <State label="Loading assessment result..." />
            ) : result ? (
              <AssessmentResult result={result} />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}

function AssessmentResult({ result }: { result: any }) {
  const root = result?.data ?? result?.result ?? result?.evaluation ?? result;
  const passed = Boolean(root?.passed ?? root?.isPassed ?? root?.IsPassed);
  const rows = [
    ["Mission Title", text(root?.missionTitle ?? root?.MissionTitle ?? root?.title ?? root?.Title, "Assessment mission")],
    ["Score", text(root?.score ?? root?.Score ?? root?.percentageScore, "—")],
    ["Passed/Failed", passed ? "Passed" : "Failed"],
    ["Strengths", text(root?.strengths ?? root?.Strengths, "No strengths returned.")],
    ["Weaknesses", text(root?.weaknesses ?? root?.Weaknesses, "No weaknesses returned.")],
    ["Improvement Areas", text(root?.improvementAreas ?? root?.ImprovementAreas ?? root?.areasForImprovement, "No improvement areas returned.")],
    ["Positive Feedback", text(root?.positiveFeedback ?? root?.PositiveFeedback ?? root?.feedback, "No positive feedback returned.")],
  ];
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

function State({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" />
      <span className="font-mono">{label}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
      <p className="mb-4 text-sm text-destructive">{message}</p>
      <Button onClick={onRetry} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
    </div>
  );
}

function Empty({ title, body, cta, ctaText }: { title: string; body: string; cta: string; ctaText: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
      <ClipboardList className="mx-auto mb-3 h-10 w-10 text-[#00D2FF]" />
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
        <Link href={cta}>{ctaText}</Link>
      </Button>
    </div>
  );
}
