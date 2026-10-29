import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  isOrganizationWallet,
  normalizeCheckoutUrl,
  normalizeCreditBalance,
} from "@/lib/aiCredits";
import type { BrainiacCreditBalanceDto } from "@/lib/types/billingCredits";
import { getUserId, getUserRole, isAuthenticated } from "@/lib/auth";

type CreditsState = {
  balance: BrainiacCreditBalanceDto | null;
  organizationBalance: BrainiacCreditBalanceDto | null;
  loading: boolean;
  organizationLoading: boolean;
  error: string;
  organizationError: string;
  refresh: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  startRecharge: (accountType?: "User" | "Employer") => Promise<{ ok: boolean; error?: string }>;
  rechargeLoading: boolean;
};

const CreditsContext = createContext<CreditsState | null>(null);

export function useBrainiacCredits(): CreditsState {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    throw new Error("useBrainiacCredits must be used within BrainiacCreditsProvider");
  }
  return ctx;
}

export function useOptionalBrainiacCredits(): CreditsState | null {
  return useContext(CreditsContext);
}

export function useCreditsState(): CreditsState {
  const [balance, setBalance] = useState<BrainiacCreditBalanceDto | null>(null);
  const [organizationBalance, setOrganizationBalance] = useState<BrainiacCreditBalanceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [error, setError] = useState("");
  const [organizationError, setOrganizationError] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) {
      setBalance(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    const res = await api.brainiacCredits.balance();
    setLoading(false);
    if (!res.ok) {
      setBalance(null);
      if (res.status === 401) {
        setError("");
        return;
      }
      setError(res.error || "Unable to load Brainiac credits.");
      return;
    }
    setBalance(normalizeCreditBalance(res.data));
  }, []);

  const refreshOrganization = useCallback(async () => {
    const role = getUserRole();
    if (!isAuthenticated() || (role !== "Employer" && role !== "GlobalAdmin")) {
      setOrganizationBalance(null);
      setOrganizationError("");
      return;
    }
    setOrganizationLoading(true);
    setOrganizationError("");
    const res = await api.brainiacCredits.organizationBalance();
    setOrganizationLoading(false);
    if (!res.ok) {
      setOrganizationBalance(null);
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        setOrganizationError(res.status === 403 || res.status === 404 ? "" : "");
        return;
      }
      setOrganizationError(res.error || "Unable to load organization credits.");
      return;
    }
    setOrganizationBalance(normalizeCreditBalance(res.data));
  }, []);

  const startRecharge = useCallback(async (accountType?: "User" | "Employer") => {
    const userId = getUserId();
    if (!userId) return { ok: false, error: "You must be signed in to recharge credits." };
    const role = getUserRole();
    const resolvedType = accountType || (role === "Employer" ? "Employer" : "User");
    setRechargeLoading(true);
    const res = await api.subscriptions.initializeCreditRecharge({
      userId,
      accountType: resolvedType,
    });
    setRechargeLoading(false);
    const checkoutUrl = normalizeCheckoutUrl(res.data);
    if (res.ok && checkoutUrl) {
      window.location.href = checkoutUrl;
      return { ok: true };
    }
    return { ok: false, error: res.error || "Unable to start credit recharge." };
  }, []);

  useEffect(() => {
    void refresh();
    void refreshOrganization();
    const onAuth = () => {
      void refresh();
      void refreshOrganization();
    };
    window.addEventListener("auth-change", onAuth);
    window.addEventListener("brainepedia:credits-refresh", onAuth);
    return () => {
      window.removeEventListener("auth-change", onAuth);
      window.removeEventListener("brainepedia:credits-refresh", onAuth);
    };
  }, [refresh, refreshOrganization]);

  return useMemo(
    () => ({
      balance,
      organizationBalance,
      loading,
      organizationLoading,
      error,
      organizationError,
      refresh,
      refreshOrganization,
      startRecharge,
      rechargeLoading,
    }),
    [
      balance,
      organizationBalance,
      loading,
      organizationLoading,
      error,
      organizationError,
      refresh,
      refreshOrganization,
      startRecharge,
      rechargeLoading,
    ],
  );
}

export function canUseWallet(balance: BrainiacCreditBalanceDto | null): boolean {
  if (!balance) return true;
  if (balance.canUseAI === false || balance.isExhausted === true) return false;
  return true;
}

export function walletGuidance(balance: BrainiacCreditBalanceDto | null): string {
  if (!balance) return "";
  if (isOrganizationWallet(balance.walletType)) {
    return "Organization Brainiac credits are exhausted. An authorized billing owner can recharge or renew the organization plan.";
  }
  if (balance.isExhausted || balance.canUseAI === false) {
    return "Brainiac AI credits for the current billing cycle are exhausted.";
  }
  return "";
}

export { CreditsContext };
