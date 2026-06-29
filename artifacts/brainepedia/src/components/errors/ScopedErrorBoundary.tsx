import type { ReactNode } from "react";
import { useLocation } from "wouter";
import {
  AdminErrorBoundary,
  DashboardErrorBoundary,
  EmployerErrorBoundary,
  ForumErrorBoundary,
  JobsErrorBoundary,
  MissionErrorBoundary,
} from "@/components/errors/ErrorBoundary";

/**
 * Selects the appropriate domain error boundary based on the current route.
 */
export function ScopedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  if (location.startsWith("/admin")) {
    return <AdminErrorBoundary>{children}</AdminErrorBoundary>;
  }
  if (location.startsWith("/employer")) {
    return <EmployerErrorBoundary>{children}</EmployerErrorBoundary>;
  }
  if (location.startsWith("/forum")) {
    return <ForumErrorBoundary>{children}</ForumErrorBoundary>;
  }
  if (location.startsWith("/jobs")) {
    return <JobsErrorBoundary>{children}</JobsErrorBoundary>;
  }
  if (
    location.startsWith("/app/") ||
    location.startsWith("/mission/") ||
    location.startsWith("/missions/") ||
    location.startsWith("/profession/")
  ) {
    return <MissionErrorBoundary>{children}</MissionErrorBoundary>;
  }
  if (
    location.startsWith("/user") ||
    location.startsWith("/profile") ||
    location === "/login-success"
  ) {
    return <DashboardErrorBoundary>{children}</DashboardErrorBoundary>;
  }

  return <>{children}</>;
}
