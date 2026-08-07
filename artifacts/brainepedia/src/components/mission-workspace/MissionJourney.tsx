import { JOURNEY_STEPS, type JourneyStep } from "@/lib/missionStage";
import { Check } from "lucide-react";

type Props = {
  currentStep: JourneyStep;
  /** Highest step the user has unlocked — can navigate back to any step up to this one */
  maxReachableStep?: JourneyStep;
  onStepSelect?: (step: JourneyStep) => void;
};

const STEP_ORDER: JourneyStep[] = ["brief", "plan", "build", "review", "submit"];

export function MissionJourney({ currentStep, maxReachableStep, onStepSelect }: Props) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  const maxIdx = STEP_ORDER.indexOf(maxReachableStep ?? currentStep);

  return (
    <nav
      className="px-4 py-3 border-b border-white/5 bg-[#060a10]/50"
      aria-label="Mission journey progress"
    >
      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2 hidden sm:block">
        Mission Journey — tap a completed step to revisit
      </p>
      <ol className="flex items-center justify-between gap-1 max-w-3xl mx-auto">
        {JOURNEY_STEPS.map((step, i) => {
          const isComplete = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isReachable = i <= maxIdx && Boolean(onStepSelect);
          const isFuture = i > maxIdx;

          const stepButton = (
            <>
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                  isComplete
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                    : isCurrent
                      ? "bg-[#00D2FF]/20 border-2 border-[#00D2FF] text-[#00D2FF] shadow-[0_0_12px_rgba(0,210,255,0.25)]"
                      : "bg-white/5 border border-white/10 text-white/25"
                } ${isReachable && !isCurrent ? "hover:border-[#00D2FF]/50 hover:text-[#00D2FF]/80 cursor-pointer" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-mono truncate w-full text-center ${
                  isCurrent ? "text-[#00D2FF]" : isComplete ? "text-white/50" : "text-white/25"
                }`}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                {isReachable && !isFuture ? (
                  <button
                    type="button"
                    onClick={() => onStepSelect?.(step.id)}
                    className="flex flex-col items-center gap-1 flex-1 min-w-0 rounded-lg p-0.5 transition-colors hover:bg-white/5"
                    aria-label={`Go to ${step.label}`}
                  >
                    {stepButton}
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0 opacity-60">{stepButton}</div>
                )}
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-0.5 sm:mx-1 mb-4 transition-colors duration-300 ${
                    i < currentIdx ? "bg-emerald-500/40" : "bg-white/10"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
