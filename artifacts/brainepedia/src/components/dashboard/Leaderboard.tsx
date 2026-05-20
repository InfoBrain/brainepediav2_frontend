import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Zap, Crown, ChevronUp, ExternalLink } from "lucide-react";

/* ── Types ── */
export interface LeaderboardUser {
  rank: number;
  nickName: string;
  avatarUrl?: string | null;
  totalXP: number;
  isCurrentUser?: boolean;
  userId?: string | null;
  professionalTitle?: string | null;
  verifiedExperienceYears?: number;
}

export interface CurrentUserRank {
  rank: number;
  xp: number;
  nickName?: string;
  avatarUrl?: string | null;
  userId?: string | null;
  professionalTitle?: string | null;
  verifiedExperienceYears?: number;
}

interface LeaderboardProps {
  topUsers: LeaderboardUser[];
  currentUser?: CurrentUserRank | null;
  loading?: boolean;
  onUserClick?: (userId: string) => void;
}

/* ── Helpers ── */
function fmtXP(xp: number): string {
  return xp.toLocaleString() + " XP";
}

function fmtVX(years?: number): string | null {
  if (!years || years <= 0) return null;
  return `VX-${years.toFixed(1)}`;
}

/* ── Avatar ── */
function Avatar({
  name,
  url,
  size = "md",
  glow,
}: {
  name: string;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  glow?: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => setImgErr(false), [url]);

  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };
  const cls = `${sizeMap[size]} rounded-full object-cover shrink-0 flex items-center justify-center font-bold text-white`;

  if (url && !imgErr) {
    return (
      <img
        src={url}
        alt={name}
        className={`${cls} ${glow || ""}`}
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <div className={`${cls} bg-gradient-to-br from-[#7C3AED] to-[#00D2FF] ${glow || ""}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── You badge ── */
function YouBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full border border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700] shrink-0">
      YOU
    </span>
  );
}

/* ── Rank badge ── */
const PODIUM_CFG = [
  {
    color: "#FFD700",
    glow: "shadow-[0_0_22px_rgba(255,215,0,0.35)]",
    border: "border-[#FFD700]/40",
    bg: "bg-[#FFD700]/6",
    text: "text-[#FFD700]",
    ring: "ring-2 ring-[#FFD700]/50",
    icon: <Crown className="w-3.5 h-3.5 text-[#FFD700]/70" />,
  },
  {
    color: "#C0C0C0",
    glow: "shadow-[0_0_16px_rgba(192,192,192,0.25)]",
    border: "border-[#C0C0C0]/35",
    bg: "bg-[#C0C0C0]/5",
    text: "text-[#C0C0C0]",
    ring: "ring-1 ring-[#C0C0C0]/30",
    icon: <Medal className="w-3.5 h-3.5 text-[#C0C0C0]/60" />,
  },
  {
    color: "#CD7F32",
    glow: "shadow-[0_0_14px_rgba(205,127,50,0.25)]",
    border: "border-[#CD7F32]/35",
    bg: "bg-[#CD7F32]/5",
    text: "text-[#CD7F32]",
    ring: "ring-1 ring-[#CD7F32]/25",
    icon: <Medal className="w-3.5 h-3.5 text-[#CD7F32]/60" />,
  },
];

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-xl border border-white/6 bg-white/3 p-4 flex flex-col items-center gap-3 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-white/8" />
            <div className="w-20 h-3 rounded bg-white/8" />
            <div className="w-14 h-2.5 rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/6 bg-[#0d1117] divide-y divide-white/5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-5 h-3 rounded bg-white/8" />
            <div className="w-8 h-8 rounded-full bg-white/8" />
            <div className="flex-1 h-3 rounded bg-white/8" />
            <div className="w-16 h-3 rounded bg-white/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ── */
export function Leaderboard({ topUsers, currentUser, loading, onUserClick }: LeaderboardProps) {
  if (loading) return <Skeleton />;

  if (!topUsers.length) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#0d1117] p-10 text-center">
        <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
        <p className="text-sm text-white/30 font-mono">No leaderboard data available yet.</p>
        <p className="text-xs text-white/15 font-mono mt-1">Complete missions to appear here.</p>
      </div>
    );
  }

  const top3 = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  const isCurrentInTopList = topUsers.some(u => u.isCurrentUser);
  const showYourPosition = currentUser && !isCurrentInTopList && (currentUser.rank > 0 || currentUser.xp > 0);

  return (
    <div className="space-y-4">

      {/* ── Top 3 podium ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        {top3.map((user, i) => {
          const cfg = PODIUM_CFG[i];
          const isMe = Boolean(user.isCurrentUser);
          const clickable = Boolean(user.userId && onUserClick);
          const vx = fmtVX(user.verifiedExperienceYears);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              whileHover={clickable ? { scale: 1.02, y: -2 } : {}}
              onClick={() => clickable && user.userId && onUserClick!(user.userId)}
              className={`relative rounded-xl border ${cfg.border} ${cfg.bg} ${cfg.glow} p-4 flex flex-col items-center gap-2 text-center
                ${isMe ? "ring-2 ring-[#FFD700]/40 shadow-[0_0_30px_rgba(255,215,0,0.12)]" : ""}
                ${clickable ? "cursor-pointer group" : ""}`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full border ${cfg.border} bg-[#0A0E14] ${cfg.text}`}>
                  #{i + 1}
                </span>
              </div>

              <div className="absolute top-2 right-2">{cfg.icon}</div>

              {isMe && (
                <div className="absolute top-2 left-2">
                  <YouBadge />
                </div>
              )}

              {clickable && !isMe && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 text-white/30" />
                </div>
              )}

              <Avatar
                name={user.nickName}
                url={user.avatarUrl}
                size="lg"
                glow={isMe ? "ring-2 ring-[#FFD700]/60 shadow-[0_0_16px_rgba(255,215,0,0.3)]" : ""}
              />

              <div>
                <p className="text-sm font-bold text-white truncate max-w-[100px]">
                  {user.nickName}
                </p>
                {user.professionalTitle && (
                  <p className="text-[10px] text-white/40 font-mono truncate max-w-[110px] mt-0.5">
                    {user.professionalTitle}
                  </p>
                )}
                <p className={`text-xs font-black font-mono ${cfg.text} mt-0.5`}>
                  {fmtXP(user.totalXP)}
                </p>
                {vx && (
                  <span className={`inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.text}`}>
                    {vx}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Ranks 4+ ── */}
      {rest.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#0d1117] divide-y divide-white/5 overflow-hidden">
          {rest.map((user, i) => {
            const isMe = Boolean(user.isCurrentUser);
            const clickable = Boolean(user.userId && onUserClick);
            const vx = fmtVX(user.verifiedExperienceYears);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.035, duration: 0.3 }}
                whileHover={clickable ? { backgroundColor: "rgba(0,210,255,0.03)" } : {}}
                onClick={() => clickable && user.userId && onUserClick!(user.userId)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors
                  ${isMe ? "bg-[#FFD700]/6 border-l-2 border-l-[#FFD700]/50" : "hover:bg-white/2"}
                  ${clickable ? "cursor-pointer group" : ""}`}
              >
                <span className={`text-[10px] font-mono w-6 text-right shrink-0 ${isMe ? "text-[#FFD700]" : "text-white/25"}`}>
                  #{user.rank}
                </span>

                <Avatar name={user.nickName} url={user.avatarUrl} size="sm" />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-mono truncate ${isMe ? "text-[#FFD700] font-bold" : "text-white/70"}`}>
                    {user.nickName}
                  </p>
                  {(user.professionalTitle || vx) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {user.professionalTitle && (
                        <span className="text-[10px] text-white/30 font-mono truncate max-w-[120px]">
                          {user.professionalTitle}
                        </span>
                      )}
                      {vx && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-[#00D2FF]/20 bg-[#00D2FF]/5 text-[#00D2FF]/70 shrink-0">
                          {vx}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className={`text-xs font-bold font-mono shrink-0 ${isMe ? "text-[#FFD700]" : "text-[#00D2FF]"}`}>
                  {fmtXP(user.totalXP)}
                </p>

                {isMe && <YouBadge />}

                {clickable && !isMe && (
                  <ExternalLink className="w-3.5 h-3.5 text-white/10 group-hover:text-white/30 transition-colors shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Sticky "Your Position" ── */}
      <AnimatePresence>
        {showYourPosition && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ delay: 0.35 }}
            className="sticky bottom-2 z-10 rounded-xl border border-[#FFD700]/30 bg-[#0d1117]/95 backdrop-blur px-4 py-3 flex items-center gap-4 shadow-[0_0_24px_rgba(255,215,0,0.1)]"
          >
            <div className="flex items-center gap-2 shrink-0">
              <ChevronUp className="w-4 h-4 text-[#FFD700]/60" />
              <div>
                <p className="text-[10px] font-mono text-[#FFD700]/50 uppercase tracking-widest leading-none">Your Position</p>
                <p className="text-xl font-black text-white font-mono leading-none mt-0.5">
                  #{currentUser.rank}
                </p>
              </div>
            </div>

            {currentUser.nickName && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar name={currentUser.nickName} url={currentUser.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-mono text-white/60 truncate">{currentUser.nickName}</p>
                  {currentUser.professionalTitle && (
                    <p className="text-[10px] font-mono text-white/30 truncate">{currentUser.professionalTitle}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#FFD700]" />
              <p className="text-sm font-bold font-mono text-[#FFD700]">
                {currentUser.xp > 0 ? fmtXP(currentUser.xp) : "0 XP"}
              </p>
            </div>

            <YouBadge />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
