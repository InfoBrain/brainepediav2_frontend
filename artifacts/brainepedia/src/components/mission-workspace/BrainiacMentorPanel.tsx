import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, ChevronUp, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationIntent } from "@/lib/missionExecutionTypes";
import type { MentorMessageDto } from "@/lib/missionExecutionTypes";

type ChatMessage = {
  role: "user" | "mentor";
  text: string;
  suggestedActions?: string[];
  xpAwarded?: number;
};

type Props = {
  messages: ChatMessage[];
  loading?: boolean;
  sending?: boolean;
  onSend: (message: string, intent: number) => void;
  onSuggestedAction: (action: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function BrainiacMentorPanel({
  messages,
  loading,
  sending,
  onSend,
  onSuggestedAction,
  collapsed,
  onToggleCollapse,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function submit(intent = ConversationIntent.Question) {
    const text = input.trim();
    if (!text && intent === ConversationIntent.Question) return;
    onSend(text || "I'd like some guidance on my approach.", intent);
    setInput("");
  }

  return (
    <section
      className="rounded-xl border border-[#9D4EDD]/25 bg-[#0d1020] flex flex-col min-h-0"
      aria-label="Brainiac mentor chat"
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center justify-between px-4 py-3 border-b border-[#9D4EDD]/15 w-full text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#9D4EDD]" />
          <span className="text-sm font-bold font-mono text-white">Brainiac</span>
          <span className="text-[10px] text-[#9D4EDD]/60 font-mono">Team Lead</span>
        </div>
        {onToggleCollapse && (
          collapsed ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronUp className="w-4 h-4 text-white/30" />
        )}
      </button>

      {!collapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[320px]">
            {loading && (
              <div className="flex items-center justify-center py-8 text-white/30 text-xs font-mono gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading conversation…
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <Sparkles className="w-6 h-6 text-[#9D4EDD]/40 mx-auto" />
                <p className="text-xs font-mono text-white/40 max-w-[220px] mx-auto leading-relaxed">
                  Your team lead is here to coach — ask questions, request hints, or get feedback on your draft.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-mono border-[#9D4EDD]/25 text-[#9D4EDD]/80"
                  onClick={() => onSend("What should I focus on first?", ConversationIntent.RequestHint)}
                >
                  Get a hint
                </Button>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-white/5 border border-white/8 text-white/75 ml-4"
                    : "bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 text-white/80 mr-4"
                }`}
              >
                <p className="text-[9px] font-mono uppercase tracking-wider mb-1 opacity-50">
                  {m.role === "user" ? "You" : "Brainiac"}
                </p>
                <p>{m.text}</p>
                {m.xpAwarded && m.xpAwarded > 0 && (
                  <p className="text-[10px] font-mono text-[#FFD700]/70 mt-1 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> +{m.xpAwarded} XP
                  </p>
                )}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.suggestedActions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => onSuggestedAction(action)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#9D4EDD]/30 text-[#9D4EDD]/80 hover:bg-[#9D4EDD]/15 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-xs font-mono text-white/35 pl-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Brainiac is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-[#9D4EDD]/15 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your team lead…"
              className="min-h-[56px] text-xs bg-black/30 border-white/10 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              aria-label="Mentor message input"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={sending || !input.trim()}
                onClick={() => submit()}
                className="flex-1 text-xs font-mono bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30"
              >
                Send
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={sending}
                onClick={() => submit(ConversationIntent.RequestHint)}
                className="text-xs font-mono border-white/15 text-white/50"
              >
                Hint
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function mapHistoryToChat(messages: MentorMessageDto[]): ChatMessage[] {
  return messages.map((m) => ({
    role: m.sender === 1 ? "user" : "mentor",
    text: m.message,
    suggestedActions: m.suggestedNextActions,
  }));
}
