import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServerPagination } from "@/components/shared/ServerPagination";
import { openSmartCvInNewTab } from "@/lib/smartCv";
import { formatNigeriaTimestamp, getSmartDocument, listSmartDocuments, type SmartDocument } from "@/lib/smartDocuments";

export function SmartCvHistory({ userId, refreshKey = 0 }: { userId: string; refreshKey?: number }) {
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState("");
  const [preview, setPreview] = useState<SmartDocument | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await listSmartDocuments(userId, {
        documentType: "CV",
        includeContent: false,
        pageNumber: page,
        pageSize: 10,
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        if (res.status === 403) {
          setDocuments([]);
          setError("");
          return;
        }
        setError(res.error || "Unable to load Smart CV history.");
        setDocuments([]);
        return;
      }
      setDocuments(res.data.documents);
      setTotalPages(res.data.totalPages);
    })();
    return () => { cancelled = true; };
  }, [page, refreshKey, userId]);

  const openDocument = async (document: SmartDocument) => {
    setOpeningId(document.smartDocHistoryId);
    const res = await getSmartDocument(userId, document.smartDocHistoryId);
    setOpeningId("");
    if (!res.ok || !res.data?.rawContent) {
      setError(res.error || "That CV could not be opened.");
      return;
    }
    const opened = openSmartCvInNewTab(res.data.rawContent);
    if (!opened) setPreview(res.data);
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Smart CV history</p>
          <h3 className="text-lg font-bold">Previously generated CVs</h3>
        </div>
        <FileText className="h-5 w-5 text-[#00D2FF]" />
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading documents…</div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Generated CVs appear here after you create one.</p>
      ) : (
        <div className="divide-y divide-white/5">
          {documents.map((document) => (
            <div key={document.smartDocHistoryId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold">{document.documentType || "CV"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNigeriaTimestamp(document.dateCreated)} WAT
                  {document.chargedFee ? ` · Fee ${document.chargedFee}` : ""}
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" disabled={openingId === document.smartDocHistoryId} onClick={() => void openDocument(document)}>
                {openingId === document.smartDocHistoryId && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Open
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3">
        <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
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
