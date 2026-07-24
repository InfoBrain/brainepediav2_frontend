import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { openPublicDossier } from "@/lib/publicDossier";
import {
  asList,
  candidateAvatar,
  candidateName,
  idOf,
  initials,
  text,
} from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState, ButtonLoading } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { useApiFeedback } from "@/hooks/useApiFeedback";

type SuggestedCandidate = {
  id: string;
  name: string;
  avatarUrl: string;
  currentTitle: string;
  location: string;
  profession: string;
  matchScore: number;
  fitSummary: string;
  matchingSkills: string[];
  email?: string;
};

export default function SuggestedApplicants() {
  const [, params] = useRoute("/employer/jobs/:jobId/suggested-applicants");
  const jobId = params?.jobId ? decodeURIComponent(params.jobId) : "";
  const { showSuccess, showError } = useApiFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [candidatesEvaluated, setCandidatesEvaluated] = useState<number | undefined>();
  const [suggestionCount, setSuggestionCount] = useState<number | undefined>();
  const [candidates, setCandidates] = useState<SuggestedCandidate[]>([]);
  const [savingId, setSavingId] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minMatch, setMinMatch] = useState(0);

  const load = async () => {
    if (!jobId) return;
    setLoading(true);
    setError("");
    const res = await api.jobs.suggestApplicants(jobId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load suggested applicants.");
      setCandidates([]);
      return;
    }
    const data = res.data as any;
    const root = data?.data ?? data?.result ?? data;
    setJobTitle(text(root?.jobTitle ?? root?.JobTitle ?? root?.title ?? root?.Title, "Job posting"));
    setCandidatesEvaluated(numberish(root?.candidatesEvaluated ?? root?.CandidatesEvaluated ?? root?.evaluatedCount));
    setSuggestionCount(numberish(root?.suggestionCount ?? root?.SuggestionCount ?? root?.count));
    const rows = asList(root?.suggestions ?? root?.Suggestions ?? root?.candidates ?? root?.Candidates ?? root?.applicants ?? root);
    setCandidates(rows.map(normalizeSuggestion).filter((row) => row.id).sort((a, b) => b.matchScore - a.matchScore));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const professionOptions = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.profession).filter(Boolean))),
    [candidates],
  );

  const filtered = useMemo(() => {
    return candidates.filter((candidate) => {
      if (professionFilter && candidate.profession !== professionFilter) return false;
      if (locationFilter && !candidate.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (candidate.matchScore < minMatch) return false;
      return true;
    });
  }, [candidates, professionFilter, locationFilter, minMatch]);

  const saveCandidate = async (candidate: SuggestedCandidate) => {
    setSavingId(candidate.id);
    const res = await api.jobs.saveCandidate({ candidateUserId: candidate.id, notes: `AI suggested for ${jobTitle}` });
    setSavingId("");
    if (!res.ok) {
      showError(res.error || "Please try again.", { title: "Unable to save candidate" });
      return;
    }
    showSuccess({ title: "Candidate saved", description: `${candidate.name} was added to Saved Candidates.` });
  };

  const inviteCandidate = (candidate: SuggestedCandidate) => {
    if (candidate.email) {
      window.location.href = `/employer/assessments?email=${encodeURIComponent(candidate.email)}`;
      return;
    }
    showSuccess({
      title: "Invite candidate",
      description: "Open Candidate Assessments to send an assessment invitation.",
    });
    window.open("/employer/assessments", "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Suggested Applicants" subtitle="// jobs.ai-matching" theme="employer">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="w-fit text-muted-foreground">
            <Link href="/employer/jobs"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Job Postings</Link>
          </Button>
        </div>

        <section className="rounded-2xl border border-[#9D4EDD]/20 bg-gradient-to-br from-[#9D4EDD]/10 via-[#0d1119] to-[#00D2FF]/10 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 text-[#9D4EDD]" />
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#9D4EDD]">AI Match</p>
              <h2 className="text-2xl font-black">{jobTitle}</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {candidatesEvaluated != null && <span>Candidates Evaluated: <strong className="text-foreground">{candidatesEvaluated}</strong></span>}
                {suggestionCount != null && <span>Suggestions: <strong className="text-foreground">{suggestionCount}</strong></span>}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-xl border border-white/5 bg-[#0d1119] p-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-mono uppercase tracking-wider text-muted-foreground">Profession</label>
            <select value={professionFilter} onChange={(e) => setProfessionFilter(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All professions</option>
              {professionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono uppercase tracking-wider text-muted-foreground">Location</label>
            <Input value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Filter by location" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono uppercase tracking-wider text-muted-foreground">Minimum Match %</label>
            <Input type="number" min={0} max={100} value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value) || 0)} />
          </div>
        </section>

        {loading ? (
          <LoadingState label="Finding best candidates..." variant="card" rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} dashboardHref="/employer/jobs" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No suggested applicants"
            description="Try adjusting your filters or check back after more candidates enter the talent pool."
            actionLabel="Back to jobs"
            actionHref="/employer/jobs"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((candidate) => (
              <article key={candidate.id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5 transition hover:border-[#9D4EDD]/35">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#9D4EDD]/35 to-[#00D2FF]/30 font-bold">
                    {candidate.avatarUrl ? <img src={candidate.avatarUrl} alt={candidate.name} className="h-full w-full object-cover" /> : initials(candidate.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold">{candidate.name}</h3>
                      <span className="rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 px-2 py-0.5 text-[10px] font-mono text-[#9D4EDD]">
                        {candidate.matchScore}% match
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{candidate.currentTitle}</p>
                    <p className="text-xs text-muted-foreground">{candidate.profession} · {candidate.location}</p>
                    {candidate.fitSummary && <p className="mt-3 text-sm leading-6 text-white/70">{candidate.fitSummary}</p>}
                    {candidate.matchingSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {candidate.matchingSkills.map((skill) => (
                          <span key={skill} className="rounded-full border border-[#00D2FF]/20 bg-[#00D2FF]/8 px-2 py-0.5 text-[10px] text-[#00D2FF]">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openPublicDossier(candidate.id)}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> View Dossier
                  </Button>
                  <Button onClick={() => saveCandidate(candidate)} disabled={savingId === candidate.id} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                    <ButtonLoading loading={savingId === candidate.id}>
                      <><Bookmark className="mr-2 h-4 w-4" /> Save Candidate</>
                    </ButtonLoading>
                  </Button>
                  <Button variant="outline" onClick={() => inviteCandidate(candidate)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normalizeSuggestion(item: any): SuggestedCandidate {
  const source = item?.profile ?? item?.candidate ?? item?.user ?? item;
  const skillsRaw = item?.matchingSkills ?? item?.MatchingSkills ?? item?.skills ?? item?.Skills ?? [];
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw.map((skill: any) => (typeof skill === "string" ? skill : text(skill?.name ?? skill?.skill ?? skill?.mySkill, ""))).filter(Boolean)
    : [];
  return {
    id: idOf(item) || idOf(source),
    name: candidateName(item),
    avatarUrl: candidateAvatar(item),
    currentTitle: text(source?.currentTitle ?? source?.CurrentTitle ?? source?.title ?? source?.professionalTitle, "Current title not set"),
    location: text(source?.location ?? source?.Location ?? source?.city ?? source?.country ?? source?.address, "Location not set"),
    profession: text(source?.professionName ?? source?.ProfessionName ?? source?.profession ?? source?.Profession, "Profession not set"),
    matchScore: Math.round(Number(item?.matchScore ?? item?.MatchScore ?? item?.matchPercentage ?? item?.MatchPercentage ?? item?.score ?? 0)),
    fitSummary: text(item?.fitSummary ?? item?.FitSummary ?? item?.summary ?? item?.aiSummary ?? item?.reasoning, ""),
    matchingSkills: skills,
    email: text(source?.email ?? source?.Email ?? item?.email ?? item?.Email, ""),
  };
}

function numberish(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}
