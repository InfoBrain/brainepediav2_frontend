import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ClipboardList, Eye, Loader2, RefreshCw, Save, Search, UserCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import {
  applicantUserId,
  applicationProblemNodeId,
  asList,
  candidateName,
  formatDate,
  formatNumber,
  idOf,
  initials,
  numberish,
  profileDetailsOf,
  text,
} from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const [jobRes, primaryRes, applicantRes] = await Promise.all([
      api.jobs.myJob(jobId),
      api.jobs.applications(jobId),
      api.jobs.postingApplicants(jobId),
    ]);
    const res = primaryRes.ok ? primaryRes : applicantRes;
    setLoading(false);
    if (jobRes.ok) setJob(jobRes.data);
    if (!res.ok) {
      setError(res.error || "Unable to load applications.");
      setApplications([]);
      return;
    }
    const list = mergeApplicationLists(asList(res.data), applicantRes.ok ? asList(applicantRes.data) : []);
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
    toast({ title: "Application updated", description: res.message || "Status and notes were saved." });
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
              const profile = profileDetailsOf(application);
              const name = candidateName(application);
              const userId = applicantUserId(application);
              const problemNodeId = applicationProblemNodeId(application, job);
              const profession = text(profile?.profession ?? profile?.Profession ?? application?.profession ?? application?.candidate?.profession, "Profession not provided");
              const currentTitle = text(profile?.currentTitle ?? profile?.CurrentTitle, "Current title not provided");
              const totalXp = profile?.totalXP ?? profile?.TotalXP ?? profile?.totalXp ?? profile?.TotalXp;
              const xp = formatNumber(totalXp);
              const vx = numberish(profile?.calculatedVX ?? profile?.CalculatedVX ?? profile?.verifiedExperienceYears ?? profile?.VerifiedExperienceYears);
              const applicationStatus = text(application?.status ?? application?.Status ?? application?.applicationStatus, "New");
              const appliedAt = formatDate(application?.appliedAt ?? application?.AppliedAt ?? application?.dateApplied ?? application?.DateApplied, "Date unavailable");
              const assessmentStatus = assessmentStatusLabel(application);
              const canViewResult = Boolean(problemNodeId && userId && assessmentStatus === "Completed");
              return (
                <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                  <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00D2FF]/35 to-[#7C3AED]/30 font-bold">
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold">{name}</h3>
                        <p className="text-sm text-muted-foreground">{profession}</p>
                        {currentTitle !== "Current title not provided" && (
                          <p className="text-xs text-muted-foreground">{currentTitle}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{assessmentStatus}</span>
                          <span className="rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2.5 py-1 text-[#00D2FF]">{applicationStatus}</span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <ApplicantMetric label="Full Name" value={name} />
                          <ApplicantMetric label="Profession" value={profession} />
                          <ApplicantMetric label="Current Title" value={currentTitle} />
                          <ApplicantMetric label="XP" value={xp === "—" ? "—" : `${xp} XP`} />
                          <ApplicantMetric label="VX" value={vx === undefined ? "—" : `${vx.toFixed(1)} VX`} />
                          <ApplicantMetric label="Applied Date" value={appliedAt} />
                          <ApplicantMetric label="Application Status" value={applicationStatus} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {userId && (
                            <Button asChild variant="outline">
                              <Link href={`/employer/candidates/${encodeURIComponent(String(userId))}`}><UserCheck className="mr-2 h-4 w-4" /> Candidate dossier</Link>
                            </Button>
                          )}
                          {canViewResult && (
                            <Button variant="outline" onClick={() => viewAssessmentResult(problemNodeId, String(userId))}>
                              <Eye className="mr-2 h-4 w-4" /> View Assessment Result
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`status-${id}`} className="text-xs text-muted-foreground">Application Status</Label>
                        <Input
                          id={`status-${id}`}
                          value={draft.newStatus}
                          onChange={(event) => updateDraft(id, "newStatus", event.target.value)}
                          placeholder="Status (e.g. Shortlisted)"
                          aria-label={`Status for ${name}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`notes-${id}`} className="text-xs text-muted-foreground">Internal Notes</Label>
                        <Textarea
                          id={`notes-${id}`}
                          value={draft.notes}
                          onChange={(event) => updateDraft(id, "notes", event.target.value)}
                          placeholder="Internal notes"
                          aria-label={`Notes for ${name}`}
                        />
                      </div>
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

function mergeApplicationLists(primary: any[], withProfileDetails: any[]): any[] {
  if (!primary.length) return withProfileDetails;
  if (!withProfileDetails.length) return primary;
  const detailsById = new Map(withProfileDetails.map((item) => [idOf(item), item]));
  return primary.map((item) => {
    const match = detailsById.get(idOf(item));
    return match ? { ...match, ...item, profileDetails: profileDetailsOf(match) ?? profileDetailsOf(item) } : item;
  });
}

function AssessmentResult({ result }: { result: any }) {
  const root = result?.data ?? result?.result ?? result?.evaluation ?? result;
  const passValue = root?.passed ?? root?.isPassed ?? root?.IsPassed ?? root?.Passed ?? root?.passFail ?? root?.PassFail ?? root?.status ?? root?.Status;
  const passed = typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue);
  const rows: [string, string][] = [
    ["Mission Title", text(root?.missionTitle ?? root?.MissionTitle ?? root?.title ?? root?.Title, "Assessment mission")],
    ["Score", text(root?.score ?? root?.Score ?? root?.percentageScore ?? root?.PercentageScore, "—")],
    ["Strengths", listText(root?.strengths ?? root?.Strengths ?? root?.Feedback?.Strengths, "No strengths returned.")],
    ["Weaknesses", listText(root?.weaknesses ?? root?.Weaknesses ?? root?.Feedback?.Weaknesses, "No weaknesses returned.")],
    ["Improvement Areas", listText(root?.improvementAreas ?? root?.ImprovementAreas ?? root?.areasForImprovement ?? root?.Feedback?.ImprovementAreas, "No improvement areas returned.")],
    ["Positive Feedback", listText(root?.positiveFeedback ?? root?.PositiveFeedback ?? root?.feedback ?? root?.Feedback?.PositiveFeedback, "No positive feedback returned.")],
    ["AI Evaluation Summary", listText(root?.aiEvaluationSummary ?? root?.AiEvaluationSummary ?? root?.summary ?? root?.Summary ?? root?.rawAiReasoning ?? root?.RawAiReasoning ?? root?.aiReasoning ?? root?.AiReasoning, "No AI evaluation summary returned.")],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Passed / Failed</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${passed ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
          {passed ? "Passed" : "Failed"}
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

function ApplicantMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{value}</p>
    </div>
  );
}

function listText(value: unknown, fallback: string): string {
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

function assessmentStatusLabel(application: any): "Completed" | "In Progress" | "Pending" | "Not Started" {
  const raw = text(
    application?.assessmentStatus ??
      application?.AssessmentStatus ??
      application?.assessmentCompletionStatus ??
      application?.AssessmentCompletionStatus ??
      application?.completionStatus ??
      application?.CompletionStatus ??
      application?.resultStatus ??
      application?.ResultStatus,
    "",
  ).toLowerCase();
  if (/\b(completed|complete|done|evaluated|submitted)\b/.test(raw)) return "Completed";
  if (/\b(in[-\s]?progress|started|attempting|attempted|ongoing)\b/.test(raw)) return "In Progress";
  if (/\b(pending|assigned|invited|sent|waiting|applied)\b/.test(raw)) return "Pending";
  if (/\b(not[-\s]?started|new|open)\b/.test(raw)) return "Not Started";
  if (application?.completedAt ?? application?.CompletedAt ?? application?.completionDate ?? application?.CompletionDate) return "Completed";
  return applicationProblemNodeId(application) ? "Pending" : "Not Started";
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
