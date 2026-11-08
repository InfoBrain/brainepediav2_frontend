import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getCheckpointProgress, type JourneyStep, JOURNEY_STEPS } from "@/lib/missionStage";

type Props = {
  currentStep: JourneyStep;
  checkpoints: { name: string; isCompleted: boolean }[];
  progressPct: number;
  sessionXpEarned: number;
};

export function MissionProgressPanel({
  currentStep,
  checkpoints,
  progressPct,
  sessionXpEarned,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { completed, total } = getCheckpointProgress(
    checkpoints.map((c, i) => ({
      checkpointProgressId: String(i),
      name: c.name,
      description: "",
      order: i,
      isRequired: true,
      isCompleted: c.isCompleted,
      xpReward: 10,
    })),
  );
  const stepLabel = JOURNEY_STEPS.find((s) => s.id === currentStep)?.label ?? "In Progress";

  return (
    <aside className="lg:w-52 shrink-0">
      {/* Mobile collapsible */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-2 border border-[#d8dde8] rounded-xl bg-white text-xs font-mono text-[#5e6a7f]"
        aria-expanded={!collapsed}
      >
        Mission Progress
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      <div className={`${collapsed ? "hidden lg:block" : "block"} mt-2 lg:mt-0`}>
        <div className="rounded-xl border border-[#d8dde8] bg-white p-4 space-y-3">
          <p className="text-[10px] font-mono text-[#7a869d] uppercase tracking-widest">Mission Progress</p>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-[#7a869d] mb-1">
              <span>
                {completed} of {total} steps
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#e8ecf4] overflow-hidden" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7d4ccc] to-[#9b74dc] transition-all duration-500"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-[#8b96ab] mt-1">{stepLabel}</p>
          </div>

          <p className="text-[10px] font-mono text-[#7d4ccc]">+{sessionXpEarned} XP earned</p>

          <ul className="space-y-1.5 hidden lg:block" aria-label="Checkpoint summary">
            {checkpoints.slice(0, 5).map((cp, i) => (
              <li
                key={i}
                className={`text-[10px] font-mono truncate ${ cp.isCompleted ? "text-[#7d4ccc]" : "text-[#9ba5b7] " }`}
              >
                {cp.isCompleted ? "✓" : "○"} {cp.name}
              </li>
            ))}
            {checkpoints.length > 5 && (
              <li className="text-[10px] font-mono text-[#9ba5b7]">+{checkpoints.length - 5} more</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
