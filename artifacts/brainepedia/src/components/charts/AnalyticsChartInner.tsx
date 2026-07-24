import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartPoint = { name: string; value: number };

export default function AnalyticsChartInner({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#0d1119", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
        <Bar dataKey="value" fill="#A5B4FC" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
