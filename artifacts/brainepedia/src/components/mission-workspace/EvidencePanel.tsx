import { useState } from "react";
import { ExternalLink, FileUp, Link2, Loader2, Paperclip, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVIDENCE_TYPE_OPTIONS, EvidenceType, type MissionEvidenceDto } from "@/lib/missionExecutionTypes";

type StagedFile = { id: string; file: File };

type Props = {
  evidence: MissionEvidenceDto[];
  stagedFiles: StagedFile[];
  onAddLinkEvidence: (payload: {
    title: string;
    description: string;
    evidenceType: number;
    url: string;
  }) => Promise<boolean>;
  onStageFiles: (files: File[]) => void;
  onRemoveStagedFile: (id: string) => void;
  adding?: boolean;
};

function evidenceTypeLabel(type: number) {
  return EVIDENCE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Evidence";
}

export function EvidencePanel({
  evidence,
  stagedFiles,
  onAddLinkEvidence,
  onStageFiles,
  onRemoveStagedFile,
  adding,
}: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState<number>(EvidenceType.Link);

  async function handleAdd() {
    if (!title.trim() || !url.trim()) return;
    const ok = await onAddLinkEvidence({
      title: title.trim(),
      description: description.trim(),
      evidenceType,
      url: url.trim(),
    });
    if (ok) {
      setTitle("");
      setDescription("");
      setUrl("");
      setOpen(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-white/10 bg-[#0a0f16] p-4 space-y-3"
      aria-label="Evidence submission"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-[#FFD700] tracking-widest uppercase flex items-center gap-1">
          <Paperclip className="w-3 h-3" /> Evidence
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs font-mono text-white/50 h-7"
          onClick={() => setOpen((o) => !o)}
        >
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border border-white/8 rounded-lg p-3 bg-black/20">
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-white/40">Type</Label>
            <Select
              value={String(evidenceType)}
              onValueChange={(v) => setEvidenceType(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs bg-black/30 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-white/40">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs bg-black/30 border-white/10"
              placeholder="e.g. GitHub repo, Figma link"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-white/40">URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-xs bg-black/30 border-white/10"
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-white/40">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[50px] text-xs bg-black/30 border-white/10"
              placeholder="What does this evidence show?"
            />
          </div>
          <Button
            size="sm"
            disabled={adding || !title.trim() || !url.trim()}
            onClick={handleAdd}
            className="w-full text-xs font-mono bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/25"
          >
            {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
            Register evidence (+10 XP)
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/15 text-xs font-mono text-white/40 cursor-pointer hover:border-white/25 hover:text-white/55 transition-colors">
          <FileUp className="w-3.5 h-3.5" />
          Attach files (included on final submit)
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onStageFiles(files);
              e.target.value = "";
            }}
          />
        </label>

        {stagedFiles.map((sf) => (
          <div
            key={sf.id}
            className="flex items-center justify-between gap-2 text-[11px] font-mono text-white/50 border border-white/8 rounded-lg px-2 py-1.5"
          >
            <span className="truncate">{sf.file.name}</span>
            <button
              type="button"
              onClick={() => onRemoveStagedFile(sf.id)}
              className="text-white/30 hover:text-red-400 text-[10px]"
            >
              Remove
            </button>
          </div>
        ))}

        {evidence.map((ev, i) => (
          <div
            key={ev.evidenceId ?? `${ev.url}-${i}`}
            className="flex items-start gap-2 border border-white/8 rounded-lg p-2 bg-black/15"
          >
            <Zap className="w-3 h-3 text-[#FFD700]/60 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/80 font-medium truncate">{ev.title}</p>
              <p className="text-[10px] text-white/35 font-mono">{evidenceTypeLabel(ev.evidenceType)}</p>
              {ev.url && (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#00D2FF]/70 hover:text-[#00D2FF] flex items-center gap-1 mt-0.5 truncate"
                >
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{ev.url}</span>
                </a>
              )}
            </div>
          </div>
        ))}

        {evidence.length === 0 && stagedFiles.length === 0 && (
          <p className="text-[11px] font-mono text-white/30 text-center py-2">
            Add links or files to support your submission.
          </p>
        )}
      </div>
    </section>
  );
}
