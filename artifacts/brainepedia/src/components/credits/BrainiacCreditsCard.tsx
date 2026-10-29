import { Link } from "wouter";
import { AlertTriangle, Coins, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCredits, formatDateOnly, isOrganizationWallet, renewalKind } from "@/lib/aiCredits";
import type { BrainiacCreditBalanceDto } from "@/lib/types/billingCredits";

type Props = {
  balance: BrainiacCreditBalanceDto | null;
  loading?: boolean;
  error?: string;
  title?: string;
  compact?: boolean;
  usageHref?: string;
  billingHref?: string;
  onRefresh?: () => void;
  onUpgrade?: () => void;
  onRecharge?: () => void;
  actionLoading?: boolean;
};

export function BrainiacCreditsCard({
  balance,
  loading,
  error,
  title = "Brainiac AI Credits",
  compact,
  usageHref,
  billingHref,
  onRefresh,
  onUpgrade,
  onRecharge,
  actionLoading,
}: Props) {
  if (loading && !balance) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#A78BFA]" />
          Loading Brainiac credits…
        </div>
      </div>
    );
  }

  if (error && !balance) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
        <p className="text-sm text-destructive">{error}</p>
        {onRefresh && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-5">
        <p className="text-sm text-muted-foreground">Brainiac credit balance is not available yet.</p>
      </div>
    );
  }

  const used = balance.usedCredits ?? 0;
  const remaining = balance.remainingCredits ?? 0;
  const allocated = balance.allocation ?? used + remaining;
  const percent = Math.max(0, Math.min(100, Number(balance.usagePercentage ?? (allocated ? (used / allocated) * 100 : 0))));
  const exhausted = Boolean(balance.isExhausted || balance.canUseAI === false);
  const action = renewalKind(balance.renewalAction);
  const orgWallet = isOrganizationWallet(balance.walletType);
  const cycleLabel = balance.applicableRenewalDate
    ? `Renews ${formatDateOnly(balance.applicableRenewalDate)}`
    : balance.billingCycleStart || balance.billingCycleEnd
      ? `${formatDateOnly(balance.billingCycleStart)} – ${formatDateOnly(balance.billingCycleEnd)}`
      : "";

  return (
    <section className={`rounded-2xl border bg-[#0d1119] ${exhausted ? "border-amber-400/30" : "border-white/10"} ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/15">
            <Coins className="h-4 w-4 text-[#A78BFA]" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
            <h3 className="text-base font-bold">{balance.planName || "Current plan"}</h3>
          </div>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Refresh Brainiac credits">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-3"}`}>
        <Metric label="Allocated" value={formatCredits(allocated)} />
        <Metric label="Used" value={formatCredits(used)} />
        <Metric label="Remaining" value={formatCredits(remaining)} emphasize />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Usage</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
        <Progress value={percent} className="h-2 bg-white/10" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {balance.walletType && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {orgWallet ? "Organization wallet" : balance.walletType}
          </span>
        )}
        {cycleLabel && <span>{cycleLabel}</span>}
      </div>

      {exhausted && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {orgWallet
              ? "The organization Brainiac credit balance is exhausted for this billing cycle."
              : "This wallet has exhausted its Brainiac AI credits for the current billing cycle."}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(action === "upgrade" || (!action && exhausted)) && onUpgrade && (
          <Button size="sm" onClick={onUpgrade} className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
            <Sparkles className="mr-2 h-3.5 w-3.5" /> Upgrade
          </Button>
        )}
        {(action === "recharge" || action === "renew") && onRecharge && (
          <Button size="sm" onClick={onRecharge} disabled={actionLoading} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
            {actionLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            {action === "renew" ? "Renew credits" : "Recharge credits"}
          </Button>
        )}
        {usageHref && (
          <Button asChild size="sm" variant="outline">
            <Link href={usageHref}>Usage history</Link>
          </Button>
        )}
        {billingHref && (
          <Button asChild size="sm" variant="ghost">
            <Link href={billingHref}>Billing</Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-black ${emphasize ? "text-[#A78BFA]" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
