import { useEffect, useState } from "react";
import { BarChart3, Loader2, Trophy, Flame, Target, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";

type Employee = {
  userId: string;
  name: string;
  profession?: string;
  totalXP: number;
  problemsSolved: number;
  dayStreak: number;
  verifiedExperience?: number;
};

type AnalyticsData = {
  organizationSize: number;
  employees: Employee[];
  professionDistribution: { profession: string; count: number }[];
  averageXP: number;
};

function StatPill({ label, value, color = "#00D2FF" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0d1119] border border-white/5 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function TeamAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.employers.teamAnalytics().then((res) => {
      if (res.ok) setData(normAnalytics(res.data));
      setLoading(false);
    });
  }, []);

  const xpChartData = (data?.employees ?? [])
    .sort((a, b) => b.totalXP - a.totalXP)
    .slice(0, 10)
    .map((e) => ({ name: e.name.split(" ")[0], xp: e.totalXP }));

  const radarData = (data?.professionDistribution ?? []).slice(0, 6).map((p) => ({
    subject: p.profession,
    count: p.count,
  }));

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Analytics" subtitle="// employer.insights.performance" theme="employer">
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-mono text-sm">Loading analytics…</span>
        </div>
      ) : !data ? (
        <div className="py-16 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
          No analytics data available yet. Add team members to see insights.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatPill label="Team Size" value={data.organizationSize} color="#00D2FF" />
            <StatPill label="Avg Verified XP" value={Math.round(data.averageXP).toLocaleString()} color="#9D4EDD" />
            <StatPill
              label="Top Streak"
              value={Math.max(0, ...data.employees.map((e) => e.dayStreak))}
              color="#FFD700"
            />
            <StatPill
              label="Problems Solved"
              value={data.employees.reduce((s, e) => s + e.problemsSolved, 0)}
              color="#22c55e"
            />
          </div>

          {/* XP Bar Chart */}
          {xpChartData.length > 0 && (
            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00D2FF]" />
                Top 10 by Verified XP
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={xpChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#0d1119", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#00D2FF" }}
                    />
                    <Bar dataKey="xp" fill="#00D2FF" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profession Distribution */}
            {radarData.length > 0 && (
              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#9D4EDD]" />
                  Profession Distribution
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={false} axisLine={false} />
                      <Radar dataKey="count" stroke="#9D4EDD" fill="#9D4EDD" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Employee Leaderboard */}
            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#FFD700]" />
                Performance Leaderboard
              </h3>
              <div className="space-y-2">
                {data.employees
                  .sort((a, b) => b.totalXP - a.totalXP)
                  .slice(0, 8)
                  .map((emp, i) => (
                    <div key={emp.userId} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <span className={`text-xs font-mono w-5 shrink-0 ${
                        i === 0 ? "text-[#FFD700]" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"
                      }`}>
                        #{i + 1}
                      </span>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00D2FF]/20 to-[#9D4EDD]/20 flex items-center justify-center text-xs font-bold shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp.name}</p>
                        {emp.profession && (
                          <p className="text-xs text-muted-foreground font-mono truncate">{emp.profession}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono text-[#00D2FF]">{emp.totalXP.toLocaleString()} XP</p>
                        <p className="text-[10px] text-muted-foreground font-mono flex items-center justify-end gap-1">
                          <Flame className="h-2.5 w-2.5 text-orange-400" />
                          {emp.dayStreak}d · <Target className="h-2.5 w-2.5 text-[#9D4EDD] ml-0.5" />
                          {emp.problemsSolved}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function normAnalytics(d: any): AnalyticsData {
  const employees: Employee[] = (
    Array.isArray(d?.employees) ? d.employees : Array.isArray(d?.members) ? d.members : []
  ).map((x: any) => ({
    userId: String(x.userId ?? x.id ?? Math.random()),
    name: x.name ?? (`${x.firstName ?? ""} ${x.lastName ?? ""}`.trim() || "Employee"),
    profession: x.profession ?? x.role,
    totalXP: Number(x.totalXP ?? x.xp ?? x.verifiedXp ?? 0),
    problemsSolved: Number(x.problemsSolved ?? x.challengesSolved ?? x.solved ?? 0),
    dayStreak: Number(x.dayStreak ?? x.streak ?? 0),
    verifiedExperience: Number(x.verifiedExperience ?? x.verifiedXp ?? 0),
  }));

  const profMap: Record<string, number> = {};
  employees.forEach((e) => {
    if (e.profession) profMap[e.profession] = (profMap[e.profession] ?? 0) + 1;
  });

  return {
    organizationSize: d?.organizationSize ?? d?.teamSize ?? employees.length,
    employees,
    professionDistribution: Object.entries(profMap).map(([profession, count]) => ({ profession, count })),
    averageXP: employees.length ? employees.reduce((s, e) => s + e.totalXP, 0) / employees.length : 0,
  };
}
