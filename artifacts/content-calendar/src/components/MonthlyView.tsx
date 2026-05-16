import { useState } from "react";
import type { ContentEntry } from "../types";
import { STATUS_COLORS, PLATFORM_COLORS } from "../types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Props {
  entries: ContentEntry[];
  onEdit: (e: ContentEntry) => void;
  onAdd: () => void;
}

export default function MonthlyView({ entries, onEdit, onAdd }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function pad(d: number) { return d < 10 ? `0${d}` : `${d}`; }
  function dateStr(d: number) { return `${year}-${pad(month + 1)}-${pad(d)}`; }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const entriesByDate: Record<string, ContentEntry[]> = {};
  for (const e of entries) {
    const k = e.date?.slice(0, 10);
    if (!k) continue;
    if (!entriesByDate[k]) entriesByDate[k] = [];
    entriesByDate[k].push(e);
  }

  const selectedEntries = selected ? (entriesByDate[selected] || []) : [];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <div className="animate-fade-in" style={{ padding: "28px 32px 40px", display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 600px", minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>Monthly View</h1>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>
              {entries.filter(e => e.date?.startsWith(`${year}-${pad(month + 1)}`)).length} posts planned in {MONTH_NAMES[month]}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={prevMonth} style={{ background: "#111827", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, color: "#94A3B8", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", minWidth: 140, textAlign: "center" }}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} style={{ background: "#111827", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, color: "#94A3B8", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center" }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={onAdd}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "linear-gradient(135deg,#1E40AF,#3B82F6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={14} />
            Add Post
          </button>
        </div>

        {/* Day names */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} style={{ minHeight: 90, background: "rgba(255,255,255,0.01)", borderRadius: 8 }} />;
            }
            const ds = dateStr(day);
            const dayEntries = entriesByDate[ds] || [];
            const isToday   = ds === todayStr;
            const isSelected = ds === selected;

            return (
              <div
                key={ds}
                onClick={() => setSelected(isSelected ? null : ds)}
                style={{
                  minHeight: 90, borderRadius: 8, padding: "8px 6px",
                  background: isSelected ? "rgba(59,130,246,0.12)" : isToday ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                  border: isSelected ? "1px solid rgba(59,130,246,0.4)" : isToday ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)"; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isToday ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{
                    fontSize: 13, fontWeight: isToday ? 800 : 500,
                    color: isToday ? "#3B82F6" : "#94A3B8",
                    width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: isToday ? "50%" : 0,
                    background: isToday ? "rgba(59,130,246,0.15)" : "transparent",
                  }}>
                    {day}
                  </span>
                  {dayEntries.length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#60A5FA", background: "rgba(59,130,246,0.15)", padding: "1px 5px", borderRadius: 10 }}>
                      {dayEntries.length}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEntries.slice(0, 3).map(e => {
                    const sc = STATUS_COLORS[e.status as keyof typeof STATUS_COLORS];
                    return (
                      <div
                        key={e.id}
                        onClick={ev => { ev.stopPropagation(); onEdit(e); }}
                        style={{
                          fontSize: 10, padding: "2px 5px", borderRadius: 4,
                          background: sc ? sc.bg : "rgba(59,130,246,0.1)",
                          color: sc ? sc.text : "#60A5FA",
                          border: `1px solid ${sc ? sc.border : "rgba(59,130,246,0.2)"}`,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                        title={e.topicHook}
                      >
                        <span style={{ marginRight: 3, display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: PLATFORM_COLORS[e.platform] || "#3B82F6", verticalAlign: "middle" }} />
                        {e.topicHook?.slice(0, 22)}{e.topicHook?.length > 22 ? "…" : ""}
                      </div>
                    );
                  })}
                  {dayEntries.length > 3 && (
                    <span style={{ fontSize: 9, color: "#475569", paddingLeft: 4 }}>+{dayEntries.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel — selected day detail */}
      {selected && (
        <div className="animate-fade-in" style={{ width: 300, flexShrink: 0 }}>
          <div style={{ background: "#0D1117", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 14, padding: 20, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{selected}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>{selectedEntries.length} post{selectedEntries.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={onAdd}
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, color: "#60A5FA", cursor: "pointer", padding: "5px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {selectedEntries.length === 0 ? (
              <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>No posts scheduled for this day.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedEntries.map(e => {
                  const sc = STATUS_COLORS[e.status as keyof typeof STATUS_COLORS];
                  return (
                    <div
                      key={e.id}
                      onClick={() => onEdit(e)}
                      style={{ background: "#111827", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s" }}
                      onMouseEnter={e2 => (e2.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)"}
                      onMouseLeave={e2 => (e2.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.1)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", flex: 1, paddingRight: 8, lineHeight: 1.3 }}>
                          {e.topicHook?.slice(0, 60)}{e.topicHook?.length > 60 ? "…" : ""}
                        </span>
                        {sc && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, flexShrink: 0, whiteSpace: "nowrap" }}>
                            {e.status}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: PLATFORM_COLORS[e.platform] || "#3B82F6", display: "inline-block" }} />
                          {e.platform}
                        </span>
                        <span style={{ fontSize: 10, color: "#64748B" }}>{e.contentType}</span>
                        {e.publishingTime && <span style={{ fontSize: 10, color: "#64748B" }}>🕐 {e.publishingTime}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
