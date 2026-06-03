import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Bookmark, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, ShieldCheck, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, candidateName, formatNumber, idOf, initials, listMeta, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type CandidateRow = {
  id: string;
  name: string;
  profession: string;
  rank: string;
  xp?: unknown;
  vx?: unknown;
  badgeCount?: unknown;
};

export default function CandidateExplorer() {
  const { toast } = useToast();
  const [profession, setProfession] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | undefined>();
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    const res = await api.jobs.exploreCandidates({ profession: profession.trim() || undefined, page: nextPage, pageSize: 20 });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to explore candidates.");
      setCandidates([]);
      return;
    }
    const meta = listMeta(res.data, nextPage, 20);
    setCandidates(asList(res.data).map(normalizeCandidate).filter((candidate) => candidate.id));
    setTotalPages(meta.totalPages);
    setPage(meta.page);
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const professionOptions = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.profession).filter(Boolean))).slice(0, 6),
    [candidates]
  );

  const saveCandidate = async (candidate: CandidateRow) => {
    setSavingId(candidate.id);
    const res = await api.jobs.saveCandidate({
      candidateUserId: candidate.id,
      notes: notesById[candidate.id] || null,
    });
    setSavingId("");
    if (!res.ok) {
      toast({ title: "Unable to save candidate", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Candidate saved", description: `${candidate.name} was added to Saved Candidates.` });
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Candidate Explorer" subtitle="// recruitment.verified-talent" theme="employer">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#00D2FF]/15 bg-gradient-to-br from-[#00D2FF]/10 via-[#0d1119] to-[#7C3AED]/10 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Recruitment intelligence</p>
              <h2 className="text-2xl font-black">Find candidates by profession and verified experience.</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Search real-world mission history, XP, VX, badges, rank, and portfolio proof before inviting applicants.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-[520px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={profession}
                  onChange={(event) => setProfession(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && load(1)}
                  placeholder="Filter by profession"
                  className="pl-9"
                  aria-label="Filter candidates by profession"
                />
              </div>
              <Button onClick={() => load(1)} disabled={loading} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>
          {professionOptions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {professionOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setProfession(option);
                    setTimeout(() => load(1), 0);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:border-[#00D2FF]/40 hover:text-[#00D2FF]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <State label="Exploring candidates..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(page)} />
        ) : candidates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {candidates.map((candidate) => (
              <article key={candidate.id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00D2FF]/35 to-[#7C3AED]/30 font-bold">
                    {initials(candidate.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold">{candidate.name}</h3>
                      <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2 py-0.5 text-[10px] font-mono text-[#FFD700]">
                        {candidate.rank}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{candidate.profession}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <Metric label="XP" value={formatNumber(candidate.xp)} />
                      <Metric label="VX" value={formatNumber(candidate.vx)} />
                      <Metric label="Badges" value={formatNumber(candidate.badgeCount)} />
                    </div>
                  </div>
                </div>
                <Textarea
                  value={notesById[candidate.id] || ""}
                  onChange={(event) => setNotesById((prev) => ({ ...prev, [candidate.id]: event.target.value }))}
                  placeholder="Private hiring notes"
                  className="mt-4 min-h-20"
                  aria-label={`Notes for ${candidate.name}`}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/employer/candidates/${encodeURIComponent(candidate.id)}`}><ShieldCheck className="mr-2 h-4 w-4" /> View dossier</Link>
                  </Button>
                  <Button onClick={() => saveCandidate(candidate)} disabled={savingId === candidate.id} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                    {savingId === candidate.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bookmark className="mr-2 h-4 w-4" />}
                    Save
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
          <span className="text-xs font-mono text-muted-foreground">Page {page}{totalPages ? ` of ${totalPages}` : ""}</span>
          <Button variant="outline" disabled={loading || (totalPages !== undefined && page >= totalPages)} onClick={() => load(page + 1)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function normalizeCandidate(item: any): CandidateRow {
  return {
    id: idOf(item),
    name: candidateName(item),
    profession: text(item?.professionName ?? item?.profession ?? item?.currentTitle, "Profession not set"),
    rank: text(item?.rank ?? item?.professionalRank ?? item?.tier, "Verified talent"),
    xp: item?.xp ?? item?.totalXP ?? item?.totalXp ?? item?.verifiedXp,
    vx: item?.vx ?? item?.verifiedExperienceYears ?? item?.verifiedExperience,
    badgeCount: item?.badgeCount ?? item?.badgesCount ?? (Array.isArray(item?.badges) ? item.badges.length : undefined),
  };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-bold text-[#00D2FF]">{value}</p>
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

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
      <Trophy className="mx-auto mb-3 h-10 w-10 text-[#00D2FF]" />
      <h3 className="text-lg font-bold">No candidates found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Try another profession filter or clear the search to discover more verified professionals.
      </p>
    </div>
  );
}
