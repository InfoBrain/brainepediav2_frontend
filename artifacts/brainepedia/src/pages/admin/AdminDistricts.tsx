import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
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
  Wand2,
  CheckCircle2,
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

type Profession = { id: string; name: string };
type District = {
  id: string;
  name: string;
  description?: string;
  professionId?: string;
  completion?: number;
};

type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; district: District };
type DeleteState = { open: false } | { open: true; district: District };

function normProfessions(d: any): Profession[] {
  const arr = Array.isArray(d) ? d : d?.data || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.professionId ?? x.professionsId ?? ""),
    name: x.name || x.professionName || "",
  }));
}

function normDistricts(d: any): District[] {
  const arr = Array.isArray(d) ? d : d?.data || d?.districts || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.districtId ?? ""),
    name: x.name || x.districtName || "",
    description: x.description || "",
    professionId: x.professionId || "",
    completion: typeof x.completion === "number" ? x.completion : undefined,
  }));
}

type DistrictForm = {
  name: string;
  description: string;
  mapCoordinatesJson: string;
  professionId: string;
  assetFile: File | null;
};

const emptyForm = (): DistrictForm => ({
  name: "",
  description: "",
  mapCoordinatesJson: "",
  professionId: "",
  assetFile: null,
});

export default function AdminDistricts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [profLoading, setProfLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<DistrictForm>(emptyForm());
  const [assetPreview, setAssetPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // AI seed state
  const [aiSeeding, setAiSeeding] = useState(false);
  const [aiSeedMsg, setAiSeedMsg] = useState(0);
  const AI_SEED_MESSAGES = [
    "Designing districts…",
    "Mapping skill zones…",
    "Structuring learning paths…",
    "Finalising district layout…",
  ];

  useEffect(() => {
    (async () => {
      setProfLoading(true);
      const res = await api.professions.list();
      setProfLoading(false);
      if (res.ok) setProfessions(normProfessions(res.data));
    })();
  }, []);

  const loadDistricts = useCallback(async (professionId: string) => {
    if (!professionId) { setDistricts([]); return; }
    setLoading(true);
    const res = await api.districts.byProfession(professionId);
    setLoading(false);
    if (res.ok) setDistricts(normDistricts(res.data));
    else setDistricts([]);
  }, []);

  useEffect(() => {
    loadDistricts(selectedProfessionId);
  }, [selectedProfessionId, loadDistricts]);

  useEffect(() => {
    if (!userId) navigate("/auth/login");
  }, [userId, navigate]);

  function setField<K extends keyof DistrictForm>(k: K, v: DistrictForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleFile(file: File | null) {
    if (!file) return;
    setField("assetFile", file);
    if (file.type.startsWith("image/")) {
      setAssetPreview(URL.createObjectURL(file));
    } else {
      setAssetPreview(null);
    }
  }

  async function handleAiSeed() {
    if (!selectedProfessionId) {
      toast({ title: "Select a profession first", variant: "destructive" });
      return;
    }
    setAiSeeding(true);
    setAiSeedMsg(0);
    const interval = setInterval(() => setAiSeedMsg(i => (i + 1) % AI_SEED_MESSAGES.length), 2000);
    const profName = professions.find(p => p.id === selectedProfessionId)?.name || "this profession";
    const res = await api.districts.seedDistricts(selectedProfessionId);
    clearInterval(interval);
    setAiSeeding(false);
    if (res.ok) {
      toast({ title: "Districts generated!", description: `Districts for "${profName}" are ready.` });
      loadDistricts(selectedProfessionId);
    } else {
      toast({ title: "AI generation failed", description: res.error, variant: "destructive" });
    }
  }

  function openCreate() {
    setForm({ ...emptyForm(), professionId: selectedProfessionId });
    setAssetPreview(null);
    setModal({ open: true, mode: "create" });
  }

  function openEdit(d: District) {
    setForm({
      name: d.name,
      description: d.description || "",
      mapCoordinatesJson: "",
      professionId: d.professionId || selectedProfessionId,
      assetFile: null,
    });
    setAssetPreview(null);
    setModal({ open: true, mode: "edit", district: d });
  }

  function closeModal() { setModal({ open: false }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!form.professionId) {
      toast({ title: "Please select a profession", variant: "destructive" });
      return;
    }
    if (!userId) { navigate("/auth/login"); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("Name", form.name.trim());
    fd.append("Description", form.description);
    fd.append("MapCoordinatesJson", form.mapCoordinatesJson);
    fd.append("ProfessionId", form.professionId);
    if (form.assetFile) fd.append("AssetFile", form.assetFile);

    const res = modal.open && modal.mode === "edit"
      ? await api.districts.update(modal.district.id, userId, fd)
      : await api.districts.create(userId, fd);

    setSaving(false);
    if (res.ok) {
      toast({ title: modal.open && modal.mode === "edit" ? "District updated" : "District created" });
      closeModal();
      loadDistricts(selectedProfessionId);
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteState.open) return;
    if (!userId) { navigate("/auth/login"); return; }
    setDeleting(true);
    const res = await api.districts.delete(deleteState.district.id, userId);
    setDeleting(false);
    if (res.ok) {
      toast({ title: "District deleted" });
      setDeleteState({ open: false });
      loadDistricts(selectedProfessionId);
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  return (
    <DashboardShell nav={nav} title="Districts">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Districts</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage learning districts within each profession</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleAiSeed}
              disabled={!selectedProfessionId || aiSeeding}
              className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 gap-2 disabled:opacity-40"
            >
              {aiSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {aiSeeding ? "Generating…" : "Generate with AI"}
            </Button>
            <Button
              onClick={openCreate}
              disabled={!selectedProfessionId}
              className="bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black font-semibold gap-2 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              New District
            </Button>
          </div>
        </div>

        {/* Profession Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">Filter by Profession:</label>
          {profLoading ? (
            <Loader2 className="w-4 h-4 text-[#00D2FF] animate-spin" />
          ) : (
            <select
              value={selectedProfessionId}
              onChange={e => setSelectedProfessionId(e.target.value)}
              className="bg-[#0D1117] border border-[#00D2FF]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#00D2FF] outline-none min-w-[200px]"
            >
              <option value="">— Select profession —</option>
              {professions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#00D2FF]/20 bg-[#0D1117] overflow-hidden">
          {!selectedProfessionId ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <MapPin className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Select a profession to view its districts</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 text-[#00D2FF] animate-spin" />
            </div>
          ) : districts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <MapPin className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No districts yet. Create one to get started.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#00D2FF]/10 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 w-32">Completion</th>
                  <th className="px-5 py-3 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-[#00D2FF]/05 hover:bg-[#00D2FF]/05 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-white font-medium">{d.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-400 text-sm line-clamp-1">{d.description || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      {typeof d.completion === "number" ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00D2FF] rounded-full"
                              style={{ width: `${Math.min(d.completion, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{d.completion}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#00D2FF] hover:bg-[#00D2FF]/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteState({ open: true, district: d })}
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
              className="relative w-full max-w-lg bg-[#0D1117] border border-[#00D2FF]/30 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                  {modal.mode === "create" ? "Create District" : "Edit District"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Name <span className="text-[#00D2FF]">*</span></label>
                  <Input
                    value={form.name}
                    onChange={e => setField("name", e.target.value)}
                    placeholder="e.g. Frontend Fundamentals"
                    className="bg-[#0A0E14] border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setField("description", e.target.value)}
                    placeholder="Brief description of this district..."
                    rows={3}
                    className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF] rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Map Coordinates JSON</label>
                  <textarea
                    value={form.mapCoordinatesJson}
                    onChange={e => setField("mapCoordinatesJson", e.target.value)}
                    placeholder='{"x": 0, "y": 0, "width": 100, "height": 100}'
                    rows={3}
                    className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF] rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Profession <span className="text-[#00D2FF]">*</span></label>
                  <select
                    value={form.professionId}
                    onChange={e => setField("professionId", e.target.value)}
                    className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#00D2FF] outline-none"
                  >
                    <option value="">— Select profession —</option>
                    {professions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Asset File</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragging(false);
                      handleFile(e.dataTransfer.files[0] || null);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      dragging
                        ? "border-[#00D2FF] bg-[#00D2FF]/10"
                        : "border-[#00D2FF]/20 hover:border-[#00D2FF]/50 hover:bg-[#00D2FF]/5"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx"
                      className="sr-only"
                      onChange={e => handleFile(e.target.files?.[0] || null)}
                    />
                    {assetPreview ? (
                      <img src={assetPreview} alt="preview" className="w-24 h-24 mx-auto rounded-xl object-cover border border-[#00D2FF]/30" />
                    ) : form.assetFile ? (
                      <p className="text-sm text-[#00D2FF]">{form.assetFile.name}</p>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto mb-2 text-[#00D2FF]/50" />
                        <p className="text-sm text-gray-400">Drag & drop or click to upload</p>
                        <p className="text-xs text-gray-600 mt-1">Image, PDF, or document</p>
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
              <h2 className="text-lg font-bold text-white mb-2">Delete District</h2>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to delete <span className="text-white font-medium">"{deleteState.district.name}"</span>? This cannot be undone.
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

      {/* AI Seeding Overlay */}
      <AnimatePresence>
        {aiSeeding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-5 px-8 py-10 bg-[#0D1117] border border-purple-500/30 rounded-2xl shadow-2xl max-w-xs w-full mx-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={aiSeedMsg}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-purple-300 font-mono text-center"
                >
                  {AI_SEED_MESSAGES[aiSeedMsg]}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-gray-600 text-center">
                Designing districts for{" "}
                <span className="text-gray-400">
                  {professions.find(p => p.id === selectedProfessionId)?.name || "this profession"}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
