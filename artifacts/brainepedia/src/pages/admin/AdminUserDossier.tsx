import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Zap,
  Trophy,
  CheckCircle2,
  Star,
  Globe,
  Copy,
  ExternalLink,
  Share2,
  Loader2,
  UserCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { UserAvatar } from "./AdminUsers";

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
  aboutMe: string;
  userId: string;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: number;
};

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const RARITY_COLORS: Record<number, { card: string; badge: string }> = {
  0: {
    card: "border-slate-500/30 bg-slate-500/5",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  1: {
    card: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  2: {
    card: "border-purple-500/30 bg-purple-500/5",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  3: {
    card: "border-amber-500/40 bg-amber-500/5",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
};

function normDossier(d: any, userId: string): DossierData {
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
    userId,
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
    totalXp: Number(
      x.totalXp || x.totalXP || x.xp || x.experiencePoints || 0
    ),
    leaderboardRank: Number(
      x.leaderboardRank ||
        x.rank ||
        x.position ||
        x.leaderboardPosition ||
        0
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
    aboutMe: x.aboutMe || x.bio || x.about || x.summary || "",
  };
}

export default function AdminUserDossier() {
  const [, params] = useRoute("/admin/users/public/:userId");
  const userId = params?.userId ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle(
    dossier ? `${dossier.fullName} · Dossier` : "Public Dossier · Admin"
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await api.identity.publicProfile(userId);
      if (cancelled) return;
      if (res.ok && res.data) {
        setDossier(normDossier(res.data, userId));
      } else {
        setError(res.error || "Dossier not found.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const publicUrl = `${window.location.origin}/profile/${userId}`;

  const copyLink = () => {
    navigator.clipboard
      .writeText(publicUrl)
      .then(() => toast({ title: "Link copied", description: publicUrl }))
      .catch(() => toast({ title: "Could not copy link", variant: "destructive" }));
  };

  return (
    <DashboardShell
      nav={ADMIN_NAV}
      title="Public Dossier"
      subtitle="// admin.users.public-dossier"
      theme="admin"
    >
      <div className="mb-5 flex items-center gap-3">
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
        <DossierSkeleton />
      ) : error ? (
        <div className="bg-[#0d1119] border border-red-500/20 rounded-xl p-14 text-center">
          <Globe className="h-12 w-12 mx-auto mb-3 text-red-400/30" />
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
      ) : dossier ? (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-[#1a1040] via-[#0d1119] to-[#0A0E14] border border-[#6366F1]/25 rounded-2xl p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.15),_transparent_70%)] pointer-events-none" />
            <div className="relative flex flex-wrap items-start gap-6">
              <UserAvatar
                name={dossier.fullName}
                url={dossier.avatarUrl}
                size="xl"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold tracking-tight">
                  {dossier.fullName}
                </h2>
                {dossier.professionalTitle && (
                  <p className="text-[#A5B4FC] font-mono text-sm mt-1">
                    {dossier.professionalTitle}
                  </p>
                )}
                {dossier.profession && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30 font-mono">
                    {dossier.profession}
                  </span>
                )}
                {dossier.aboutMe && (
                  <p className="text-sm text-foreground/70 mt-3 max-w-xl leading-relaxed">
                    {dossier.aboutMe}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className="border-white/15 hover:border-white/30"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publicUrl, "_blank")}
                  className="border-white/15 hover:border-white/30"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `${dossier.fullName} · Brainepedia`,
                          url: publicUrl,
                        });
                      } catch {}
                    } else {
                      copyLink();
                    }
                  }}
                  className="border-white/15 hover:border-white/30"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              <MetricCard
                icon={Zap}
                label="Total XP"
                value={dossier.totalXp.toLocaleString()}
                color="text-amber-400"
                glow="rgba(251,191,36,0.15)"
              />
              {dossier.leaderboardRank > 0 && (
                <MetricCard
                  icon={Trophy}
                  label="Rank"
                  value={`#${dossier.leaderboardRank}`}
                  color="text-[#A5B4FC]"
                  glow="rgba(165,180,252,0.15)"
                />
              )}
              <MetricCard
                icon={CheckCircle2}
                label="Completed"
                value={String(dossier.completedTasks)}
                color="text-emerald-400"
                glow="rgba(52,211,153,0.15)"
              />
              {dossier.verifiedExperienceYears > 0 && (
                <MetricCard
                  icon={Star}
                  label="Exp. Years"
                  value={`${dossier.verifiedExperienceYears}y`}
                  color="text-rose-400"
                  glow="rgba(251,113,133,0.15)"
                />
              )}
            </div>
          </motion.div>

          {dossier.badges.length > 0 ? (
            <div className="bg-[#0d1119] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Earned Badges</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {dossier.badges.length} achievement
                    {dossier.badges.length !== 1 ? "s" : ""} unlocked
                  </p>
                </div>
                <Trophy className="h-5 w-5 text-amber-400/60" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dossier.badges.map((badge, i) => {
                  const rarity = Math.min(badge.rarity, 3);
                  const colors =
                    RARITY_COLORS[rarity] || RARITY_COLORS[0];
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.93 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-4 rounded-xl border ${colors.card}`}
                    >
                      {badge.iconUrl ? (
                        <img
                          src={badge.iconUrl}
                          alt={badge.name}
                          className="h-10 w-10 rounded-lg object-contain shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-xl shrink-0">
                          🏆
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {badge.name}
                        </p>
                        {badge.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {badge.description}
                          </p>
                        )}
                        <span
                          className={`inline-block mt-1.5 text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${colors.badge}`}
                        >
                          {RARITY_LABELS[rarity] || "Common"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#0d1119] border border-white/5 rounded-2xl p-12 text-center">
              <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                No badges earned yet
              </p>
            </div>
          )}

          <div className="bg-[#0d1119] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Profile Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/users`)}
                className="border-white/15"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Back to User List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="border-white/15"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Public Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(publicUrl, "_blank")}
                className="border-white/15"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Public Profile
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  glow,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="rounded-xl p-4 bg-white/[0.04] border border-white/5 text-center"
      style={{ boxShadow: `0 0 20px ${glow}` }}
    >
      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

function DossierSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-[#0d1119] border border-white/5 rounded-2xl p-8">
        <div className="flex gap-6">
          <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-56 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 bg-white/5 animate-pulse h-24"
            />
          ))}
        </div>
      </div>
      <div className="bg-[#0d1119] border border-white/5 rounded-2xl p-6">
        <div className="h-5 w-32 rounded bg-white/5 animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
