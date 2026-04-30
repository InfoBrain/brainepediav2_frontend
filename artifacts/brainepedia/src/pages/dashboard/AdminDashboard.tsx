import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Database,
  Sparkles,
  Loader2,
  Search,
  Edit3,
  Save,
  X,
  TrendingUp,
  BookOpen,
  MapPin,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const nav: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/professions", label: "Professions", icon: BookOpen },
  { href: "/admin/districts", label: "Districts", icon: MapPin },
  { href: "/admin/problem-nodes", label: "Problem Nodes", icon: Database },
  { href: "/admin/seed", label: "AI Seed Tool", icon: Sparkles },
  { href: "/admin/users", label: "User Audit", icon: Users },
];

type Stats = {
  totalUsers?: number;
  activeSubscriptions?: number;
  totalXpAwarded?: number;
};
type ProblemNode = {
  id: string;
  name: string;
  district?: string;
  difficulty?: number;
  multiplier?: number;
};
type AdminUser = { id: string; email?: string; name?: string; role?: string };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [nodes, setNodes] = useState<ProblemNode[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string>("");
  const [seedName, setSeedName] = useState("");
  const [seedCount, setSeedCount] = useState(5);
  const [editing, setEditing] = useState<{ id: string; multiplier: number } | null>(null);
  const [savingNode, setSavingNode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [s, u] = await Promise.all([api.admin.stats(), api.admin.users({})]);
      if (cancelled) return;
      if (s.ok) {
        setStats(normalizeStats(s.data));
        setNodes(normalizeNodes(s.data));
      }
      if (u.ok) setUsers(normalizeUsers(u.data));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const u = await api.admin.users({ search, role: roleFilter });
      if (u.ok) setUsers(normalizeUsers(u.data));
    }, 350);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const filteredUsers = useMemo(() => users, [users]);

  const handleSeed = async () => {
    if (!seedName.trim()) {
      setSeedResult("Profession name is required.");
      return;
    }
    setSeeding(true);
    setSeedResult("");
    const res = await api.professions.generateSeed({
      professionName: seedName.trim(),
      districtCount: Math.max(1, Math.min(50, seedCount)),
    });
    setSeeding(false);
    setSeedResult(
      res.ok
        ? `Seeded "${seedName}" with ${seedCount} districts. New nodes will appear shortly.`
        : res.error || "Seed failed."
    );
  };

  const startEdit = (n: ProblemNode) =>
    setEditing({ id: n.id, multiplier: Number(n.multiplier ?? n.difficulty ?? 1) });

  const saveEdit = async () => {
    if (!editing) return;
    setSavingNode(true);
    const fd = new FormData();
    fd.append("multiplier", String(editing.multiplier));
    const res = await api.problemNodes.update(editing.id, fd);
    setSavingNode(false);
    if (res.ok) {
      setNodes((prev) =>
        prev.map((n) => (n.id === editing.id ? { ...n, multiplier: editing.multiplier } : n))
      );
      setEditing(null);
    } else {
      alert(res.error || "Update failed");
    }
  };

  return (
    <DashboardShell
      nav={nav}
      title="Architect's Console"
      subtitle="// admin.global.system"
      theme="admin"
    >
      {loading ? (
        <BrainiacSpinner text="Brainiac auditing the empire…" />
      ) : (
        <div className="space-y-6">
          {/* System Health */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HealthCard
              label="Total Users"
              value={(stats?.totalUsers ?? 0).toLocaleString()}
              icon={Users}
              accent="text-[#A5B4FC]"
            />
            <HealthCard
              label="Active Subscriptions"
              value={(stats?.activeSubscriptions ?? 0).toLocaleString()}
              icon={TrendingUp}
              accent="text-emerald-400"
            />
            <HealthCard
              label="Total XP Awarded"
              value={(stats?.totalXpAwarded ?? 0).toLocaleString()}
              icon={Sparkles}
              accent="text-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Manager */}
            <div className="lg:col-span-2 bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold">Content Manager</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    Problem Nodes &amp; Districts
                  </p>
                </div>
                <Database className="h-5 w-5 text-[#A5B4FC]" />
              </div>
              {nodes.length === 0 ? (
                <Empty text="No problem nodes available." />
              ) : (
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider font-mono text-muted-foreground border-b border-white/5">
                        <th className="py-2 pr-4">Node</th>
                        <th className="py-2 pr-4 hidden sm:table-cell">District</th>
                        <th className="py-2 pr-4">Multiplier</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.slice(0, 10).map((n) => (
                        <tr key={n.id} className="border-b border-white/5">
                          <td className="py-3 pr-4 font-medium">{n.name}</td>
                          <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">
                            {n.district || "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {editing?.id === n.id ? (
                              <Input
                                type="number"
                                step="0.1"
                                value={editing.multiplier}
                                onChange={(e) =>
                                  setEditing({ ...editing, multiplier: Number(e.target.value) })
                                }
                                className="w-24 h-8"
                              />
                            ) : (
                              <span className="font-mono text-[#A5B4FC]">
                                {Number(n.multiplier ?? n.difficulty ?? 1).toFixed(1)}x
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {editing?.id === n.id ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={saveEdit}
                                  disabled={savingNode}
                                >
                                  {savingNode ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 text-emerald-400" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditing(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => startEdit(n)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Seed Tool */}
            <div className="bg-gradient-to-br from-[#6366F1]/15 to-[#0d1119] border border-[#6366F1]/30 rounded-xl p-6">
              <Sparkles className="h-6 w-6 text-[#A5B4FC] mb-3" />
              <h3 className="text-lg font-bold mb-1">Profession Generator</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trigger the AI to create new industry nodes.
              </p>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                    Profession Name
                  </label>
                  <Input
                    value={seedName}
                    onChange={(e) => setSeedName(e.target.value)}
                    placeholder="e.g. Cybersecurity"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                    District Count
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={seedCount}
                    onChange={(e) => setSeedCount(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold"
                onClick={handleSeed}
                disabled={seeding}
              >
                {seeding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {seeding ? "Seeding…" : "Generate Profession Seeds"}
              </Button>
              {seedResult && (
                <div className="mt-4 text-xs font-mono text-muted-foreground p-3 border border-white/5 rounded-md bg-black/30">
                  {seedResult}
                </div>
              )}
            </div>
          </div>

          {/* User Audit */}
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold">User Audit</h2>
                <p className="text-xs text-muted-foreground font-mono">Identity table — all roles</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-56"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-background border border-input h-10 rounded-md px-3 text-sm"
                >
                  <option value="">All roles</option>
                  <option value="GlobalAdmin">GlobalAdmin</option>
                  <option value="Employer">Employer</option>
                  <option value="User">User</option>
                </select>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <Empty text="No users match your filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider font-mono text-muted-foreground border-b border-white/5">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 20).map((u) => (
                      <tr key={u.id} className="border-b border-white/5">
                        <td className="py-3 pr-4 font-medium">{u.name || "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground font-mono">
                          {u.email || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30">
                            {u.role || "User"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function HealthCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0d1119] border border-white/5 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </motion.div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
      {text}
    </div>
  );
}
function normalizeStats(d: any): Stats {
  if (!d || typeof d !== "object") return {};
  return {
    totalUsers: Number(d.totalUsers ?? d.users ?? 0),
    activeSubscriptions: Number(d.activeSubscriptions ?? d.subscriptions ?? 0),
    totalXpAwarded: Number(d.totalXpAwarded ?? d.totalXP ?? d.xp ?? 0),
  };
}
function normalizeNodes(d: any): ProblemNode[] {
  const arr =
    (Array.isArray(d) && d) ||
    d?.problemNodes ||
    d?.nodes ||
    d?.content?.problemNodes ||
    [];
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.nodeId ?? Math.random()),
    name: x.name || x.title || "Node",
    district: x.district || x.districtName,
    difficulty: x.difficulty,
    multiplier: x.multiplier ?? x.difficultyMultiplier,
  }));
}
function normalizeUsers(d: any): AdminUser[] {
  const arr = Array.isArray(d) ? d : d?.users || d?.items || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.userId ?? Math.random()),
    email: x.email,
    name: x.fullName || x.name || `${x.firstName || ""} ${x.lastName || ""}`.trim(),
    role: x.role || (Array.isArray(x.roles) ? x.roles[0] : x.roles) || "User",
  }));
}
