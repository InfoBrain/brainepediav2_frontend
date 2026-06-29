import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "wouter";
import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ErrorBoundaryScope =
  | "global"
  | "dashboard"
  | "forum"
  | "jobs"
  | "mission"
  | "admin"
  | "employer";

type Props = {
  children: ReactNode;
  scope?: ErrorBoundaryScope;
  dashboardHref?: string;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  errorId: string;
};

const SCOPE_COPY: Record<
  ErrorBoundaryScope,
  { title: string; description: string; illustration: string }
> = {
  global: {
    title: "Brainepedia hit an unexpected snag",
    description:
      "Something went wrong while rendering this page. Your data is safe — try refreshing or return to your dashboard.",
    illustration: "🛰️",
  },
  dashboard: {
    title: "Dashboard unavailable right now",
    description:
      "We couldn't load your dashboard view. This is usually temporary — retry or head back to your home dashboard.",
    illustration: "📊",
  },
  forum: {
    title: "Forum temporarily unavailable",
    description:
      "The community area couldn't be displayed. Your discussions are still safe — try again in a moment.",
    illustration: "💬",
  },
  jobs: {
    title: "Jobs section unavailable",
    description:
      "We couldn't load the jobs experience. Refresh to try again or return to your dashboard.",
    illustration: "💼",
  },
  mission: {
    title: "Mission viewer unavailable",
    description:
      "The mission interface encountered an error. Your progress is preserved — retry to continue.",
    illustration: "🎯",
  },
  admin: {
    title: "Admin panel error",
    description:
      "An admin view failed to render. Retry the action or return to the admin dashboard.",
    illustration: "⚙️",
  },
  employer: {
    title: "Employer workspace error",
    description:
      "A recruiter workflow view couldn't load. Your company data is unaffected — try again shortly.",
    illustration: "🏢",
  },
};

const DEFAULT_DASHBOARD: Record<ErrorBoundaryScope, string> = {
  global: "/",
  dashboard: "/user/dashboard",
  forum: "/forum",
  jobs: "/jobs",
  mission: "/user/missions",
  admin: "/admin/dashboard",
  employer: "/employer/overview",
};

function ErrorFallback({
  scope,
  dashboardHref,
  onReset,
  errorId,
}: {
  scope: ErrorBoundaryScope;
  dashboardHref: string;
  onReset: () => void;
  errorId: string;
}) {
  const copy = SCOPE_COPY[scope];

  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-[#0A0E14] px-4 py-16"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1119] p-8 text-center shadow-[0_0_40px_rgba(0,210,255,0.08)]">
        <div
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-5xl"
          aria-hidden="true"
        >
          {copy.illustration}
        </div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-mono text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Error {errorId}
        </div>
        <h1 className="text-2xl font-black text-foreground">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
          <Button variant="outline" asChild>
            <Link href={dashboardHref}>
              <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: "" };

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorId: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary:${this.props.scope ?? "global"}]`, error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: "" });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const scope = this.props.scope ?? "global";
      return (
        <ErrorFallback
          scope={scope}
          dashboardHref={this.props.dashboardHref ?? DEFAULT_DASHBOARD[scope]}
          onReset={this.handleReset}
          errorId={this.state.errorId}
        />
      );
    }
    return this.props.children;
  }
}

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="global">{children}</AppErrorBoundary>;
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="dashboard">{children}</AppErrorBoundary>;
}

export function ForumErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="forum" dashboardHref="/forum">{children}</AppErrorBoundary>;
}

export function JobsErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="jobs" dashboardHref="/jobs">{children}</AppErrorBoundary>;
}

export function MissionErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="mission">{children}</AppErrorBoundary>;
}

export function AdminErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="admin" dashboardHref="/admin/dashboard">{children}</AppErrorBoundary>;
}

export function EmployerErrorBoundary({ children }: { children: ReactNode }) {
  return <AppErrorBoundary scope="employer" dashboardHref="/employer/overview">{children}</AppErrorBoundary>;
}
