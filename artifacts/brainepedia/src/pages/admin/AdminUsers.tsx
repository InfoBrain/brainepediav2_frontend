import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Search,
  RefreshCw,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Globe,
  KeyRound,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Profile = {
  profileId: string;
  userId: string;
  fullName: string;
  email: string;
  gender: string;
  profession: string;
  xp: number;
  currentTitle: string;
  dateJoined: string;
  avatarUrl: string;
};

function normProfiles(d: any): Profile[] {
  const arr = Array.isArray(d) ? d : d?.data || d?.profiles || d?.items || [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x: any) => ({
      profileId: String(x.profileId || x.id || ""),
      userId: String(
        x.userId || x.applicationUserId || x.appUserId || x.user?.id || ""
      ),
      fullName:
        x.fullName ||
        `${x.firstName || ""} ${x.lastName || ""}`.trim() ||
        x.name ||
        "Unknown",
      email: x.email || x.emailAddress || "",
      gender: x.gender || x.sex || "",
      profession: x.professionName || x.profession || x.career || "",
      xp: Number(x.xp || x.totalXp || x.totalXP || x.experiencePoints || 0),
      currentTitle: x.currentTitle || x.title || x.level || x.rank || "",
      dateJoined:
        x.dateJoined || x.createdAt || x.joinedAt || x.dateCreated || "",
      avatarUrl:
        x.avatarUrl ||
        x.profileImageUrl ||
        x.imageUrl ||
        x.avatar ||
        x.profilePicture ||
        "",
    }))
    .filter((p: Profile) => p.profileId);
}

const PAGE_SIZE = 20;

export default function AdminUsers() {
  usePageTitle("User Management · Admin");
  const [, navigate] = useLocation();
  const adminUserId = getUserId();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [sortXp, setSortXp] = useState<"asc" | "desc" | null>(null);
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const res = await api.profiles.search();
    setProfiles(res.ok ? normProfiles(res.data) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const professions = useMemo(() => {
    const set = new Set(profiles.map((p) => p.profession).filter(Boolean));
    return Array.from(set).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    let list = profiles;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }
    if (professionFilter) {
      list = list.filter((p) => p.profession === professionFilter);
    }
    if (sortXp === "asc") list = [...list].sort((a, b) => a.xp - b.xp);
    if (sortXp === "desc") list = [...list].sort((a, b) => b.xp - a.xp);
    return list;
  }, [profiles, search, professionFilter, sortXp]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleResetPassword = useCallback(async () => {
    if (!resetTarget || !adminUserId) return;
    setResetting(true);
    const res = await api.account.resetUserPassword(
      resetTarget.email,
      adminUserId
    );
    setResetting(false);
    setResetTarget(null);
    if (res.ok) {
      toast({
        title: "Password Reset Sent",
        description: `A temporary password has been emailed to ${resetTarget.email}.`,
      });
    } else {
      toast({
        title: "Reset Failed",
        description: res.error || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }, [resetTarget, adminUserId, toast]);

  const toggleSort = () => {
    setSortXp((v) => (v === "desc" ? "asc" : v === "asc" ? null : "desc"));
    setPage(1);
  };

  return (
    <DashboardShell
      nav={ADMIN_NAV}
      title="User Management"
      subtitle="// admin.users.all"
      theme="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">All Users</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {loading
                ? "Loading users…"
                : `${filtered.length.toLocaleString()} of ${profiles.length.toLocaleString()} users`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadProfiles}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={professionFilter}
            onChange={(e) => {
              setProfessionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-input h-10 rounded-md px-3 text-sm min-w-[160px] text-foreground"
          >
            <option value="">All Professions</option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Button
            variant={sortXp ? "secondary" : "outline"}
            size="sm"
            onClick={toggleSort}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            XP{" "}
            {sortXp === "desc" ? "↓ High→Low" : sortXp === "asc" ? "↑ Low→High" : "Sort"}
          </Button>
        </div>

        <div className="bg-[#0d1119] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Gender</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Profession</th>
                  <th className="px-4 py-3">XP</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Title</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-white/5 animate-pulse shrink-0" />
                          <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 w-24 rounded bg-white/5 animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-20 text-center">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No users found
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {search || professionFilter
                          ? "Try adjusting your search or filters"
                          : "No user profiles have been created yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((profile, i) => (
                    <motion.tr
                      key={profile.profileId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="border-b border-white/5 hover:bg-white/[0.025] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            name={profile.fullName}
                            url={profile.avatarUrl}
                          />
                          <span className="font-medium truncate">
                            {profile.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-muted-foreground font-mono text-xs">
                          {profile.email || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground capitalize">
                        {profile.gender || "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {profile.profession ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30">
                            {profile.profession}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-amber-400 font-semibold">
                          {profile.xp.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                        {profile.currentTitle || "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground font-mono">
                        {profile.dateJoined
                          ? new Date(profile.dateJoined).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short", year: "numeric" }
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-[#A5B4FC]"
                            title="View Profile"
                            onClick={() =>
                              navigate(`/admin/users/${profile.profileId}`)
                            }
                          >
                            <UserCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-400"
                            title="View Public Dossier"
                            onClick={() =>
                              navigate(
                                `/admin/users/public/${profile.userId || profile.profileId}`
                              )
                            }
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                            title="Reset Password"
                            onClick={() => setResetTarget(profile)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-xs text-muted-foreground font-mono">
                Page {page} of {totalPages} &middot;{" "}
                {filtered.length.toLocaleString()} total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p =
                      totalPages <= 5
                        ? i + 1
                        : page <= 3
                        ? i + 1
                        : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-8 min-w-[2rem] px-2 rounded text-xs font-mono transition-colors ${
                          p === page
                            ? "bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
      >
        <AlertDialogContent className="bg-[#0d1119] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this user's password?</AlertDialogTitle>
            <AlertDialogDescription>
              A temporary password will be generated and emailed to{" "}
              <strong className="text-foreground font-mono">
                {resetTarget?.email}
              </strong>
              . The user will be required to change it on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={resetting}
              className="bg-amber-500/90 hover:bg-amber-500 text-black font-bold border-0"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Email"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

export function UserAvatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };
  const cls = sizeMap[size];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hue =
    name.length > 1
      ? ((name.charCodeAt(0) * 37 + name.charCodeAt(1) * 13) % 360)
      : 210;

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${cls} rounded-full object-cover border border-white/10 shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold text-white border border-white/10 shrink-0`}
      style={{ background: `hsl(${hue}, 45%, 28%)` }}
    >
      {initials || "?"}
    </div>
  );
}
