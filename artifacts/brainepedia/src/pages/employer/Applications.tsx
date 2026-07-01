import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ClipboardList, Eye, FileText, Save, Search, UserCheck, Users } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState, ButtonLoading } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { useApiFeedback } from "@/hooks/useApiFeedback";
import { AssessmentResultCard } from "@/components/employer/AssessmentResultCard";

const APPLICATION_STATUSES = ["Applied", "Reviewing", "Shortlisted", "Interviewing", "Rejected", "Recruited", "Hired"];

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
            <p className="text-sm text-muted-foreground">Select a job posting to view applicants and assessment performance.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search postings" className="pl-9" />
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading postings..." variant="card" rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} dashboardHref="/employer/overview" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No job postings found"
            description="Create a job posting before reviewing applications."
            actionLabel="Create job"
            actionHref="/employer/jobs/create"
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map((job, index) => {
              const id = idOf(job) || String(index);
              const jobTitle = text(job?.title ?? job?.jobTitle ?? job?.JobTitle, "Untitled role");
              const profession = text(job?.professionName ?? job?.ProfessionName ?? job?.profession ?? job?.Profession, "Open profession");
              const location = text(job?.location ?? job?.Location, "Location not specified");
              const salary = text(job?.salaryRange ?? job?.SalaryRange ?? job?.salary ?? job?.Salary, "Salary undisclosed");
              const posted = formatDate(job?.datePosted ?? job?.DatePosted ?? job?.postedDate ?? job?.PostedDate ?? job?.createdAt ?? job?.CreatedAt, "Date unavailable");
              const expiry = formatDate(job?.expiryDate ?? job?.ExpiryDate ?? job?.expiresAt ?? job?.ExpiresAt, "No expiry date");
              const active = Boolean(job?.isActive ?? job?.IsActive ?? job?.active ?? job?.Active);
              const hasAssessment = Boolean(
                job?.hasLinkedAssessment ??
                  job?.HasLinkedAssessment ??
                  job?.linkAssessmentNodeId ??
                  job?.LinkAssessmentNodeId ??
                  job?.assessmentProblemNodeId ??
                  job?.AssessmentProblemNodeId,
              );
              return (
                <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">{jobTitle}</h3>
                          <p className="text-sm text-muted-foreground">{profession}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-mono ${active ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-mono ${hasAssessment ? "border-[#00D2FF]/40 bg-[#00D2FF]/10 text-[#00D2FF]" : "border-white/10 bg-white/5 text-muted-foreground"}`}>
                            {hasAssessment ? "Assessment linked" : "No assessment"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <PostingMetric label="Job Title" value={jobTitle} />
                        <PostingMetric label="Profession" value={profession} />
                        <PostingMetric label="Location" value={location} />
                        <PostingMetric label="Salary" value={salary} />
                        <PostingMetric label="Posted Date" value={posted} />
                        <PostingMetric label="Expiry Date" value={expiry} />
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      <Button asChild className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                        <Link href={`/employer/applications/${encodeURIComponent(id)}`}>
                          <ClipboardList className="mr-2 h-4 w-4" /> Applications
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/employer/jobs/${encodeURIComponent(id)}/edit`}>
                          <FileText className="mr-2 h-4 w-4" /> Preview
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/employer/applications/${encodeURIComponent(id)}`}>
                          <Users className="mr-2 h-4 w-4" /> View Applicants
                        </Link>
                      </Button>
                    </div>
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
  const { showSuccess, showError } = useApiFeedback();
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
      showError(res.error || "Please try again.", { title: "Unable to update application" });
      return;
    }
    showSuccess({
      title: "Application updated",
      description: res.message || "Status and notes were saved.",
    });
    load();
  };

  const viewAssessmentResult = async (problemNodeId: string, candidateUserId: string) => {
    setResultLoading(true);
    setResult(null);
    const res = await api.evaluations.getNodeResult(problemNodeId, candidateUserId);
    setResultLoading(false);
    if (!res.ok) {
      showError(res.error || "Please try again.", { title: "Unable to load assessment result" });
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
          <LoadingState label="Loading applications..." variant="card" rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} dashboardHref="/employer/overview" />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications yet"
            description="Applicants will appear here after users apply from Job Details."
            actionLabel="View postings"
            actionHref="/employer/jobs"
          />
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
              const assessment = assessmentState(application);
              const canViewResult = Boolean(problemNodeId && userId && assessment.hasCompleted);
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
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{assessment.status}</span>
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
                          {problemNodeId && (
                            <Button
                              variant="outline"
                              disabled={!canViewResult || resultLoading}
                              title={!canViewResult ? "View Result is available after the assessment is completed." : undefined}
                              onClick={() => canViewResult && viewAssessmentResult(problemNodeId, String(userId))}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Assessment Result
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`status-${id}`} className="text-xs text-muted-foreground">Application Status</Label>
                        <select
                          id={`status-${id}`}
                          value={draft.newStatus}
                          onChange={(event) => updateDraft(id, "newStatus", event.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Status for ${name}`}
                        >
                          <option value="">Select status</option>
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
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
                        <ButtonLoading loading={savingId === id}>
                          <><Save className="mr-2 h-4 w-4" /> Save status</>
                        </ButtonLoading>
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
              <LoadingState label="Loading assessment result..." variant="spinner" />
            ) : result ? (
              <AssessmentResultCard result={result} />
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

function ApplicantMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{value}</p>
    </div>
  );
}

function PostingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{value}</p>
    </div>
  );
}

function assessmentState(application: any): { status: string; hasCompleted: boolean } {
  const explicitCompleted = application?.hasCompleted ?? application?.HasCompleted ?? application?.assessment?.hasCompleted ?? application?.Assessment?.HasCompleted;
  const hasCompleted =
    typeof explicitCompleted === "boolean"
      ? explicitCompleted
      : Boolean(application?.completedAt ?? application?.CompletedAt ?? application?.completionDate ?? application?.CompletionDate);
  const rawStatus = text(
    application?.status ??
      application?.Status ??
      application?.assessmentStatus ??
      application?.AssessmentStatus ??
      application?.assessmentCompletionStatus ??
      application?.AssessmentCompletionStatus ??
      application?.completionStatus ??
      application?.CompletionStatus ??
      application?.resultStatus ??
      application?.ResultStatus,
    applicationProblemNodeId(application) ? "Not Started" : "Not Started",
  );
  return { status: hasCompleted ? "Completed" : rawStatus, hasCompleted };
}
