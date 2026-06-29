import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@/components/ux/LoadingState";

export function ChartSuspense({ children, height = 280 }: { children: ReactNode; height?: number }) {
  return (
    <div style={{ minHeight: height }}>
      <Suspense fallback={<LoadingState label="Loading chart..." variant="card" rows={1} className="max-w-full" />}>
        {children}
      </Suspense>
    </div>
  );
}
