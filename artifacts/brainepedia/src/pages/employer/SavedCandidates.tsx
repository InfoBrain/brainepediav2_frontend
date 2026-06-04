import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Bookmark, Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, candidateAvatar, candidateName, formatNumber, idOf, initials, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";

export default function SavedCandidates() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.jobs.savedCandidates();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load saved candidates.");
      setItems([]);
      return;
    }
    setItems(asList(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Saved Candidates" subtitle="// recruitment.saved-shortlist" theme="employer">
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" />
          <span className="font-mono">Loading saved candidates...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="mb-4 text-sm text-destructive">{error}</p>
          <Button onClick={load} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
          <Bookmark className="mx-auto mb-3 h-10 w-10 text-[#00D2FF]" />
          <h2 className="text-2xl font-black">No saved candidates yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Save candidates from the explorer to keep hiring notes and compare verified experience proof.
          </p>
          <Button asChild className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
            <Link href="/employer/candidates"><Search className="mr-2 h-4 w-4" /> Explore candidates</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item, index) => {
            const candidate = item?.candidate ?? item?.profile ?? item?.user ?? item;
            const userId = String(item?.candidateUserId ?? candidate?.userId ?? candidate?.UserId ?? idOf(item));
            const name = candidateName(item?.candidate ?? item);
            const avatarUrl = candidateAvatar(item?.candidate ?? item);
            const profession = text(candidate?.professionName ?? candidate?.ProfessionName ?? candidate?.profession ?? candidate?.Profession ?? candidate?.currentTitle, "Verified candidate");
            const rank = text(candidate?.rankTitle ?? candidate?.RankTitle ?? candidate?.rank ?? candidate?.professionalRank ?? candidate?.tier, "Rank not set");
            const vx = formatNumber(candidate?.vx ?? candidate?.VX ?? candidate?.verifiedExperience ?? candidate?.VerifiedExperience);
            const savedDate = formatDate(item?.savedDate ?? item?.SavedDate ?? item?.dateSaved ?? item?.createdAt ?? item?.dateCreated);
            return (
              <Link
                key={userId || index}
                href={`/employer/candidates/${encodeURIComponent(userId)}`}
                className="block rounded-xl border border-white/5 bg-[#0d1119] p-5 transition hover:border-[#00D2FF]/35 focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/60"
              >
                <article>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#00D2FF]/35 to-[#7C3AED]/30 font-bold">
                    {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold">{name}</h3>
                    <p className="text-sm text-muted-foreground">{profession}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2.5 py-1 text-[#FFD700]">{rank}</span>
                      <span className="rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2.5 py-1 text-[#00D2FF]">VX {vx}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted-foreground">Saved {savedDate}</span>
                    </div>
                    <p className="mt-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 text-sm text-muted-foreground">
                      {text(item?.notes, "No saved notes yet.")}
                    </p>
                  </div>
                </div>
                {userId && (
                  <Button asChild className="mt-4 bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={(event) => event.stopPropagation()}>
                    <span><ShieldCheck className="mr-2 h-4 w-4" /> View dossier</span>
                  </Button>
                )}
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function formatDate(value: unknown): string {
  if (!value) return "date unavailable";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? text(value, "date unavailable") : date.toLocaleDateString();
}
