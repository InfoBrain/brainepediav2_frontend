import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; xp: number; cumulative: number };

export default function XPChartInner({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} />
        <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#0d1119", border: "1px solid rgba(255,215,0,.25)", borderRadius: 12 }} />
        <Line type="monotone" dataKey="cumulative" stroke="#FFD700" strokeWidth={2} dot={false} name="Cumulative XP" />
        <Line type="monotone" dataKey="xp" stroke="#00D2FF" strokeWidth={2} dot={false} name="Daily XP" />
      </LineChart>
    </ResponsiveContainer>
  );
}
