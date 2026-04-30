import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Database,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  X,
  Upload,
  BookOpen,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const nav: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/professions", label: "Professions", icon: BookOpen },
  { href: "/admin/districts", label: "Districts", icon: MapPin },
  { href: "/admin/problem-nodes", label: "Problem Nodes", icon: Database },
  { href: "/admin/seed", label: "AI Seed Tool", icon: Sparkles },
  { href: "/admin/users", label: "User Audit", icon: Users },
];

type Profession = {
  id: string;
  name: string;
  iconUrl?: string;
};

type ModalState = { open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; profession: Profession };
type DeleteState = { open: false } | { open: true; profession: Profession };

function normProfessions(d: any): Profession[] {
  const arr = Array.isArray(d) ? d : d?.data || d?.professions || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.professionId ?? x.professionsId ?? ""),
    name: x.name || x.professionName || "",
    iconUrl: x.iconUrl || x.icon || x.imageUrl || "",
  }));
}

export default function AdminProfessions() {
  const { toast } = useToast();
  const userId = getUserId() || "";

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

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.professions.list();
    setLoading(false);
    if (res.ok) setProfessions(normProfessions(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setName("");
    setIconFile(null);
    setIconPreview(null);
    setModal({ open: true, mode: "create" });
  }

  function openEdit(p: Profession) {
    setName(p.name);
    setIconFile(null);
    setIconPreview(p.iconUrl || null);
    setModal({ open: true, mode: "edit", profession: p });
  }

  function closeModal() {
    setModal({ open: false });
  }

  function handleFile(file: File | null) {
    if (!file) return;
    setIconFile(file);
    const url = URL.createObjectURL(file);
    setIconPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("userId", userId);
    if (iconFile) fd.append("iconFile", iconFile);

    const res = modal.open && modal.mode === "edit"
      ? await api.professions.update(modal.profession.id, fd)
      : await api.professions.create(fd);

    setSaving(false);
    if (res.ok) {
      toast({ title: modal.open && modal.mode === "edit" ? "Profession updated" : "Profession created" });
      closeModal();
      load();
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteState.open) return;
    setDeleting(true);
    const res = await api.professions.delete(deleteState.profession.id);
    setDeleting(false);
    if (res.ok) {
      toast({ title: "Profession deleted" });
      setDeleteState({ open: false });
      load();
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  return (
    <DashboardShell nav={nav} title="Professions">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Professions</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage career paths and their icons</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            New Profession
          </Button>
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
              <p className="text-sm">No professions yet. Create one to get started.</p>
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
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#00D2FF] hover:bg-[#00D2FF]/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteState({ open: true, profession: p })}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeModal}
            />
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
                    onDrop={e => {
                      e.preventDefault();
                      setDragging(false);
                      handleFile(e.dataTransfer.files[0] || null);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragging
                        ? "border-[#00D2FF] bg-[#00D2FF]/10"
                        : "border-[#00D2FF]/20 hover:border-[#00D2FF]/50 hover:bg-[#00D2FF]/5"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={e => handleFile(e.target.files?.[0] || null)}
                    />
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

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDeleteState({ open: false })}
            />
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
