import { useEffect, useState } from "react";
import { CreditCard, Eye, Loader2, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { ADMIN_NAV } from "@/lib/adminNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Mode = "user" | "admin" | "employer";

export default function TransactionsPage({ mode }: { mode: Mode }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: "", status: "", paymentType: "", amount: "", fromDate: "", toDate: "" });
  const [selected, setSelected] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const pageSize = 15;

  const nav = mode === "admin" ? ADMIN_NAV : mode === "employer" ? EMPLOYER_NAV : USER_NAV;
  const theme = mode === "admin" ? "admin" : mode === "employer" ? "employer" : "user";
  const title = mode === "admin" ? "Admin Transactions" : mode === "employer" ? "Corporate Transactions" : "Transactions";

  const load = async () => {
    setLoading(true);
    setError("");
    const params = { ...filters, page, pageSize };
    const res = mode === "admin" ? await api.billing.adminAll(params) : mode === "employer" ? await api.billing.corporateLedger(params) : await api.billing.personalLedger(params);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load transactions.");
      return;
    }
    setRows(listOf(res.data));
    setTotal(totalOf(res.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, page]);

  const applyFilters = () => {
    setPage(1);
    load();
  };

  const viewDetails = async (row: any) => {
    const id = idOf(row);
    setSelected(row);
    if (!id) return;
    setDetailsLoading(true);
    const res = await api.billing.transactionDetails(id);
    setDetailsLoading(false);
    if (res.ok) setSelected(res.data);
  };

  return (
    <DashboardShell nav={nav} title={title} subtitle="// billing.ledger" theme={theme}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <label className="md:col-span-2 xl:col-span-2">
              <span className="sr-only">Search</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search transactions" className="pl-9" />
              </div>
            </label>
            <Input value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} placeholder="Status" />
            <Input value={filters.paymentType} onChange={(event) => setFilters((prev) => ({ ...prev, paymentType: event.target.value }))} placeholder="Payment Type" />
            {mode === "admin" && <Input value={filters.amount} onChange={(event) => setFilters((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Amount" />}
            <Input type="date" value={filters.fromDate} onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))} />
            <Input type="date" value={filters.toDate} onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))} />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={applyFilters} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">Apply Filters</Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d1119]">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading transactions...</div>
          ) : error ? (
            <div className="p-10 text-center text-destructive">{error}</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row, index) => (
                    <tr key={idOf(row) || index} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs">{text(row.reference ?? row.Reference ?? row.transactionReference ?? row.id, "—")}</td>
                      <td className="px-4 py-3"><Status value={text(row.status ?? row.Status, "—")} /></td>
                      <td className="px-4 py-3">{text(row.paymentType ?? row.PaymentType ?? row.type, "—")}</td>
                      <td className="px-4 py-3 font-bold">{formatMoney(row.amount ?? row.Amount ?? row.totalAmount)}</td>
                      <td className="px-4 py-3">{formatDate(row.createdAt ?? row.CreatedAt ?? row.date ?? row.transactionDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(row)}><Eye className="mr-2 h-4 w-4" /> Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {total > pageSize && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <span className="text-xs font-mono text-muted-foreground">Page {page}</span>
            <Button variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        )}
      </div>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#00D2FF]" /> Transaction Details</SheetTitle>
            <SheetDescription>Backend transaction record.</SheetDescription>
          </SheetHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading details...</div>
          ) : (
            <div className="mt-6 space-y-3">
              {Object.entries(flatten(selected)).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{key}</p>
                  <p className="mt-1 break-words text-sm">{String(value ?? "—")}</p>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}

function Status({ value }: { value: string }) {
  const ok = /success|paid|complete/i.test(value);
  const pending = /pending|processing/i.test(value);
  return <span className={`rounded-full border px-2 py-1 text-xs font-mono ${ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : pending ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>{value}</span>;
}
function listOf(data: any): any[] {
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data?.transactions) ? data.transactions : [];
}
function totalOf(data: any): number {
  return Number(data?.totalCount ?? data?.total ?? data?.count ?? listOf(data).length ?? 0);
}
function idOf(row: any): string {
  return String(row?.id ?? row?.Id ?? row?.transactionId ?? row?.TransactionId ?? "");
}
function text(value: any, fallback = ""): string {
  return value === null || value === undefined || String(value).trim() === "" ? fallback : String(value);
}
function formatDate(value: any): string {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}
function formatMoney(value: any): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}
function flatten(obj: any, prefix = ""): Record<string, any> {
  if (!obj || typeof obj !== "object") return {};
  return Object.entries(obj).reduce<Record<string, any>>((acc, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) Object.assign(acc, flatten(value, nextKey));
    else acc[nextKey] = Array.isArray(value) ? JSON.stringify(value) : value;
    return acc;
  }, {});
}
