import { useEffect, useState } from "react";
import { CreditCard, Eye, Loader2, RefreshCw, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { ADMIN_NAV } from "@/lib/adminNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerPagination, totalPagesFrom } from "@/components/shared/ServerPagination";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Mode = "user" | "admin" | "employer";
type StatusFilter = "successful" | "pending" | "failed" | "all";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "successful", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "all", label: "All" },
];

export default function TransactionsPage({ mode }: { mode: Mode }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("successful");
  const [selected, setSelected] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [queryingReference, setQueryingReference] = useState("");
  const pageSize = 20;

  const nav = mode === "admin" ? ADMIN_NAV : mode === "employer" ? EMPLOYER_NAV : USER_NAV;
  const theme = mode === "admin" ? "admin" : mode === "employer" ? "employer" : "user";
  const title = mode === "admin" ? "Admin Transactions" : mode === "employer" ? "Corporate Transactions" : "Transactions";

  const load = async () => {
    setLoading(true);
    setError("");
    const res = mode === "admin"
      ? await api.billing.adminAll({ searchEmail, pageNumber: page, pageSize })
      : mode === "employer"
        ? await api.billing.corporateLedger({ pageNumber: page, pageSize })
        : await api.billing.personalLedger({ pageNumber: page, pageSize });
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
    if (page === 1) load();
    else setPage(1);
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

  const queryTransaction = async (row: any) => {
    const reference = referenceOf(row);
    if (!reference || reference === "—") {
      toast({ title: "Missing reference", description: "This transaction does not include a payment reference.", variant: "destructive" });
      return;
    }
    setQueryingReference(reference);
    const shouldUseEmployer = mode === "employer" || (mode === "admin" && isEmployerTransaction(row));
    const res = shouldUseEmployer
      ? await api.subscriptions.verifyEmployerPayment(reference)
      : await api.subscriptions.verifyPayment(reference);
    setQueryingReference("");
    if (!res.ok) {
      toast({ title: "Query failed", description: res.error || "Unable to verify this transaction.", variant: "destructive" });
      return;
    }
    toast({ title: "Transaction queried", description: res.message || "Verification completed successfully." });
    setSelected(res.data || row);
    load();
  };

  const filteredRows = rows.filter((row) => matchesStatus(row, statusFilter));
  const totalPages = total > 0 ? totalPagesFrom(total, pageSize) : page + (rows.length === pageSize ? 1 : 0);

  return (
    <DashboardShell nav={nav} title={title} subtitle="// billing.ledger" theme={theme}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
          <div className="flex flex-col gap-4">
            {mode === "admin" ? (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchEmail}
                  onChange={(event) => setSearchEmail(event.target.value)}
                  placeholder="Search by email"
                  className="pl-9"
                />
                </div>
                <Button onClick={applyFilters} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">Search Email</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Showing page {page} of your {mode === "employer" ? "corporate" : "personal"} transaction ledger.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Filter</span>
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  variant={statusFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.key)}
                  className={statusFilter === filter.key ? "bg-amber-400 text-black hover:bg-amber-300" : ""}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d1119]">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading transactions...</div>
          ) : error ? (
            <div className="p-10 text-center text-destructive">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">FullName</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRows.map((row, index) => (
                    <tr key={idOf(row) || index} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs">{referenceOf(row)}</td>
                      <td className="px-4 py-3">{fullNameOf(row)}</td>
                      <td className="px-4 py-3"><Status value={text(row.status ?? row.Status, "—")} /></td>
                      <td className="px-4 py-3 font-bold">{formatMoney(row.amount ?? row.Amount ?? row.totalAmount)}</td>
                      <td className="px-4 py-3">{formatDate(row.createdAt ?? row.CreatedAt ?? row.date ?? row.transactionDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewDetails(row)}><Eye className="mr-2 h-4 w-4" /> Details</Button>
                          <Button variant="outline" size="sm" disabled={queryingReference === referenceOf(row)} onClick={() => queryTransaction(row)}>
                            {queryingReference === referenceOf(row) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Query
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {(total > pageSize || page > 1 || rows.length === pageSize) && (
          <ServerPagination
            page={page}
            totalPages={Math.max(totalPages, page)}
            onPageChange={setPage}
            className="justify-end"
          />
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
function statusText(row: any): string {
  return text(row?.status ?? row?.Status ?? row?.paymentStatus ?? row?.PaymentStatus, "");
}
function matchesStatus(row: any, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  const status = statusText(row);
  if (filter === "successful") return /success|successful|paid|complete|completed/i.test(status);
  if (filter === "pending") return /pending|processing|initiated/i.test(status);
  return /fail|failed|declin|cancel|abandon|error/i.test(status);
}
function referenceOf(row: any): string {
  return text(row?.reference ?? row?.Reference ?? row?.transactionReference ?? row?.TransactionReference ?? row?.paymentReference ?? row?.PaymentReference ?? row?.trxref ?? row?.Trxref ?? row?.id, "—");
}
function fullNameOf(row: any): string {
  const first = text(row?.firstName ?? row?.FirstName, "");
  const last = text(row?.lastName ?? row?.LastName ?? row?.surName ?? row?.SurName, "");
  return text(
    row?.fullName ??
      row?.FullName ??
      row?.customerName ??
      row?.CustomerName ??
      row?.userFullName ??
      row?.UserFullName ??
      row?.name ??
      row?.Name ??
      `${first} ${last}`.trim(),
    "—",
  );
}
function isEmployerTransaction(row: any): boolean {
  const raw = `${row?.role ?? row?.Role ?? row?.userRole ?? row?.UserRole ?? row?.paymentType ?? row?.PaymentType ?? row?.type ?? row?.Type ?? ""}`;
  return /employer|corporate|company|seat|grandmaster/i.test(raw);
}
function listOf(data: any): any[] {
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data?.transactions) ? data.transactions : [];
}
function totalOf(data: any): number {
  return Number(data?.totalCount ?? data?.totalRecords ?? data?.totalItems ?? data?.total ?? data?.count ?? 0);
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
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(num);
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
