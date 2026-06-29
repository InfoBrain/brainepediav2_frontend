import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  showDashboardLink?: boolean;
  dashboardHref?: string;
  className?: string;
  compact?: boolean;
};

export function ErrorState({
  title = "Unable to load content",
  message,
  onRetry,
  showDashboardLink = true,
  dashboardHref = "/user/dashboard",
  className,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <Alert variant="destructive" className={cn("border-destructive/30 bg-destructive/10", className)} role="alert">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{message}</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="border-destructive/30">
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        )}
        {showDashboardLink && (
          <Button variant="outline" asChild>
            <Link href={dashboardHref}>
              <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
              Return to Dashboard
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
