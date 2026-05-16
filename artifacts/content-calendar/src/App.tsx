import { useState, useCallback } from "react";
import type { ContentEntry, ViewType, Toast } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { sampleData } from "./data/sampleData";
import { exportToExcel, exportToCSV, printCalendar } from "./utils/export";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CalendarTable from "./components/CalendarTable";
import MonthlyView from "./components/MonthlyView";
import AIAssistant from "./components/AIAssistant";
import EditRowModal from "./components/EditRowModal";
import Toaster from "./components/Toaster";
import { Sparkles, Calendar, X } from "lucide-react";
import { CONTENT_PILLARS, PLATFORMS, CONTENT_TYPES } from "./types";

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function makeId() { return Math.random().toString(36).slice(2, 10); }
function pad(d: number) { return d < 10 ? `0${d}` : `${d}`; }

/* ── Generate month helper ─────────────────────────────────────────── */
function generateMonthEntries(year: number, month: number, frequency: number, goals: string[]): ContentEntry[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const entries: ContentEntry[] = [];
  const platforms = [...PLATFORMS];
  const pillars   = goals.length > 0 ? goals : [...CONTENT_PILLARS];
  const types     = [...CONTENT_TYPES];
  let posted = 0;

  for (let d = 1; d <= daysInMonth && posted < frequency * 5; d++) {
    const postCount = Math.random() < 0.3 ? 2 : 1;
    for (let p = 0; p < postCount && posted < frequency * 5; p++) {
      const date = `${year}-${pad(month + 1)}-${pad(d)}`;
      const pillar   = pillars[posted % pillars.length];
      const platform = platforms[posted % platforms.length];
      const ctype    = types[posted % types.length];
      entries.push({
        id:              makeId(),
        date,
        day:             days[new Date(date).getDay()],
        campaignName:    "Generated Campaign",
        contentPillar:   pillar as any,
        platform:        platform,
        contentType:     ctype,
        topicHook:       `[${pillar}] — Content post for ${platform}`,
        caption:         `[AI-generated caption for ${pillar} on ${platform}. Edit this to customise.]`,
        cta:             "Learn More",
        hashtags:        `#Brainepedia #${pillar.replace(/\s/g, "")} #EdTech`,
        mediaType:       "Graphic",
        designerAssigned:"",
        status:          "Draft",
        publishingTime:  "09:00",
        link:            "https://demo.brainepedia.com",
        notes:           "Auto-generated — please review and customise before publishing.",
        priority:        "Medium",
      });
      posted++;
    }
  }

  return entries;
}

/* ── Generate modal ────────────────────────────────────────────────── */
function GenerateModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (year: number, month: number, freq: number, goals: string[]) => void }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [freq,  setFreq]  = useState(20);
  const [goals, setGoals] = useState<string[]>(["Beta Launch", "Career Transformation"]);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  const inputSt: React.CSSProperties = {
    background: "#0D1117", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8,
    color: "#F1F5F9", padding: "8px 12px", fontSize: 13, outline: "none", width: "100%",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-fade-in" style={{
        background: "#0D1117", border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 16, width: "100%", maxWidth: 540,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} color="#A78BFA" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>Generate Monthly Calendar</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Month</label>
              <select style={{ ...inputSt, cursor: "pointer" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Year</label>
              <input type="number" style={inputSt} value={year} onChange={e => setYear(Number(e.target.value))} min={2024} max={2030} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Posts / Week</label>
              <select style={{ ...inputSt, cursor: "pointer" }} value={freq} onChange={e => setFreq(Number(e.target.value))}>
                {[7, 14, 21, 28, 35].map(f => <option key={f} value={f}>{f / 7}× per day (~{f} posts)</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Campaign Goals (select pillars to focus on)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {CONTENT_PILLARS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                    background: goals.includes(g) ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${goals.includes(g) ? "rgba(139,92,246,0.5)" : "rgba(59,130,246,0.1)"}`,
                    color: goals.includes(g) ? "#C4B5FD" : "#64748B",
                    transition: "all 0.12s",
                  }}
                >
                  {goals.includes(g) ? "✓ " : ""}{g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#C4B5FD" }}>
              Will generate approximately <strong>{freq}</strong> draft posts for <strong>{MONTHS[month]} {year}</strong>
              {goals.length > 0 ? ` focused on: ${goals.join(", ")}` : " across all content pillars"}.
              All entries will be added as <strong>Draft</strong> status — review and edit before scheduling.
            </p>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(59,130,246,0.1)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, color: "#64748B", cursor: "pointer", fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={() => onGenerate(year, month, freq, goals)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 20px", background: "linear-gradient(135deg,#4C1D95,#7C3AED)", border: "none", borderRadius: 7, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            <Calendar size={14} />
            Generate Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [entries, setEntries] = useLocalStorage<ContentEntry[]>("brainepedia-calendar-v2", sampleData);
  const [view, setView]       = useState<ViewType>("dashboard");
  const [toasts, setToasts]   = useState<Toast[]>([]);
  const [editTarget, setEditTarget] = useState<Partial<ContentEntry> | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);

  function toast(message: string, type: Toast["type"] = "success") {
    const id = makeId();
    setToasts(prev => [...prev, { id, message, type }]);
  }

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  function handleSave(entry: ContentEntry) {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
    setEditTarget(null);
    toast(entries.find(e => e.id === entry.id) ? "Entry updated" : "Entry added");
  }

  function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
    setEditTarget(null);
    toast("Entry deleted", "info");
  }

  function handleDuplicate(entry: ContentEntry) {
    const dupe: ContentEntry = { ...entry, id: makeId(), status: "Draft" };
    setEntries(prev => [...prev, dupe]);
    toast("Entry duplicated");
  }

  function handleReorder(reordered: ContentEntry[]) {
    setEntries(reordered);
  }

  function handleAddNew() {
    setEditTarget({});
  }

  function handleAIAdd(topicHook: string, caption: string, cta: string, hashtags: string, platform: string, contentType: string, contentPillar: string) {
    const today = new Date();
    const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    setEditTarget({
      topicHook, caption, cta, hashtags,
      platform: platform as any,
      contentType: contentType as any,
      contentPillar: contentPillar as any,
      date,
      status: "Draft",
      publishingTime: "09:00",
      priority: "Medium",
    });
    setView("calendar");
    toast("Content pre-filled from AI — review and save!", "info");
  }

  function handleGenerateMonth(year: number, month: number, freq: number, goals: string[]) {
    const generated = generateMonthEntries(year, month, freq, goals);
    setEntries(prev => [...prev, ...generated]);
    setShowGenModal(false);
    toast(`Generated ${generated.length} posts for ${new Date(year, month).toLocaleString("default", { month: "long" })} ${year}`);
  }

  function handleExcelExport() {
    exportToExcel(entries).catch(() => toast("Export failed", "error"));
    toast("Exporting Excel file…", "info");
  }

  function handleCsvExport() {
    exportToCSV(entries);
    toast("CSV downloaded");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080C14" }}>
      <Sidebar
        view={view}
        onView={setView}
        onExcelExport={handleExcelExport}
        onCsvExport={handleCsvExport}
        onPrint={printCalendar}
        totalEntries={entries.length}
      />

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", overflow: "auto" }}>
        {view === "dashboard" && (
          <Dashboard
            entries={entries}
            onNewEntry={handleAddNew}
            onViewCalendar={() => setView("calendar")}
          />
        )}
        {view === "calendar" && (
          <CalendarTable
            entries={entries}
            onEdit={e => setEditTarget(e)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onAdd={handleAddNew}
            onReorder={handleReorder}
            onGenerateMonth={() => setShowGenModal(true)}
          />
        )}
        {view === "monthly" && (
          <MonthlyView
            entries={entries}
            onEdit={e => setEditTarget(e)}
            onAdd={handleAddNew}
          />
        )}
        {view === "ai" && (
          <AIAssistant onAddToCalendar={handleAIAdd} />
        )}
      </main>

      {/* Modals */}
      {editTarget !== null && (
        <EditRowModal
          entry={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          onDelete={handleDelete}
        />
      )}

      {showGenModal && (
        <GenerateModal
          onClose={() => setShowGenModal(false)}
          onGenerate={handleGenerateMonth}
        />
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
