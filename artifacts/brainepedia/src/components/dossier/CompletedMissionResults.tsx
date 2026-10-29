import { ExternalLink } from "lucide-react";
import { classifyExternalUrl, formatDateOnly, safeExternalHref } from "@/lib/aiCredits";
import type { PublicMissionResultDto } from "@/lib/types/billingCredits";

export function CompletedMissionResults({
  results,
  emptyLabel,
}: {
  results: PublicMissionResultDto[];
  emptyLabel?: string;
}) {
  if (!results.length) {
    return emptyLabel ? (
      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    ) : null;
  }

  return (
    <div className="relative space-y-4">
      <div className="absolute left-[1.125rem] top-3 bottom-3 hidden w-px bg-gradient-to-b from-[#00D2FF]/50 via-[#7C3AED]/30 to-transparent sm:block" />
      {results.map((result, index) => {
        const passed = result.passed;
        return (
          <article key={`${result.missionTitle || "mission"}-${index}`} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:pl-10">
            <span className="absolute left-3 top-6 hidden h-3 w-3 rounded-full border-2 border-[#00D2FF] bg-[#0d1119] sm:block" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{result.missionTitle || "Completed mission"}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {result.profession && <span className="rounded-full bg-white/5 px-2 py-0.5">{result.profession}</span>}
                  {result.district && <span className="rounded-full bg-white/5 px-2 py-0.5">{result.district}</span>}
                  {result.completionDate && <span className="rounded-full bg-white/5 px-2 py-0.5">{formatDateOnly(result.completionDate)}</span>}
                  {result.score != null && (
                    <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[#A78BFA]">{result.score}</span>
                  )}
                </div>
              </div>
              {passed != null && (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  passed ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" : "border-red-400/30 bg-red-400/10 text-red-400"
                }`}>
                  {passed ? "Passed" : "Not passed"}
                </span>
              )}
            </div>
            {result.publicFeedbackSummary && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{result.publicFeedbackSummary}</p>
            )}
            {result.publicStrengths && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Public strengths</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{result.publicStrengths}</p>
              </div>
            )}
            {result.publicPortfolioReference && (
              <SafePublicLink href={result.publicPortfolioReference} label="Public portfolio reference" />
            )}
            {result.publicDeliverableLinks?.length ? (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Public deliverables</p>
                {result.publicDeliverableLinks.map((href) => (
                  <SafePublicLink key={href} href={href} />
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function SafePublicLink({ href, label }: { href: string; label?: string }) {
  const safe = safeExternalHref(href);
  const kind = classifyExternalUrl(safe);
  return (
    <div className="mt-3">
      {label && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>}
      {kind === "image" ? (
        <a href={safe} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-white/10">
          <img src={safe} alt={label || "Public deliverable"} className="max-h-52 w-full object-cover" />
        </a>
      ) : kind === "video" ? (
        <video src={safe} controls className="max-h-52 w-full rounded-xl border border-white/10" />
      ) : (
        <a
          href={safe}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00D2FF] hover:underline"
        >
          {href} <ExternalLink className="h-3.5 w-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
