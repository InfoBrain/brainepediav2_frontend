import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BrainiacCreditsCard } from "@/components/credits/BrainiacCreditsCard";
import { BrainiacUsageHistory } from "@/components/credits/BrainiacUsageHistory";
import { useBrainiacCredits } from "@/hooks/useBrainiacCredits";
import { USER_NAV } from "@/lib/userNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { ADMIN_NAV } from "@/lib/adminNav";
import { getUserRole } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocation } from "wouter";

export default function BrainiacUsagePage() {
  usePageTitle("Brainiac Credits");
  const role = getUserRole();
  const [, navigate] = useLocation();
  const credits = useBrainiacCredits();
  const isEmployer = role === "Employer";
  const isAdmin = role === "GlobalAdmin";
  const nav = isAdmin ? ADMIN_NAV : isEmployer ? EMPLOYER_NAV : USER_NAV;
  const theme = isAdmin ? "admin" : isEmployer ? "employer" : "user";
  const subscriptionHref = isEmployer ? "/employer/subscription" : isAdmin ? "/admin/subscriptions" : "/user/subscription";
  const billingHref = isEmployer ? "/employer/billing" : undefined;

  return (
    <DashboardShell nav={nav} title="Brainiac Credits & Usage" subtitle="// remaining.credits.usage.history" theme={theme}>
      <div className="space-y-6">
        <BrainiacCreditsCard
          balance={credits.balance}
          loading={credits.loading}
          error={credits.error}
          onRefresh={() => void credits.refresh()}
          onUpgrade={() => navigate(subscriptionHref)}
          onRecharge={() => void credits.startRecharge(isEmployer ? "Employer" : "User")}
          actionLoading={credits.rechargeLoading}
          usageHref={undefined}
          billingHref={billingHref}
        />
        {isEmployer && (
          <BrainiacCreditsCard
            title="Organization Brainiac credits"
            balance={credits.organizationBalance}
            loading={credits.organizationLoading}
            error={credits.organizationError}
            onRefresh={() => void credits.refreshOrganization()}
            onUpgrade={() => navigate("/employer/subscription")}
            onRecharge={() => navigate("/employer/billing")}
            billingHref="/employer/billing"
          />
        )}
        <BrainiacUsageHistory />
      </div>
    </DashboardShell>
  );
}
