import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronDown, ChevronUp, Loader2, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationIntent } from "@/lib/missionExecutionTypes";

type ChatMessage = {
  role: "user" | "mentor";
  text: string;
  suggestedActions?: string[];
  xpAwarded?: number;
};

type Props = {
  messages: ChatMessage[];
  sending?: boolean;
  onSend: (message: string, intent: number) => void;
  onSuggestedAction: (action: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
};

const SUGGESTED_PROMPTS = [
  { label: "Give me a hint", intent: ConversationIntent.RequestHint },
  { label: "Review my approach", intent: ConversationIntent.Feedback },
  { label: "What should I do next?", intent: ConversationIntent.DecisionSupport },
  { label: "Explain the requirement", intent: ConversationIntent.Explanation },
];

export function BrainiacDrawer({
  messages,
  sending,
  onSend,
  onSuggestedAction,
  open,
  onOpenChange,
  isMobile,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  function submit(intent = ConversationIntent.Question) {
    const text = input.trim();
    if (!text && intent === ConversationIntent.Question) return;
    onSend(text || "I'd like some guidance on my approach.", intent);
    setInput("");
  }

  if (!open && !isMobile) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed right-4 bottom-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#9D4EDD]/30 bg-[#0d1020]/95 backdrop-blur text-sm font-mono text-[#9D4EDD] shadow-lg hover:bg-[#9D4EDD]/10 transition-colors"
        aria-label="Open Brainiac assistant"
      >
        <Sparkles className="w-4 h-4" />
        Brainiac
      </button>
    );
  }

  const panelContent = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#9D4EDD]/15">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#9D4EDD]" />
          <div>
            <span className="text-sm font-bold font-mono text-white">Brainiac</span>
            <p className="text-[10px] text-[#9D4EDD]/60 font-mono">Your Team Lead</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-white/30 hover:text-white p-1"
          aria-label="Close Brainiac"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs font-mono text-white/40 max-w-[240px] mx-auto leading-relaxed">
              "Need help? Ask me about your approach."
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onSend(p.label, p.intent)}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-[#9D4EDD]/25 text-[#9D4EDD]/80 hover:bg-[#9D4EDD]/10 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-white/5 border border-white/8 text-white/75 ml-3"
                : "bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 text-white/80 mr-3"
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
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#9D4EDD]/30 text-[#9D4EDD]/80 hover:bg-[#9D4EDD]/15"
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
          className="min-h-[48px] text-xs bg-black/30 border-white/10 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          aria-label="Mentor message input"
        />
        <Button
          size="sm"
          disabled={sending || !input.trim()}
          onClick={() => submit()}
          className="w-full text-xs font-mono bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30"
        >
          Send
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
              aria-hidden
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[75vh] rounded-t-2xl border border-[#9D4EDD]/25 bg-[#0d1020]"
              role="dialog"
              aria-label="Brainiac assistant"
            >
              {panelContent}
            </motion.div>
          </>
        )}
        {!open && (
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            className="fixed right-4 bottom-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#9D4EDD]/30 bg-[#0d1020]/95 backdrop-blur text-sm font-mono text-[#9D4EDD] shadow-lg"
            aria-label="Open Brainiac assistant"
          >
            <Sparkles className="w-4 h-4" />
            Brainiac
          </button>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 rounded-xl border border-[#9D4EDD]/25 bg-[#0d1020] max-h-[calc(100vh-180px)] sticky top-4">
      {panelContent}
    </aside>
  );
}

export type { ChatMessage };
