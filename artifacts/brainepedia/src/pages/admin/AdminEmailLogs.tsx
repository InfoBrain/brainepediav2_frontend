import { useCallback, useEffect, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ErrorState } from "@/components/ux/ErrorState";
import { LoadingState } from "@/components/ux/LoadingState";
import { PageHeader } from "@/components/ux/PageHeader";
import { ADMIN_NAV } from "@/lib/adminNav";
import { listEmailLogs, type EmailDeliveryLog, type EmailDeliveryStatus } from "@/lib/emailLogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ServerPagination } from "@/components/shared/ServerPagination";

const PAGE_SIZE = 20;
const STATUSES: Array<EmailDeliveryStatus | ""> = ["", "Pending", "Sent", "Failed"];

function formatUtc(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function utcBound(date: string, end: boolean): string | undefined {
  if (!date) return undefined;
  return end ? `${date}T23:59:59Z` : `${date}T00:00:00Z`;
}

export default function AdminEmailLogs() {
  usePageTitle("Email delivery · Admin");
  const [rows, setRows] = useState<EmailDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<EmailDeliveryStatus | "">("");
  const [recipient, setRecipient] = useState("");
  const [source, setSource] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [applied, setApplied] = useState({ recipient: "", source: "", fromDate: "", toDate: "" });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await listEmailLogs({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      status,
      recipient: applied.recipient,
      source: applied.source,
      fromUtc: utcBound(applied.fromDate, false),
      toUtc: utcBound(applied.toDate, true),
    });
    setLoading(false);
    if (!res.ok || !res.data) {
      setError(res.status === 401 || res.status === 403
        ? "Only a Global Admin can read the email delivery log."
        : (res.error || "Unable to load email delivery logs."));
      setRows([]);
      return;
    }
    setRows(res.data.items);
    setTotalPages(res.data.totalPages);
    setTotalCount(res.data.totalCount);
  }, [applied, page, status]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const apply = () => {
    setPage(1);
    setApplied({
      recipient: recipient.trim(),
      source: source.trim(),
      fromDate,
      toDate,
    });
  };

  return (
    <DashboardShell nav={ADMIN_NAV} title="Email delivery" subtitle="// admin.email.log" theme="admin">
      <div className="space-y-6">
        <PageHeader
          title="Email delivery log"
          subtitle="Every platform send is recorded when it is attempted. Reminder sweeps use NotificationScheduler. Other messages use Platform. The HTML body is not stored."
          actions={
            <Button variant="outline" size="sm" onClick={() => void loadLogs()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        <section className="grid gap-3 rounded-xl border border-white/5 bg-[#0d1119] p-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="email-status">Status</Label>
            <select
              id="email-status"
              value={status}
              onChange={(event) => { setStatus(event.target.value as EmailDeliveryStatus | ""); setPage(1); }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {STATUSES.map((item) => <option key={item || "all"} value={item}>{item || "All statuses"}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email-recipient">Recipient</Label>
            <Input id="email-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Partial email" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email-source">Source</Label>
            <Input id="email-source" value={source} onChange={(event) => setSource(event.target.value)} placeholder="NotificationScheduler or Platform" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email-from">From (UTC)</Label>
            <Input id="email-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email-to">To (UTC)</Label>
            <Input id="email-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={apply}>Apply</Button>
          </div>
        </section>

        {loading ? <LoadingState label="Loading email logs..." /> : error ? (
          <ErrorState message={error} onRetry={() => void loadLogs()} showDashboardLink={false} />
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
            <Mail className="mx-auto mb-3 h-6 w-6" />
            No email deliveries match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">When (Lagos)</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Failure</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.emailDeliveryLogId} className="border-t border-white/5 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{formatUtc(row.createdAtUtc)}</td>
                    <td className="px-4 py-3">
                      <div>{row.recipientEmail || "—"}</div>
                      {row.recipientUserId && <div className="text-xs text-muted-foreground">{row.recipientUserId}</div>}
                    </td>
                    <td className="px-4 py-3">{row.subject || "—"}</td>
                    <td className="px-4 py-3">{row.source || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${
                        row.deliveryStatus === "Sent"
                          ? "border-emerald-400/30 text-emerald-300"
                          : row.deliveryStatus === "Failed"
                            ? "border-red-400/30 text-red-300"
                            : "border-amber-400/30 text-amber-300"
                      }`}>{row.deliveryStatus}</span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">{row.failureSummary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{totalCount} delivery record{totalCount === 1 ? "" : "s"}</p>
        <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardShell>
  );
}
