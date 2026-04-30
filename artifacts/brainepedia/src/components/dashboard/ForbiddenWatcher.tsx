import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { getDashboardPath, getUserRole } from "@/lib/auth";

export function ForbiddenWatcher() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const role = getUserRole();
      const subPath =
        role === "User" ? "/user/subscription" : `${getDashboardPath(role)}/subscription`;
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

  return null;
}
