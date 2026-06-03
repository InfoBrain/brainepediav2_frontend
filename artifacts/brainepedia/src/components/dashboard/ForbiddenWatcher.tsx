import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { getUserRole, isAuthenticated } from "@/lib/auth";

export function ForbiddenWatcher() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // ── 403 Forbidden — subscription upgrade prompt ──────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const role = getUserRole();
      const subPath =
        role === "Employer" ? "/employer/subscription" : role === "User" ? "/user/subscription" : "/admin/subscriptions";
      toast({
        title: "Access Restricted",
        description:
          detail.message ||
          "Upgrade your subscription to unlock this District.",
        variant: "destructive",
        action: (
          <ToastAction altText="Upgrade" onClick={() => setLocation(subPath)}>
            Upgrade
          </ToastAction>
        ),
      });
    };
    window.addEventListener("api-forbidden", handler);
    return () => window.removeEventListener("api-forbidden", handler);
  }, [toast, setLocation]);

  // ── 401 Unauthorized — session expired, redirect to login ────────────────
  useEffect(() => {
    const handler = () => {
      // Only redirect if the user was previously authenticated; if they were
      // already on a public page this event can be a false alarm.
      if (!isAuthenticated()) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setLocation("/auth/login?reason=expired");
      }
    };
    window.addEventListener("api-unauthorized", handler);
    return () => window.removeEventListener("api-unauthorized", handler);
  }, [toast, setLocation]);

  return null;
}
