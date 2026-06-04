import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Loader2, Zap, Search, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const schema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  employeeEmail: z.string().email("Valid email required"),
  profession: z.string().min(1, "Profession required"),
});
type FormData = z.infer<typeof schema>;

type Member = {
  profileId: string;
  fullName: string;
  email: string;
  profession?: string;
  dateJoinedRoster?: string;
  totalXpEarned?: number;
  isActive?: boolean;
  avatarUrl?: string;
};

export default function TeamMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [search, setSearch] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [seatTarget, setSeatTarget] = useState<Member | null>(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [professions, setProfessions] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchMembers = async () => {
    setLoading(true);
    setError("");
    setWarning("");
    const res = await api.employers.myTeamRoster();
    if (res.ok) {
      setMembers(normMembers(res.data));
    } else {
      const fallback = await api.employers.teamAnalytics();
      if (fallback.ok) {
        setMembers(normMembers(fallback.data));
        setWarning(res.error || "Roster endpoint is temporarily unavailable; showing team analytics roster data.");
      } else {
        setMembers([]);
        setError(res.error || fallback.error || "Unable to load team roster.");
        toast({ title: "Unable to load team roster", description: res.error || fallback.error, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
    api.professions.list().then((res) => {
      if (!res.ok) return;
      setProfessions(
        asList(res.data)
          .map((item) => text(item?.name ?? item?.professionName ?? item?.title, ""))
          .filter(Boolean),
      );
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    const res = await api.employers.provisionTeam(data);
    if (res.ok) {
      toast({ title: "Team member added", description: `Invitation sent to ${data.employeeEmail}.` });
      reset();
      setOpen(false);
      fetchMembers();
    } else {
      toast({ title: "Failed to add member", description: res.error, variant: "destructive" });
    }
  };

  const activateSeat = async () => {
    if (!seatTarget) return;
    setSeatLoading(true);
    const res = await api.employers.initializeSeatPayment(seatTarget.profileId);
    setSeatLoading(false);
    setSeatTarget(null);
    if (res.ok && (res.data as any)?.checkoutUrl) {
      window.location.href = (res.data as any).checkoutUrl;
    } else {
      toast({ title: "Payment init failed", description: res.error, variant: "destructive" });
    }
  };

  const rosterProfessions = useMemo(
    () => Array.from(new Set(members.map((m) => m.profession).filter(Boolean) as string[])).sort(),
    [members],
  );

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.profession || "").toLowerCase().includes(q);
    const matchesProfession = !professionFilter || m.profession === professionFilter;
    return matchesSearch && matchesProfession;
  });

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Members" subtitle="Employer team roster and seat activation" theme="employer">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_220px] lg:max-w-2xl">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Team Member"
              className="pl-9"
            />
          </div>
            <select
              value={professionFilter}
              onChange={(event) => setProfessionFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter by profession"
            >
              <option value="">All professions</option>
              {rosterProfessions.map((profession) => (
                <option key={profession} value={profession}>{profession}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchMembers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-[0_0_12px_rgba(0,210,255,0.25)]">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Provision Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input {...register("firstName")} />
                      {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input {...register("lastName")} />
                      {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Email</Label>
                    <Input {...register("employeeEmail")} type="email" placeholder="employee@company.com" />
                    {errors.employeeEmail && <p className="text-destructive text-xs">{errors.employeeEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Profession</Label>
                    <select
                      {...register("profession")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select profession</option>
                      {professions.map((profession) => (
                        <option key={profession} value={profession}>{profession}</option>
                      ))}
                    </select>
                    {errors.profession && <p className="text-destructive text-xs">{errors.profession.message}</p>}
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isSubmitting ? "Provisioning…" : "Provision Member"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table */}
        {warning && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {warning}
          </div>
        )}
        <div className="bg-[#0d1119] border border-white/5 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-sm">Loading team roster…</span>
            </div>
          ) : error ? (
            <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
              <p className="mb-4 text-sm text-destructive">{error}</p>
              <Button onClick={fetchMembers} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="m-4 rounded-lg border border-dashed border-white/10 p-10 text-center">
              <h3 className="text-lg font-bold text-white">
                {search || professionFilter ? "No team members match your filters." : "No team members have been added yet."}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Invite team members to provision assessment access, roster tracking, and Grandmaster seats.
              </p>
              {!search && !professionFilter && (
                <Button onClick={() => setOpen(true)} className="mt-5 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                  <UserPlus className="mr-2 h-4 w-4" /> Invite Team Member
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Avatar</th>
                    <th className="text-left px-4 py-3">Full Name</th>
                    <th className="text-left px-4 py-3">Email Address</th>
                    <th className="text-left px-4 py-3">Profession</th>
                    <th className="text-left px-4 py-3">XP Earned</th>
                    <th className="text-left px-4 py-3">Date Joined</th>
                    <th className="text-left px-4 py-3">Active Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.profileId} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.fullName} className="h-9 w-9 rounded-full object-cover border border-[#00D2FF]/30" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#00D2FF]/30 to-[#7C3AED]/20 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials(m.fullName)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{m.fullName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{m.email || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.profession || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[#00D2FF]">
                        {m.totalXpEarned !== undefined ? `${m.totalXpEarned.toLocaleString()} XP` : "0 XP"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(m.dateJoinedRoster)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                          m.isActive
                            ? "bg-green-500/15 text-green-400 border border-green-500/30"
                            : "bg-white/5 text-muted-foreground border border-white/10"
                        }`}>
                          {m.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                          onClick={() => setSeatTarget(m)}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Activate Seat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          {filtered.length} of {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Seat payment confirmation */}
      <AlertDialog open={!!seatTarget} onOpenChange={(o) => !o && setSeatTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Grandmaster Seat</AlertDialogTitle>
            <AlertDialogDescription>
              This will open the payment checkout to activate a Grandmaster seat for{" "}
              <strong>{seatTarget?.fullName}</strong>. You will be redirected to the payment page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={activateSeat} disabled={seatLoading} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
              {seatLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Proceed to Checkout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function normMembers(d: any): Member[] {
  const arr = Array.isArray(d) ? d : d?.members ?? d?.employees ?? d?.items ?? d?.roster ?? d?.metricsRoster ?? [];
  return arr.map((x: any) => ({
    profileId: String(x.profileId ?? x.ProfileId ?? x.userId ?? x.UserId ?? x.id ?? x.employeeId ?? Math.random()),
    fullName: text(x.fullName ?? x.FullName ?? x.name ?? `${x.firstName ?? ""} ${x.lastName ?? ""}`.trim(), "Team member"),
    email: text(x.email ?? x.Email ?? x.employeeEmail ?? x.EmailAddress, ""),
    profession: text(x.profession ?? x.Profession ?? x.role ?? x.title, ""),
    dateJoinedRoster: x.dateJoinedRoster ?? x.DateJoinedRoster ?? x.joinedAt ?? x.createdAt,
    totalXpEarned: Number(x.totalXpEarned ?? x.TotalXpEarned ?? x.totalXP ?? x.TotalXP ?? x.totalXp ?? x.xp ?? x.verifiedXp ?? 0),
    isActive: Boolean(x.isActive ?? x.IsActive ?? x.active ?? true),
    avatarUrl: x.avatarUrl ?? x.AvatarUrl ?? x.imageUrl ?? x.ImageUrl,
  }));
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "TM";
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? text(value, "—") : date.toLocaleDateString();
}
