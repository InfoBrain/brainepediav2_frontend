import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, Loader2, MapPin, RefreshCw, Search, ShieldCheck, WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { asList, idOf, listMeta, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type JobRow = {
  id: string;
  title: string;
  company: string;
  profession: string;
  salary: string;
  location: string;
  assessmentRequired: boolean;
};

export default function JobFeed() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    const res = await api.jobs.feed(nextPage, 10);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load job feed.");
      setJobs([]);
      return;
    }
    const meta = listMeta(res.data, nextPage, 10);
    setJobs(asList(res.data).map(normalizeJob));
    setTotalPages(meta.totalPages);
    setPage(meta.page);
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = jobs.filter((job) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [job.title, job.company, job.profession, job.location].some((value) =>
      value.toLowerCase().includes(needle)
    );
  });

  return (
    <DashboardShell
      nav={USER_NAV}
      title="Job Feed"
      subtitle="// career.verified-experience.marketplace"
      theme="user"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#FFD700]/15 bg-gradient-to-br from-[#FFD700]/10 via-[#0d1119] to-[#7C3AED]/10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-mono uppercase tracking-[0.2em] text-[#FFD700]">Career credibility</p>
              <h2 className="text-2xl font-black">Turn mission proof into career opportunities.</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Browse roles that value XP, VX, badges, ranks, and completed real-world missions.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company, role, profession"
                className="pl-9"
                aria-label="Search job feed"
              />
            </div>
          </div>
        </section>

        {loading ? (
          <Loading label="Loading verified opportunities..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(page)} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {filtered.map((job) => (
              <article key={job.id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5 transition hover:border-[#FFD700]/30">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFD700]">
                        {job.profession}
                      </span>
                      {job.assessmentRequired && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#00D2FF]">
                          <ShieldCheck className="h-3 w-3" /> Assessment
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-xl font-bold">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                      <span className="inline-flex items-center gap-1"><WalletCards className="h-4 w-4" /> {job.salary}</span>
                    </div>
                  </div>
                  <Button asChild className="bg-[#FFD700] text-black hover:bg-[#F3C800]">
                    <Link href={`/jobs/${encodeURIComponent(job.id)}`}>View details</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={loading || page <= 1} onClick={() => load(page - 1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-xs font-mono text-muted-foreground">
            Page {page}{totalPages ? ` of ${totalPages}` : ""}
          </span>
          <Button variant="outline" disabled={loading || (totalPages !== undefined && page >= totalPages)} onClick={() => load(page + 1)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function normalizeJob(job: any): JobRow {
  return {
    id: idOf(job),
    title: text(job?.title ?? job?.jobTitle, "Untitled role"),
    company: text(job?.companyName ?? job?.company ?? job?.employerName, "Brainepedia employer"),
    profession: text(job?.professionName ?? job?.profession, "Open profession"),
    salary: text(job?.salaryRange ?? job?.salary, "Salary undisclosed"),
    location: text(job?.location, "Remote / flexible"),
    assessmentRequired: Boolean(job?.assessmentRequired ?? job?.requiresAssessment ?? job?.linkAssessmentNodeId ?? job?.assessmentNodeId),
  };
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
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

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
      <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-[#FFD700]" />
      <h3 className="text-lg font-bold">No jobs found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Keep building XP and VX while employers publish new opportunities for verified problem solvers.
      </p>
      <Button asChild className="mt-5"><Link href="/profession/select">Continue your journey</Link></Button>
    </div>
  );
}
