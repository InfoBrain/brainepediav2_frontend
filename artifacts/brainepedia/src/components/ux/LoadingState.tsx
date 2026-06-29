import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  variant?: "spinner" | "card" | "table" | "profile" | "grid";
  rows?: number;
};

export function LoadingState({
  label = "Loading...",
  className,
  variant = "spinner",
  rows = 5,
}: LoadingStateProps) {
  if (variant === "spinner") {
    return (
      <div
        className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <BrainiacSpinner text={label} className="py-8" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)} role="status" aria-busy="true" aria-label={label}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#0d1119] p-5 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("rounded-2xl border border-white/10 overflow-hidden", className)} role="status" aria-busy="true" aria-label={label}>
        <div className="border-b border-white/10 bg-white/5 px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/5 px-4 py-4 last:border-0">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div className={cn("flex flex-col items-center gap-4 py-12", className)} role="status" aria-busy="true" aria-label={label}>
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="mt-4 grid w-full max-w-lg grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)} role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

export function ButtonLoading({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
