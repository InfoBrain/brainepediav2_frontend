import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, ClipboardList, FilePlus2, Loader2, MapPin, RefreshCw, WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, idOf, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";

export default function MyJobPostings() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {text(job?.status, "Active")}
                      </span>
                    </div>
                    <h3 className="truncate text-xl font-bold">{text(job?.title ?? job?.jobTitle, "Untitled role")}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {text(job?.location, "Remote / flexible")}</span>
                      <span className="inline-flex items-center gap-1"><WalletCards className="h-4 w-4" /> {text(job?.salaryRange ?? job?.salary, "Salary undisclosed")}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/employer/applications/${encodeURIComponent(id)}`}><ClipboardList className="mr-2 h-4 w-4" /> View applicants</Link>
                    </Button>
                    <Button asChild className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                      <Link href={`/jobs/${encodeURIComponent(id)}`}>Preview</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
      <p className="mb-4 text-sm text-destructive">{message}</p>
      <Button onClick={onRetry} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
    </div>
  );
}
