import { ArrowLeft, Zap } from "lucide-react";

type Props = {
  missionTitle: string;
  employerChallenge?: boolean;
  sessionXpEarned: number;
  onBack?: () => void;
};

export function MissionHeader({ missionTitle, employerChallenge, sessionXpEarned, onBack }: Props) {
  return (
    <header className="flex-shrink-0 border-b border-[#e6e8ef] bg-white/95 backdrop-blur z-20">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onBack ?? (() => window.history.back())}
          className="flex items-center gap-1.5 text-xs font-mono text-[#7a869d] hover:text-[#182137] transition-colors"
          aria-label="Back to missions"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Missions</span>
        </button>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="text-sm sm:text-base font-bold text-[#182137] truncate">{missionTitle}</h1>
        </div>

        {employerChallenge && (
          <span className="shrink-0 text-[9px] sm:text-[10px] font-mono px-2 py-1 rounded-full border border-[#ffd9a6] bg-[#fff4e5] text-[#9a3412] uppercase tracking-wide">
            Employer Challenge
          </span>
        )}

        <div
          className="shrink-0 flex items-center gap-1 text-[10px] sm:text-xs font-mono text-[#7d4ccc]"
          aria-label={`${sessionXpEarned} XP earned this mission`}
        >
          <Zap className="w-3.5 h-3.5 text-[#7d4ccc]" aria-hidden />
          <span>{sessionXpEarned} XP</span>
        </div>
      </div>
    </header>
  );
}
