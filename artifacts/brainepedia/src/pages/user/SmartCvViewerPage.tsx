import { useCallback, useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { Download, FileCode, Loader2 } from "lucide-react";
import { SMART_CV_STORAGE_KEY } from "@/lib/smartCv";
import { Button } from "@/components/ui/button";

export default function SmartCvViewerPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const autoDownloadedRef = useRef(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparing your downloadable PDF...");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    document.title = "Brainepedia Smart CV";
    const stored = sessionStorage.getItem(SMART_CV_STORAGE_KEY);
    if (!stored) {
      setError("No CV content found. Please generate your Smart CV from the Portfolio page.");
      return;
    }
    setHtml(stored);
    sessionStorage.removeItem(SMART_CV_STORAGE_KEY);
  }, []);

  const downloadPdf = useCallback(async () => {
    if (!contentRef.current || pdfLoading) return;
    setPdfLoading(true);
    setStatus("Generating PDF...");
    try {
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: "brainepedia-smart-cv.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(contentRef.current)
        .save();
      setStatus("PDF downloaded successfully.");
    } catch {
      setStatus("PDF generation failed. Try again or download the HTML.");
    } finally {
      setPdfLoading(false);
    }
  }, [pdfLoading]);

  const downloadHtml = useCallback(() => {
    if (!html) return;
    const blob = new Blob(
      [`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>Brainepedia Smart CV</title></head><body>${html}</body></html>`],
      { type: "text/html;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "brainepedia-smart-cv.html";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("HTML downloaded successfully.");
  }, [html]);

  useEffect(() => {
    if (!html || autoDownloadedRef.current) return;
    autoDownloadedRef.current = true;
    const timer = window.setTimeout(() => {
      void downloadPdf();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [html, downloadPdf]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E14] px-4 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#0d1119] p-8 text-center shadow-2xl shadow-black/40">
          <p className="text-lg font-semibold text-amber-400">Smart CV unavailable</p>
          <p className="mt-3 text-sm text-white/65">{error}</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E14] text-white/70">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#00D2FF]" />
        Loading your Smart CV...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E14] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1119]/95 px-4 py-4 shadow-lg shadow-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-400">Brainepedia Smart CV</p>
            <p className="mt-1 text-xs text-white/55">{status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void downloadPdf()}
              disabled={pdfLoading}
              className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]"
            >
              {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
            <Button variant="outline" onClick={downloadHtml} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <FileCode className="mr-2 h-4 w-4" />
              Download HTML
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40">
          <div ref={contentRef} className="smart-cv-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </main>
    </div>
  );
}
