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
  Zap,
  Clock,
  ChevronRight,
  Wand2,
  PlusCircle,
  Minus,
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
type District = { id: string; name: string };
type Difficulty = { id: string; name: string; level?: number };
type ProblemNode = {
  id: string;
  title: string;
  difficultyId?: string;
  difficultyName?: string;
  experiencePoints?: number;
  estimatedMinutes?: number;
  status?: string;
};

type NodeForm = {
  title: string;
  context: string;
  missionBrief: string;
  constraints: string[];
  expectedOutcomes: string[];
  experiencePoints: string;
  estimatedMinutes: string;
  difficultyId: string;
  districtId: string;
  attachment: File | null;
};

const emptyForm = (districtId = ""): NodeForm => ({
  title: "",
  context: "",
  missionBrief: "",
  constraints: [""],
  expectedOutcomes: [""],
  experiencePoints: "",
  estimatedMinutes: "",
  difficultyId: "",
  districtId,
  attachment: null,
});

type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; node: ProblemNode };
type DeleteState = { open: false } | { open: true; node: ProblemNode };
type AIState = { open: boolean; loading: boolean; preview: any };

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
  }));
}
function normDifficulties(d: any): Difficulty[] {
  const arr = Array.isArray(d) ? d : d?.data || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.difficultyId ?? ""),
    name: x.name || x.difficultyName || `Level ${x.level ?? ""}`,
    level: x.level,
  }));
}
function normNodes(d: any): ProblemNode[] {
  const arr = Array.isArray(d) ? d : d?.data || d?.nodes || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.nodeId ?? x.problemNodeId ?? ""),
    title: x.title || x.name || "",
    difficultyId: x.difficultyId || "",
    difficultyName: x.difficultyName || x.difficulty?.name || "",
    experiencePoints: typeof x.experiencePoints === "number" ? x.experiencePoints : undefined,
    estimatedMinutes: typeof x.estimatedMinutes === "number" ? x.estimatedMinutes : undefined,
    status: x.status || "",
  }));
}

function DynamicList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  function update(i: number, v: string) {
    const next = [...items];
    next[i] = v;
    onChange(next);
  }
  function add() { onChange([...items, ""]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-gray-400">{label}</label>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-[#00D2FF] hover:text-[#00D2FF]/80 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholder}
              className="bg-[#0A0E14] border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF] text-sm"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminProblemNodes() {
  const { toast } = useToast();
  const userId = getUserId() || "";
  const fileRef = useRef<HTMLInputElement>(null);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedProfId, setSelectedProfId] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistId, setSelectedDistId] = useState("");
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [nodes, setNodes] = useState<ProblemNode[]>([]);
  const [profLoading, setProfLoading] = useState(true);
  const [distLoading, setDistLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<NodeForm>(emptyForm());
  const [dragging, setDragging] = useState(false);
  const [ai, setAi] = useState<AIState>({ open: false, loading: false, preview: null });
  const [aiForm, setAiForm] = useState({ topic: "", districtId: "", difficultyId: "" });

  useEffect(() => {
    (async () => {
      setProfLoading(true);
      const [profRes, diffRes] = await Promise.all([
        api.professions.list(),
        api.difficulties.list(),
      ]);
      setProfLoading(false);
      if (profRes.ok) setProfessions(normProfessions(profRes.data));
      if (diffRes.ok) setDifficulties(normDifficulties(diffRes.data));
    })();
  }, []);

  const loadDistricts = useCallback(async (profId: string) => {
    if (!profId) { setDistricts([]); setSelectedDistId(""); return; }
    setDistLoading(true);
    const res = await api.districts.byProfession(profId);
    setDistLoading(false);
    if (res.ok) setDistricts(normDistricts(res.data));
    else setDistricts([]);
    setSelectedDistId("");
  }, []);

  const loadNodes = useCallback(async (distId: string) => {
    if (!distId) { setNodes([]); return; }
    setLoading(true);
    const res = await api.problemNodes.byDistrict(distId);
    setLoading(false);
    if (res.ok) setNodes(normNodes(res.data));
    else setNodes([]);
  }, []);

  useEffect(() => { loadDistricts(selectedProfId); }, [selectedProfId, loadDistricts]);
  useEffect(() => { loadNodes(selectedDistId); }, [selectedDistId, loadNodes]);

  function setField<K extends keyof NodeForm>(k: K, v: NodeForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setForm(emptyForm(selectedDistId));
    setModal({ open: true, mode: "create" });
  }

  async function openEdit(node: ProblemNode) {
    // Load full node to get constraints etc.
    const res = await api.problemNodes.get(node.id);
    let full: any = node;
    if (res.ok && res.data) full = res.data;
    const parseArray = (v: any): string[] => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === "string") {
        try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(String) : [v]; } catch { return [v]; }
      }
      return [""];
    };
    setForm({
      title: full.title || "",
      context: full.context || "",
      missionBrief: full.missionBrief || "",
      constraints: parseArray(full.constraints).length ? parseArray(full.constraints) : [""],
      expectedOutcomes: parseArray(full.expectedOutcomes).length ? parseArray(full.expectedOutcomes) : [""],
      experiencePoints: String(full.experiencePoints ?? ""),
      estimatedMinutes: String(full.estimatedMinutes ?? ""),
      difficultyId: full.difficultyId || "",
      districtId: full.districtId || selectedDistId,
      attachment: null,
    });
    setModal({ open: true, mode: "edit", node });
  }

  function closeModal() { setModal({ open: false }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("Title", form.title.trim());
    fd.append("Context", form.context);
    fd.append("MissionBrief", form.missionBrief);
    fd.append("Constraints", JSON.stringify(form.constraints.filter(Boolean)));
    fd.append("ExpectedOutcomes", JSON.stringify(form.expectedOutcomes.filter(Boolean)));
    fd.append("ExperiencePoints", form.experiencePoints || "0");
    fd.append("EstimatedMinutes", form.estimatedMinutes || "0");
    fd.append("DifficultyId", form.difficultyId);
    fd.append("DistrictId", form.districtId || selectedDistId);
    if (form.attachment) fd.append("Attachment", form.attachment);

    const res = modal.open && modal.mode === "edit"
      ? await api.problemNodes.update(modal.node.id, userId, fd)
      : await api.problemNodes.create(userId, fd);

    setSaving(false);
    if (res.ok) {
      toast({ title: modal.open && modal.mode === "edit" ? "Problem node updated" : "Problem node created" });
      closeModal();
      loadNodes(selectedDistId);
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteState.open) return;
    setDeleting(true);
    const res = await api.problemNodes.delete(deleteState.node.id, userId);
    setDeleting(false);
    if (res.ok) {
      toast({ title: "Problem node deleted" });
      setDeleteState({ open: false });
      loadNodes(selectedDistId);
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  }

  async function handleAiGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!aiForm.topic.trim()) {
      toast({ title: "Topic is required", variant: "destructive" });
      return;
    }
    setAi(s => ({ ...s, loading: true, preview: null }));
    const res = await api.problemNodes.aiGenerate(userId, {
      topic: aiForm.topic,
      districtId: aiForm.districtId || selectedDistId,
      difficultyId: aiForm.difficultyId,
    });
    setAi(s => ({ ...s, loading: false, preview: res.ok ? res.data : null }));
    if (!res.ok) toast({ title: "AI generation failed", description: res.error, variant: "destructive" });
  }

  async function saveAiPreview() {
    if (!ai.preview) return;
    const p = ai.preview;
    const parseArray = (v: any): string[] => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === "string") { try { return JSON.parse(v); } catch { return [v]; } }
      return [""];
    };
    setSaving(true);
    const fd = new FormData();
    fd.append("Title", p.title || "AI Generated");
    fd.append("Context", p.context || "");
    fd.append("MissionBrief", p.missionBrief || "");
    fd.append("Constraints", JSON.stringify(parseArray(p.constraints)));
    fd.append("ExpectedOutcomes", JSON.stringify(parseArray(p.expectedOutcomes)));
    fd.append("ExperiencePoints", String(p.experiencePoints ?? 0));
    fd.append("EstimatedMinutes", String(p.estimatedMinutes ?? 0));
    fd.append("DifficultyId", aiForm.difficultyId);
    fd.append("DistrictId", aiForm.districtId || selectedDistId);
    const res = await api.problemNodes.create(userId, fd);
    setSaving(false);
    if (res.ok) {
      toast({ title: "AI problem node saved!" });
      setAi({ open: false, loading: false, preview: null });
      loadNodes(selectedDistId);
    } else {
      toast({ title: "Error saving", description: res.error, variant: "destructive" });
    }
  }

  const diffName = (id: string) => difficulties.find(d => d.id === id)?.name || id;

  return (
    <DashboardShell nav={nav} title="Problem Nodes">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Problem Nodes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage challenges and missions within districts</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAi({ open: true, loading: false, preview: null })}
              variant="outline"
              className="border-[#9D4EDD]/40 text-[#9D4EDD] hover:bg-[#9D4EDD]/10 gap-2"
            >
              <Wand2 className="w-4 h-4" />
              AI Generate
            </Button>
            <Button
              onClick={openCreate}
              disabled={!selectedDistId}
              className="bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black font-semibold gap-2 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              New Node
            </Button>
          </div>
        </div>

        {/* Cascade Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {profLoading ? (
            <Loader2 className="w-4 h-4 text-[#00D2FF] animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400 whitespace-nowrap">Profession:</label>
                <select
                  value={selectedProfId}
                  onChange={e => setSelectedProfId(e.target.value)}
                  className="bg-[#0D1117] border border-[#00D2FF]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#00D2FF] outline-none min-w-[180px]"
                >
                  <option value="">— Select —</option>
                  {professions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {selectedProfId && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400 whitespace-nowrap">District:</label>
                    {distLoading ? (
                      <Loader2 className="w-4 h-4 text-[#00D2FF] animate-spin" />
                    ) : (
                      <select
                        value={selectedDistId}
                        onChange={e => setSelectedDistId(e.target.value)}
                        className="bg-[#0D1117] border border-[#00D2FF]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#00D2FF] outline-none min-w-[180px]"
                      >
                        <option value="">— Select —</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#00D2FF]/20 bg-[#0D1117] overflow-hidden">
          {!selectedDistId ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Database className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Select a profession and district to view problem nodes</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 text-[#00D2FF] animate-spin" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Database className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No problem nodes yet. Create one or use AI Generate.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#00D2FF]/10 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Difficulty</th>
                  <th className="px-5 py-3 w-24">XP</th>
                  <th className="px-5 py-3 w-24">Time</th>
                  <th className="px-5 py-3 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n, i) => (
                  <motion.tr
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-[#00D2FF]/05 hover:bg-[#00D2FF]/05 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-white font-medium">{n.title}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30">
                        {n.difficultyName || diffName(n.difficultyId || "") || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-[#FFD700] text-sm font-medium">
                        <Zap className="w-3.5 h-3.5" />
                        {n.experiencePoints ?? "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {n.estimatedMinutes != null ? `${n.estimatedMinutes}m` : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(n)}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#00D2FF] hover:bg-[#00D2FF]/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteState({ open: true, node: n })}
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
              className="relative w-full max-w-2xl bg-[#0D1117] border border-[#00D2FF]/30 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                  {modal.mode === "create" ? "Create Problem Node" : "Edit Problem Node"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Title <span className="text-[#00D2FF]">*</span></label>
                  <Input
                    value={form.title}
                    onChange={e => setField("title", e.target.value)}
                    placeholder="e.g. Build a REST API"
                    className="bg-[#0A0E14] border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF]"
                  />
                </div>

                {/* Context */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Context</label>
                  <textarea
                    value={form.context}
                    onChange={e => setField("context", e.target.value)}
                    placeholder="Background context for the learner..."
                    rows={3}
                    className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF] rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  />
                </div>

                {/* Mission Brief */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Mission Brief</label>
                  <textarea
                    value={form.missionBrief}
                    onChange={e => setField("missionBrief", e.target.value)}
                    placeholder="What the learner must accomplish..."
                    rows={3}
                    className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF] rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  />
                </div>

                {/* Constraints + Expected Outcomes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DynamicList
                    label="Constraints"
                    items={form.constraints}
                    onChange={v => setField("constraints", v)}
                    placeholder="e.g. Must use TypeScript"
                  />
                  <DynamicList
                    label="Expected Outcomes"
                    items={form.expectedOutcomes}
                    onChange={v => setField("expectedOutcomes", v)}
                    placeholder="e.g. Returns 200 with JSON"
                  />
                </div>

                {/* XP + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">XP Reward</label>
                    <Input
                      type="number"
                      min={0}
                      value={form.experiencePoints}
                      onChange={e => setField("experiencePoints", e.target.value)}
                      placeholder="e.g. 150"
                      className="bg-[#0A0E14] border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Est. Minutes</label>
                    <Input
                      type="number"
                      min={0}
                      value={form.estimatedMinutes}
                      onChange={e => setField("estimatedMinutes", e.target.value)}
                      placeholder="e.g. 45"
                      className="bg-[#0A0E14] border-[#00D2FF]/20 text-white placeholder:text-gray-600 focus:border-[#00D2FF]"
                    />
                  </div>
                </div>

                {/* Difficulty + District */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Difficulty</label>
                    <select
                      value={form.difficultyId}
                      onChange={e => setField("difficultyId", e.target.value)}
                      className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#00D2FF] outline-none"
                    >
                      <option value="">— Select —</option>
                      {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">District</label>
                    <select
                      value={form.districtId}
                      onChange={e => setField("districtId", e.target.value)}
                      className="w-full bg-[#0A0E14] border border-[#00D2FF]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#00D2FF] outline-none"
                    >
                      <option value="">— Select —</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Attachment</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragging(false);
                      const f = e.dataTransfer.files[0];
                      if (f) setField("attachment", f);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      dragging
                        ? "border-[#00D2FF] bg-[#00D2FF]/10"
                        : "border-[#00D2FF]/20 hover:border-[#00D2FF]/50 hover:bg-[#00D2FF]/5"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      className="sr-only"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setField("attachment", f); }}
                    />
                    {form.attachment ? (
                      <p className="text-sm text-[#00D2FF]">{form.attachment.name}</p>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mx-auto mb-1 text-[#00D2FF]/50" />
                        <p className="text-sm text-gray-400">Drag & drop or click — image, PDF, or code file</p>
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

      {/* AI Generate Modal */}
      <AnimatePresence>
        {ai.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !ai.loading && setAi(s => ({ ...s, open: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0D1117] border border-[#9D4EDD]/40 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-[#9D4EDD]" />
                  <h2 className="text-lg font-bold text-white">AI Problem Generator</h2>
                </div>
                <button
                  onClick={() => setAi(s => ({ ...s, open: false }))}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAiGenerate} className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Topic <span className="text-[#9D4EDD]">*</span></label>
                  <Input
                    value={aiForm.topic}
                    onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Build a JWT auth system"
                    className="bg-[#0A0E14] border-[#9D4EDD]/20 text-white placeholder:text-gray-600 focus:border-[#9D4EDD]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">District</label>
                    <select
                      value={aiForm.districtId}
                      onChange={e => setAiForm(f => ({ ...f, districtId: e.target.value }))}
                      className="w-full bg-[#0A0E14] border border-[#9D4EDD]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#9D4EDD] outline-none"
                    >
                      <option value="">— Any —</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Difficulty</label>
                    <select
                      value={aiForm.difficultyId}
                      onChange={e => setAiForm(f => ({ ...f, difficultyId: e.target.value }))}
                      className="w-full bg-[#0A0E14] border border-[#9D4EDD]/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#9D4EDD] outline-none"
                    >
                      <option value="">— Any —</option>
                      {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={ai.loading}
                  className="w-full bg-[#9D4EDD] hover:bg-[#9D4EDD]/80 text-white font-semibold gap-2"
                >
                  {ai.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>
              </form>

              {/* Preview */}
              <AnimatePresence>
                {ai.preview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-[#9D4EDD]/30 rounded-xl p-4 bg-[#9D4EDD]/5 space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-[#9D4EDD] uppercase tracking-wider">Preview</h3>
                    <p className="text-white font-semibold">{ai.preview.title}</p>
                    {ai.preview.context && (
                      <p className="text-gray-400 text-sm">{ai.preview.context}</p>
                    )}
                    {ai.preview.missionBrief && (
                      <p className="text-sm text-gray-300 border-l-2 border-[#9D4EDD]/40 pl-3">{ai.preview.missionBrief}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      {ai.preview.experiencePoints != null && (
                        <span className="flex items-center gap-1 text-[#FFD700]">
                          <Zap className="w-3.5 h-3.5" />{ai.preview.experiencePoints} XP
                        </span>
                      )}
                      {ai.preview.estimatedMinutes != null && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3.5 h-3.5" />{ai.preview.estimatedMinutes}m
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={saveAiPreview}
                      disabled={saving}
                      className="w-full bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black font-semibold gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Database"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
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
              <h2 className="text-lg font-bold text-white mb-2">Delete Problem Node</h2>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to delete <span className="text-white font-medium">"{deleteState.node.title}"</span>? This cannot be undone.
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
