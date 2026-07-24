import { useEffect, useState } from "react";
import { Bookmark, Search, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { openPublicDossier } from "@/lib/publicDossier";
import { asList, candidateAvatar, candidateName, formatNumber, idOf, initials, text } from "@/lib/jobData";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";

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
    let rows = asList(res.data);
    if (rows.some((row) => !candidateUserId(row))) {
      const explore = await api.jobs.exploreCandidates({ page: 1, pageSize: 100 });
      if (explore.ok) {
        const pool = asList(explore.data);
        rows = rows.map((row) => {
          const info = row?.candidateInfo ?? row?.candidate ?? row;
          const match = pool.find((candidate) => candidateMatches(info, candidate));
          return match ? { ...row, candidate: match, candidateUserId: idOf(match) } : row;
        });
      }
    }
    setItems(rows);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Saved Candidates" subtitle="// recruitment.saved-shortlist" theme="employer">
      {loading ? (
        <LoadingState label="Loading saved candidates..." variant="card" rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} dashboardHref="/employer/overview" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved candidates yet"
          description="Save candidates from the explorer to keep hiring notes and compare verified experience proof."
          actionLabel="Explore candidates"
          actionHref="/employer/candidates"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item, index) => {
            const candidate = item?.candidate ?? item?.candidateInfo ?? item?.profile ?? item?.user ?? item;
            const userId = candidateUserId(item);
            const name = candidateName(item?.candidate ?? item);
            const avatarUrl = candidateAvatar(item?.candidate ?? item);
            const profession = text(candidate?.professionName ?? candidate?.ProfessionName ?? candidate?.profession ?? candidate?.Profession ?? candidate?.currentTitle, "Verified candidate");
            const rank = text(candidate?.rankTitle ?? candidate?.RankTitle ?? candidate?.rank ?? candidate?.professionalRank ?? candidate?.tier, "Rank not set");
            const vx = formatNumber(candidate?.vx ?? candidate?.VX ?? candidate?.verifiedExperienceYears ?? candidate?.verifiedExperience ?? candidate?.VerifiedExperience);
            const savedDate = formatDate(item?.savedAt ?? item?.SavedAt ?? item?.savedDate ?? item?.SavedDate ?? item?.dateSaved ?? item?.createdAt ?? item?.dateCreated);
            const card = (
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
                  {userId ? (
                    <button
                      type="button"
                      onClick={() => openPublicDossier(userId)}
                      className="mt-4 inline-flex rounded-md bg-[#00D2FF] px-4 py-2 text-sm font-medium text-black hover:bg-[#00B8DD]"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" /> View dossier
                    </button>
                  ) : (
                    <span className="mt-4 inline-flex rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground">
                      Dossier link unavailable
                    </span>
                  )}
                </article>
              );
              return (
                <div key={userId || index} className="rounded-xl border border-white/5 bg-[#0d1119] p-5 transition hover:border-[#00D2FF]/35">
                  {card}
                </div>
              );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function candidateUserId(item: any): string {
  return text(item?.candidateUserId ?? item?.candidate?.userId ?? item?.candidate?.UserId ?? item?.candidateInfo?.userId ?? item?.candidateInfo?.UserId ?? idOf(item), "");
}

function candidateMatches(info: any, candidate: any): boolean {
  const infoEmail = text(info?.email ?? info?.Email, "").toLowerCase();
  const candidateEmail = text(candidate?.email ?? candidate?.Email, "").toLowerCase();
  if (infoEmail && candidateEmail && infoEmail === candidateEmail) return true;
  const infoName = candidateName(info).toLowerCase();
  const candidateDisplayName = candidateName(candidate).toLowerCase();
  if (infoName === "candidate" || candidateDisplayName === "candidate") return false;
  if (infoName === candidateDisplayName) return true;
  const infoTokens = infoName.split(/\s+/).filter((part) => part.length > 1);
  const candidateTokens = new Set(candidateDisplayName.split(/\s+/).filter(Boolean));
  return infoTokens.length > 0 && infoTokens.every((token) => candidateTokens.has(token));
}

function formatDate(value: unknown): string {
  if (!value) return "date unavailable";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? text(value, "date unavailable") : date.toLocaleDateString();
}
