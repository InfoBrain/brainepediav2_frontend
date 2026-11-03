import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, Building2, ExternalLink, MapPin, SlidersHorizontal } from "lucide-react";
import { RoleChrome } from "@/components/layout/RoleChrome";
import { HtmlContent } from "@/components/editor/HtmlContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<ExternalJobDto | null>(null);
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
    setFiltersOpen(false);
  };

  const clear = () => {
    setDraft(EMPTY);
    setFilters(EMPTY);
    setPage(1);
    setFiltersOpen(false);
  };

  const applyExternally = (job: ExternalJobDto) => {
    const href = safeHttpUrl(job.applicationUrl);
    if (!href) {
      toast({ title: "Application link unavailable", description: "This role does not have a safe http or https application URL.", variant: "destructive" });
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const activeCount = [filters.search, filters.profession, filters.location, filters.employmentType, filters.experienceLevel, filters.organisation].filter(Boolean).length;

  return (
    <RoleChrome title="External Jobs" subtitle="// roles outside Brainepedia employers">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => { setDraft(filters); setFiltersOpen(true); }}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/feed">Public feed</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/jobs">Organisation jobs</Link></Button>
        </div>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter external jobs</DialogTitle>
            <DialogDescription>Search stays out of the way so the roles stay in front.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="ext-search">Search</Label>
              <Input id="ext-search" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder="Title, organisation, or keyword" />
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
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={apply} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">Apply filters</Button>
            <Button type="button" variant="outline" onClick={clear}>Clear</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? <LoadingState label="Loading external jobs..." /> : error ? (
        <ErrorState message={error} onRetry={() => setFilters({ ...filters })} showDashboardLink={Boolean(getUserRole())} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} title="No active external jobs" description="Inactive and expired roles are hidden. Try a broader search." />
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const logo = safeHttpUrl(job.organisationLogoUrl);
            const place = [job.location, job.country].filter(Boolean).join(", ");
            return (
              <article key={job.externalJobId} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0d1119] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {logo ? <img src={logo} alt="" className="h-12 w-12 rounded-xl object-cover" /> : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D2FF]/10 text-[#00D2FF]"><Building2 className="h-5 w-5" /></div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">{job.jobTitle || "Untitled role"}</h3>
                    <p className="truncate text-sm text-muted-foreground">{job.organisationName || "Organisation"}</p>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {place && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {place}</span>}
                      {job.employmentType && <span>{employmentLabel(job.employmentType)}</span>}
                      {job.closingDate && <span>Closes {formatFeedDate(job.closingDate)}</span>}
                    </p>
                  </div>
                </div>
                <Button type="button" className="shrink-0 bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={() => setSelected(job)}>
                  View and apply
                </Button>
              </article>
            );
          })}
        </div>
      )}
      <div className="mt-4">
        <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.jobTitle || "Untitled role"}</DialogTitle>
                <DialogDescription>{selected.organisationName || "Organisation"}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {selected.location && <span>{selected.location}</span>}
                {selected.country && <span>{selected.country}</span>}
                {selected.employmentType && <span>{employmentLabel(selected.employmentType)}</span>}
                {selected.experienceLevel && <span>{experienceLabel(selected.experienceLevel)}</span>}
                {selected.professionName && <span>{selected.professionName}</span>}
                {selected.salaryInformation && <span>{selected.salaryInformation}</span>}
                {selected.closingDate && <span>Closes {formatFeedDate(selected.closingDate)}</span>}
              </div>
              <HtmlContent html={selected.jobDescription} className="text-sm text-foreground/85" />
              <p className="text-xs text-muted-foreground">Apply Externally opens the organisation&apos;s own application page. Brainepedia does not create an internal application for these roles.</p>
              <Button type="button" className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={() => applyExternally(selected)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Apply Externally
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </RoleChrome>
  );
}
