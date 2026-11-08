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
  /** Contextual mentor prompt shown when the conversation is empty */
  contextPrompt?: string;
  canUseAI?: boolean;
  disabledReason?: string;
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
  contextPrompt,
  canUseAI = true,
  disabledReason,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  function submit(intent = ConversationIntent.Question) {
    if (!canUseAI) return;
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
        className="fixed right-4 bottom-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#e0d2f3]/30 bg-white backdrop-blur text-sm font-mono text-[#7d4ccc] shadow-lg hover:bg-[#f5f0fc]/10 transition-colors"
        aria-label="Open Brainiac assistant"
      >
        <Sparkles className="w-4 h-4" />
        Brainiac
      </button>
    );
  }

  const panelContent = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0d2f3]/15">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#7d4ccc]" />
          <div>
            <span className="text-sm font-bold font-mono text-[#182137]">Brainiac</span>
            <p className="text-[10px] text-[#7d4ccc]/60 font-mono">Your Team Lead</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-[#7a869d] hover:text-[#182137] p-1"
          aria-label="Close Brainiac"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="py-2 space-y-3">
            {contextPrompt && (
              <div className="rounded-lg px-3 py-2.5 text-xs leading-relaxed bg-[#f5f0fc] border border-[#e0d2f3]/35 text-[#182137] mr-1">
                <p className="text-[9px] font-mono uppercase tracking-wider mb-1 text-[#7d4ccc]">Brainiac</p>
                <p className="text-[#182137]">{contextPrompt}</p>
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-[10px] font-mono text-[#5e6a7f] max-w-[240px] mx-auto leading-relaxed">
                Ask for a hint, review your draft, or get guidance on next steps.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onSend(p.label, p.intent)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-[#d8dde8] bg-[#f4f6fb] text-[#182137] hover:bg-[#f5f0fc] hover:text-[#182137] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${ m.role === "user" ? "bg-[#f4f6fb] border border-[#e6e8ef] text-[#182137] ml-3" : "bg-[#f5f0fc] border border-[#e0d2f3]/30 text-[#182137] mr-3" }`}
          >
            <p className={`text-[9px] font-mono uppercase tracking-wider mb-1 ${ m.role === "user" ? "text-[#5e6a7f]" : "text-[#7d4ccc]" }`}>
              {m.role === "user" ? "You" : "Brainiac"}
            </p>
            <p className="text-[#182137]">{m.text}</p>
            {m.xpAwarded && m.xpAwarded > 0 && (
              <p className="text-[10px] font-mono text-[#7d4ccc]/70 mt-1 flex items-center gap-1">
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
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#d8dde8] bg-[#f4f6fb] text-[#182137] hover:bg-[#f5f0fc]"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a869d] pl-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Brainiac is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-[#e0d2f3]/15 space-y-2">
        {!canUseAI && (
          <p className="text-[11px] text-[#9a3412]">{disabledReason || "Brainiac AI credits are exhausted for this wallet."}</p>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your team lead…"
          disabled={!canUseAI || sending}
          className="min-h-[48px] text-xs bg-white border-[#e6e8ef] resize-none"
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
          disabled={sending || !canUseAI || !input.trim()}
          onClick={() => submit()}
          className="w-full text-xs font-mono bg-[#7d4ccc] text-white border border-[#7d4ccc] hover:bg-[#6538ad]"
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
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[75vh] rounded-t-2xl border border-[#e0d2f3]/25 bg-white"
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
            className="fixed right-4 bottom-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#e0d2f3]/30 bg-white backdrop-blur text-sm font-mono text-[#7d4ccc] shadow-lg"
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
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 rounded-xl border border-[#e0d2f3]/25 bg-white max-h-[calc(100vh-180px)] sticky top-4">
      {panelContent}
    </aside>
  );
}

export type { ChatMessage };
