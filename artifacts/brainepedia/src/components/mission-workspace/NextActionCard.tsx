import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NextAction } from "@/lib/missionStage";

type Props = {
  action: NextAction;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  hideCta?: boolean;
};

export function NextActionCard({
  action,
  onPrimaryAction,
  primaryDisabled,
  primaryLoading,
  hideCta,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/5 to-[#9D4EDD]/5 p-4 sm:p-5"
      role="region"
      aria-label="Your next step"
    >
      <p className="text-[10px] font-mono text-[#00D2FF] uppercase tracking-widest mb-2">Your Next Step</p>
      <h2 className="text-base sm:text-lg font-bold text-white mb-1">{action.title}</h2>
      <p className="text-sm text-white/55 leading-relaxed mb-4">{action.description}</p>
      {!hideCta && onPrimaryAction && (
        <Button
          onClick={onPrimaryAction}
          disabled={primaryDisabled || primaryLoading}
          className="w-full sm:w-auto font-mono text-xs bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] text-white border-0 gap-1"
        >
          {action.ctaLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </motion.div>
  );
}
