import type { ContentEntry } from "../types";

const HEADERS = [
  "Date", "Day", "Campaign Name", "Content Pillar", "Platform", "Content Type",
  "Topic / Hook", "Caption", "CTA", "Hashtags", "Media Type",
  "Designer Assigned", "Status", "Publishing Time", "Link", "Notes", "Priority",
];

function entryToRow(e: ContentEntry): string[] {
  return [
    e.date, e.day, e.campaignName, e.contentPillar, e.platform, e.contentType,
    e.topicHook, e.caption, e.cta, e.hashtags, e.mediaType,
    e.designerAssigned, e.status, e.publishingTime, e.link, e.notes, e.priority,
  ];
}

export async function exportToExcel(entries: ContentEntry[], filename = "brainepedia-content-calendar.xlsx") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...entries.map(entryToRow)]);

  /* Column widths */
  ws["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 16 },
    { wch: 50 }, { wch: 80 }, { wch: 30 }, { wch: 60 }, { wch: 14 },
    { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 40 }, { wch: 50 }, { wch: 10 },
  ];

  /* Freeze top row */
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  /* Auto filter */
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }) };

  /* Header style */
  for (let c = 0; c <= HEADERS.length - 1; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "center", wrapText: true },
      };
    }
  }

  /* Alternate row shading */
  for (let r = 1; r <= entries.length; r++) {
    for (let c = 0; c < HEADERS.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          ...(ws[cellRef].s || {}),
          fill: { fgColor: { rgb: r % 2 === 0 ? "F0F4FF" : "FFFFFF" } },
          alignment: { wrapText: true, vertical: "top" },
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Content Calendar");

  /* Summary sheet */
  const statusCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};
  const pillarCounts: Record<string, number> = {};
  for (const e of entries) {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    platformCounts[e.platform] = (platformCounts[e.platform] || 0) + 1;
    pillarCounts[e.contentPillar] = (pillarCounts[e.contentPillar] || 0) + 1;
  }

  const summaryData = [
    ["BRAINEPEDIA v2 — CONTENT CALENDAR SUMMARY"],
    [],
    ["Total Posts", entries.length],
    [],
    ["BY STATUS"],
    ...Object.entries(statusCounts).map(([k, v]) => [k, v]),
    [],
    ["BY PLATFORM"],
    ...Object.entries(platformCounts).map(([k, v]) => [k, v]),
    [],
    ["BY CONTENT PILLAR"],
    ...Object.entries(pillarCounts).map(([k, v]) => [k, v]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  ws2["!cols"] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  XLSX.writeFile(wb, filename);
}

export function exportToCSV(entries: ContentEntry[], filename = "brainepedia-content-calendar.csv") {
  const rows = [HEADERS, ...entries.map(entryToRow)];
  const csv = rows.map(r => r.map(cell => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printCalendar() {
  window.print();
}
