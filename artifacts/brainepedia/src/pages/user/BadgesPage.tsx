import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Map,
  Trophy,
  Activity,
  CreditCard,
  User as UserIcon,
  Loader2,
  Shield,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/map", label: "Imperial Map", icon: Map },
  { href: "/profile/edit", label: "My Profile", icon: UserIcon },
  { href: "/user/badges", label: "My Badges", icon: Trophy },
  { href: "/user/activity", label: "Activity Feed", icon: Activity },
  { href: "/user/subscription", label: "Subscription", icon: CreditCard },
];

type Badge = {
  id: string;
  name: string;
  description?: string;
  rarity: number; // 0=Common/Bronze, 1=Rare/Silver, 2=Epic/Gold, 3=Legendary/Platinum
  iconUrl?: string;
  earnedAt?: string;
};

const RARITY_CONFIG: Record<
  number,
  { label: string; glow: string; border: string; bg: string; text: string; starColor: string }
> = {
  0: {
    label: "Bronze",
    glow: "shadow-[0_0_20px_rgba(180,120,60,0.5)]",
    border: "border-[#cd7f32]/50",
    bg: "bg-gradient-to-br from-[#3d2510]/60 to-[#0d1119]",
    text: "text-[#cd7f32]",
    starColor: "#cd7f32",
  },
  1: {
    label: "Silver",
    glow: "shadow-[0_0_20px_rgba(192,192,192,0.4)]",
    border: "border-[#c0c0c0]/50",
    bg: "bg-gradient-to-br from-[#2a2a2a]/60 to-[#0d1119]",
    text: "text-[#c0c0c0]",
    starColor: "#c0c0c0",
  },
  2: {
    label: "Gold",
    glow: "shadow-[0_0_25px_rgba(255,215,0,0.5)]",
    border: "border-[#FFD700]/50",
    bg: "bg-gradient-to-br from-[#3d3000]/60 to-[#0d1119]",
    text: "text-[#FFD700]",
    starColor: "#FFD700",
  },
  3: {
    label: "Platinum",
    glow: "shadow-[0_0_30px_rgba(0,210,255,0.6)]",
    border: "border-[#00D2FF]/50",
    bg: "bg-gradient-to-br from-[#003d4d]/60 to-[#0d1119]",
    text: "text-[#00D2FF]",
    starColor: "#00D2FF",
  },
};

function normBadges(d: any): Badge[] {
  const arr = Array.isArray(d) ? d : d?.badges || [];
  return arr.map((x: any) => {
    let rarity = 0;
    if (typeof x.rarity === "number") {
      rarity = Math.min(Math.max(x.rarity, 0), 3);
    } else if (typeof x.rarity === "string") {
      const s = x.rarity.toLowerCase();
      if (s.includes("legend") || s.includes("platinum")) rarity = 3;
      else if (s.includes("epic") || s.includes("gold")) rarity = 2;
      else if (s.includes("rare") || s.includes("silver")) rarity = 1;
    }
    return {
      id: String(x.id ?? x.badgeId ?? Math.random()),
      name: x.name || x.badgeName || x.title || "Badge",
      description: x.description || "",
      rarity,
      iconUrl: x.iconUrl || x.imageUrl || "",
      earnedAt: x.earnedAt || x.createdAt || x.dateEarned || "",
    };
  });
}

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  const cfg = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border ${cfg.border} ${cfg.bg} ${cfg.glow} cursor-default`}
    >
      {/* Rarity label */}
      <span className={`absolute top-3 right-3 text-[9px] font-mono uppercase tracking-widest ${cfg.text}`}>
        {cfg.label}
      </span>

      {/* Icon */}
      <div className={`relative h-16 w-16 rounded-2xl border-2 ${cfg.border} flex items-center justify-center overflow-hidden`}>
        {badge.iconUrl ? (
          <img src={badge.iconUrl} alt={badge.name} className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full w-full flex items-center justify-center ${cfg.bg}`}>
            <Shield className={`h-8 w-8 ${cfg.text}`} />
          </div>
        )}
        {/* Glow pulse */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{ boxShadow: `inset 0 0 20px ${cfg.starColor}` }}
        />
      </div>

      {/* Stars for rarity tier */}
      <div className="flex gap-0.5">
        {Array.from({ length: badge.rarity + 1 }).map((_, i) => (
          <Star key={i} className="h-3 w-3" fill={cfg.starColor} style={{ color: cfg.starColor }} />
        ))}
      </div>

      {/* Name + description */}
      <div className="text-center">
        <p className={`text-sm font-bold ${cfg.text}`}>{badge.name}</p>
        {badge.description && (
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{badge.description}</p>
        )}
      </div>

      {/* Date */}
      {badge.earnedAt && (
        <p className="text-[10px] font-mono text-gray-600">
          {new Date(badge.earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </motion.div>
  );
}

export default function BadgesPage() {
  const userId = getUserId() || "";
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const res = await api.userBadges.forUser(userId);
      setLoading(false);
      if (res.ok) setBadges(normBadges(res.data));
    })();
  }, [userId]);

  const legendary = badges.filter(b => b.rarity === 3);
  const epic = badges.filter(b => b.rarity === 2);
  const rare = badges.filter(b => b.rarity === 1);
  const common = badges.filter(b => b.rarity === 0);

  return (
    <DashboardShell nav={nav} title="Trophy Case" subtitle="// earned.glory">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400" />
              My Badges
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? "Loading…" : `${badges.length} badge${badges.length !== 1 ? "s" : ""} earned`}
            </p>
          </div>
          {!loading && badges.length > 0 && (
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
              {legendary.length > 0 && <span className="text-[#00D2FF]">{legendary.length} Platinum</span>}
              {epic.length > 0 && <span className="text-[#FFD700]">{epic.length} Gold</span>}
              {rare.length > 0 && <span className="text-[#c0c0c0]">{rare.length} Silver</span>}
              {common.length > 0 && <span className="text-[#cd7f32]">{common.length} Bronze</span>}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && badges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-24 w-24 rounded-full bg-[#0d1119] border-2 border-dashed border-gray-700 flex items-center justify-center mb-5">
              <Trophy className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">No badges yet</h3>
            <p className="text-sm text-gray-600 max-w-xs">
              Complete missions to earn rewards. Each badge is a mark of your conquest across the Empire.
            </p>
          </motion.div>
        )}

        {/* Badge groups by rarity (highest first) */}
        {!loading && badges.length > 0 && (
          <>
            {[
              { rarity: 3, label: "Platinum", items: legendary },
              { rarity: 2, label: "Gold", items: epic },
              { rarity: 1, label: "Silver", items: rare },
              { rarity: 0, label: "Bronze", items: common },
            ]
              .filter(g => g.items.length > 0)
              .map(group => {
                const cfg = RARITY_CONFIG[group.rarity];
                return (
                  <div key={group.rarity}>
                    <h2 className={`text-sm font-mono uppercase tracking-widest mb-4 ${cfg.text}`}>
                      — {group.label} Tier
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {group.items.map((b, i) => (
                        <BadgeCard key={b.id} badge={b} index={i} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
