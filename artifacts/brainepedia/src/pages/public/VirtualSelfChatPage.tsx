import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Bot, Loader2, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "What projects have you worked on?",
  "What are your strongest skills?",
  "Tell me about your experience.",
  "What industries have you worked in?",
];

export default function VirtualSelfChatPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || "";
  const [profileName, setProfileName] = useState("Professional");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [bootLoading, setBootLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setBootLoading(false);
      setError("Invalid profile link.");
      return;
    }
    (async () => {
      const res = await api.identity.publicProfile(userId);
      if (res.ok && res.data) {
        const data = res.data as any;
        setProfileName(data.displayName || data.DisplayName || data.fullName || data.FullName || "Professional");
        setAvatarUrl(data.profilePictureUrl || data.ProfilePictureUrl || data.avatarUrl || null);
        setTitle(data.professionalTitle || data.ProfessionalTitle || data.currentTitle || data.CurrentTitle || "");
      }
      setBootLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || !userId) return;

    const nextUserMessage: ChatMessage = { role: "user", content: trimmed };
    const history = messages.map((message) => ({ role: message.role, content: message.content }));
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput("");
    setError("");
    setLoading(true);
    setTyping(true);

    const res = await api.profiles.virtualSelfChat(
      userId,
      { message: trimmed, history },
      { skipAuth: true },
    );

    setLoading(false);
    setTyping(false);

    if (!res.ok) {
      setError(res.error || "Unable to reach the virtual self right now.");
      return;
    }

    const reply = extractChatReply(res.data);
    if (!reply) {
      setError("No reply was returned. Please try again.");
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  if (bootLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b10] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D2FF]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080b10] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080b10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <Link href={`/public-profile/${encodeURIComponent(userId)}`} className="rounded-lg p-2 text-white/50 transition hover:bg-white/5 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar name={profileName} url={avatarUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{profileName}</h1>
            <p className="truncate text-sm text-white/50">{title || "Virtual Self"}</p>
            <p className="text-xs text-[#00D2FF]/70">Ask me anything about my professional experience.</p>
          </div>
          <div className="hidden rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#9D4EDD] sm:block">
            <Bot className="mr-1 inline h-3 w-3" /> AI Digital Twin
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && !typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#00D2FF]" />
              <p className="text-sm text-white/60">Start a conversation with {profileName}&apos;s AI digital twin.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#00D2FF]/40 hover:text-[#00D2FF]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={`${message.role}-${index}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-[#00D2FF] text-black"
                    : "border border-white/10 bg-[#0d1119] text-white/85"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1119] px-4 py-3 text-sm text-white/50">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00D2FF]" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00D2FF]" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00D2FF]" style={{ animationDelay: "300ms" }} />
                </span>
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSubmit} className="sticky bottom-0 border-t border-white/10 bg-[#080b10] pt-4">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your question..."
              rows={2}
              disabled={loading}
              className="min-h-[52px] resize-none border-white/10 bg-[#0d1119] text-white placeholder:text-white/30"
              aria-label="Chat message"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-auto shrink-0 bg-[#00D2FF] px-4 text-black hover:bg-[#00B8DD]"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function extractChatReply(data: unknown): string {
  if (data == null) return "";

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extractChatReply(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidates = [
      record.response,
      record.Response,
      record.reply,
      record.Reply,
      record.message,
      record.Message,
    ];

    for (const candidate of candidates) {
      const text = extractChatReply(candidate);
      if (text) return text;
    }
  }

  return "";
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setErr(true)}
        className="h-12 w-12 rounded-xl border border-[#00D2FF]/30 object-cover"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#00D2FF] text-lg font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
