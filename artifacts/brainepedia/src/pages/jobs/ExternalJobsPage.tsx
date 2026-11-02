import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, Building2, ExternalLink, MapPin, Search } from "lucide-react";
import { RoleChrome } from "@/components/layout/RoleChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServerPagination } from "@/components/shared/ServerPagination";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { LoadingState } from "@/components/ux/LoadingState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { getUserRole } from "@/lib/auth";
import { listActiveExternalJobs } from "@/lib/externalJobsService";
import { employmentLabel, experienceLabel, formatFeedDate, safeHttpUrl } from "@/lib/safeUrl";
import type { EmploymentType, ExperienceLevel, ExternalJobDto } from "@/lib/types/socialFeed";

const EMPLOYMENT: EmploymentType[] = ["FullTime", "PartTime", "Contract", "Internship", "Freelance"];
const EXPERIENCE: ExperienceLevel[] = ["Entry", "Junior", "Mid", "Senior", "Lead"];

type Filters = {
  search: string;
  profession: string;
  location: string;
  employmentType: EmploymentType | "";
  experienceLevel: ExperienceLevel | "";
  organisation: string;
};

const EMPTY: Filters = { search: "", profession: "", location: "", employmentType: "", experienceLevel: "", organisation: "" };

export default function ExternalJobsPage() {
  usePageTitle("External Jobs");
  const { toast } = useToast();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<ExternalJobDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await listActiveExternalJobs({ ...filters, pageNumber: page, pageSize: 20 });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.error || "Unable to load external jobs.");
        setJobs([]);
        return;
      }
      setJobs(res.data.items);
      setTotalPages(res.data.totalPages);
    })();
    return () => { cancelled = true; };
  }, [filters, page]);

  const apply = () => {
    setPage(1);
    setFilters({ ...draft, search: draft.search.trim(), profession: draft.profession.trim(), location: draft.location.trim(), organisation: draft.organisation.trim() });
  };

  const applyExternally = (job: ExternalJobDto) => {
    const href = safeHttpUrl(job.applicationUrl);
    if (!href) {
      toast({ title: "Application link unavailable", description: "This role does not have a safe http or https application URL.", variant: "destructive" });
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <RoleChrome title="External Jobs" subtitle="// roles outside Brainepedia employers">
      <section className="mb-6 rounded-2xl border border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/10 to-[#0d1119] p-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">External roles</p>
        <h2 className="mt-1 text-2xl font-black">Jobs from organisations without a Brainepedia employer account.</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Apply Externally opens the organisation&apos;s own application page. Brainepedia does not create an internal application for these roles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/feed">Public feed</Link></Button>
          <Button asChild variant="outline"><Link href="/jobs">Organisation jobs</Link></Button>
        </div>
      </section>

      <section className="mb-6 grid gap-3 rounded-2xl border border-white/8 bg-[#0d1119] p-4 md:grid-cols-3">
        <div className="space-y-1 md:col-span-3">
          <Label htmlFor="ext-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ext-search" className="pl-9" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder="Title, organisation, or keyword" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ext-profession">Profession</Label>
          <Input id="ext-profession" value={draft.profession} onChange={(event) => setDraft({ ...draft, profession: event.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ext-location">Location</Label>
          <Input id="ext-location" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ext-org">Organisation</Label>
          <Input id="ext-org" value={draft.organisation} onChange={(event) => setDraft({ ...draft, organisation: event.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Employment type</Label>
          <Select value={draft.employmentType || "all"} onValueChange={(value) => setDraft({ ...draft, employmentType: value === "all" ? "" : value as EmploymentType })}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent className="border-white/15 bg-[#0d1119] text-white">
              <SelectItem value="all">Any</SelectItem>
              {EMPLOYMENT.map((item) => <SelectItem key={item} value={item}>{employmentLabel(item)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Experience level</Label>
          <Select value={draft.experienceLevel || "all"} onValueChange={(value) => setDraft({ ...draft, experienceLevel: value === "all" ? "" : value as ExperienceLevel })}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent className="border-white/15 bg-[#0d1119] text-white">
              <SelectItem value="all">Any</SelectItem>
              {EXPERIENCE.map((item) => <SelectItem key={item} value={item}>{experienceLabel(item)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={apply} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">Apply filters</Button>
        </div>
      </section>

      {loading ? <LoadingState label="Loading external jobs..." /> : error ? (
        <ErrorState message={error} onRetry={() => setFilters({ ...filters })} showDashboardLink={Boolean(getUserRole())} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} title="No active external jobs" description="Inactive and expired roles are hidden. Try a broader search." />
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const logo = safeHttpUrl(job.organisationLogoUrl);
            return (
              <article key={job.externalJobId} className="rounded-2xl border border-white/8 bg-[#0d1119] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {logo ? <img src={logo} alt="" className="h-14 w-14 rounded-xl object-cover" /> : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#00D2FF]/10 text-[#00D2FF]"><Building2 className="h-6 w-6" /></div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold">{job.jobTitle || "Untitled role"}</h3>
                      <p className="text-sm text-muted-foreground">{job.organisationName || "Organisation"}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>}
                        {job.country && <span>{job.country}</span>}
                        {job.employmentType && <span>{employmentLabel(job.employmentType)}</span>}
                        {job.experienceLevel && <span>{experienceLabel(job.experienceLevel)}</span>}
                        {job.professionName && <span>{job.professionName}</span>}
                        {job.salaryInformation && <span>{job.salaryInformation}</span>}
                        {job.applicationType && <span>Application: {job.applicationType}</span>}
                        {job.closingDate && <span>Closes {formatFeedDate(job.closingDate)}</span>}
                        {job.createdAt && <span>Posted {formatFeedDate(job.createdAt)}</span>}
                      </div>
                      {job.jobDescription && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">{job.jobDescription}</p>}
                    </div>
                  </div>
                  <Button type="button" className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={() => applyExternally(job)}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Apply Externally
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="mt-4">
        <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </RoleChrome>
  );
}
