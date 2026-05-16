import type { ViewType } from "../types";
import {
  LayoutDashboard, CalendarDays, Calendar, Sparkles,
  Download, FileSpreadsheet, FileText, Printer,
  ChevronRight, Zap,
} from "lucide-react";

interface Props {
  view: ViewType;
  onView: (v: ViewType) => void;
  onExcelExport: () => void;
  onCsvExport: () => void;
  onPrint: () => void;
  totalEntries: number;
}

const NAV = [
  { id: "dashboard" as ViewType, label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar"  as ViewType, label: "Content Calendar", icon: CalendarDays },
  { id: "monthly"   as ViewType, label: "Monthly View", icon: Calendar },
  { id: "ai"        as ViewType, label: "AI Assistant", icon: Sparkles },
];

export default function Sidebar({ view, onView, onExcelExport, onCsvExport, onPrint, totalEntries }: Props) {
  return (
    <aside style={{
      width: 240, minHeight: "100vh", background: "#0D1117",
      borderRight: "1px solid rgba(59,130,246,0.12)",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #1E40AF, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(59,130,246,0.4)",
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.3px" }}>Brainepedia</p>
            <p style={{ margin: 0, fontSize: 10, color: "#3B82F6", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Content Calendar</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        <p style={{ margin: "0 0 6px 10px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Navigation</p>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => onView(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                background: active ? "rgba(59,130,246,0.15)" : "transparent",
                border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                color: active ? "#60A5FA" : "#94A3B8",
                cursor: "pointer", fontSize: 13.5, fontWeight: active ? 600 : 400,
                textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={14} />}
            </button>
          );
        })}

        {/* Export section */}
        <div style={{ marginTop: 24 }}>
          <p style={{ margin: "0 0 6px 10px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Export</p>

          <button
            onClick={onExcelExport}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, marginBottom: 2,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
              color: "#34D399", cursor: "pointer", fontSize: 13, fontWeight: 500,
              textAlign: "left",
            }}
          >
            <FileSpreadsheet size={15} />
            Download Excel
          </button>

          <button
            onClick={onCsvExport}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, marginBottom: 2,
              background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
              color: "#93C5FD", cursor: "pointer", fontSize: 13, fontWeight: 500,
              textAlign: "left",
            }}
          >
            <FileText size={15} />
            Download CSV
          </button>

          <button
            onClick={onPrint}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8,
              background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)",
              color: "#94A3B8", cursor: "pointer", fontSize: 13, fontWeight: 500,
              textAlign: "left",
            }}
          >
            <Printer size={15} />
            Print View
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(59,130,246,0.1)" }}>
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#64748B" }}>Total Posts</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA" }}>{totalEntries}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} className="pulse-dot" />
            <span style={{ fontSize: 10, color: "#10B981" }}>Calendar active</span>
          </div>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 10, color: "#334155", textAlign: "center" }}>Brainepedia v2 · Marketing Suite</p>
      </div>
    </aside>
  );
}
