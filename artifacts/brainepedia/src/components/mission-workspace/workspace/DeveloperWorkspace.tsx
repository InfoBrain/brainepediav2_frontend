import { useState } from "react";
import Editor from "@monaco-editor/react";
import { AlignLeft, Code2 } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CODE_LANGUAGES } from "@/lib/workspaceType";

type Props = {
  code: string;
  approach: string;
  language: string;
  onCodeChange: (v: string) => void;
  onApproachChange: (v: string) => void;
  onLanguageChange: (v: string) => void;
  onBlurSave?: () => void;
  focusSection?: "deliverable" | "approach";
};

export function DeveloperWorkspace({
  code,
  approach,
  language,
  onCodeChange,
  onApproachChange,
  onLanguageChange,
  onBlurSave,
  focusSection,
}: Props) {
  const [solutionMode, setSolutionMode] = useState<"prose" | "code">("prose");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-mono text-[#5e6a7f]">Solution Type</Label>
        <div className="flex items-center gap-1 rounded-xl border border-[#e6e8ef] bg-white p-1 w-fit">
          <button
            type="button"
            onClick={() => setSolutionMode("prose")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${ solutionMode === "prose" ? "border border-[#7d4ccc]/35 bg-[#f5f0fc]/15 text-[#7d4ccc]" : "text-[#5e6a7f] hover:text-[#182137]" }`}
          >
            <AlignLeft className="h-3.5 w-3.5" /> Professional Response
          </button>
          <button
            type="button"
            onClick={() => setSolutionMode("code")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${ solutionMode === "code" ? "border border-[#e0d2f3]/35 bg-[#f5f0fc]/15 text-[#7d4ccc]" : "text-[#5e6a7f] hover:text-[#182137]" }`}
          >
            <Code2 className="h-3.5 w-3.5" /> Code Solution
          </button>
        </div>
      </div>

      <div className="space-y-2" id="workspace-deliverable">
        {solutionMode === "code" ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-mono text-[#7d4ccc]/80">Implementation</Label>
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="h-7 w-[140px] text-[10px] font-mono bg-white border-[#e6e8ef]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value} className="text-xs font-mono">
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className={`rounded-xl border overflow-hidden ${ focusSection === "deliverable" ? "border-[#7d4ccc]/40 ring-1 ring-[#7d4ccc]/20" : "border-[#e6e8ef]" }`}
            >
              <Editor
                height="320px"
                language={language}
                theme="vs"
                value={code}
                onChange={(v) => onCodeChange(v ?? "")}
                onMount={(editor) => {
                  if (focusSection === "deliverable") editor.focus();
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12 },
                }}
              />
            </div>
          </>
        ) : (
          <>
            <Label className="text-xs font-mono text-[#7d4ccc]/80">Professional Response</Label>
            <div className={focusSection === "deliverable" ? "rounded-xl ring-1 ring-[#00D2FF]/20" : undefined}>
              <RichTextEditor
                value={code}
                onChange={(html) => onCodeChange(html)}
                placeholder="Write a professional report, recommendation, analysis, or proposal for this mission…"
                minHeightClassName="min-h-[320px]"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-2" id="workspace-approach">
        <Label className="text-xs font-mono text-[#5e6a7f]">Why did you make these technical decisions?</Label>
        <Textarea
          value={approach}
          onChange={(e) => onApproachChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Document your reasoning for your team lead — trade-offs, security, performance…"
          className={`min-h-[100px] text-sm bg-white border-[#e6e8ef] resize-y ${ focusSection === "approach" ? "border-[#7d4ccc]/40 ring-1 ring-[#7d4ccc]/20" : "" }`}
        />
      </div>
    </div>
  );
}
