import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BrainiacCreditsExhaustedDto } from "@/lib/types/billingCredits";
import { isOrganizationWallet, renewalKind } from "@/lib/aiCredits";

type Props = {
  open: boolean;
  payload: BrainiacCreditsExhaustedDto | null;
  organizationWallet?: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
  onRecharge?: () => void;
  rechargeLoading?: boolean;
};

export function BrainiacCreditsExhaustedDialog({
  open,
  payload,
  organizationWallet,
  onOpenChange,
  onUpgrade,
  onRecharge,
  rechargeLoading,
}: Props) {
  const lastKey = useRef("");
  const message = payload?.message || "This account has exhausted its Brainiac AI credits for the current billing cycle.";
  const org = organizationWallet || isOrganizationWallet(payload?.balance?.walletType);
  const recommended = renewalKind(payload?.recommendedAction);
  const canUpgrade = Boolean(payload?.canUpgrade);
  const canRecharge = Boolean(payload?.canRenewOrRecharge);

  useEffect(() => {
    if (!open || !payload) return;
    lastKey.current = `${payload.errorCode}:${payload.message}`;
  }, [open, payload]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-amber-400/30 bg-[#0d1119] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            Brainiac credits exhausted
          </DialogTitle>
          <DialogDescription>
            {org
              ? "The applicable organization AI credit wallet has no remaining credits for this billing cycle."
              : "The applicable Brainiac AI credit wallet has no remaining credits for this billing cycle."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
          {message}
        </div>
        {org && (
          <p className="text-xs text-muted-foreground">
            This charge uses the organization wallet. Personal Architect credits are not used as a substitute.
          </p>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canRecharge && onRecharge && (recommended === "recharge" || recommended === "renew" || !canUpgrade) && (
            <Button onClick={onRecharge} disabled={rechargeLoading} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
              {rechargeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {org ? "Organization billing" : recommended === "renew" ? "Renew credits" : "Recharge credits"}
            </Button>
          )}
          {canUpgrade && onUpgrade && (
            <Button onClick={onUpgrade} className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
              Upgrade plan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
