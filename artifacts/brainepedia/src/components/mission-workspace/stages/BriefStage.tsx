import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Shield,
  Target,
  Zap,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProblemNodeDetail } from "@/lib/problemNodeTypes";

type Props = {
  missionTitle: string;
  missionBrief: string;
  problemNode?: ProblemNodeDetail | null;
  employerChallenge?: boolean;
  estimatedXp?: number;
  onConfirmBrief: () => void;
  confirming?: boolean;
  onAskBrainiac?: () => void;
};

export function BriefStage({
  missionTitle,
  missionBrief,
  problemNode,
  employerChallenge,
  estimatedXp,
  onConfirmBrief,
  confirming,
  onAskBrainiac,
}: Props) {
  const title = problemNode?.title || missionTitle;
  const context = problemNode?.context?.trim() || "";
  const brief = (problemNode?.missionBrief || missionBrief || "").trim();
  const constraints = problemNode?.constraints ?? [];
  const outcomes = problemNode?.expectedOutcomes ?? [];
  const difficulty = problemNode?.difficultyName || "—";
  const estimatedMinutes = problemNode?.estimatedMinutes;
  const xp = problemNode?.experiencePoints || estimatedXp || 0;
  const profession = problemNode?.professionName;
  const district = problemNode?.districtName;
  const attachmentUrl = problemNode?.attachmentUrl;

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
          <BookOpen className="w-3 h-3" /> Mission Brief
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{title}</h2>
        {(employerChallenge || problemNode?.employerChallengeAssignmentId) && (
          <span className="inline-block mt-2 text-[10px] font-mono px-2 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
            Employer Challenge
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3 text-xs font-mono">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50">
          <Shield className="w-3.5 h-3.5 text-[#A78BFA]" />
          Difficulty: {difficulty}
        </span>
        {(estimatedMinutes ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50">
            <Clock className="w-3.5 h-3.5" />
            Estimated time: {estimatedMinutes} mins
          </span>
        )}
        {xp > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/5 text-[#FFD700]/80">
            <Zap className="w-3.5 h-3.5" />
            Reward: +{xp} XP
          </span>
        )}
        {profession && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50">
            <Briefcase className="w-3.5 h-3.5" />
            {profession}
          </span>
        )}
        {district && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50">
            <MapPin className="w-3.5 h-3.5" />
            {district}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0f16] p-6 space-y-6">
        {context && (
          <section>
            <h3 className="text-[10px] font-mono text-[#00D2FF]/70 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Mission Context
            </h3>
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{context}</p>
            </div>
          </section>
        )}

        {brief && (
          <section>
            <h3 className="text-[10px] font-mono text-white/45 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Target className="w-3 h-3" /> Your Mission
            </h3>
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{brief}</p>
            </div>
          </section>
        )}

        {!context && !brief && (
          <p className="text-sm text-white/45">Review the mission details before you begin.</p>
        )}

        <section>
          <h3 className="text-[10px] font-mono text-amber-400/70 uppercase tracking-widest mb-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Constraints
          </h3>
          <div className="border-t border-white/10 pt-4">
            {constraints.length > 0 ? (
              <ul className="space-y-2" role="list">
                {constraints.map((c, i) => (
                  <li key={i} className="text-sm text-white/60 flex gap-2 leading-relaxed">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/35 font-mono">No specific constraints provided.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest mb-3 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Expected Outcomes
          </h3>
          <div className="border-t border-white/10 pt-4">
            {outcomes.length > 0 ? (
              <ul className="space-y-2" role="list">
                {outcomes.map((o, i) => (
                  <li key={i} className="text-sm text-white/60 flex gap-2 leading-relaxed">
                    <span className="text-white/30 shrink-0">○</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/35 font-mono">No specific expected outcomes provided.</p>
            )}
          </div>
        </section>

        {attachmentUrl && (
          <section>
            <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Resource</h3>
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#00D2FF] hover:text-[#00D2FF]/80 font-mono transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View mission attachment
            </a>
          </section>
        )}
      </div>

      <p className="text-sm text-white/45 italic text-center sm:text-left">
        &quot;Before you begin, make sure you understand what the client needs.&quot;
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
          I&apos;ve Read the Brief →
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
