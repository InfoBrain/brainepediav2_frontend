import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  AlertCircle,
  RefreshCw,
  Loader2,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Send,
  Bot,
  ArrowLeft,
  Timer,
  Paperclip,
  FileCode2,
  Image,
  File,
  Sparkles,
  TriangleAlert,
  Save,
  Flag,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Type,
  Code2,
  AlignLeft,
  Heading1,
  Heading2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUserId, getDashboardPath, isAuthenticated } from "@/lib/auth";
import { CopyrightBar } from "@/components/ui/CopyrightBar";
import { useDifficulties, buildDifficultyLookup, getDifficultyStyle } from "@/hooks/useDifficulties";

type ProblemNode = {
  problemNodeId: string;
  title: string;
  context: string;
  missionBrief: string;
  constraints: string[];
  expectedOutcomes: string[];
  experiencePoints: number;
  estimatedMinutes: number;
  difficultyName?: string;
  difficultyId?: string;
  districtId?: string;
};

type SessionData = {
  sessionId: string;
  userId: string;
  problemNodeId: string;
  status: string;
  startedAt?: string;
  problemNode?: ProblemNode;
};

type BrainiacMessage = {
  role: "user" | "ai";
  text: string;
  penalty?: number;
};

type UploadedFile = {
  id: string;
  file: File;
  preview?: string;
};

type SolutionMode = "prose" | "code";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
  { value: "plaintext", label: "Plain Text" },
];

const BRAINIAC_TIPS: Record<SolutionMode, string[]> = {
  prose: [
    "Provide a clear, practical solution with real-world reasoning and structured thinking.",
    "Use headings to organise your response and bullet points for key insights.",
    "Support your ideas with examples and explain the reasoning behind your decisions.",
    "Address the constraints directly and show how your solution handles each one.",
  ],
  code: [
    "Write clean, well-commented code — explain your reasoning inline.",
    "Consider edge cases and document how your solution handles them.",
    "Structure your code for readability: clear variable names, logical flow.",
    "Add a brief comment block at the top explaining your overall approach.",
  ],
};

function normSession(data: any): SessionData {
  return {
    sessionId: data?.sessionId || data?.id || "",
    userId: data?.userId || "",
    problemNodeId: data?.problemNodeId || "",
    status: data?.status || "active",
    startedAt: data?.startedAt || data?.createdAt,
    problemNode: data?.problemNode ? normProblemNode(data.problemNode) : undefined,
  };
}

function normProblemNode(data: any): ProblemNode {
  const parseArr = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return v ? [v] : []; } }
    return [];
  };
  return {
    problemNodeId: data?.problemNodeId || data?.id || "",
    title: data?.title || "Untitled Challenge",
    context: data?.context || "",
    missionBrief: data?.missionBrief || "",
    constraints: parseArr(data?.constraints),
    expectedOutcomes: parseArr(data?.expectedOutcomes),
    experiencePoints: Number(data?.experiencePoints ?? 0),
    estimatedMinutes: Number(data?.estimatedMinutes ?? 0),
    difficultyName: data?.difficultyName || data?.difficulty?.name || "",
    difficultyId: data?.difficultyId || data?.difficulty?.difficultyId || data?.difficulty?.id || "",
    districtId: data?.districtId || "",
  };
}

function fileIcon(file: File) {
  if (file.type.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  if (file.name.endsWith(".zip")) return <File className="w-4 h-4 text-yellow-400" />;
  return <FileCode2 className="w-4 h-4 text-[#00D2FF]" />;
}

// ─── COLLAPSIBLE SECTION ───────────────────────────────────────────────────
function CollapsibleSection({
  icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase tracking-widest">
          {icon} {title}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── RICH TEXT EDITOR ──────────────────────────────────────────────────────
function RichTextEditor({
  editorRef,
  onInput,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onInput: () => void;
}) {
  const [isEmpty, setIsEmpty] = useState(true);

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value ?? undefined);
    editorRef.current?.focus();
    setIsEmpty(!editorRef.current?.innerText?.trim());
    onInput();
  }

  function handleInput() {
    setIsEmpty(!editorRef.current?.innerText?.trim());
    onInput();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    setIsEmpty(!editorRef.current?.innerText?.trim());
    onInput();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "b" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec("bold"); }
    if (e.key === "i" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec("italic"); }
    if (e.key === "u" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec("underline"); }
  }

  const toolbarBtn = "p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors";

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/8 bg-[#0a0e18]">
        <button onMouseDown={e => { e.preventDefault(); exec("bold"); }} className={toolbarBtn} title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button onMouseDown={e => { e.preventDefault(); exec("italic"); }} className={toolbarBtn} title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button onMouseDown={e => { e.preventDefault(); exec("underline"); }} className={toolbarBtn} title="Underline (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onMouseDown={e => { e.preventDefault(); exec("formatBlock", "<h2>"); }}
          className={toolbarBtn}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={e => { e.preventDefault(); exec("formatBlock", "<h3>"); }}
          className={toolbarBtn}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={e => { e.preventDefault(); exec("formatBlock", "<p>"); }}
          className={toolbarBtn}
          title="Paragraph"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} className={toolbarBtn} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </button>
        <button onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }} className={toolbarBtn} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onMouseDown={e => {
            e.preventDefault();
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          className={toolbarBtn}
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={e => {
            e.preventDefault();
            if (editorRef.current) {
              editorRef.current.innerHTML = "";
              setIsEmpty(true);
              onInput();
            }
          }}
          className="ml-auto p-1.5 rounded hover:bg-red-400/10 text-white/20 hover:text-red-400 transition-colors"
          title="Clear"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Editor area */}
      <div className="relative min-h-[280px] sm:min-h-[320px]">
        {isEmpty && (
          <p className="absolute top-4 left-4 text-sm text-white/20 pointer-events-none select-none font-sans leading-relaxed">
            Explain your approach, ideas, analysis, or professional solution here…
          </p>
        )}
        <div
          ref={editorRef as React.RefObject<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className="min-h-[280px] sm:min-h-[320px] px-4 py-4 text-sm text-white/80 outline-none leading-relaxed font-sans
            [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-2
            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white/90 [&_h3]:mt-3 [&_h3]:mb-1
            [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_ol]:space-y-1
            [&_a]:text-[#00D2FF] [&_a]:underline
            [&_strong]:text-white [&_em]:text-white/70
            [&_p]:mb-2"
        />
      </div>
    </div>
  );
}

// ─── BRAINIAC AI TIP ───────────────────────────────────────────────────────
function BrainiacAITip({ mode }: { mode: SolutionMode }) {
  const [tipIndex] = useState(() => Math.floor(Math.random() * BRAINIAC_TIPS[mode].length));
  const tip = BRAINIAC_TIPS[mode][tipIndex];

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#9D4EDD]/20 bg-[#9D4EDD]/5"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9D4EDD]/20 border border-[#9D4EDD]/30 flex items-center justify-center mt-0.5">
        <Sparkles className="w-3 h-3 text-[#9D4EDD]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-[#9D4EDD]/70 uppercase tracking-widest mb-1">Brainiac AI Tip</p>
        <p className="text-xs text-white/50 leading-relaxed">{tip}</p>
      </div>
    </motion.div>
  );
}

// ─── SOLUTION MODE TOGGLE ──────────────────────────────────────────────────
function SolutionModeToggle({
  mode,
  onChange,
}: {
  mode: SolutionMode;
  onChange: (m: SolutionMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
      <button
        onClick={() => onChange("prose")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 ${
          mode === "prose"
            ? "bg-[#00D2FF]/15 border border-[#00D2FF]/30 text-[#00D2FF] shadow-sm"
            : "text-white/40 hover:text-white/70 border border-transparent"
        }`}
      >
        <AlignLeft className="w-3.5 h-3.5" />
        Professional Response
      </button>
      <button
        onClick={() => onChange("code")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 ${
          mode === "code"
            ? "bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] shadow-sm"
            : "text-white/40 hover:text-white/70 border border-transparent"
        }`}
      >
        <Code2 className="w-3.5 h-3.5" />
        Code Solution
      </button>
    </div>
  );
}

// ─── MISSION LEFT PANEL ────────────────────────────────────────────────────
function MissionPanel({
  node,
  elapsed,
  diffStyle,
  diffLabel,
}: {
  node: ProblemNode;
  elapsed: number;
  diffStyle?: React.CSSProperties;
  diffLabel?: string;
}) {
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <aside className="w-full h-full overflow-y-auto bg-[#080c12] border-r border-white/8 flex flex-col">
      <div className="sticky top-0 z-10 bg-[#080c12]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <p className="text-[10px] font-mono text-[#00D2FF] tracking-[0.3em] uppercase mb-1 flex items-center gap-1">
          <Target className="w-3 h-3" /> Mission
        </p>
        <h2 className="text-base font-bold text-white leading-snug mb-3">{node.title}</h2>
        <div className="flex flex-wrap gap-2">
          {(diffLabel || node.difficultyName) && (
            <span
              className="text-[11px] font-mono px-2 py-1 rounded-full border"
              style={diffStyle || getDifficultyStyle("")}
            >
              {diffLabel || node.difficultyName}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/5 text-[#FFD700]">
            <Zap className="w-3 h-3" /> {node.experiencePoints} XP
          </span>
          {node.estimatedMinutes > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full border border-white/10 bg-white/3 text-white/40">
              <Clock className="w-3 h-3" /> {node.estimatedMinutes}m
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-white/30">
          <Timer className="w-3.5 h-3.5" />
          <span>Time: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
        </div>

        <div className="mt-2 text-[10px] font-mono text-purple-400/60">
          Estimated XP: ~{node.experiencePoints} if passed
        </div>
      </div>

      <div className="flex-1">
        {node.context && (
          <CollapsibleSection icon={<BookOpen className="w-3.5 h-3.5" />} title="Context">
            <p className="text-xs text-white/50 leading-relaxed">{node.context}</p>
          </CollapsibleSection>
        )}
        {node.missionBrief && (
          <CollapsibleSection icon={<Target className="w-3.5 h-3.5" />} title="Task Overview">
            <p className="text-xs text-white/60 leading-relaxed">{node.missionBrief}</p>
          </CollapsibleSection>
        )}
        {node.constraints.length > 0 && (
          <CollapsibleSection icon={<AlertTriangle className="w-3.5 h-3.5" />} title="Constraints">
            <ul className="space-y-2">
              {node.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
        {node.expectedOutcomes.length > 0 && (
          <CollapsibleSection icon={<CheckCircle2 className="w-3.5 h-3.5" />} title="Expected Outcomes">
            <ul className="space-y-2">
              {node.expectedOutcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  {o}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </aside>
  );
}

// ─── BRAINIAC AI CHAT PANEL ────────────────────────────────────────────────
function BrainiacPanel({
  sessionId,
  userId,
  approach,
  code,
}: {
  sessionId: string;
  userId: string;
  approach: string;
  code: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BrainiacMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function ask(question?: string) {
    const q = question || input.trim();
    if (!q && !question) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q || "Give me a hint" }]);
    setThinking(true);

    const contextualApproach = q ? `${approach}\n\n[User question: ${q}]` : approach;

    const res = await api.evaluations.askBrainiac({
      sessionId,
      userId,
      currentApproach: contextualApproach,
      currentCode: code,
    });

    setThinking(false);
    if (res.ok) {
      const d = res.data as Record<string, unknown>;

      function extractHint(val: unknown): string {
        if (!val) return "";
        if (typeof val === "string") return val.trim();
        if (typeof val === "object" && val !== null) {
          const obj = val as Record<string, unknown>;
          const hint = obj.hint ?? obj.text ?? obj.message ?? obj.content ?? obj.response;
          if (typeof hint === "string") return hint.trim();
          const nested = Object.values(obj).find(v => typeof v === "string");
          if (typeof nested === "string") return nested.trim();
        }
        return "";
      }

      const hint =
        extractHint(d?.response) ||
        extractHint(d?.message) ||
        extractHint(d?.hint) ||
        "Brainiac could not generate guidance right now.";

      const penaltyRaw = d?.penaltyApplied ?? d?.PenaltyApplied ?? d?.penalty ?? 0;

      setMessages(m => [...m, {
        role: "ai",
        text: hint,
        penalty: Number(penaltyRaw) || 0,
      }]);
    } else {
      setMessages(m => [...m, { role: "ai", text: "Brainiac could not generate guidance right now." }]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 text-[#9D4EDD] text-sm font-mono hover:bg-[#9D4EDD]/20 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Brainiac AI
        {messages.length > 0 && (
          <span className="ml-1 bg-[#9D4EDD]/30 rounded-full px-1.5 py-0.5 text-[10px]">{messages.length}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-2xl border border-[#9D4EDD]/25 bg-[#0d1020] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#9D4EDD]/15">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#9D4EDD]" />
                <span className="text-sm font-bold text-white font-mono">Brainiac</span>
                <span className="text-[10px] text-[#9D4EDD]/60 font-mono">AI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-56 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <Bot className="w-8 h-8 text-[#9D4EDD]/30" />
                  <p className="text-xs text-white/30 font-mono max-w-xs">
                    Ask Brainiac for a hint. Each hint may apply a small XP penalty.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${m.role === "user" ? "bg-[#00D2FF]/20 text-[#00D2FF]" : "bg-[#9D4EDD]/20 text-[#9D4EDD]"}`}>
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className={`text-xs leading-relaxed rounded-xl px-3 py-2 whitespace-pre-wrap break-words
                      ${m.role === "user"
                        ? "bg-[#00D2FF]/10 text-white/70 rounded-tr-sm"
                        : "bg-[#9D4EDD]/10 text-white/80 rounded-tl-sm"}`}>
                      {m.text}
                    </div>
                    {m.penalty && m.penalty > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                        <TriangleAlert className="w-3 h-3" /> -{m.penalty} XP penalty applied
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-[#9D4EDD]/20 flex items-center justify-center text-[10px] text-[#9D4EDD] font-bold">AI</div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl rounded-tl-sm bg-[#9D4EDD]/10">
                    <span className="text-xs text-white/40 font-mono italic">Brainiac is thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1 h-1 rounded-full bg-[#9D4EDD]"
                        />
                      ))}
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 pb-2 flex gap-2">
              <button
                onClick={() => ask("Give me a hint without revealing the full answer")}
                disabled={thinking}
                className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-[#9D4EDD]/20 text-[#9D4EDD]/70 hover:bg-[#9D4EDD]/10 transition-colors disabled:opacity-40"
              >
                💡 Get Hint
              </button>
              <button
                onClick={() => ask("Am I on the right track?")}
                disabled={thinking}
                className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                🔍 Check Approach
              </button>
            </div>

            <div className="px-4 pb-4 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
                placeholder="Ask Brainiac anything…"
                disabled={thinking}
                className="flex-1 bg-[#060a10] border border-white/10 text-white text-xs font-mono rounded-lg px-3 py-2 outline-none focus:border-[#9D4EDD]/50 placeholder:text-white/20 disabled:opacity-50"
              />
              <button
                onClick={() => ask()}
                disabled={!input.trim() || thinking}
                className="w-9 h-9 rounded-lg bg-[#9D4EDD]/20 border border-[#9D4EDD]/30 text-[#9D4EDD] flex items-center justify-center hover:bg-[#9D4EDD]/30 transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── ABANDON MODAL ─────────────────────────────────────────────────────────
function AbandonModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-sm bg-[#0d1117] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Flag className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Abandon Mission?</h3>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          Are you sure? Your progress will be lost and no XP will be awarded.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-mono hover:bg-white/5 transition-colors"
          >
            Keep Going
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/20 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Abandon"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function SolvePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "";
  const [, navigate] = useLocation();
  const userId = getUserId() || "";

  const [solutionMode, setSolutionMode] = useState<SolutionMode>("prose");
  const [approach, setApproach] = useState("");
  const [code, setCode] = useState("// Write your code solution here...\n");
  const [language, setLanguage] = useState("javascript");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAbandon, setShowAbandon] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [unsaved, setUnsaved] = useState(false);
  const [mobileTab, setMobileTab] = useState<"mission" | "workspace">("workspace");

  const richEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (unsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsaved]);

  useEffect(() => {
    if (approach || code !== "// Write your code solution here...\n") setUnsaved(true);
  }, [approach, code]);

  const { data: session, isLoading, isError, refetch } = useQuery<SessionData>({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await api.experienceSessions.get(sessionId);
      if (!res.ok) throw new Error(res.error || "Failed to load session");
      return normSession(res.data);
    },
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: problemNode } = useQuery<ProblemNode>({
    queryKey: ["problem-node-for-session", session?.problemNodeId],
    queryFn: async () => {
      const res = await api.problemNodes.get(session!.problemNodeId);
      if (!res.ok) throw new Error("Failed to load mission");
      return normProblemNode(res.data);
    },
    enabled: Boolean(session?.problemNodeId) && !session?.problemNode,
    staleTime: 5 * 60 * 1000,
  });

  const node: ProblemNode | undefined = session?.problemNode || problemNode;

  const { data: difficulties } = useDifficulties();
  const difficultyLookup = buildDifficultyLookup(difficulties);
  const nodeDifficultyId = node?.difficultyId || "";
  const diffMeta = difficultyLookup[nodeDifficultyId];
  const diffStyle = getDifficultyStyle(diffMeta?.rankColorHex || "");
  const diffLabel = diffMeta?.name || node?.difficultyName || "";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  function addFiles(newFiles: File[]) {
    const added: UploadedFile[] = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setFiles(prev => [...prev, ...added]);
    setUnsaved(true);
  }

  function removeFile(id: string) {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter(x => x.id !== id);
    });
  }

  async function handleSubmit() {
    setSubmitError(null);

    if (solutionMode === "prose") {
      const textContent = richEditorRef.current?.innerText?.trim() || "";
      if (!textContent) {
        setSubmitError("Please write your solution before submitting.");
        return;
      }
    } else {
      const codeVal = code.trim();
      if (!codeVal || codeVal === "// Write your code solution here...") {
        setSubmitError("Please write your code solution before submitting.");
        return;
      }
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.append("ExperienceSessionId", sessionId);

    if (solutionMode === "prose") {
      const html = richEditorRef.current?.innerHTML || "";
      fd.append("ApproachExplanation", html);
      fd.append("CodeSnippet", "");
    } else {
      fd.append("ApproachExplanation", approach);
      fd.append("CodeSnippet", code);
    }

    files.forEach(f => fd.append("EvidenceFiles", f.file));

    const res = await api.submissions.submit(fd);
    setSubmitting(false);

    if (res.ok) {
      const rd = res.data as Record<string, unknown>;
      const submissionId = String(rd?.submissionId || rd?.id || "");
      setUnsaved(false);
      navigate(`/mission/evaluating/${submissionId}/${sessionId}`);
    } else {
      setSubmitError(res.error || "Submission failed. Please try again.");
    }
  }

  async function handleAbandon() {
    setAbandoning(true);
    await api.experienceSessions.abandon(sessionId, userId);
    setAbandoning(false);
    setShowAbandon(false);
    setUnsaved(false);
    const districtId = node?.districtId;
    navigate(districtId ? `/app/district/${districtId}/missions` : "/profession/select");
  }

  return (
    <div className="h-screen bg-[#060a10] text-white flex flex-col overflow-hidden">
      {/* Top nav bar */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/30 backdrop-blur z-20">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono text-white/20">|</span>
        <span className="text-xs font-mono text-white/40 truncate max-w-[140px] sm:max-w-xs">{node?.title || "Mission Workspace"}</span>
        {unsaved && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400/60 ml-auto mr-2 sm:mr-0">
            <Save className="w-3 h-3" /> Unsaved
          </span>
        )}
        {/* Mobile tab switcher */}
        <div className="md:hidden ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-0.5">
          <button
            onClick={() => setMobileTab("mission")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200 ${
              mobileTab === "mission"
                ? "bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/30"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Mission
          </button>
          <button
            onClick={() => setMobileTab("workspace")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200 ${
              mobileTab === "workspace"
                ? "bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Workspace
          </button>
        </div>
      </header>

      {/* ─── LOADING ─── */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#00D2FF] animate-spin" />
            <p className="text-sm font-mono text-white/40">Loading session…</p>
          </div>
        </div>
      )}

      {/* ─── ERROR ─── */}
      {isError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400/60" />
          <p className="text-sm font-mono text-white/50">Failed to load session</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/20 rounded-lg px-4 py-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ─── WORKSPACE ─── */}
      {!isLoading && !isError && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Mission Panel */}
          {node && (
            <div className={`${mobileTab === "mission" ? "flex" : "hidden"} md:flex w-full md:w-[340px] flex-shrink-0`}>
              <MissionPanel node={node} elapsed={elapsed} diffStyle={diffStyle} diffLabel={diffLabel} />
            </div>
          )}

          {/* Right: Workspace */}
          <div className={`${mobileTab === "workspace" ? "flex" : "hidden"} md:flex flex-1 overflow-y-auto flex-col`}>
            <div className="flex-1 px-4 md:px-6 py-6 space-y-5 max-w-4xl w-full mx-auto">

              {/* 1. Solution type toggle */}
              <section>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Solution Type</p>
                <SolutionModeToggle mode={solutionMode} onChange={(m) => {
                  setSolutionMode(m);
                  setSubmitError(null);
                }} />
              </section>

              {/* 2. Brainiac AI Tip */}
              <BrainiacAITip mode={solutionMode} />

              {/* 3. Solution editor */}
              <AnimatePresence mode="wait">
                {solutionMode === "prose" ? (
                  <motion.section
                    key="prose"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2">
                      Your Solution
                    </label>
                    <RichTextEditor
                      editorRef={richEditorRef}
                      onInput={() => setUnsaved(true)}
                    />
                  </motion.section>
                ) : (
                  <motion.section
                    key="code"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Optional approach for code mode */}
                    <div>
                      <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2">
                        Explain your approach <span className="text-white/20 normal-case font-sans">(optional)</span>
                      </label>
                      <textarea
                        value={approach}
                        onChange={e => setApproach(e.target.value)}
                        placeholder="Briefly describe your overall strategy before writing the code…"
                        rows={3}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 font-sans outline-none focus:border-[#FFD700]/30 resize-none transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Language selector + Monaco */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-mono text-white/50 uppercase tracking-widest">
                          Code Solution
                        </label>
                        <select
                          value={language}
                          onChange={e => setLanguage(e.target.value)}
                          className="text-xs font-mono bg-[#0a0e18] border border-white/10 rounded-lg px-2 py-1.5 text-white/60 outline-none focus:border-[#FFD700]/30 cursor-pointer hover:border-white/20 transition-colors"
                        >
                          {LANGUAGES.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <Editor
                          height="320px"
                          language={language}
                          value={code}
                          onChange={v => { setCode(v || ""); setUnsaved(true); }}
                          theme="vs-dark"
                          options={{
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineNumbers: "on",
                            padding: { top: 16, bottom: 16 },
                            smoothScrolling: true,
                            cursorBlinking: "smooth",
                            renderLineHighlight: "gutter",
                            automaticLayout: true,
                          }}
                        />
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* 4. File Upload */}
              <section>
                <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2">
                  Evidence Files <span className="text-white/20 normal-case font-sans">(optional)</span>
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                    ${isDragging ? "border-[#00D2FF]/60 bg-[#00D2FF]/5 scale-[1.01]" : "border-white/10 hover:border-white/20 hover:bg-white/2"}`}
                >
                  <Upload className="w-5 h-5 text-white/20" />
                  <div className="text-center">
                    <p className="text-sm text-white/40 font-mono">Drop files here or click to upload</p>
                    <p className="text-xs text-white/20 mt-1">Images, documents, code files, ZIP archives</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map(f => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/10"
                      >
                        {f.preview ? (
                          <img src={f.preview} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                            {fileIcon(f.file)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/60 truncate">{f.file.name}</p>
                          <p className="text-[10px] text-white/30">{(f.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => removeFile(f.id)} className="text-white/20 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* 5. Brainiac AI Chat */}
              <section>
                <BrainiacPanel
                  sessionId={sessionId}
                  userId={userId}
                  approach={solutionMode === "prose" ? (richEditorRef.current?.innerText || "") : approach}
                  code={solutionMode === "code" ? code : ""}
                />
              </section>

              <div className="h-6" />
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 z-10 flex-shrink-0 bg-[#060a10]/90 backdrop-blur border-t border-white/5 px-4 sm:px-6 py-4">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <AnimatePresence>
                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 text-xs text-red-400 font-mono flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {submitError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => setShowAbandon(true)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400/60 text-sm font-mono hover:border-red-500/40 hover:text-red-400 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Abandon</span>
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] text-white text-sm font-bold font-mono hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#00D2FF]/20"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Submit Solution</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAbandon && (
          <AbandonModal
            onConfirm={handleAbandon}
            onCancel={() => setShowAbandon(false)}
            loading={abandoning}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
