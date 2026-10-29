import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CreditsContext, useCreditsState } from "@/hooks/useBrainiacCredits";
import { AI_CREDITS_EXHAUSTED_EVENT, type CreditsExhaustedEventDetail } from "@/lib/aiCredits";
import type { BrainiacCreditsExhaustedDto } from "@/lib/types/billingCredits";
import { getUserRole } from "@/lib/auth";
import { BrainiacCreditsExhaustedDialog } from "./BrainiacCreditsExhaustedDialog";

export function BrainiacCreditsProvider({ children }: { children: React.ReactNode }) {
  const credits = useCreditsState();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<BrainiacCreditsExhaustedDto | null>(null);
  const [organizationWallet, setOrganizationWallet] = useState(false);
  const lastKeyRef = useState({ current: "" })[0];

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<CreditsExhaustedEventDetail>).detail;
      if (!detail?.payload) return;
      const key = `${detail.payload.errorCode || ""}:${detail.payload.message || ""}:${detail.organizationWallet ? "org" : "personal"}`;
      if (lastKeyRef.current === key && open) return;
      lastKeyRef.current = key;
      setPayload(detail.payload);
      setOrganizationWallet(Boolean(detail.organizationWallet));
      setOpen(true);
      void credits.refresh();
      if (detail.organizationWallet) void credits.refreshOrganization();
    };
    window.addEventListener(AI_CREDITS_EXHAUSTED_EVENT, handler);
    return () => window.removeEventListener(AI_CREDITS_EXHAUSTED_EVENT, handler);
  }, [credits, lastKeyRef, open]);

  const goUpgrade = useCallback(() => {
    setOpen(false);
    const role = getUserRole();
    navigate(role === "Employer" ? "/employer/subscription" : "/user/subscription");
  }, [navigate]);

  const goRecharge = useCallback(async () => {
    const role = getUserRole();
    if (organizationWallet) {
      setOpen(false);
      navigate("/employer/billing");
      return;
    }
    const result = await credits.startRecharge(role === "Employer" ? "Employer" : "User");
    if (!result.ok) {
      setOpen(false);
      navigate(role === "Employer" ? "/employer/subscription" : "/user/subscription");
    }
  }, [credits, navigate, organizationWallet]);

  return (
    <CreditsContext.Provider value={credits}>
      {children}
      <BrainiacCreditsExhaustedDialog
        open={open}
        payload={payload}
        organizationWallet={organizationWallet}
        onOpenChange={setOpen}
        onUpgrade={payload?.canUpgrade ? goUpgrade : undefined}
        onRecharge={payload?.canRenewOrRecharge || organizationWallet ? goRecharge : undefined}
        rechargeLoading={credits.rechargeLoading}
      />
    </CreditsContext.Provider>
  );
}
