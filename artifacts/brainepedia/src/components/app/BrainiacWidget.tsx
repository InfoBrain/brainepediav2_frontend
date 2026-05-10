import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot } from "lucide-react";
import { api } from "@/lib/api";

type Message = { role: "user" | "ai"; text: string };

export function BrainiacWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  async function send() {
    const prompt = input.trim();
    if (!prompt) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: prompt }]);
    setThinking(true);
    const res = await api.evaluations.chatBrainiac({ prompt });
    setThinking(false);
    const text = (res.data as any)?.response || (res.data as any)?.message || "I'm here to help. Could you rephrase your question?";
    setMessages(m => [...m, { role: "ai", text }]);
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#9D4EDD] to-[#00D2FF] text-white text-sm font-bold font-mono shadow-2xl shadow-[#9D4EDD]/30"
      >
        <Sparkles className="w-4 h-4" />
        Ask Brainiac
        {messages.length > 0 && (
          <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">{messages.length}</span>
        )}
      </motion.button>

      {/* Chat modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-[340px] rounded-2xl border border-[#9D4EDD]/25 bg-[#0a0d16] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#9D4EDD]/15 bg-[#0d1020]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9D4EDD] to-[#00D2FF] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-mono">Brainiac</p>
                  <p className="text-[10px] text-[#9D4EDD]/60 font-mono">AI Learning Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Bot className="w-8 h-8 text-[#9D4EDD]/20" />
                  <p className="text-xs text-white/20 font-mono text-center max-w-[200px]">
                    Ask me anything about coding, missions, or the platform.
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
                  <div className={`text-xs leading-relaxed rounded-xl px-3 py-2 max-w-[80%]
                    ${m.role === "user" ? "bg-[#00D2FF]/10 text-white/70 rounded-tr-sm" : "bg-[#9D4EDD]/10 text-white/70 rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-[#9D4EDD]/20 flex items-center justify-center text-[10px] text-[#9D4EDD] font-bold">AI</div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl rounded-tl-sm bg-[#9D4EDD]/10">
                    <span className="text-xs text-white/30 font-mono italic">Thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0,1,2].map(i => (
                        <motion.span key={i} animate={{ opacity: [0.2,1,0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1 h-1 rounded-full bg-[#9D4EDD]" />
                      ))}
                    </span>
                  </div>
                </div>
              )}
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
