import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
};

export function InfoTooltip({ label, children, className, side = "top" }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className,
          )}
          aria-label={label}
        >
          {children}
          <HelpCircle className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-left">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

/** Predefined contextual help for Brainepedia concepts */
export const TOOLTIP_COPY = {
  xp: "Experience Points (XP) reward daily engagement. Earn XP by completing missions; AI hints may reduce your XP gain.",
  vx: "Verified Experience (VX) measures career-grade proof in fractional years. Employers use VX to trust demonstrated capability over credentials alone.",
  verifiedExperience: "Verified Experience converts mission performance into recruiter-ready evidence on your public dossier.",
  problemNodes: "Problem Nodes are real-world missions you solve to prove practical skills and earn XP and VX.",
  missions: "Missions are assigned or self-selected challenges that track your solving progress, XP earned, and success rate.",
  assessments: "Employer-linked assessments validate skills for specific roles using the same mission engine.",
  careerRank: "Your career rank reflects cumulative proof across XP, VX, badges, and district completion.",
  districts: "Districts are thematic skill zones within a profession. Complete missions to claim district progress.",
  profession: "A profession is your career track — it groups districts, missions, and proof pathways.",
  architectPlan: "Architect unlocks unlimited missions, all districts, advanced AI evaluation, and faster XP progression.",
  grandmasterPlan: "Grandmaster Corporate gives employers candidate discovery, jobs, assessments, team training, and analytics.",
  savedCandidates: "Saved Candidates is your employer shortlist for follow-up, dossier review, and outreach.",
  employerChallenges: "Private employer challenges train teams and validate workforce skills outside public missions.",
  trainingChallenges: "Training challenges are corporate missions assigned to employees for upskilling and assessment.",
  leaderboards: "Leaderboards rank learners by XP to encourage healthy competition and visibility.",
  badges: "Badges mark milestones across missions, ranks, districts, and streaks.",
  experienceCredits: "Experience Credits are granular XP ledger entries from completed challenges and assessments.",
  forumReputation: "Forum reputation grows as you contribute helpful discussions and replies to the community.",
  subscriptionPlans: "Initiate is free entry; Architect unlocks full learning; Grandmaster Corporate powers employer workflows.",
} as const;

export function ConceptTooltip({
  concept,
  className,
}: {
  concept: keyof typeof TOOLTIP_COPY;
  className?: string;
}) {
  const text = TOOLTIP_COPY[concept];
  return (
    <InfoTooltip label={text} className={className}>
      <span className="text-sm">{text}</span>
    </InfoTooltip>
  );
}
