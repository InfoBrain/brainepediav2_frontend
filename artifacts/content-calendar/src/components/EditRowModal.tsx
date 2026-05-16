import { useState, useEffect } from "react";
import type { ContentEntry } from "../types";
import { PLATFORMS, CONTENT_TYPES, CONTENT_PILLARS, STATUSES, MEDIA_TYPES, PRIORITIES } from "../types";
import { X, Save, Trash2 } from "lucide-react";

interface Props {
  entry: Partial<ContentEntry> | null;
  onSave: (e: ContentEntry) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function makeId() { return Math.random().toString(36).slice(2, 10); }

const EMPTY: Omit<ContentEntry, "id" | "day"> = {
  date: new Date().toISOString().slice(0, 10),
  campaignName: "",
  contentPillar: CONTENT_PILLARS[0],
  platform: PLATFORMS[0],
  contentType: CONTENT_TYPES[0],
  topicHook: "",
  caption: "",
  cta: "",
  hashtags: "",
  mediaType: MEDIA_TYPES[0],
  designerAssigned: "",
  status: "Draft",
  publishingTime: "09:00",
  link: "",
  notes: "",
  priority: "Medium",
};

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0D1117", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7,
  padding: "8px 12px", color: "#F1F5F9", fontSize: 13, outline: "none", width: "100%",
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

export default function EditRowModal({ entry, onSave, onClose, onDelete }: Props) {
  const [form, setForm] = useState<Omit<ContentEntry, "id" | "day">>(EMPTY);
  const isEdit = !!(entry && "id" in entry && entry.id);

  useEffect(() => {
    if (entry) {
      setForm({
        date: entry.date || EMPTY.date,
        campaignName: entry.campaignName || "",
        contentPillar: entry.contentPillar || EMPTY.contentPillar,
        platform: entry.platform || EMPTY.platform,
        contentType: entry.contentType || EMPTY.contentType,
        topicHook: entry.topicHook || "",
        caption: entry.caption || "",
        cta: entry.cta || "",
        hashtags: entry.hashtags || "",
        mediaType: entry.mediaType || EMPTY.mediaType,
        designerAssigned: entry.designerAssigned || "",
        status: (entry.status as any) || "Draft",
        publishingTime: entry.publishingTime || "09:00",
        link: entry.link || "",
        notes: entry.notes || "",
        priority: (entry.priority as any) || "Medium",
      });
    }
  }, [entry]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSave() {
    const id = isEdit ? (entry as ContentEntry).id : makeId();
    const day = days[new Date(form.date).getDay()] || "";
    onSave({ ...form, id, day } as ContentEntry);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-fade-in" style={{
        background: "#0D1117", border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 16, width: "100%", maxWidth: 780,
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(59,130,246,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>
            {isEdit ? "Edit Content Entry" : "New Content Entry"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <Field label="Date">
            <input type="date" style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} />
          </Field>

          <Field label="Publishing Time">
            <input type="time" style={inputStyle} value={form.publishingTime} onChange={e => set("publishingTime", e.target.value)} />
          </Field>

          <Field label="Campaign Name" full>
            <input style={inputStyle} placeholder="e.g. Brainepedia v2 Launch Week" value={form.campaignName} onChange={e => set("campaignName", e.target.value)} />
          </Field>

          <Field label="Content Pillar">
            <select style={selectStyle} value={form.contentPillar} onChange={e => set("contentPillar", e.target.value)}>
              {CONTENT_PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Platform">
            <select style={selectStyle} value={form.platform} onChange={e => set("platform", e.target.value)}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Content Type">
            <select style={selectStyle} value={form.contentType} onChange={e => set("contentType", e.target.value)}>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Media Type">
            <select style={selectStyle} value={form.mediaType} onChange={e => set("mediaType", e.target.value)}>
              {MEDIA_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select style={selectStyle} value={form.status} onChange={e => set("status", e.target.value as any)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Priority">
            <select style={selectStyle} value={form.priority} onChange={e => set("priority", e.target.value as any)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Designer Assigned">
            <input style={inputStyle} placeholder="Designer name" value={form.designerAssigned} onChange={e => set("designerAssigned", e.target.value)} />
          </Field>

          <Field label="Topic / Hook" full>
            <input style={inputStyle} placeholder="Scroll-stopping hook or headline..." value={form.topicHook} onChange={e => set("topicHook", e.target.value)} />
          </Field>

          <Field label="Caption" full>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
              placeholder="Full post caption..."
              value={form.caption}
              onChange={e => set("caption", e.target.value)}
            />
          </Field>

          <Field label="CTA">
            <input style={inputStyle} placeholder="Call to action text" value={form.cta} onChange={e => set("cta", e.target.value)} />
          </Field>

          <Field label="Hashtags">
            <input style={inputStyle} placeholder="#Brainepedia #EdTech..." value={form.hashtags} onChange={e => set("hashtags", e.target.value)} />
          </Field>

          <Field label="Link" full>
            <input style={inputStyle} placeholder="https://..." value={form.link} onChange={e => set("link", e.target.value)} />
          </Field>

          <Field label="Notes" full>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              placeholder="Internal notes for the team..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(59,130,246,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {isEdit && onDelete && (
              <button
                onClick={() => { if (entry && (entry as ContentEntry).id) { onDelete!((entry as ContentEntry).id); onClose(); } }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, color: "#F87171", cursor: "pointer", fontSize: 13 }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, color: "#64748B", cursor: "pointer", fontSize: 13 }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 20px", background: "linear-gradient(135deg,#1E40AF,#3B82F6)", border: "none", borderRadius: 7, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              <Save size={14} />
              {isEdit ? "Save Changes" : "Create Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
