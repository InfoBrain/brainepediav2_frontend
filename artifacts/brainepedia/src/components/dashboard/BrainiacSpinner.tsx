import { motion } from "framer-motion";
import { Brain } from "lucide-react";

export function BrainiacSpinner({
  text = "Brainiac thinking…",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <div className="relative h-14 w-14">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-[#7C3AED]/30 border-t-[#A78BFA]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-1.5 rounded-full border-2 border-[#FFD700]/20 border-b-[#FFD700]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <Brain className="h-5 w-5 text-[#A78BFA]" />
          </motion.div>
        </div>
      </div>
      <div className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
        {text}
      </div>
    </div>
  );
}
