import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileUp, Link2, Loader2, X } from "lucide-react";
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
import { EVIDENCE_TYPE_OPTIONS, EvidenceType } from "@/lib/missionExecutionTypes";

type StagedFile = { id: string; file: File };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLinkEvidence: (payload: {
    title: string;
    description: string;
    evidenceType: number;
    url: string;
  }) => Promise<boolean>;
  onStageFiles: (files: File[]) => void;
  stagedFiles: StagedFile[];
  onRemoveStagedFile: (id: string) => void;
  adding?: boolean;
};

export function EvidenceDrawer({
  open,
  onOpenChange,
  onAddLinkEvidence,
  onStageFiles,
  stagedFiles,
  onRemoveStagedFile,
  adding,
}: Props) {
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
      onOpenChange(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white border-l border-[#e6e8ef] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-drawer-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e8ef]">
              <h2 id="evidence-drawer-title" className="text-lg font-bold font-mono">
                Add Evidence
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-[#7a869d] hover:text-[#182137] p-1"
                aria-label="Close evidence drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-mono text-[#6b768c]">Type</Label>
                <Select value={String(evidenceType)} onValueChange={(v) => setEvidenceType(Number(v))}>
                  <SelectTrigger className="h-9 text-xs bg-white border-[#e6e8ef]">
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
                <Label className="text-[10px] font-mono text-[#6b768c]">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs bg-white border-[#e6e8ef]"
                  placeholder="e.g. GitHub repo, Figma link"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-mono text-[#6b768c]">URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-9 text-xs bg-white border-[#e6e8ef]"
                  placeholder="https://…"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-mono text-[#6b768c]">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[60px] text-xs bg-white border-[#e6e8ef]"
                  placeholder="What does this evidence show?"
                />
              </div>

              <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-[#d8dde8] text-xs font-mono text-[#6b768c] cursor-pointer hover:border-white/25 hover:text-[#182137]/55 transition-colors">
                <FileUp className="w-4 h-4" />
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
                  className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#5e6a7f] border border-[#e6e8ef] rounded-lg px-3 py-2"
                >
                  <span className="truncate">{sf.file.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveStagedFile(sf.id)}
                    className="text-[#7a869d] hover:text-red-400 text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-[#e6e8ef]">
              <Button
                disabled={adding || !title.trim() || !url.trim()}
                onClick={handleAdd}
                className="w-full text-xs font-mono bg-[#f5f0fc]/15 text-[#7d4ccc] border border-[#e0d2f3]/25 gap-1"
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Add Evidence
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
