import { useEffect, useState } from "react";
import { Building2, Loader2, ChevronLeft, ChevronRight, Search, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Employer = {
  id: string;
  companyName: string;
  websiteUrl: string;
  email: string;
  dateRegistered: string;
  activeJobs?: number;
  teamMembers?: number;
};

const PAGE_SIZE = 15;

export default function AdminEmployers() {
  const [, setLocation] = useLocation();
  const user = getUser();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.userId) { setLocation("/auth/login"); return; }
  }, [user, setLocation]);

  const fetchEmployers = async (p: number) => {
    setLoading(true);
    const res = await api.employers.admin.allEmployers(p, PAGE_SIZE);
    if (res.ok) {
      const d = res.data as any;
      setEmployers(normEmployers(Array.isArray(d) ? d : d?.items ?? d?.employers ?? d?.data ?? []));
      setTotal(d?.total ?? d?.totalCount ?? d?.count ?? (Array.isArray(d) ? d.length : 0));
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmployers(page); }, [page]);

  const filtered = employers.filter(
    (e) =>
      !search ||
      e.companyName.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardShell nav={ADMIN_NAV} title="Employer Management" subtitle="// admin.employers.registry" theme="admin">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employers…"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground font-mono">{total} employer{total !== 1 ? "s" : ""} registered</p>
        </div>

        <div className="bg-[#0d1119] border border-white/5 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-sm">Loading employers…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg m-4">
              {search ? "No employers match your search." : "No employers registered yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Company</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Website</th>
                    <th className="text-left px-4 py-3">Registered</th>
                    <th className="text-left px-4 py-3">Team</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#00D2FF]/10 flex items-center justify-center text-xs font-bold border border-[#00D2FF]/20 shrink-0">
                            <Building2 className="h-4 w-4 text-[#00D2FF]" />
                          </div>
                          <span className="font-medium">{emp.companyName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{emp.email || "—"}</td>
                      <td className="px-4 py-3">
                        {emp.websiteUrl ? (
                          <a href={emp.websiteUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#00D2FF] hover:underline flex items-center gap-1">
                            {emp.websiteUrl.replace(/^https?:\/\//, "").split("/")[0]}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {emp.dateRegistered ? new Date(emp.dateRegistered).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-[#00D2FF]">
                        {emp.teamMembers !== undefined ? emp.teamMembers : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setLocation(`/admin/employers/${emp.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normEmployers(arr: any[]): Employer[] {
  return arr.map((x) => ({
    id: String(x.id ?? x.employerId ?? x.userId ?? Math.random()),
    companyName: x.companyName ?? x.name ?? x.company ?? "Unknown",
    websiteUrl: x.websiteUrl ?? x.website ?? "",
    email: x.email ?? x.companyEmail ?? x.ownerEmail ?? "",
    dateRegistered: x.dateRegistered ?? x.createdAt ?? x.registrationDate ?? "",
    activeJobs: x.activeJobs ?? x.jobCount,
    teamMembers: x.teamMembers ?? x.memberCount ?? x.employees,
  }));
}
