import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Briefcase,
  Zap,
  Flame,
  CheckCircle2,
  Trophy,
  Calendar,
  KeyRound,
  Loader2,
  Activity,
  Shield,
  Copy,
  ExternalLink,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { UserAvatar } from "./AdminUsers";
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

type ProfileDetail = {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profession: string;
  aboutMe: string;
  address: string;
  country: string;
  gender: string;
  xp: number;
  currentTitle: string;
  problemsSolved: number;
  dayStreak: number;
  dateJoined: string;
  avatarUrl: string;
};

type DossierData = {
  fullName: string;
  professionalTitle: string;
  verifiedExperienceYears: number;
  totalXp: number;
  leaderboardRank: number;
  badges: Badge[];
  completedTasks: number;
  avatarUrl: string;
  profession: string;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: number;
};

type ActivityItem = {
  id: string;
  activity: string;
  createdAt: string;
};

function normDetail(d: any): ProfileDetail {
  const x = Array.isArray(d) ? d[0] : d?.profile || d?.data || d || {};
  return {
    profileId: String(x.profileId || x.id || ""),
    userId: String(
      x.userId || x.applicationUserId || x.appUserId || x.user?.id || ""
    ),
    firstName: x.firstName || "",
    lastName: x.lastName || "",
    fullName:
      x.fullName ||
      `${x.firstName || ""} ${x.lastName || ""}`.trim() ||
      x.name ||
      "Unknown",
    email: x.email || x.emailAddress || "",
    phoneNumber:
      x.phoneNumber || x.phone || x.phoneNo || x.contactNumber || "",
    profession: x.professionName || x.profession || x.career || "",
    aboutMe: x.aboutMe || x.bio || x.about || x.summary || "",
    address: x.address || x.streetAddress || x.location || "",
    country: x.country || x.countryName || "",
    gender: x.gender || x.sex || "",
    xp: Number(x.xp || x.totalXp || x.totalXP || x.experiencePoints || 0),
    currentTitle: x.currentTitle || x.title || x.level || x.rank || "",
    problemsSolved: Number(
      x.problemsSolved ||
        x.completedNodes ||
        x.completedChallenges ||
        x.tasksCompleted ||
        0
    ),
    dayStreak: Number(x.dayStreak || x.streak || x.currentStreak || 0),
    dateJoined:
      x.dateJoined || x.createdAt || x.joinedAt || x.dateCreated || "",
    avatarUrl:
      x.avatarUrl ||
      x.profileImageUrl ||
      x.imageUrl ||
      x.avatar ||
      x.profilePicture ||
      "",
  };
}

function normDossier(d: any): DossierData {
  const x = d?.profile || d?.data || d || {};
  const badges: Badge[] = (() => {
    const arr =
      x.badges || x.earnedBadges || x.userBadges || x.achievements || [];
    if (!Array.isArray(arr)) return [];
    return arr.map((b: any) => ({
      id: String(b.id || b.badgeId || Math.random()),
      name: b.name || b.badgeName || "Badge",
      description: b.description || "",
      iconUrl: b.iconUrl || b.icon || b.imageUrl || "",
      rarity: Number(b.rarity ?? b.rarityLevel ?? 0),
    }));
  })();
  return {
    fullName:
      x.fullName ||
      `${x.firstName || ""} ${x.lastName || ""}`.trim() ||
      "Unknown",
    professionalTitle:
      x.professionalTitle ||
      x.currentTitle ||
      x.title ||
      x.level ||
      x.rank ||
      "",
    verifiedExperienceYears: Number(
      x.verifiedExperienceYears || x.experienceYears || x.yearsOfExperience || 0
    ),
    totalXp: Number(x.totalXp || x.totalXP || x.xp || x.experiencePoints || 0),
    leaderboardRank: Number(
      x.leaderboardRank || x.rank || x.position || x.leaderboardPosition || 0
    ),
    badges,
    completedTasks: Number(
      x.completedTasks ||
        x.tasksCompleted ||
        x.completedChallenges ||
        x.problemsSolved ||
        0
    ),
    avatarUrl:
      x.avatarUrl ||
      x.profileImageUrl ||
      x.imageUrl ||
      x.avatar ||
      x.profilePicture ||
      "",
    profession: x.professionName || x.profession || x.career || "",
  };
}

function normActivity(d: any): ActivityItem[] {
  const arr = Array.isArray(d) ? d : d?.data || d?.logs || d?.items || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => ({
    id: String(x.id || x.activityId || Math.random()),
    activity:
      x.activity ||
      x.action ||
      x.description ||
      x.activityType ||
      "Activity",
    createdAt: x.createdAt || x.date || x.timestamp || x.performedAt || "",
  }));
}

const TABS = ["overview", "activity", "dossier", "security"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  activity: "Activity",
  dossier: "Public Dossier",
  security: "Security",
};

const RARITY_COLORS: Record<number, string> = {
  0: "text-slate-400 border-slate-500/40 bg-slate-500/10",
  1: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  2: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  3: "text-amber-400 border-amber-500/40 bg-amber-500/10",
};
const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"];

export default function AdminUserProfile() {
  const [, params] = useRoute("/admin/users/:profileId");
  const profileId = params?.profileId ?? "";
  const [, navigate] = useLocation();
  const adminUserId = getUserId();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  usePageTitle(
    profile ? `${profile.fullName} · Admin` : "User Profile · Admin"
  );

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await api.profiles.get(profileId);
      if (cancelled) return;
      if (res.ok && res.data) {
        setProfile(normDetail(res.data));
      } else {
        setError(res.error || "Profile not found.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    if (tab !== "dossier" || !profile?.userId) return;
    let cancelled = false;
    setDossierLoading(true);
    api.identity.publicProfile(profile.userId).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) setDossier(normDossier(res.data));
      setDossierLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, profile?.userId]);

  useEffect(() => {
    if (tab !== "activity" || !profile?.userId) return;
    let cancelled = false;
    setActivityLoading(true);
    api.activityLogs.forUser(profile.userId).then((res) => {
      if (cancelled) return;
      if (res.ok) setActivity(normActivity(res.data));
      setActivityLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, profile?.userId]);

  const handleReset = async () => {
    if (!profile?.email || !adminUserId) return;
    setResetting(true);
    const res = await api.account.resetUserPassword(
      profile.email,
      adminUserId
    );
    setResetting(false);
    setResetOpen(false);
    toast({
      title: res.ok ? "Reset Email Sent" : "Reset Failed",
      description: res.ok
        ? `A temporary password has been emailed to ${profile.email}.`
        : res.error || "An error occurred.",
      variant: res.ok ? undefined : "destructive",
    });
  };

  return (
    <DashboardShell
      nav={ADMIN_NAV}
      title="User Profile"
      subtitle={profile ? `// ${profile.email}` : "// loading…"}
      theme="admin"
    >
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Users
        </Button>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : error ? (
        <div className="bg-[#0d1119] border border-red-500/20 rounded-xl p-10 text-center">
          <User className="h-12 w-12 mx-auto mb-3 text-red-400/40" />
          <p className="text-sm font-medium text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => navigate("/admin/users")}
          >
            Back to Users
          </Button>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
            <div className="flex flex-wrap items-start gap-5">
              <UserAvatar name={profile.fullName} url={profile.avatarUrl} size="xl" />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                {profile.currentTitle && (
                  <p className="text-[#A5B4FC] font-mono text-sm mt-0.5">
                    {profile.currentTitle}
                  </p>
                )}
                {profile.profession && (
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30 font-mono">
                    {profile.profession}
                  </span>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  <Stat
                    icon={Zap}
                    label="XP"
                    value={profile.xp.toLocaleString()}
                    color="text-amber-400"
                  />
                  <Stat
                    icon={CheckCircle2}
                    label="Solved"
                    value={String(profile.problemsSolved)}
                    color="text-emerald-400"
                  />
                  <Stat
                    icon={Flame}
                    label="Streak"
                    value={`${profile.dayStreak}d`}
                    color="text-orange-400"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#A5B4FC] border-[#6366F1]/30 hover:bg-[#6366F1]/10"
                  onClick={() =>
                    navigate(`/admin/users/public/${profile.userId}`)
                  }
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Public Dossier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={() => setResetOpen(true)}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-0.5 border-b border-white/5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t
                    ? "text-[#A5B4FC] border-b-2 border-[#6366F1] -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {tab === "overview" && <OverviewTab profile={profile} />}
              {tab === "activity" && (
                <ActivityTab items={activity} loading={activityLoading} />
              )}
              {tab === "dossier" && (
                <DossierTab dossier={dossier} loading={dossierLoading} />
              )}
              {tab === "security" && (
                <SecurityTab
                  profile={profile}
                  onReset={() => setResetOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="bg-[#0d1119] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this user's password?</AlertDialogTitle>
            <AlertDialogDescription>
              A temporary password will be generated and emailed to{" "}
              <strong className="text-foreground font-mono">
                {profile?.email}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
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

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className={`font-bold font-mono ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground/70 mb-0.5">
          {label}
        </div>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

function OverviewTab({ profile }: { profile: ProfileDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
        <h3 className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-4">
          Contact Details
        </h3>
        <InfoRow icon={Mail} label="Email" value={profile.email} />
        <InfoRow icon={Phone} label="Phone" value={profile.phoneNumber} />
        <InfoRow icon={MapPin} label="Address" value={profile.address} />
        <InfoRow icon={Globe} label="Country" value={profile.country} />
        <InfoRow icon={User} label="Gender" value={profile.gender} />
        <InfoRow
          icon={Calendar}
          label="Joined"
          value={
            profile.dateJoined
              ? new Date(profile.dateJoined).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : ""
          }
        />
      </div>

      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
        <h3 className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-4">
          Career &amp; Progress
        </h3>
        <InfoRow icon={Briefcase} label="Profession" value={profile.profession} />
        <InfoRow icon={Trophy} label="Current Title" value={profile.currentTitle} />
        <InfoRow
          icon={Zap}
          label="Total XP"
          value={profile.xp.toLocaleString()}
        />
        <InfoRow
          icon={CheckCircle2}
          label="Problems Solved"
          value={String(profile.problemsSolved)}
        />
        <InfoRow
          icon={Flame}
          label="Day Streak"
          value={`${profile.dayStreak} day${profile.dayStreak !== 1 ? "s" : ""}`}
        />
      </div>

      {profile.aboutMe && (
        <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-3">
            About
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {profile.aboutMe}
          </p>
        </div>
      )}
    </div>
  );
}

function ActivityTab({
  items,
  loading,
}: {
  items: ActivityItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-16 text-center">
        <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">No activity recorded</p>
      </div>
    );
  }
  return (
    <div className="bg-[#0d1119] border border-white/5 rounded-xl divide-y divide-white/5">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-start gap-4 p-4"
        >
          <div className="h-8 w-8 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="h-3.5 w-3.5 text-[#A5B4FC]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{item.activity}</p>
            {item.createdAt && (
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {new Date(item.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function DossierTab({
  dossier,
  loading,
}: {
  dossier: DossierData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!dossier) {
    return (
      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-16 text-center">
        <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">
          No public dossier available
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#6366F1]/10 to-[#0d1119] border border-[#6366F1]/20 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-5">
          <UserAvatar name={dossier.fullName} url={dossier.avatarUrl} size="xl" />
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold">{dossier.fullName}</h3>
            {dossier.professionalTitle && (
              <p className="text-[#A5B4FC] font-mono text-sm mt-0.5">
                {dossier.professionalTitle}
              </p>
            )}
            {dossier.profession && (
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30">
                {dossier.profession}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <DossierStat
            icon={Zap}
            label="Total XP"
            value={dossier.totalXp.toLocaleString()}
            color="text-amber-400"
          />
          {dossier.leaderboardRank > 0 && (
            <DossierStat
              icon={Trophy}
              label="Leaderboard Rank"
              value={`#${dossier.leaderboardRank}`}
              color="text-[#A5B4FC]"
            />
          )}
          <DossierStat
            icon={CheckCircle2}
            label="Completed"
            value={String(dossier.completedTasks)}
            color="text-emerald-400"
          />
          {dossier.verifiedExperienceYears > 0 && (
            <DossierStat
              icon={Star}
              label="Exp. Years"
              value={`${dossier.verifiedExperienceYears}y`}
              color="text-rose-400"
            />
          )}
        </div>
      </div>

      {dossier.badges.length > 0 && (
        <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
          <h3 className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-4">
            Earned Badges ({dossier.badges.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dossier.badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  RARITY_COLORS[badge.rarity] || RARITY_COLORS[0]
                }`}
              >
                {badge.iconUrl ? (
                  <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className="h-9 w-9 rounded object-contain"
                  />
                ) : (
                  <div className="h-9 w-9 rounded bg-white/10 flex items-center justify-center text-lg">
                    🏆
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{badge.name}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">
                    {RARITY_NAMES[badge.rarity] || "Common"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityTab({
  profile,
  onReset,
}: {
  profile: ProfileDetail;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="h-5 w-5 text-[#A5B4FC]" />
          <h3 className="font-semibold">Account Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/5">
            <div>
              <p className="text-sm font-medium">Email Address</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {profile.email}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/5">
            <div>
              <p className="text-sm font-medium">Password Reset</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate a temporary password and email it to the user
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 shrink-0"
              onClick={onReset}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/5">
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {profile.userId || profile.profileId}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  profile.userId || profile.profileId
                );
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DossierStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
        <div className="flex gap-5">
          <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-[#0d1119] border border-white/5 rounded-xl p-6 space-y-4"
          >
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex gap-3">
                <div className="h-4 w-4 rounded bg-white/5 animate-pulse shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
