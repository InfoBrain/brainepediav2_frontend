import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Clock, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  missionTitle: string;
  missionBrief: string;
  employerChallenge?: boolean;
  estimatedXp?: number;
  onConfirmBrief: () => void;
  confirming?: boolean;
  onAskBrainiac?: () => void;
};

function parseBriefSections(brief: string) {
  if (!brief.trim()) {
    return {
      situation: "Review the mission details below.",
      objective: "",
      success: "",
      constraints: "",
      estimatedTime: "",
    };
  }
  return { full: brief };
}

export function BriefStage({
  missionTitle,
  missionBrief,
  employerChallenge,
  estimatedXp = 120,
  onConfirmBrief,
  confirming,
  onAskBrainiac,
}: Props) {
  const sections = parseBriefSections(missionBrief);

  return (
    <motion.div
      key="brief"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto w-full space-y-6"
    >
      <div className="text-center sm:text-left">
        <p className="text-[10px] font-mono text-[#00D2FF] tracking-widest uppercase flex items-center justify-center sm:justify-start gap-1 mb-2">
          <BookOpen className="w-3 h-3" /> Your Mission
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{missionTitle}</h2>
        {employerChallenge && (
          <span className="inline-block mt-2 text-[10px] font-mono px-2 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
            Employer Challenge
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0f16] p-6 space-y-5">
        {"full" in sections ? (
          <div className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{sections.full}</div>
        ) : (
          <>
            <section>
              <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Client Situation</h3>
              <p className="text-sm text-white/65 leading-relaxed">{sections.situation}</p>
            </section>
          </>
        )}

        <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs font-mono text-white/40">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated: 30 min</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#FFD700]/70">
            <Zap className="w-3.5 h-3.5" />
            <span>Reward: {estimatedXp} XP</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/45 italic text-center sm:text-left">
        "Before you begin, make sure you understand what the client needs."
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onConfirmBrief}
          disabled={confirming}
          className="flex-1 font-mono text-sm bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD] text-white border-0 gap-2"
        >
          {confirming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          I've Read the Brief →
        </Button>
        {onAskBrainiac && (
          <Button
            variant="outline"
            onClick={onAskBrainiac}
            className="font-mono text-sm border-[#9D4EDD]/30 text-[#9D4EDD]/80 hover:bg-[#9D4EDD]/10"
          >
            Ask Brainiac
          </Button>
        )}
      </div>
    </motion.div>
  );
}
