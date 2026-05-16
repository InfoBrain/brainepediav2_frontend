import { useState, useRef } from "react";
import type { ContentEntry } from "../types";
import { STATUS_COLORS, PLATFORM_COLORS, STATUSES, PLATFORMS, CONTENT_PILLARS } from "../types";
import { Plus, Search, Edit2, Copy, Trash2, Filter, X, GripVertical, ChevronDown } from "lucide-react";

interface Props {
  entries: ContentEntry[];
  onEdit: (e: ContentEntry) => void;
  onDelete: (id: string) => void;
  onDuplicate: (e: ContentEntry) => void;
  onAdd: () => void;
  onReorder: (entries: ContentEntry[]) => void;
  onGenerateMonth: () => void;
}

const COLS = [
  { key: "date",             label: "Date",        w: 110 },
  { key: "day",              label: "Day",         w: 88  },
  { key: "campaignName",     label: "Campaign",    w: 180 },
  { key: "contentPillar",    label: "Pillar",      w: 160 },
  { key: "platform",         label: "Platform",    w: 140 },
  { key: "contentType",      label: "Type",        w: 120 },
  { key: "topicHook",        label: "Topic / Hook",w: 240 },
  { key: "caption",          label: "Caption",     w: 260 },
  { key: "cta",              label: "CTA",         w: 150 },
  { key: "hashtags",         label: "Hashtags",    w: 180 },
  { key: "mediaType",        label: "Media",       w: 100 },
  { key: "designerAssigned", label: "Designer",    w: 120 },
  { key: "status",           label: "Status",      w: 120 },
  { key: "publishingTime",   label: "Time",        w: 85  },
  { key: "priority",         label: "Priority",    w: 90  },
  { key: "link",             label: "Link",        w: 150 },
  { key: "notes",            label: "Notes",       w: 200 },
];

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  Low:    { bg: "rgba(100,116,139,0.15)", text: "#94A3B8" },
  Medium: { bg: "rgba(59,130,246,0.15)",  text: "#60A5FA" },
  High:   { bg: "rgba(245,158,11,0.15)",  text: "#FCD34D" },
  Urgent: { bg: "rgba(239,68,68,0.15)",   text: "#F87171" },
};

export default function CalendarTable({ entries, onEdit, onDelete, onDuplicate, onAdd, onReorder, onGenerateMonth }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterPillar, setFilterPillar] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(["hashtags", "notes", "link"]));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const dragNode = useRef<number | null>(null);

  const visibleCols = COLS.filter(c => !hiddenCols.has(c.key));

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [e.topicHook, e.caption, e.campaignName, e.platform, e.contentType, e.contentPillar]
      .some(v => (v || "").toLowerCase().includes(q));
    const matchesStatus   = filterStatus   === "All" || e.status   === filterStatus;
    const matchesPlatform = filterPlatform === "All" || e.platform === filterPlatform;
    const matchesPillar   = filterPillar   === "All" || e.contentPillar === filterPillar;
    return matchesSearch && matchesStatus && matchesPlatform && matchesPillar;
  });

  function toggleCol(key: string) {
    setHiddenCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  /* Drag-and-drop handlers */
  function handleDragStart(i: number) {
    dragNode.current = i;
    setDragIdx(i);
  }
  function handleDragEnter(i: number) { setDropIdx(i); }
  function handleDragEnd() {
    if (dragNode.current !== null && dropIdx !== null && dragNode.current !== dropIdx) {
      const next = [...entries];
      const [moved] = next.splice(dragNode.current, 1);
      next.splice(dropIdx, 0, moved);
      onReorder(next);
    }
    setDragIdx(null);
    setDropIdx(null);
    dragNode.current = null;
  }

  const totalW = visibleCols.reduce((s, c) => s + c.w, 0) + 52 + 88;

  const selectSt: React.CSSProperties = {
    background: "#111827", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7,
    color: "#CBD5E1", padding: "6px 10px", fontSize: 12, cursor: "pointer", outline: "none",
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 28px 0" }}>
      {/* Toolbar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>Content Calendar</h1>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>
              {filtered.length} of {entries.length} entries
              {(filterStatus !== "All" || filterPlatform !== "All" || filterPillar !== "All" || search) && " (filtered)"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={onGenerateMonth}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              ✨ Generate Month
            </button>
            <button
              onClick={onAdd}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "linear-gradient(135deg,#1E40AF,#3B82F6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Plus size={14} />
              Add Row
            </button>
          </div>
        </div>

        {/* Search + filter bar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
            <input
              placeholder="Search content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", paddingLeft: 30, paddingRight: 30, padding: "7px 30px",
                background: "#111827", border: "1px solid rgba(59,130,246,0.18)",
                borderRadius: 8, color: "#E2E8F0", fontSize: 13, outline: "none",
              }}
            />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 0 }}><X size={13} /></button>}
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: showFilters ? "rgba(59,130,246,0.15)" : "#111827", border: `1px solid ${showFilters ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.18)"}`, borderRadius: 8, color: showFilters ? "#60A5FA" : "#94A3B8", fontSize: 12, cursor: "pointer" }}
          >
            <Filter size={13} />
            Filters
            <ChevronDown size={12} style={{ transform: showFilters ? "rotate(180deg)" : "none", transition: "0.15s" }} />
          </button>

          {(filterStatus !== "All" || filterPlatform !== "All" || filterPillar !== "All") && (
            <button
              onClick={() => { setFilterStatus("All"); setFilterPlatform("All"); setFilterPillar("All"); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#F87171", fontSize: 12, cursor: "pointer" }}
            >
              <X size={12} />
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="animate-fade-in" style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</p>
              <select style={selectSt} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option>All</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Platform</p>
              <select style={selectSt} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
                <option>All</option>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Content Pillar</p>
              <select style={selectSt} value={filterPillar} onChange={e => setFilterPillar(e.target.value)}>
                <option>All</option>
                {CONTENT_PILLARS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Columns</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {COLS.filter(c => !["date","day","platform","status","topicHook"].includes(c.key)).map(c => (
                  <button
                    key={c.key}
                    onClick={() => toggleCol(c.key)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                      background: hiddenCols.has(c.key) ? "rgba(100,116,139,0.1)" : "rgba(59,130,246,0.15)",
                      border: hiddenCols.has(c.key) ? "1px solid rgba(100,116,139,0.2)" : "1px solid rgba(59,130,246,0.3)",
                      color: hiddenCols.has(c.key) ? "#64748B" : "#60A5FA",
                    }}
                  >
                    {hiddenCols.has(c.key) ? "＋" : "✓"} {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table wrapper */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", borderRadius: "12px 12px 0 0", border: "1px solid rgba(59,130,246,0.12)" }}>
        <table style={{ width: Math.max(totalW, 900), borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 44 }} />
            {visibleCols.map(c => <col key={c.key} style={{ width: c.w }} />)}
            <col style={{ width: 88 }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#0D1117", position: "sticky", top: 0, zIndex: 10 }}>
              <th style={{ width: 44, borderBottom: "1px solid rgba(59,130,246,0.15)", padding: "10px 6px" }} />
              {visibleCols.map(c => (
                <th key={c.key} style={{
                  padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600,
                  color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px",
                  borderBottom: "1px solid rgba(59,130,246,0.15)",
                  whiteSpace: "nowrap", overflow: "hidden",
                }}>
                  {c.label}
                </th>
              ))}
              <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const sc = STATUS_COLORS[e.status as keyof typeof STATUS_COLORS];
              const pc = PRIORITY_COLORS[e.priority] || PRIORITY_COLORS.Medium;
              const isDragging = dragIdx === i;
              const isDropTarget = dropIdx === i && dragIdx !== null;

              return (
                <tr
                  key={e.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={ev => ev.preventDefault()}
                  style={{
                    opacity: isDragging ? 0.4 : 1,
                    background: isDropTarget ? "rgba(59,130,246,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    borderBottom: "1px solid rgba(59,130,246,0.06)",
                    cursor: "default",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)"; }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = isDropTarget ? "rgba(59,130,246,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"; }}
                >
                  {/* Drag handle */}
                  <td style={{ padding: "0 6px", textAlign: "center", cursor: "grab" }}>
                    <GripVertical size={14} color="#334155" />
                  </td>

                  {visibleCols.map(c => {
                    const val = (e as any)[c.key];
                    return (
                      <td key={c.key} style={{ padding: "10px 12px", verticalAlign: "top", maxWidth: c.w }}>
                        {c.key === "status" ? (
                          sc ? (
                            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, whiteSpace: "nowrap" }}>
                              {val}
                            </span>
                          ) : <span style={{ color: "#64748B", fontSize: 12 }}>{val}</span>
                        ) : c.key === "platform" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#E2E8F0" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: PLATFORM_COLORS[val] || "#3B82F6", flexShrink: 0, display: "inline-block" }} />
                            {val}
                          </span>
                        ) : c.key === "priority" ? (
                          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: pc.bg, color: pc.text, whiteSpace: "nowrap" }}>
                            {val}
                          </span>
                        ) : c.key === "link" && val ? (
                          <a href={val} target="_blank" rel="noreferrer" style={{ color: "#60A5FA", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>
                            {val}
                          </a>
                        ) : c.key === "topicHook" || c.key === "caption" ? (
                          <span style={{ fontSize: 12, color: "#CBD5E1", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {val}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94A3B8", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {val || <span style={{ color: "#2D3748" }}>—</span>}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td style={{ padding: "8px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={() => onEdit(e)} title="Edit" style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4, borderRadius: 5 }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => onDuplicate(e)} title="Duplicate" style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4, borderRadius: 5 }}>
                        <Copy size={13} />
                      </button>
                      <button onClick={() => onDelete(e.id)} title="Delete" style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4, borderRadius: 5 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty state */}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 2} style={{ padding: "48px 24px", textAlign: "center" }}>
                  <p style={{ color: "#475569", margin: 0 }}>No entries found. {search || filterStatus !== "All" ? "Try adjusting your filters." : "Click \"Add Row\" to get started."}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
          Showing {filtered.length} entries · Drag rows to reorder
        </p>
        <button
          onClick={onAdd}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, color: "#60A5FA", fontSize: 12, cursor: "pointer" }}
        >
          <Plus size={13} />
          Add Row
        </button>
      </div>
    </div>
  );
}
