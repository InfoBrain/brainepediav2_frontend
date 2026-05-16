import type { ContentEntry } from "../types";
import { STATUS_COLORS, PLATFORM_COLORS } from "../types";
import { TrendingUp, Target, Users, Zap, Calendar, CheckCircle, Clock, BarChart3, Plus } from "lucide-react";

interface Props {
  entries: ContentEntry[];
  onNewEntry: () => void;
  onViewCalendar: () => void;
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className="card-glow" style={{
      background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)",
      borderRadius: 14, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 12,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#64748B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
          <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569" }}>{sub}</p>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ entries, onNewEntry, onViewCalendar }: Props) {
  const statusCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};
  const pillarCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const e of entries) {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    platformCounts[e.platform] = (platformCounts[e.platform] || 0) + 1;
    pillarCounts[e.contentPillar] = (pillarCounts[e.contentPillar] || 0) + 1;
    typeCounts[e.contentType] = (typeCounts[e.contentType] || 0) + 1;
  }

  const published = statusCounts["Published"] || 0;
  const scheduled = statusCounts["Scheduled"] || 0;
  const approved  = statusCounts["Approved"] || 0;
  const inReview  = statusCounts["In Review"] || 0;

  const topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topPillars   = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topTypes     = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const maxPlatform = Math.max(...topPlatforms.map(x => x[1]), 1);
  const maxPillar   = Math.max(...topPillars.map(x => x[1]), 1);

  const upcomingEntries = entries
    .filter(e => e.status === "Scheduled" || e.status === "Approved")
    .slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ padding: "32px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#F1F5F9" }}>
            Content Calendar <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 14 }}>Brainepedia v2 Marketing — Overview & Analytics</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onViewCalendar}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#60A5FA", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Calendar size={15} />
            View Calendar
          </button>
          <button
            onClick={onNewEntry}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "linear-gradient(135deg,#1E40AF,#3B82F6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={15} />
            Add Content
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Posts" value={entries.length} icon={BarChart3} color="#3B82F6" sub="All content entries" />
        <StatCard label="Published" value={published} icon={CheckCircle} color="#10B981" sub="Live content" />
        <StatCard label="Scheduled" value={scheduled + approved} icon={Clock} color="#A78BFA" sub="Ready to publish" />
        <StatCard label="In Review" value={inReview} icon={Target} color="#F59E0B" sub="Awaiting approval" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* Platform breakdown */}
        <div style={{ background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Posts by Platform
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topPlatforms.map(([platform, count]) => (
              <div key={platform}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#CBD5E1" }}>{platform}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#F1F5F9" }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "#1E293B", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${(count / maxPlatform) * 100}%`,
                    background: PLATFORM_COLORS[platform] || "#3B82F6",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar breakdown */}
        <div style={{ background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Content Pillars
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {topPillars.map(([pillar, count]) => (
              <div key={pillar} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pillar}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 4, background: "#1E293B", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${(count / maxPillar) * 100}%`, background: "#3B82F6", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#60A5FA", minWidth: 18, textAlign: "right" }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status overview */}
        <div style={{ background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Status Overview
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
              if (!colors) return null;
              return (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                    }}>{status}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content type + Upcoming row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>

        {/* Content types */}
        <div style={{ background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={14} />
              Content Format Mix
            </div>
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {topTypes.map(([type, count]) => (
              <div key={type} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20, fontSize: 12,
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                color: "#93C5FD",
              }}>
                <span>{type}</span>
                <span style={{ fontWeight: 700, color: "#60A5FA" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div style={{ background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={14} />
              Upcoming Content
            </div>
          </h3>
          {upcomingEntries.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13 }}>No upcoming scheduled content.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingEntries.map(e => {
                const sc = STATUS_COLORS[e.status as keyof typeof STATUS_COLORS];
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#111827", borderRadius: 8, border: "1px solid rgba(59,130,246,0.08)" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `${PLATFORM_COLORS[e.platform] || "#3B82F6"}22`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${PLATFORM_COLORS[e.platform] || "#3B82F6"}44`,
                    }}>
                      <Zap size={15} color={PLATFORM_COLORS[e.platform] || "#3B82F6"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.topicHook}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>{e.date} · {e.platform} · {e.contentType}</p>
                    </div>
                    {sc && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, flexShrink: 0 }}>
                        {e.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
