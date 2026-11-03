import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ThreadSummary = {
  conversationId: string;
  visitorLabel: string;
  startedAtUtc: string | null;
  lastMessageAtUtc: string | null;
  messageCount: number;
  lastMessagePreview: string;
};

type ThreadMessage = {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  createdAtUtc: string | null;
};

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function formatUtc(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function normalizeSummary(raw: unknown): ThreadSummary | null {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const conversationId = text(item.conversationId ?? item.ConversationId);
  if (!conversationId) return null;
  return {
    conversationId,
    visitorLabel: text(item.visitorLabel ?? item.VisitorLabel) || "Visitor",
    startedAtUtc: text(item.startedAtUtc ?? item.StartedAtUtc) || null,
    lastMessageAtUtc: text(item.lastMessageAtUtc ?? item.LastMessageAtUtc) || null,
    messageCount: Number(item.messageCount ?? item.MessageCount ?? 0) || 0,
    lastMessagePreview: text(item.lastMessagePreview ?? item.LastMessagePreview),
  };
}

export function VirtualSelfHistory({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await api.profiles.listVirtualSelfHistory(userId, { pageNumber: 1, pageSize: 20 });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.status === 403 ? "Only the profile owner or a Global Admin can read this history." : (res.error || "Unable to load chat history."));
        setThreads([]);
        return;
      }
      const root = (res.data ?? {}) as Record<string, unknown>;
      const list = root.conversations ?? root.Conversations ?? [];
      setThreads(Array.isArray(list) ? list.map(normalizeSummary).filter((item): item is ThreadSummary => Boolean(item)) : []);
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const openThread = async (thread: ThreadSummary) => {
    setSelected(thread);
    setReading(true);
    setMessages([]);
    const res = await api.profiles.getVirtualSelfThread(userId, thread.conversationId);
    setReading(false);
    if (!res.ok) {
      setError(res.error || "Unable to open that conversation.");
      return;
    }
    const root = (res.data ?? {}) as Record<string, unknown>;
    const list = root.messages ?? root.Messages ?? [];
    setMessages(Array.isArray(list) ? list.map((raw) => {
      const item = raw as Record<string, unknown>;
      const role = text(item.role ?? item.Role).toLowerCase() === "assistant" ? "assistant" : "user";
      return {
        messageId: text(item.messageId ?? item.MessageId) || `${role}-${text(item.createdAtUtc)}`,
        role,
        content: text(item.content ?? item.Content),
        createdAtUtc: text(item.createdAtUtc ?? item.CreatedAtUtc) || null,
      } satisfies ThreadMessage;
    }) : []);
  };

  return (
    <>
      <Button type="button" variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5" onClick={() => setOpen(true)}>
        <History className="mr-2 h-4 w-4" />
        Chat history
      </Button>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setSelected(null); setMessages([]); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Virtual self conversations</DialogTitle>
            <DialogDescription>Visible to the profile owner and Global Admins. Visitors still chat without an account.</DialogDescription>
          </DialogHeader>
          {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading threads…</div>
          ) : selected ? (
            <div className="space-y-3">
              <button type="button" className="text-xs text-[#00D2FF]" onClick={() => { setSelected(null); setMessages([]); }}>← All threads</button>
              <p className="text-sm font-semibold">{selected.visitorLabel}</p>
              <p className="text-xs text-white/50">{formatUtc(selected.startedAtUtc)} · {selected.messageCount} messages</p>
              {reading ? (
                <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Opening thread…</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.messageId} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "ml-auto bg-[#00D2FF] text-black" : "border border-white/10 bg-black/30 text-white/85"}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.createdAtUtc && <p className={`mt-1 text-[10px] ${message.role === "user" ? "text-black/60" : "text-white/40"}`}>{formatUtc(message.createdAtUtc)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : threads.length === 0 ? (
            <p className="text-sm text-white/60">No saved conversations yet.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {threads.map((thread) => (
                <button key={thread.conversationId} type="button" className="flex w-full flex-col items-start gap-1 py-3 text-left hover:bg-white/5" onClick={() => void openThread(thread)}>
                  <span className="text-sm font-semibold">{thread.visitorLabel}</span>
                  <span className="line-clamp-2 text-xs text-white/60">{thread.lastMessagePreview || "No preview"}</span>
                  <span className="text-[10px] text-white/40">{formatUtc(thread.lastMessageAtUtc || thread.startedAtUtc)} · {thread.messageCount} messages</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
