import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  className?: string;
};

export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const element = document.createElement("div");
  element.innerHTML = html;
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Write formatted content...",
  minHeightClassName = "min-h-[280px]",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef("");
  const [isEmpty, setIsEmpty] = useState(!htmlToPlainText(value));

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value !== lastValueRef.current && value !== editor.innerHTML) {
      editor.innerHTML = value || "";
      lastValueRef.current = value || "";
      setIsEmpty(!htmlToPlainText(value || ""));
    }
  }, [value]);

  function emit() {
    const html = editorRef.current?.innerHTML || "";
    const plainText = htmlToPlainText(html);
    lastValueRef.current = html;
    setIsEmpty(!plainText);
    onChange(html, plainText);
  }

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    emit();
  }

  function handlePaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, html || text.replace(/\n/g, "<br>"));
    emit();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "b" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      exec("bold");
    }
    if (event.key === "i" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      exec("italic");
    }
    if (event.key === "u" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      exec("underline");
    }
  }

  const toolbarBtn =
    "rounded p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white";

  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-[#0a0e18] px-3 py-2">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} className={toolbarBtn} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} className={toolbarBtn} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }} className={toolbarBtn} title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "h2"); }} className={toolbarBtn} title="Heading">
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "h3"); }} className={toolbarBtn} title="Subheading">
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "p"); }} className={toolbarBtn} title="Paragraph">
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} className={toolbarBtn} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} className={toolbarBtn} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "blockquote"); }} className={toolbarBtn} title="Block quote">
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "pre"); }} className={toolbarBtn} title="Code block">
          <Code2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          className={toolbarBtn}
          title="Link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            if (editorRef.current) {
              editorRef.current.innerHTML = "";
              emit();
            }
          }}
          className="ml-auto rounded p-1.5 text-white/25 transition-colors hover:bg-red-400/10 hover:text-red-300"
          title="Clear"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className={cn("relative", minHeightClassName)}>
        {isEmpty && (
          <p className="pointer-events-none absolute left-4 top-4 select-none text-sm leading-relaxed text-white/25">
            {placeholder}
          </p>
        )}
        <div
          id={id}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className={cn(
            "px-4 py-4 text-sm leading-relaxed text-white/80 outline-none",
            minHeightClassName,
            "[&_a]:text-[#00D2FF] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#00D2FF]/50 [&_blockquote]:pl-3 [&_blockquote]:text-white/60",
            "[&_code]:rounded [&_code]:bg-black/35 [&_code]:px-1 [&_code]:py-0.5 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white",
            "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white/90 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1",
            "[&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_strong]:text-white",
            "[&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1"
          )}
        />
      </div>
    </div>
  );
}
