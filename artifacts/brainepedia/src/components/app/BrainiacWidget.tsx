import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, MailCheck, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

type Message = {
  role: "user" | "ai";
  text: string;
  isEscalated?: boolean;
};

function extractText(data: unknown, depth = 0): string {
  if (!data) return "";
  let obj = data;
  if (typeof obj === "string") {
    const trimmed = obj.trim();
    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && depth < 4) {
      try { obj = JSON.parse(trimmed); } catch { return trimmed; }
    } else {
      return trimmed;
    }
  }
  if (typeof obj !== "object" || obj === null) return String(obj);
  const d = obj as Record<string, unknown>;
  const raw =
    d.Reply ?? d.reply ??
    d.response ?? d.Response ??
    d.message ?? d.Message ??
    d.text ?? d.Text ??
    d.content ?? d.Content ??
    null;
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && depth < 4) {
      return extractText(trimmed, depth + 1);
    }
    return trimmed;
  }
  return extractText(raw, depth + 1);
}

function FormattedText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-2">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        const isBulletBlock = lines.every(l => /^[-*•]\s/.test(l.trim()) || l.trim() === "");
        if (isBulletBlock) {
          return (
            <ul key={pi} className="list-none space-y-0.5 pl-1">
              {lines.filter(l => l.trim()).map((line, li) => (
                <li key={li} className="flex gap-1.5 items-start">
                  <span className="text-[#9D4EDD] mt-[3px] shrink-0">▸</span>
                  <span>{renderInline(line.replace(/^[-*•]\s*/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={pi} className="leading-relaxed">
            {lines.map((line, li) => (
              <span key={li}>
                {renderInline(line)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<strong key={match.index} className="text-white/90 font-semibold">{match[1]}</strong>);
    else if (match[2]) parts.push(<em key={match.index} className="text-white/70 italic">{match[2]}</em>);
    else if (match[3]) parts.push(<code key={match.index} className="px-1 py-0.5 rounded bg-[#9D4EDD]/15 text-[#9D4EDD] font-mono text-[10px]">{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function BrainiacWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = getUserId();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  async function send() {
    const prompt = input.trim();
    if (!prompt) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: prompt }]);
    setThinking(true);
    try {
      const res = await api.evaluations.chatBrainiac({ prompt }, userId);
      const text = extractText(res.data) || "I'm here to help. Could you rephrase your question?";
      const d = res.data as Record<string, unknown> | null;
      const isEscalated = Boolean(d?.IsEscalated ?? d?.isEscalated ?? false);
      setMessages(m => [...m, { role: "ai", text, isEscalated }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "Brainiac support modules are undergoing maintenance. Please try again shortly." }]);
    } finally {
      setThinking(false);
    }
  }

  const unreadCount = messages.filter(m => m.role === "ai").length;

  return (
    <>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        title={open ? "Close Brainiac" : "Ask Brainiac"}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#9D4EDD] to-[#00D2FF] text-white shadow-2xl shadow-[#9D4EDD]/30 transition-all"
        style={{ boxShadow: open ? "0 0 0 3px rgba(157,78,221,0.35), 0 8px 24px rgba(157,78,221,0.35)" : undefined }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#FFD700] text-black text-[10px] font-black flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[76px] right-6 z-50 w-[340px] rounded-2xl border border-[#9D4EDD]/25 bg-[#0a0d16] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#9D4EDD]/15 bg-[#0d1020]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9D4EDD] to-[#00D2FF] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-mono">Brainiac</p>
                  <p className="text-[10px] text-[#9D4EDD]/60 font-mono">Oracle Advisor &amp; Support</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-72 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Bot className="w-8 h-8 text-[#9D4EDD]/20" />
                  <p className="text-xs text-white/20 font-mono text-center max-w-[200px]">
                    Ask about Brainepedia, your missions, or career progression.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${m.role === "user" ? "bg-[#00D2FF]/20 text-[#00D2FF]" : "bg-[#9D4EDD]/20 text-[#9D4EDD]"}`}>
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className={`text-xs leading-relaxed rounded-xl px-3 py-2
                      ${m.role === "user"
                        ? "bg-[#00D2FF]/10 text-white/70 rounded-tr-sm"
                        : "bg-[#9D4EDD]/10 text-white/60 rounded-tl-sm"}`}>
                      {m.role === "ai" ? <FormattedText text={m.text} /> : m.text}
                    </div>
                    {m.isEscalated && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25"
                      >
                        <MailCheck className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[10px] font-mono text-amber-300">Support ticket raised — our team will follow up.</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-[#9D4EDD]/20 flex items-center justify-center text-[10px] text-[#9D4EDD] font-bold">AI</div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl rounded-tl-sm bg-[#9D4EDD]/10">
                    <span className="text-xs text-white/30 font-mono italic">Thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0, 1, 2].map(j => (
                        <motion.span key={j} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                          className="w-1 h-1 rounded-full bg-[#9D4EDD]" />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Domain note */}
            <div className="px-4 py-1.5 flex items-center gap-1.5 border-t border-white/5 bg-white/[0.02]">
              <AlertTriangle className="w-2.5 h-2.5 text-white/20 shrink-0" />
              <p className="text-[9px] font-mono text-white/15 leading-tight">Brainiac covers Brainepedia guidance &amp; career development only.</p>
            </div>

            {/* Input */}
            <div className="px-3 pb-3 flex gap-2 border-t border-white/5 pt-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask anything…"
                disabled={thinking}
                className="flex-1 bg-white/5 border border-white/10 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#9D4EDD]/50 placeholder:text-white/20 disabled:opacity-50"
              />
              <button onClick={send} disabled={!input.trim() || thinking}
                className="w-9 h-9 rounded-xl bg-[#9D4EDD]/20 border border-[#9D4EDD]/30 text-[#9D4EDD] flex items-center justify-center hover:bg-[#9D4EDD]/30 transition-colors disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
