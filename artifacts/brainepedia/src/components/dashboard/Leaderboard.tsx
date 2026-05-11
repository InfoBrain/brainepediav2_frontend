import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

export interface LeaderboardUser {
  nickName: string;
  avatarUrl?: string | null;
  totalXP: number;
}

export interface CurrentUserRank {
  rank: number;
  xp: number;
}

interface LeaderboardProps {
  topUsers: LeaderboardUser[];
  currentUser?: CurrentUserRank | null;
  currentUserId?: string;
  loading?: boolean;
}

const PODIUM = [
  { rank: 1, color: "#FFD700", glow: "shadow-[0_0_20px_rgba(255,215,0,0.4)]", border: "border-[#FFD700]/40", bg: "bg-[#FFD700]/8", label: "text-[#FFD700]" },
  { rank: 2, color: "#C0C0C0", glow: "shadow-[0_0_16px_rgba(192,192,192,0.3)]", border: "border-[#C0C0C0]/40", bg: "bg-[#C0C0C0]/6", label: "text-[#C0C0C0]" },
  { rank: 3, color: "#CD7F32", glow: "shadow-[0_0_14px_rgba(205,127,50,0.3)]", border: "border-[#CD7F32]/40", bg: "bg-[#CD7F32]/6", label: "text-[#CD7F32]" },
];

function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (url) return <img src={url} alt={name} className={`${cls} rounded-full object-cover shrink-0`} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />;
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-[#7C3AED] to-[#00D2FF] flex items-center justify-center font-bold text-white shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Leaderboard({ topUsers, currentUser, loading }: LeaderboardProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-14 rounded-xl bg-white/3 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!topUsers.length) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#0d1117] p-8 text-center">
        <Trophy className="w-8 h-8 text-white/10 mx-auto mb-2" />
        <p className="text-sm text-white/20 font-mono">No leaderboard data yet.</p>
      </div>
    );
  }

  const top3 = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);
  const isCurrentInTop = currentUser && currentUser.rank <= topUsers.length;

  return (
    <div className="space-y-4">
      {/* Top 3 podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((user, i) => {
          const p = PODIUM[i];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-xl border ${p.border} ${p.bg} ${p.glow} p-4 flex flex-col items-center gap-2 text-center`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full border ${p.border} bg-[#0A0E14] ${p.label}`}>
                  #{p.rank}
                </span>
              </div>
              {p.rank === 1 && <Trophy className="absolute top-2 right-2 w-4 h-4 text-[#FFD700]/60" />}
              <Avatar name={user.nickName} url={user.avatarUrl} size="lg" />
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[100px]">{user.nickName}</p>
                <p className={`text-xs font-black font-mono ${p.label}`}>{user.totalXP.toLocaleString()} XP</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#0d1117] divide-y divide-white/5">
          {rest.map((user, i) => {
            const rank = i + 4;
            const isMe = isCurrentInTop && currentUser?.rank === rank;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.24 + i * 0.04 }}
                className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-[#FFD700]/5" : ""}`}
              >
                <span className="text-[10px] font-mono text-white/30 w-6 text-right shrink-0">#{rank}</span>
                <Avatar name={user.nickName} url={user.avatarUrl} size="sm" />
                <p className="flex-1 text-sm text-white truncate font-mono">{user.nickName}</p>
                <p className="text-xs font-bold font-mono text-[#00D2FF] shrink-0">{user.totalXP.toLocaleString()} XP</p>
                {isMe && <span className="text-[10px] font-mono text-[#FFD700] border border-[#FFD700]/30 px-1.5 py-0.5 rounded-full">You</span>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Current user rank card (if not in displayed list) */}
      {currentUser && !isCurrentInTop && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 px-4 py-3 flex items-center gap-3"
        >
          <Medal className="w-5 h-5 text-[#FFD700] shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-mono text-[#FFD700]/60 uppercase tracking-wider">Your Rank</p>
            <p className="text-lg font-black text-white font-mono">#{currentUser.rank}</p>
          </div>
          <p className="text-sm font-bold font-mono text-[#FFD700]">{currentUser.xp.toLocaleString()} XP</p>
        </motion.div>
      )}
    </div>
  );
}
