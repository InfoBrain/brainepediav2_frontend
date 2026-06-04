import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, CalendarDays, ClipboardList, Edit3, Eye, FilePlus2, Loader2, MapPin, RefreshCw, WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, idOf, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function MyJobPostings() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.jobs.myPostings();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load job postings.");
      setJobs([]);
      return;
    }
    setJobs(asList(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const openPreview = async (jobId: string) => {
    setPreviewLoading(true);
    setPreview(null);
    const res = await api.jobs.myJob(jobId);
    setPreviewLoading(false);
    if (!res.ok) {
      toast({ title: "Unable to preview job", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setPreview(res.data);
  };

  const toggleStatus = async (jobId: string, nextActive: boolean) => {
    setStatusLoadingId(jobId);
    const res = await api.jobs.updateJobStatus(jobId, nextActive);
    setStatusLoadingId("");
    if (!res.ok) {
      toast({ title: "Unable to update status", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Job status updated", description: `Posting is now ${nextActive ? "Active" : "Inactive"}.` });
    load();
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="My Job Postings" subtitle="// jobs.posting-command-center" theme="employer">
      {loading ? (
        <State label="Loading job postings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
          <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-[#00D2FF]" />
          <h2 className="text-2xl font-black">No job postings yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Create a posting and connect it to profession proof, salary context, location, and optional assessments.
          </p>
          <Button asChild className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
            <Link href="/employer/jobs/create"><FilePlus2 className="mr-2 h-4 w-4" /> Create job</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job, index) => {
            const id = idOf(job) || String(index);
            return (
              <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#00D2FF]">
                        {text(job?.professionName ?? job?.profession, "Open profession")}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${isActive(job) ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground"}`}>
                        {isActive(job) ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="truncate text-xl font-bold">{text(job?.title ?? job?.jobTitle, "Untitled role")}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {text(job?.location, "Remote / flexible")}</span>
                      <span className="inline-flex items-center gap-1"><WalletCards className="h-4 w-4" /> {text(job?.salaryRange ?? job?.salary, "Salary undisclosed")}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(job?.datePosted ?? job?.postedDate ?? job?.createdAt ?? job?.dateCreated)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs">
                      <Switch
                        checked={isActive(job)}
                        disabled={statusLoadingId === id}
                        onCheckedChange={(checked) => toggleStatus(id, checked)}
                        className={isActive(job) ? "data-[state=checked]:bg-emerald-500" : ""}
                        aria-label={`Set ${text(job?.title ?? job?.jobTitle, "job")} active status`}
                      />
                      <span className={isActive(job) ? "text-emerald-300" : "text-muted-foreground"}>{isActive(job) ? "Active" : "Inactive"}</span>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/employer/applications/${encodeURIComponent(id)}`}><ClipboardList className="mr-2 h-4 w-4" /> View applicants</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/employer/jobs/${encodeURIComponent(id)}/edit`}><Edit3 className="mr-2 h-4 w-4" /> Edit</Link>
                    </Button>
                    <Button onClick={() => openPreview(id)} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Dialog open={Boolean(preview) || previewLoading} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl bg-[#0d1119] border border-white/10">
          <DialogHeader>
            <DialogTitle>{previewLoading ? "Loading preview..." : text(preview?.title ?? preview?.jobTitle, "Job Preview")}</DialogTitle>
            <DialogDescription>Employer-only preview from my-jobs details.</DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <State label="Loading job preview..." />
          ) : preview ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Job Title" value={text(preview?.title ?? preview?.jobTitle, "Untitled role")} />
                <Info label="Location" value={text(preview?.location, "Remote / flexible")} />
                <Info label="Salary" value={text(preview?.salaryRange ?? preview?.salary, "Salary undisclosed")} />
                <Info label="Date Posted" value={formatDate(preview?.datePosted ?? preview?.postedDate ?? preview?.createdAt ?? preview?.dateCreated)} />
              </div>
              <div>
                <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</p>
                <p className="whitespace-pre-wrap rounded-xl border border-white/5 bg-white/[0.03] p-4 text-muted-foreground">{text(preview?.description ?? preview?.details, "No description provided.")}</p>
              </div>
              {(preview?.linkAssessmentNodeId ?? preview?.linkedAssessmentNodeId ?? preview?.assessmentNodeId ?? preview?.problemNodeTitle ?? preview?.challengeName) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Challenge Name" value={text(preview?.challengeName ?? preview?.assessmentTitle ?? preview?.assessmentName, "Linked assessment")} />
                  <Info label="Problem Node" value={text(preview?.problemNodeTitle ?? preview?.problemNodeName ?? preview?.linkAssessmentNodeId ?? preview?.assessmentNodeId, "Linked problem node")} />
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardShell>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function isActive(job: any): boolean {
  const raw = job?.isActive ?? job?.active ?? job?.status ?? job?.Status;
  if (typeof raw === "boolean") return raw;
  return !String(raw ?? "Active").toLowerCase().includes("inactive");
}

function formatDate(value: unknown): string {
  if (!value) return "Date unavailable";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? text(value, "Date unavailable") : date.toLocaleDateString();
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
      <p className="mb-4 text-sm text-destructive">{message}</p>
      <Button onClick={onRetry} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
    </div>
  );
}
