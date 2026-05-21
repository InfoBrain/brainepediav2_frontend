import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Loader2,
  Pencil,
  Trash2,
  Plus,
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  Wand2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";


type Profession = { id: string; name: string; iconUrl?: string };
type ModalState = { open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; profession: Profession };
type DeleteState = { open: false } | { open: true; profession: Profession };
type AiState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "preview"; items: { name: string; iconUrl?: string }[] }
  | { phase: "error"; message: string };

function normProfessions(d: any): Profession[] {
  const arr = Array.isArray(d) ? d : d?.data || d?.professions || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.professionId ?? x.professionsId ?? ""),
    name: x.name || x.professionName || "",
    iconUrl: x.iconUrl || x.icon || x.imageUrl || "",
  }));
}

const AI_MESSAGES = [
  "AI is crafting professions…",
  "Analysing real-world career paths…",
  "Generating skill taxonomies…",
  "Finalising profession profiles…",
];

export default function AdminProfessions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI Generate state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiState, setAiState] = useState<AiState>({ phase: "idle" });
  const [aiMsgIdx, setAiMsgIdx] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.professions.list();
    setLoading(false);
    if (res.ok) setProfessions(normProfessions(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) navigate("/auth/login");
  }, [userId, navigate]);

  // Cycle loading messages
  useEffect(() => {
    if (aiState.phase !== "loading") return;
    const t = setInterval(() => setAiMsgIdx(i => (i + 1) % AI_MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, [aiState.phase]);

  function openCreate() {
    setName(""); setIconFile(null); setIconPreview(null);
    setModal({ open: true, mode: "create" });
  }
  function openEdit(p: Profession) {
    setName(p.name); setIconFile(null); setIconPreview(p.iconUrl || null);
    setModal({ open: true, mode: "edit", profession: p });
  }
  function closeModal() { setModal({ open: false }); }
  function handleFile(file: File | null) {
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!userId) { navigate("/auth/login"); return; }
    setSaving(true);
    let res;
    if (modal.open && modal.mode === "edit") {
      const existingIconUrl = !iconFile ? (modal.profession.iconUrl || null) : null;
      res = await api.professions.update(modal.profession.id, { name: name.trim(), iconUrl: existingIconUrl }, iconFile);
    } else {
      const fd = new FormData();
      fd.append("Name", name.trim());
      if (iconFile) fd.append("IconFile", iconFile);
      const createRes = await api.professions.create(userId, fd);
      if (!createRes.ok) {
        setSaving(false);
        toast({ title: "Error", description: createRes.error, variant: "destructive" });
        return;
      }
      const newId = createRes.data?.professionId;
      if (newId) await api.professions.update(newId, { name: name.trim() }, iconFile ?? null);
      res = createRes;
    }
    setSaving(false);
    if (res.ok) {
      toast({ title: modal.open && modal.mode === "edit" ? "Profession updated" : "Profession created" });
      closeModal(); load();
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteState.open) return;
    if (!userId) { navigate("/auth/login"); return; }
    setDeleting(true);
    const res = await api.professions.delete(deleteState.profession.id, userId);
    setDeleting(false);
    if (res.ok) {
      toast({ title: "Profession deleted" });
      setDeleteState({ open: false }); load();
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  async function runAiGenerate() {
    setAiState({ phase: "loading" });
    setAiMsgIdx(0);
    const res = await api.professions.generateSeed(aiCount);
    if (res.ok) {
      const items = normProfessions(res.data);
      setAiState({ phase: "preview", items });
      // Reload the main list so accepted professions appear
      load();
    } else {
      setAiState({ phase: "error", message: res.error || "AI generation failed" });
    }
  }

  function openAiModal() {
    setAiOpen(true);
    setAiState({ phase: "idle" });
    setAiCount(5);
  }
  function closeAiModal() {
    setAiOpen(false);
    setAiState({ phase: "idle" });
  }
  function handleAcceptAll() {
    const count = aiState.phase === "preview" ? aiState.items.length : 0;
    toast({ title: "Professions accepted", description: `${count} professions are now live.` });
    load();
    closeAiModal();
  }

  return (
    <DashboardShell nav={ADMIN_NAV} title="Professions">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Professions</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage career paths and their icons</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={openAiModal}
              className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate with AI
            </Button>
            <Button
              onClick={openCreate}
              className="bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              New Profession
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#00D2FF]/20 bg-[#0D1117] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 text-[#00D2FF] animate-spin" />
            </div>
          ) : professions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <BookOpen className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No professions yet. Create one or use AI to generate.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#00D2FF]/10 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 w-16">Icon</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {professions.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-[#00D2FF]/05 hover:bg-[#00D2FF]/05 transition-colors"
                  >
                    <td className="px-5 py-3">
                      {p.iconUrl ? (
                        <img src={p.iconUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-[#00D2FF]/20" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#00D2FF]/10 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-[#00D2FF]/50" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-white font-medium">{p.name}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-gray-400 hover:text-[#00D2FF] hover:bg-[#00D2FF]/10 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteState({ open: true, profession: p })} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── AI Generate Modal ── */}
      <AnimatePresence>
        {aiOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAiModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0D1117] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-purple-500/10">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">Generate Professions with AI</h2>
                </div>
                <button onClick={closeAiModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Config */}
                {aiState.phase === "idle" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <p className="text-sm text-gray-400">
                      AI will generate career profession entries and add them directly to the platform.
                    </p>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">
                        Number of professions <span className="text-purple-400">*</span>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={aiCount}
                        onChange={e => setAiCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                        className="bg-[#0A0E14] border-purple-500/20 text-white focus:border-purple-400 w-32"
                      />
                      <p className="text-xs text-gray-600 mt-1">Between 1 and 20</p>
                    </div>
                    <Button
                      onClick={runAiGenerate}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate {aiCount} Profession{aiCount !== 1 ? "s" : ""}
                    </Button>
                  </motion.div>
                )}

                {/* Loading */}
                {aiState.phase === "loading" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={aiMsgIdx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-sm text-purple-300 font-mono text-center"
                      >
                        {AI_MESSAGES[aiMsgIdx]}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Error */}
                {aiState.phase === "error" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Generation failed</p>
                      <p className="text-sm text-gray-400">{aiState.message}</p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <Button variant="outline" onClick={closeAiModal} className="flex-1 border-gray-700 text-gray-400">
                        Close
                      </Button>
                      <Button onClick={runAiGenerate} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white gap-2">
                        <RefreshCw className="w-4 h-4" /> Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Preview */}
                {aiState.phase === "preview" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="text-sm font-medium">
                        {aiState.items.length} profession{aiState.items.length !== 1 ? "s" : ""} generated successfully
                      </p>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {aiState.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5"
                        >
                          {item.iconUrl ? (
                            <img src={item.iconUrl} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-purple-500/20" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-purple-400/60" />
                            </div>
                          )}
                          <span className="text-white font-medium text-sm">{item.name}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button
                        variant="outline"
                        onClick={runAiGenerate}
                        className="flex-1 border-gray-700 text-gray-400 hover:text-white gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Regenerate
                      </Button>
                      <Button
                        onClick={handleAcceptAll}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept All
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create/Edit Modal ── */}
      <AnimatePresence>
        {modal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0D1117] border border-[#00D2FF]/30 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                  {modal.mode === "create" ? "Create Profession" : "Edit Profession"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Name <span className="text-[#00D2FF]">*</span></label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Software Engineering"
                    className="bg-[#0A0E14] border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Icon Image</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0] || null); }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragging ? "border-[#00D2FF] bg-[#00D2FF]/10" : "border-[#00D2FF]/20 hover:border-[#00D2FF]/50 hover:bg-[#00D2FF]/5"
                    }`}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only"
                      onChange={e => handleFile(e.target.files?.[0] || null)} />
                    {iconPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={iconPreview} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-[#00D2FF]/30" />
                        <p className="text-xs text-gray-400">{iconFile?.name || "Current icon"}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 mx-auto mb-2 text-[#00D2FF]/50" />
                        <p className="text-sm text-gray-400">Drag & drop or click to upload</p>
                        <p className="text-xs text-gray-600 mt-1">PNG, JPG, SVG up to 5 MB</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1 border-gray-700 text-gray-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black font-semibold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : modal.mode === "create" ? "Create" : "Save"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {deleteState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDeleteState({ open: false })} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0D1117] border border-red-500/30 rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-2">Delete Profession</h2>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to delete <span className="text-white font-medium">"{deleteState.profession.name}"</span>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleteState({ open: false })} className="flex-1 border-gray-700 text-gray-400 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
