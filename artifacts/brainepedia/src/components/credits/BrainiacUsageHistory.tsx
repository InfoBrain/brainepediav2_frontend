import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { formatCredits, formatDateTime, normalizeUsageHistory, usageOccurredAt, usagePages, usageStatusLabel, usageStatusTone } from "@/lib/aiCredits";
import { Button } from "@/components/ui/button";
import { ServerPagination } from "@/components/shared/ServerPagination";
import type { UsageHistoryItemDto, UsageHistoryResponse } from "@/lib/types/billingCredits";

const PAGE_SIZE = 20;

export function BrainiacUsageHistory() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<UsageHistoryResponse>({
    totalCount: 0,
    currentPage: 1,
    pageSize: PAGE_SIZE,
    items: [],
  });

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    const res = await api.brainiacCredits.usage(nextPage, PAGE_SIZE);
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) setError("Your session has expired. Please log in again.");
      else if (res.status === 403) setError("You do not have permission to view this usage history.");
      else setError(res.error || "Unable to load Brainiac usage history.");
      return;
    }
    setHistory(normalizeUsageHistory(res.data, nextPage, PAGE_SIZE));
  };

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = usagePages(history.totalCount, history.pageSize || PAGE_SIZE);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Brainiac usage history</h2>
          <p className="text-sm text-muted-foreground">Token usage and remaining credit balance after each AI operation.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load(page)}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0d1119] py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#A78BFA]" /> Loading usage history…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
      ) : history.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center text-sm text-muted-foreground">
          No Brainiac AI usage has been recorded for this wallet yet.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1119] md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Date and time</th>
                  <th className="px-4 py-3">AI feature</th>
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Input</th>
                  <th className="px-4 py-3">Output</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((item, index) => (
                  <tr key={`${usageOccurredAt(item)}-${index}`} className="border-b border-white/5">
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(usageOccurredAt(item))}</td>
                    <td className="px-4 py-3">{item.aiFeature || "—"}</td>
                    <td className="px-4 py-3">{item.operation || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.model || "—"}</td>
                    <td className="px-4 py-3 font-mono">{formatCredits(item.inputTokens)}</td>
                    <td className="px-4 py-3 font-mono">{formatCredits(item.outputTokens)}</td>
                    <td className="px-4 py-3 font-mono">{formatCredits(item.totalTokens)}</td>
                    <td className="px-4 py-3"><StatusBadge item={item} /></td>
                    <td className="px-4 py-3 font-mono text-[#A78BFA]">{formatCredits(item.remainingBalanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {history.items.map((item, index) => (
              <article key={`${usageOccurredAt(item)}-${index}`} className="rounded-2xl border border-white/10 bg-[#0d1119] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.aiFeature || "AI feature"}</p>
                    <p className="text-xs text-muted-foreground">{item.operation || "Operation"}</p>
                  </div>
                  <StatusBadge item={item} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(usageOccurredAt(item))}</p>
                {item.model && <p className="mt-1 text-xs text-muted-foreground">Model: {item.model}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <span>Input: {formatCredits(item.inputTokens)}</span>
                  <span>Output: {formatCredits(item.outputTokens)}</span>
                  <span>Total: {formatCredits(item.totalTokens)}</span>
                  <span>Remaining: {formatCredits(item.remainingBalanceAfter)}</span>
                </div>
              </article>
            ))}
          </div>

          <ServerPagination page={history.currentPage || page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}

function StatusBadge({ item }: { item: UsageHistoryItemDto }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${usageStatusTone(item.usageStatus)}`}>
      {usageStatusLabel(item.usageStatus)}
    </span>
  );
}
