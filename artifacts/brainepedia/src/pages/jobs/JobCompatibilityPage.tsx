import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { getUserRole } from "@/lib/auth";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { listActiveExternalJobs } from "@/lib/externalJobsService";
import { asList, text } from "@/lib/jobData";
import { createCompatibilityReport } from "@/lib/jobCompatibilityService";
import { compatibilityLevelLabel, isGuid, safeHttpUrl } from "@/lib/safeUrl";
import { USER_NAV } from "@/lib/userNav";
import { internalJobIdFromApplyUrl } from "@/components/feed/feedLinks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import type { CompatibilityReportDto, CompatibilityResultDto } from "@/lib/types/socialFeed";

type JobOption = { id: string; label: string };

const LEVEL_STYLE: Record<string, string> = {
  HighlyCompatible: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
  Compatible: "text-[#00D2FF] border-[#00D2FF]/40 bg-[#00D2FF]/10",
  PartiallyCompatible: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  NeedsDevelopment: "text-rose-300 border-rose-400/40 bg-rose-400/10",
};

export default function JobCompatibilityPage() {
  usePageTitle("Jobs That Fit Me");
  const { toast } = useToast();
  const role = getUserRole();
  const nav = role === "Employer" ? EMPLOYER_NAV : role === "GlobalAdmin" ? ADMIN_NAV : USER_NAV;
  const theme = role === "Employer" ? "employer" : role === "GlobalAdmin" ? "admin" : "user";
  const [includeInternalJobs, setIncludeInternalJobs] = useState(true);
  const [includeExternalJobs, setIncludeExternalJobs] = useState(true);
  const [professionId, setProfessionId] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [professions, setProfessions] = useState<JobOption[]>([]);
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<number | undefined>();
  const [report, setReport] = useState<CompatibilityReportDto | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    api.professions.list().then((res) => {
      if (!res.ok) return;
      setProfessions(asList(res.data).map((item) => ({
        id: text(item?.professionId ?? item?.id, ""),
        label: text(item?.name ?? item?.professionName ?? item?.title, ""),
      })).filter((item) => isGuid(item.id) && item.label));
    });
    Promise.all([
      api.jobs.feed(1, 20),
      listActiveExternalJobs({ pageNumber: 1, pageSize: 20 }),
    ]).then(([internal, external]) => {
      const internalOptions = internal.ok ? asList(internal.data).map((item) => ({
        id: text(item?.jobPostingId ?? item?.jobId ?? item?.id, ""),
        label: `${text(item?.title ?? item?.jobTitle, "Organisation job")} · Internal`,
      })) : [];
      const externalOptions = external.ok && external.data ? external.data.items.map((item) => ({
        id: item.externalJobId,
        label: `${item.jobTitle || "External job"} · External`,
      })) : [];
      setJobOptions([...internalOptions, ...externalOptions].filter((item) => item.id));
    });
  }, []);

  const generate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setStatus(undefined);
    setReport(null);
    const res = await createCompatibilityReport({
      jobIds: selected,
      includeInternalJobs,
      includeExternalJobs,
      professionId: professionId || null,
      customInstruction,
    });
    setSubmitting(false);
    setStatus(res.status);
    if (!res.ok || !res.data) {
      if (res.status === 402) {
        setError(res.error || "Your Brainiac AI credits are exhausted for this billing cycle.");
      } else if (res.status === 422) {
        setError(res.error || "Brainiac could not produce a valid compatibility report. You can try again.");
      } else if (res.status === 400) {
        setError(res.error || "No active jobs matched this request.");
      } else if (res.status === 401) {
        setError(res.error || "Please log in again to generate a report.");
      } else {
        setError(res.error || "The compatibility report could not be generated.");
      }
      return;
    }
    setReport(res.data);
  };

  const apply = async (result: CompatibilityResultDto) => {
    if (result.applicationType === "External" || result.jobType === "External") {
      const href = safeHttpUrl(result.applicationUrl);
      if (!href) {
        toast({ title: "External link unavailable", description: "This result does not include a safe application URL.", variant: "destructive" });
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    const jobId = internalJobIdFromApplyUrl(result.applicationUrl) || result.jobId;
    if (!jobId) {
      toast({ title: "Application unavailable", description: "This result does not include an internal application route.", variant: "destructive" });
      return;
    }
    setApplyingId(result.jobId);
    const res = await api.jobs.apply(jobId);
    setApplyingId(null);
    if (!res.ok) {
      toast({ title: "Unable to apply", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Application sent", description: res.message || "Your Brainepedia application was submitted." });
  };

  return (
    <DashboardShell nav={nav} title="Jobs That Fit Me" subtitle="// brainiac.compatibility" theme={theme}>
      <section className="mb-6 rounded-2xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/15 to-[#0d1119] p-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#A78BFA]">Brainiac AI</p>
        <h2 className="mt-1 text-2xl font-black">Jobs That Fit Me</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Brainiac compares your existing profile, skills, experience, and verified mission history with available jobs. This is a compatibility analysis, not a job offer or a guarantee of employment. Generating a report uses Brainiac credits from your personal wallet.
        </p>
      </section>

      <section className="mb-6 space-y-4 rounded-2xl border border-white/8 bg-[#0d1119] p-5">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={includeInternalJobs} onCheckedChange={(checked) => setIncludeInternalJobs(checked === true)} />
            Include internal jobs
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={includeExternalJobs} onCheckedChange={(checked) => setIncludeExternalJobs(checked === true)} />
            Include external jobs
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Profession</Label>
            <Select value={professionId || "all"} onValueChange={(value) => setProfessionId(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="Any profession" /></SelectTrigger>
              <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
                <SelectItem value="all">Any profession</SelectItem>
                {professions.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fit-instruction">Custom instruction</Label>
            <Input id="fit-instruction" value={customInstruction} onChange={(event) => setCustomInstruction(event.target.value)} placeholder="Prefer roles based in Lagos." />
          </div>
        </div>
        {jobOptions.length > 0 && (
          <div className="space-y-2">
            <Label>Optional job selection</Label>
            <p className="text-xs text-muted-foreground">Leave every box clear and Brainiac chooses up to 15 active jobs.</p>
            <div className="grid max-h-48 gap-2 overflow-auto rounded-xl border border-white/8 p-3 md:grid-cols-2">
              {jobOptions.map((job) => (
                <label key={job.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(job.id)}
                    onCheckedChange={(checked) => setSelected((current) => checked === true ? [...current, job.id] : current.filter((id) => id !== job.id))}
                  />
                  <span>{job.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <Button type="button" onClick={() => void generate()} disabled={submitting} className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate report
        </Button>
      </section>

      {submitting && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#A78BFA]/30 bg-[#7C3AED]/10 p-5 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#A78BFA]" />
          Brainiac is evaluating jobs against your profile. This can take as long as a normal Brainiac request.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p>{error}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {status !== 402 && (
              <Button type="button" variant="outline" onClick={() => void generate()} disabled={submitting}>Try again</Button>
            )}
            {status === 402 && (
              <>
                <Button asChild className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]"><Link href="/user/subscription">Upgrade</Link></Button>
                <Button asChild variant="outline"><Link href="/user/credits">Brainiac credits</Link></Button>
              </>
            )}
          </div>
        </div>
      )}

      {report && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-[#FFD700]/30 bg-[#FFD700]/10 p-5">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#FFD700]">Disclaimer</p>
            <p className="mt-2 text-sm font-medium">{report.disclaimer || "This is a compatibility analysis, not a guarantee of employment."}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {report.candidate?.fullName || "You"}
              {report.candidate?.profession ? ` · ${report.candidate.profession}` : ""}
              {typeof report.totalJobsEvaluated === "number" ? ` · ${report.totalJobsEvaluated} jobs evaluated` : ""}
            </p>
          </div>
          {report.generalRecommendations.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-[#0d1119] p-5">
              <h3 className="font-bold">General recommendations</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {report.generalRecommendations.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {report.results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brainiac returned a report without job results.</p>
          ) : report.results.map((result) => (
            <article key={`${result.jobType}-${result.jobId}`} className="rounded-2xl border border-white/8 bg-[#0d1119] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{result.jobType || "Job"} · {result.organisationName || "Organisation"}</p>
                  <h3 className="text-xl font-bold">{result.jobTitle || "Untitled role"}</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#FFD700]">{typeof result.compatibilityScore === "number" ? result.compatibilityScore : "—"}</p>
                  {result.compatibilityLevel && (
                    <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${LEVEL_STYLE[result.compatibilityLevel] || "border-white/15"}`}>
                      {compatibilityLevelLabel(result.compatibilityLevel)}
                    </span>
                  )}
                </div>
              </div>
              {typeof result.compatibilityScore === "number" && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#00D2FF]" style={{ width: `${Math.max(0, Math.min(100, result.compatibilityScore))}%` }} />
                </div>
              )}
              <ResultList title="Why it matches" items={result.whyItMatches} />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ResultList title="Matching skills" items={result.matchingSkills} />
                <ResultList title="Matching experience" items={result.matchingExperience} />
                <ResultList title="Missing skills" items={result.missingSkills} />
                <ResultList title="Missing experience" items={result.missingExperience} />
              </div>
              <ResultList title="Improvement recommendations" items={result.improvementRecommendations} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" disabled={applyingId === result.jobId} onClick={() => void apply(result)} className="bg-[#FFD700] text-black hover:bg-[#F3C800]">
                  {applyingId === result.jobId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : result.applicationType === "External" ? <ExternalLink className="mr-2 h-4 w-4" /> : null}
                  {result.applicationType === "External" ? "Apply Externally" : "Apply"}
                </Button>
                {result.jobType === "Internal" && result.jobId && (
                  <Button asChild variant="outline"><Link href={`/jobs/${encodeURIComponent(result.jobId)}`}>View job</Link></Button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
