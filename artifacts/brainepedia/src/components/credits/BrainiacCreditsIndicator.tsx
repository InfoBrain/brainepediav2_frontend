import { Link } from "wouter";
import { Coins } from "lucide-react";
import { formatCredits } from "@/lib/aiCredits";
import type { BrainiacCreditBalanceDto } from "@/lib/types/billingCredits";

export function BrainiacCreditsIndicator({
  balance,
  href,
  label = "AI credits",
}: {
  balance: BrainiacCreditBalanceDto | null;
  href: string;
  label?: string;
}) {
  const remaining = balance?.remainingCredits;
  const exhausted = Boolean(balance?.isExhausted || balance?.canUseAI === false);
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        exhausted
          ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
          : "border-white/10 bg-white/5 text-muted-foreground hover:border-[#A78BFA]/40 hover:text-[#A78BFA]"
      }`}
    >
      <Coins className="h-3 w-3" />
      <span>{label}</span>
      <span className="font-mono">{remaining == null ? "—" : formatCredits(remaining)}</span>
    </Link>
  );
}
