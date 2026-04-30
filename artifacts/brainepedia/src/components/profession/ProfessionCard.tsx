import { motion } from "framer-motion";

export type Profession = {
  professionId: string;
  name: string;
  iconUrl?: string | null;
};

type Props = {
  profession: Profession;
  selected: boolean;
  onClick: (p: Profession) => void;
  index: number;
};

const GLOWS: string[] = [
  "hover:shadow-cyan-500/40 hover:border-cyan-400/70 group-hover:text-cyan-300",
  "hover:shadow-amber-500/40 hover:border-amber-400/70 group-hover:text-amber-300",
  "hover:shadow-purple-500/40 hover:border-purple-400/70 group-hover:text-purple-300",
  "hover:shadow-emerald-500/40 hover:border-emerald-400/70 group-hover:text-emerald-300",
  "hover:shadow-rose-500/40 hover:border-rose-400/70 group-hover:text-rose-300",
  "hover:shadow-sky-500/40 hover:border-sky-400/70 group-hover:text-sky-300",
];

const SELECTED_RINGS: string[] = [
  "border-cyan-400 shadow-cyan-500/50",
  "border-amber-400 shadow-amber-500/50",
  "border-purple-400 shadow-purple-500/50",
  "border-emerald-400 shadow-emerald-500/50",
  "border-rose-400 shadow-rose-500/50",
  "border-sky-400 shadow-sky-500/50",
];

export function ProfessionCard({ profession, selected, onClick, index }: Props) {
  const colorIdx = index % GLOWS.length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(profession)}
      className={`group relative flex flex-col items-center gap-4 p-6 rounded-2xl border bg-[#0d1117] cursor-pointer text-left w-full transition-all duration-300 shadow-lg
        ${selected
          ? `${SELECTED_RINGS[colorIdx]} shadow-xl border-2 bg-white/5`
          : `border-white/10 ${GLOWS[colorIdx]} hover:shadow-xl hover:bg-white/5`
        }`}
    >
      {/* Selected glow ring */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "inset 0 0 0 2px currentColor" }}
        />
      )}

      {/* Icon */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300
            ${colorIdx === 0 ? "bg-cyan-400" : colorIdx === 1 ? "bg-amber-400" : colorIdx === 2 ? "bg-purple-400" : colorIdx === 3 ? "bg-emerald-400" : colorIdx === 4 ? "bg-rose-400" : "bg-sky-400"}`}
        />
        {profession.iconUrl ? (
          <img
            src={profession.iconUrl}
            alt={profession.name}
            className="w-12 h-12 object-contain relative z-10 drop-shadow-lg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "flex";
            }}
          />
        ) : null}
        <span
          className={`relative z-10 text-3xl font-bold font-mono text-white/60
            ${profession.iconUrl ? "hidden" : "flex"} items-center justify-center w-12 h-12`}
        >
          {profession.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <p
        className={`text-sm font-semibold text-center leading-tight transition-colors duration-200 font-mono tracking-wide
          ${selected ? "text-white" : "text-white/70 group-hover:text-white"}`}
      >
        {profession.name}
      </p>

      {/* Selected check */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/50"
        >
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Scan-line overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
      </div>
    </motion.button>
  );
}
