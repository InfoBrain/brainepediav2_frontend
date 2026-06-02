import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, UserPlus, Loader2, Zap, Search, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
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
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profession?: string;
  totalXP?: number;
  isActive?: boolean;
};

export default function TeamMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [seatTarget, setSeatTarget] = useState<Member | null>(null);
  const [seatLoading, setSeatLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchMembers = async () => {
    setLoading(true);
    const res = await api.employers.teamMembers();
    if (res.ok) setMembers(normMembers(res.data));
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

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
    const res = await api.employers.initializeSeatPayment(seatTarget.userId);
    setSeatLoading(false);
    setSeatTarget(null);
    if (res.ok && (res.data as any)?.checkoutUrl) {
      window.location.href = (res.data as any).checkoutUrl;
    } else {
      toast({ title: "Payment init failed", description: res.error, variant: "destructive" });
    }
  };

  const filtered = members.filter(
    (m) =>
      !search ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.profession?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Members" subtitle="// employer.team.management" theme="employer">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchMembers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-[0_0_12px_rgba(0,210,255,0.25)]">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
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
                    <Input {...register("profession")} placeholder="e.g. Software Engineer, Legal, Finance" />
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
        <div className="bg-[#0d1119] border border-white/5 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-sm">Loading team…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg m-4">
              {search ? "No members match your search." : "No team members yet. Add your first member above."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Member</th>
                    <th className="text-left px-4 py-3">Profession</th>
                    <th className="text-left px-4 py-3">Verified XP</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.userId} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00D2FF]/30 to-[#7C3AED]/20 flex items-center justify-center text-xs font-bold shrink-0">
                            {m.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{m.firstName} {m.lastName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.profession || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[#00D2FF]">
                        {m.totalXP !== undefined ? `${m.totalXP.toLocaleString()} XP` : "—"}
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
              <strong>{seatTarget?.firstName} {seatTarget?.lastName}</strong>. You will be redirected to the payment page.
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
  const arr = Array.isArray(d) ? d : d?.members ?? d?.employees ?? d?.items ?? [];
  return arr.map((x: any) => ({
    userId: String(x.userId ?? x.id ?? x.employeeId ?? Math.random()),
    firstName: x.firstName ?? x.first_name ?? (x.name ?? "").split(" ")[0] ?? "Employee",
    lastName: x.lastName ?? x.last_name ?? (x.name ?? "").split(" ").slice(1).join(" ") ?? "",
    email: x.email ?? x.employeeEmail ?? "",
    profession: x.profession ?? x.role ?? x.title,
    totalXP: x.totalXP ?? x.xp ?? x.verifiedXp,
    isActive: x.isActive ?? x.active ?? true,
  }));
}
