import { useEffect } from "react";
import type { Toast } from "../types";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function Toaster({ toasts, onDismiss }: Props) {
  useEffect(() => {
    if (!toasts.length) return;
    const last = toasts[toasts.length - 1];
    const t = setTimeout(() => onDismiss(last.id), 3500);
    return () => clearTimeout(t);
  }, [toasts, onDismiss]);

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {toasts.map(t => {
        const Icon = t.type === "success" ? CheckCircle : t.type === "error" ? XCircle : Info;
        const color = t.type === "success" ? "#10B981" : t.type === "error" ? "#EF4444" : "#3B82F6";
        return (
          <div
            key={t.id}
            className="animate-fade-in"
            style={{
              pointerEvents: "all",
              display: "flex", alignItems: "center", gap: 10,
              background: "#111827",
              border: `1px solid ${color}40`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 10, padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              maxWidth: 360, minWidth: 260,
            }}
          >
            <Icon size={18} style={{ color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#E2E8F0", flex: 1 }}>{t.message}</span>
            <button onClick={() => onDismiss(t.id)} style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
