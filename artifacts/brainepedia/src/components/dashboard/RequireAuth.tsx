import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAuthenticated, getUserRole, getDashboardPath } from "@/lib/auth";

type Role = "GlobalAdmin" | "Employer" | "User";

export function RequireAuth({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/auth/login");
      return;
    }
    const role = getUserRole();
    if (role && !allow.includes(role)) {
      setLocation(getDashboardPath(role));
    }
  }, [allow, setLocation]);

  if (!isAuthenticated()) return null;
  const role = getUserRole();
  if (role && !allow.includes(role)) return null;

  return <>{children}</>;
}
