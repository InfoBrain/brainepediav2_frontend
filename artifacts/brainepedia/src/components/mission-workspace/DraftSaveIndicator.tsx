import { Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  saving?: boolean;
  lastSavedAt?: string | null;
};

function formatRelative(ts?: string | null): string | null {
  if (!ts) return null;
  try {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60_000) return "Saved just now";
    if (diff < 3_600_000) return `Last saved ${Math.floor(diff / 60_000)} min ago`;
    return `Saved ${new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return null;
  }
}

export function DraftSaveIndicator({ saving, lastSavedAt }: Props) {
  const label = formatRelative(lastSavedAt);

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono" aria-live="polite">
      {saving ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-[#7d4ccc]" />
          <span className="text-[#7d4ccc]/70">Saving…</span>
        </>
      ) : label ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-400/70" />
          <span className="text-[#7a869d]">{label}</span>
        </>
      ) : (
        <span className="text-[#8b96ab]">Draft not saved yet</span>
      )}
    </div>
  );
}
