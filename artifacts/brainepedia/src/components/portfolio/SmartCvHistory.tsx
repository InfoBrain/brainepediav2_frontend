import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServerPagination } from "@/components/shared/ServerPagination";
import { openSmartCvInNewTab } from "@/lib/smartCv";
import { formatNigeriaDateParts, getSmartDocument, listSmartDocuments, type SmartDocument } from "@/lib/smartDocuments";

const PAGE_SIZE = 10;

type RowAction = "open" | "download";

export function SmartCvHistory({
  userId,
  refreshKey = 0,
  heading = "Previously generated CVs",
}: {
  userId: string;
  refreshKey?: number;
  heading?: string;
}) {
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<{ id: string; action: RowAction } | null>(null);
  const [preview, setPreview] = useState<SmartDocument | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await listSmartDocuments(userId, {
        documentType: "CV",
        includeContent: false,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        if (res.status === 403) {
          setDocuments([]);
          setTotalCount(0);
          setError("");
          return;
        }
        setError(res.error || "Unable to load Smart CV history.");
        setDocuments([]);
        return;
      }
      setDocuments(res.data.documents);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    })();
    return () => { cancelled = true; };
  }, [page, refreshKey, reloadTick, userId]);

  const loadContent = async (document: SmartDocument, action: RowAction): Promise<string | null> => {
    setBusy({ id: document.smartDocHistoryId, action });
    setError("");
    const res = await getSmartDocument(userId, document.smartDocHistoryId);
    setBusy(null);
    if (!res.ok || !res.data?.rawContent) {
      setError(res.error || "That CV could not be opened.");
      return null;
    }
    return res.data.rawContent;
  };

  const openDocument = async (document: SmartDocument) => {
    const html = await loadContent(document, "open");
    if (!html) return;
    const opened = openSmartCvInNewTab(html);
    if (!opened) setPreview({ ...document, rawContent: html });
  };

  const downloadDocument = async (document: SmartDocument) => {
    const html = await loadContent(document, "download");
    if (!html) return;
    const { date } = formatNigeriaDateParts(document.dateCreated);
    const slug = date ? date.replace(/[^a-z0-9]+/gi, "-").toLowerCase() : document.smartDocHistoryId.slice(0, 8);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `brainepedia-smart-cv-${slug}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isBusy = (document: SmartDocument, action: RowAction) =>
    busy?.id === document.smartDocHistoryId && busy.action === action;
  const rowDisabled = (document: SmartDocument) => busy?.id === document.smartDocHistoryId;

  const firstIndex = (page - 1) * PAGE_SIZE;
  const rangeLabel = totalCount > 0
    ? `Showing ${firstIndex + 1}–${Math.min(firstIndex + documents.length, totalCount)} of ${totalCount}`
    : "";

  return (
    <section className="min-w-0 rounded-2xl border border-white/5 bg-[#0d1119] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#00D2FF]/10 text-[#00D2FF]">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Smart CV history</p>
            <h3 className="text-lg font-bold">{heading}</h3>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? `${totalCount} document${totalCount === 1 ? "" : "s"} · times shown in West Africa Time (WAT)` : "Times are shown in West Africa Time (WAT)."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setReloadTick((tick) => tick + 1)}
          disabled={loading}
          aria-label="Refresh CV history"
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold">No generated CVs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Generate a Smart CV from your portfolio and it will be listed here.</p>
        </div>
      ) : (
        <>
          {/* Table — tablet and up */}
          <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <caption className="sr-only">Previously generated Smart CVs</caption>
              <thead className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-left font-semibold">#</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Document</th>
                  <th scope="col" className="w-36 px-4 py-3 text-left font-semibold">Generated on</th>
                  <th scope="col" className="w-32 px-4 py-3 text-left font-semibold">Time</th>
                  <th scope="col" className="w-24 px-4 py-3 text-right font-semibold">Fee</th>
                  <th scope="col" className="w-60 px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((document, index) => {
                  const { date, time } = formatNigeriaDateParts(document.dateCreated);
                  return (
                    <tr key={document.smartDocHistoryId} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{firstIndex + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#00D2FF]/10 text-[#00D2FF]">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">Smart {document.documentType || "CV"}</p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground" title={document.smartDocHistoryId}>
                              ID {document.smartDocHistoryId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{date || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{time ? `${time} WAT` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {document.chargedFee > 0 ? (
                          <span className="font-semibold">{document.chargedFee.toLocaleString()}</span>
                        ) : (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" size="sm" variant="outline" disabled={rowDisabled(document)} onClick={() => void downloadDocument(document)}>
                            {isBusy(document, "download") ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                            Download
                          </Button>
                          <Button type="button" size="sm" className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]" disabled={rowDisabled(document)} onClick={() => void openDocument(document)}>
                            {isBusy(document, "open") ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="mr-1.5 h-3.5 w-3.5" />}
                            Open
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — phones */}
          <ul className="space-y-3 md:hidden">
            {documents.map((document, index) => {
              const { date, time } = formatNigeriaDateParts(document.dateCreated);
              return (
                <li key={document.smartDocHistoryId} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#00D2FF]/10 text-[#00D2FF]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">Smart {document.documentType || "CV"}</p>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">#{firstIndex + index + 1}</span>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <dt className="text-muted-foreground">Generated on</dt>
                        <dd className="text-right font-medium">{date || "—"}</dd>
                        <dt className="text-muted-foreground">Time</dt>
                        <dd className="text-right font-medium">{time ? `${time} WAT` : "—"}</dd>
                        <dt className="text-muted-foreground">Fee</dt>
                        <dd className="text-right font-medium">{document.chargedFee > 0 ? document.chargedFee.toLocaleString() : "Free"}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={rowDisabled(document)} onClick={() => void downloadDocument(document)}>
                      {isBusy(document, "download") ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                      Download
                    </Button>
                    <Button type="button" size="sm" className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]" disabled={rowDisabled(document)} onClick={() => void openDocument(document)}>
                      {isBusy(document, "open") ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="mr-1.5 h-3.5 w-3.5" />}
                      Open
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
            <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} className="mx-0 w-auto justify-end" />
          </div>
        </>
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Smart CV</DialogTitle>
            <DialogDescription>Your browser blocked a new tab, so the document is shown here.</DialogDescription>
          </DialogHeader>
          {preview?.rawContent && (
            <iframe title="Smart CV preview" sandbox="" srcDoc={preview.rawContent} className="h-[70vh] w-full rounded-xl bg-white" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
