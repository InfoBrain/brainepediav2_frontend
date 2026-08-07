import { Target, AlertTriangle, CheckCircle2, Briefcase } from "lucide-react";
import type { ProblemNodeDetail } from "@/lib/problemNodeTypes";

type Props = {
  node: ProblemNodeDetail;
  missionBrief?: string;
  compact?: boolean;
};

export function MissionContext({ node, missionBrief, compact }: Props) {
  const brief = missionBrief || node.missionBrief || node.context;
  const clientContext = node.context || brief;

  return (
    <aside
      className={`rounded-xl border border-white/10 bg-[#0a0f16] ${compact ? "p-4 space-y-3" : "p-5 space-y-4"}`}
      aria-label="Mission context"
    >
      <div>
        <p className="text-[10px] font-mono text-[#00D2FF] uppercase tracking-widest flex items-center gap-1 mb-1">
          <Briefcase className="w-3 h-3" /> Client Situation
        </p>
        <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{clientContext}</p>
      </div>

      {brief && brief !== clientContext && (
        <div>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1 mb-1">
            <Target className="w-3 h-3" /> Your Task
          </p>
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{brief}</p>
        </div>
      )}

      {node.expectedOutcomes.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest flex items-center gap-1 mb-2">
            <CheckCircle2 className="w-3 h-3" /> Success Criteria
          </p>
          <ul className="space-y-1.5" role="list">
            {node.expectedOutcomes.map((o, i) => (
              <li key={i} className="text-xs text-white/55 leading-relaxed flex gap-2">
                <span className="text-emerald-400/50 shrink-0">•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.constraints.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-amber-400/70 uppercase tracking-widest flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3" /> Constraints
          </p>
          <ul className="space-y-1.5" role="list">
            {node.constraints.map((c, i) => (
              <li key={i} className="text-xs text-white/50 leading-relaxed flex gap-2">
                <span className="text-amber-400/50 shrink-0">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
