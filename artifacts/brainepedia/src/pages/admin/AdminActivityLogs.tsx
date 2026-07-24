import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ErrorState } from "@/components/ux/ErrorState";
import { LoadingState } from "@/components/ux/LoadingState";
import { PageHeader } from "@/components/ux/PageHeader";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ServerPagination } from "@/components/shared/ServerPagination";

type ActivityLogRow = {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  source: string;
  description: string;
};

const PAGE_SIZE = 20;

export default function AdminActivityLogs() {
  usePageTitle("Activity Logs · Admin");
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [activityType, setActivityType] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await api.activityLogs.systemWide({
      search: search.trim() || undefined,
      role: role || undefined,
      activityType: activityType || undefined,
      userId: userFilter.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load activity logs.");
      setRows([]);
      return;
    }
    setRows(normalizeLogs(res.data));
  }, [search, role, activityType, userFilter, fromDate, toDate, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const roleOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.role).filter(Boolean))), [rows]);
  const typeOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.action).filter(Boolean))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (search) {
        const hay = `${row.user} ${row.action} ${row.description} ${row.source}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      if (role && row.role !== role) return false;
      if (activityType && row.action !== activityType) return false;
      if (userFilter && !row.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
      if (fromDate && new Date(row.timestamp) < new Date(fromDate)) return false;
      if (toDate && new Date(row.timestamp) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, search, role, activityType, userFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Activity Logs" subtitle="// admin.audit.trail" theme="admin">
      <div className="space-y-6">
        <PageHeader
          title="Platform Activity Logs"
          subtitle="Search and audit activity across users, roles, and modules."
          actions={
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        <section className="grid gap-3 rounded-xl border border-white/5 bg-[#0d1119] p-4 md:grid-cols-2 xl:grid-cols-3">
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search logs..." className="pl-9" />
            </div>
          </FilterField>
          <FilterField label="Role">
            <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All roles</option>
              {roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FilterField>
          <FilterField label="Activity Type">
            <select value={activityType} onChange={(e) => { setActivityType(e.target.value); setPage(1); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All types</option>
              {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FilterField>
          <FilterField label="User">
            <Input value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} placeholder="Filter by user" />
          </FilterField>
          <FilterField label="From Date">
            <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          </FilterField>
          <FilterField label="To Date">
            <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
          </FilterField>
        </section>

        {loading ? (
          <LoadingState variant="table" rows={8} label="Loading activity logs…" />
        ) : error ? (
          <ErrorState title="Unable to load activity logs" message={error} onRetry={loadLogs} showDashboardLink={false} />
        ) : pageRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0d1119] p-12 text-center">
            <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity logs match your filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0d1119]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/5 bg-white/[0.02] text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(row.timestamp)}</td>
                      <td className="px-4 py-3">{row.user}</td>
                      <td className="px-4 py-3"><span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase">{row.role || "—"}</span></td>
                      <td className="px-4 py-3">{row.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.source}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/5 p-4">
              <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function normalizeLogs(data: any): ActivityLogRow[] {
  const arr = Array.isArray(data) ? data : data?.items ?? data?.logs ?? data?.data ?? data?.results ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.map((item: any, index: number) => ({
    id: String(item.activityLogId ?? item.id ?? item.Id ?? index),
    timestamp: item.dateCreated ?? item.DateCreated ?? item.createdAt ?? item.CreatedAt ?? item.timestamp ?? "",
    user: item.user ?? item.User ?? item.userName ?? item.UserName ?? item.userCreated ?? item.UserCreated ?? "—",
    role: item.role ?? item.Role ?? item.userRole ?? item.UserRole ?? "",
    action: item.activity ?? item.Activity ?? item.action ?? item.Action ?? item.activityType ?? item.ActivityType ?? "Activity",
    source: item.medium ?? item.Medium ?? item.source ?? item.Source ?? item.module ?? item.Module ?? "Platform",
    description: item.description ?? item.Description ?? item.activity ?? item.Activity ?? item.details ?? "",
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function formatTimestamp(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
