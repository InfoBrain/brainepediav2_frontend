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

const GLOWS = "hover:border-[#d8c6ef] hover:shadow-[0_12px_28px_rgba(125,76,204,0.12)]";

export function ProfessionCard({ profession, selected, onClick, index }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(profession)}
      className={`group relative flex flex-col items-center gap-4 p-6 rounded-2xl border bg-white cursor-pointer text-left w-full transition-all duration-300 shadow-[0_10px_24px_rgba(24,33,55,0.06)]
        ${selected
          ? "border-[#7d4ccc] shadow-[0_12px_28px_rgba(125,76,204,0.16)] border-2"
          : `border-[#e6e8ef] ${GLOWS}`
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
          className="absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 bg-[#7d4ccc]/30"
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
          className={`relative z-10 flex h-12 w-12 items-center justify-center text-3xl font-extrabold text-[#182137] ${profession.iconUrl ? "hidden" : ""}`}
        >
          {profession.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <p
        className={`text-center text-sm font-extrabold leading-tight tracking-wide transition-colors duration-200 ${selected ? "text-[#7d4ccc]" : "text-[#182137] group-hover:text-[#7d4ccc]"}`}
        style={{ color: selected ? "#7d4ccc" : "#182137" }}
      >
        {profession.name}
      </p>

      {/* Selected check */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7d4ccc] flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
