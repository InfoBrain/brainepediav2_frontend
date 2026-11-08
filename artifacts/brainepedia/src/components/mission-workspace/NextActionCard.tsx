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
      className="rounded-xl border border-[#d8dde8] bg-gradient-to-br from-[#7d4ccc]/6 to-[#9b74dc]/6 p-4 sm:p-5"
      role="region"
      aria-label="Your next step"
    >
      <p className="text-[10px] font-mono text-[#7d4ccc] uppercase tracking-widest mb-2">Your Next Step</p>
      <h2 className="text-base sm:text-lg font-bold text-[#182137] mb-1">{action.title}</h2>
      <p className="text-sm text-[#5e6a7f] leading-relaxed mb-4">{action.description}</p>
      {!hideCta && onPrimaryAction && (
        <Button
          onClick={onPrimaryAction}
          disabled={primaryDisabled || primaryLoading}
          className="w-full sm:w-auto font-mono text-xs bg-gradient-to-r from-[#7d4ccc] to-[#9b74dc] text-white border-0 gap-1"
        >
          {action.ctaLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </motion.div>
  );
}
