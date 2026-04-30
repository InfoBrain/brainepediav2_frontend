import { motion } from "framer-motion";

export function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/10 bg-[#0d1117]"
    >
      <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
      <div className="w-24 h-3 rounded-full bg-white/10 animate-pulse" />
      <div className="w-16 h-2 rounded-full bg-white/5 animate-pulse" />
    </motion.div>
  );
}
