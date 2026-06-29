import { lazy, Suspense } from "react";
import { LoadingState } from "@/components/ux/LoadingState";

const XPChartInner = lazy(() => import("./XPChartInner"));

type Point = { date: string; xp: number; cumulative: number };

export function XPChart({ data }: { data: Point[] }) {
  return (
    <Suspense fallback={<LoadingState label="Loading chart..." variant="card" rows={1} />}>
      <XPChartInner data={data} />
    </Suspense>
  );
}
