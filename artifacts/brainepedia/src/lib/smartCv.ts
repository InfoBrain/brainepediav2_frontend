import { api, type ApiResult } from "@/lib/api";

export const SMART_CV_STORAGE_KEY = "brainepedia.smartCv.html";

export const DEFAULT_SMART_CV_INSTRUCTIONS =
  "Generate a professional, employer-friendly CV from my Brainepedia profile, mission history, and portfolio.";

export function extractCleanHtmlResult(data: unknown): string {
  const record = data as Record<string, unknown> | null | undefined;
  if (typeof record?.cleanHtmlResult === "string") return record.cleanHtmlResult;
  if (typeof record?.CleanHtmlResult === "string") return record.CleanHtmlResult;
  if (typeof record?.html === "string") return record.html;
  if (typeof data === "string") return data;
  return "";
}

export async function generateSmartCv(
  userId: string,
  instructions?: string,
): Promise<ApiResult<string>> {
  const res = await api.professions.generateSmartCv({
    userId,
    instructions: instructions?.trim() || DEFAULT_SMART_CV_INSTRUCTIONS,
  });

  if (!res.ok) {
    return { ok: false, error: res.error, message: res.message, status: res.status };
  }

  const html = extractCleanHtmlResult(res.data);
  if (!html.trim()) {
    return { ok: false, error: "The server returned an empty CV document." };
  }

  return { ok: true, data: html };
}

export function openSmartCvInNewTab(html: string): Window | null {
  try {
    sessionStorage.setItem(SMART_CV_STORAGE_KEY, html);
  } catch {
    return openSmartCvWithInlineDocument(html);
  }

  const previewUrl = `${window.location.origin}/user/smart-cv/preview`;
  const previewWindow = window.open(previewUrl, "_blank");

  if (!previewWindow) {
    sessionStorage.removeItem(SMART_CV_STORAGE_KEY);
    return null;
  }

  return previewWindow;
}

function openSmartCvWithInlineDocument(html: string): Window | null {
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) return null;

  previewWindow.document.open();
  previewWindow.document.write(buildInlineSmartCvDocument(html));
  previewWindow.document.close();
  return previewWindow;
}

function buildInlineSmartCvDocument(html: string): string {
  const escapedHtml = html.replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Brainepedia Smart CV</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0A0E14; color: #f8fafc; }
    .toolbar { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(13,17,25,0.95); backdrop-filter: blur(12px); }
    .toolbar h1 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #FFD700; }
    .toolbar p { margin: 0.25rem 0 0; font-size: 0.75rem; color: rgba(255,255,255,0.55); }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    button { border: 0; border-radius: 0.75rem; padding: 0.6rem 1rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease; }
    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.6; cursor: wait; }
    .primary { background: #00D2FF; color: #000; }
    .secondary { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.12); }
    .status { font-size: 0.75rem; color: rgba(255,255,255,0.65); }
    .content-wrap { padding: 1.5rem; }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <h1>Brainepedia Smart CV</h1>
      <p id="status">Preparing your downloadable PDF...</p>
    </div>
    <div class="actions">
      <button id="download-pdf" class="primary" disabled>Download PDF</button>
      <button id="download-html" class="secondary">Download HTML</button>
    </div>
  </div>
  <div class="content-wrap">
    <div id="cv-content">${escapedHtml}</div>
  </div>
  <script>
    (function () {
      var statusEl = document.getElementById("status");
      var pdfBtn = document.getElementById("download-pdf");
      var htmlBtn = document.getElementById("download-html");
      var content = document.getElementById("cv-content");
      var generating = false;

      function setStatus(message) {
        if (statusEl) statusEl.textContent = message;
      }

      function downloadHtml() {
        var blob = new Blob([document.documentElement.outerHTML], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "brainepedia-smart-cv.html";
        link.click();
        URL.revokeObjectURL(url);
      }

      function downloadPdf() {
        if (!window.html2pdf || !content || generating) return;
        generating = true;
        if (pdfBtn) pdfBtn.disabled = true;
        setStatus("Generating PDF...");

        window.html2pdf()
          .set({
            margin: [8, 8, 8, 8],
            filename: "brainepedia-smart-cv.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(content)
          .save()
          .then(function () {
            setStatus("PDF downloaded successfully.");
          })
          .catch(function () {
            setStatus("PDF generation failed. Try again or download the HTML.");
          })
          .finally(function () {
            generating = false;
            if (pdfBtn) pdfBtn.disabled = false;
          });
      }

      if (htmlBtn) htmlBtn.addEventListener("click", downloadHtml);
      if (pdfBtn) pdfBtn.addEventListener("click", downloadPdf);

      window.addEventListener("load", function () {
        if (pdfBtn) pdfBtn.disabled = false;
        setTimeout(downloadPdf, 600);
      });
    })();
  <\/script>
</body>
</html>`;
}

export async function generateAndOpenSmartCv(
  userId: string,
  instructions?: string,
): Promise<ApiResult<Window | null>> {
  const result = await generateSmartCv(userId, instructions);
  if (!result.ok || !result.data) {
    return { ok: false, error: result.error, message: result.message, status: result.status };
  }

  const previewWindow = openSmartCvInNewTab(result.data);
  if (!previewWindow) {
    return {
      ok: false,
      error: "Your browser blocked the CV preview tab. Please allow pop-ups for Brainepedia and try again.",
    };
  }

  return { ok: true, data: previewWindow };
}
