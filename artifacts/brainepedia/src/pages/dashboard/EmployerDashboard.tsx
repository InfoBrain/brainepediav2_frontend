import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Search,
  Users as UsersIcon,
  ShieldCheck,
  Loader2,
  Trophy,
  ExternalLink,
  Crown,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const nav: NavItem[] = [
  { href: "/employer/portal", label: "Talent Search", icon: Search },
  { href: "/employer/saved", label: "Saved Candidates", icon: UsersIcon },
  { href: "/employer/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/employer/postings", label: "Postings", icon: Briefcase },
];

type Candidate = {
  id: string;
  fullName: string;
  profession?: string;
  isGrandmaster?: boolean;
  topBadges?: { name: string; rarity?: string }[];
  verifiedXp?: number;
};

type DistrictRow = { name: string; mastery: number };

export default function EmployerDashboard() {
  const [profession, setProfession] = useState("");
  const [minXP, setMinXP] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [badges, setBadges] = useState<Candidate["topBadges"]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    const params: { profession?: string; minXP?: number } = {};
    if (profession.trim()) params.profession = profession.trim();
    const n = Number(minXP);
    if (minXP !== "" && !isNaN(n)) params.minXP = n;
    const res = await api.profiles.search(params);
    setLoading(false);
    if (res.ok) setCandidates(normalizeCandidates(res.data));
    else setCandidates([]);
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCandidate = async (c: Candidate) => {
    setSelected(c);
    setDetailLoading(true);
    const [m, b] = await Promise.all([
      api.userProgresses.map(c.id),
      api.userBadges.forUser(c.id),
    ]);
    setDetailLoading(false);
    setDistricts(m.ok ? normalizeDistricts(m.data) : []);
    setBadges(
      b.ok
        ? normalizeBadgeList(b.data)
        : c.topBadges || []
    );
  };

  const chartData = useMemo(
    () =>
      districts.length
        ? districts.slice(0, 6).map((d) => ({ subject: d.name, A: Math.round(d.mastery) }))
        : [
            { subject: "Legal", A: 0 },
            { subject: "Tech", A: 0 },
            { subject: "Health", A: 0 },
            { subject: "Finance", A: 0 },
            { subject: "Creative", A: 0 },
          ],
    [districts]
  );

  return (
    <DashboardShell
      nav={nav}
      title="Validator's Suite"
      subtitle="// employer.talent.verification"
      theme="employer"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Search + List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1">Talent Search</h2>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              By profession or verified XP level
            </p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Profession (e.g. Tech, Legal)"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                type="number"
                min={0}
                value={minXP}
                onChange={(e) => setMinXP(e.target.value)}
                placeholder="Minimum XP"
              />
              <Button onClick={runSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <Loading text="Searching candidates…" />
            ) : candidates.length === 0 ? (
              <Empty text="No candidates found. Try a different profession." />
            ) : (
              candidates.slice(0, 12).map((c) => {
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCandidate(c)}
                    className={`w-full text-left bg-[#0d1119] border rounded-xl p-4 transition-all ${
                      active
                        ? "border-[#00D2FF]/50 shadow-[0_0_20px_rgba(0,210,255,0.2)]"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00D2FF]/40 to-[#7C3AED]/30 flex items-center justify-center font-bold text-sm shrink-0">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{c.fullName}</span>
                          {c.isGrandmaster && (
                            <Crown className="h-3.5 w-3.5 text-[#FFD700] shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {c.profession || "—"}
                          {typeof c.verifiedXp === "number" && (
                            <span className="text-[#00D2FF]">
                              {" "}
                              · {c.verifiedXp.toLocaleString()} XP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3 space-y-6">
          {!selected ? (
            <div className="bg-[#0d1119] border border-white/5 rounded-xl p-12 text-center">
              <ShieldCheck className="h-10 w-10 text-[#00D2FF] mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">Select a candidate</h3>
              <p className="text-sm text-muted-foreground">
                Pick a result on the left to view their competency chart and credentials.
              </p>
            </div>
          ) : detailLoading ? (
            <Loading text="Loading candidate…" />
          ) : (
            <>
              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">{selected.fullName}</h2>
                      {selected.isGrandmaster && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 flex items-center gap-1">
                          <Crown className="h-3 w-3" /> Grandmaster
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {selected.profession || "—"}
                      {typeof selected.verifiedXp === "number" &&
                        ` · ${selected.verifiedXp.toLocaleString()} XP`}
                    </div>
                  </div>
                  <Button
                    className="bg-[#00D2FF] hover:bg-[#00B8DD] text-black font-bold shadow-[0_0_18px_rgba(0,210,255,0.45)]"
                    onClick={() =>
                      window.open(`/verify/${encodeURIComponent(selected.id)}`, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Verified Certificate
                  </Button>
                </div>
              </div>

              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold">Competency Chart</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Mastery across Districts
                    </p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData} outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                        axisLine={false}
                      />
                      <Radar
                        name="Mastery"
                        dataKey="A"
                        stroke="#00D2FF"
                        fill="#00D2FF"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#FFD700]" />
                  Top Earned Badges
                </h3>
                {(badges?.length ?? 0) === 0 ? (
                  <Empty text="No verified badges yet for this candidate." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {badges!.slice(0, 12).map((b, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10"
                      >
                        {b.name}
                        {b.rarity && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                            {b.rarity}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground font-mono border border-dashed border-white/10 rounded-lg">
      {text}
    </div>
  );
}
function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="font-mono text-sm">{text}</span>
    </div>
  );
}

function normalizeCandidates(d: any): Candidate[] {
  const arr = Array.isArray(d) ? d : d?.candidates || d?.items || d?.results || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => ({
    id: String(x.userId ?? x.id ?? x.profileId ?? Math.random()),
    fullName:
      x.fullName ||
      x.name ||
      `${x.firstName || ""} ${x.surName || x.lastName || ""}`.trim() ||
      "Candidate",
    profession: x.profession || x.role || x.currentTitle || x.title,
    isGrandmaster:
      Boolean(x.isGrandmaster) ||
      Number(x.currentSubscription) === 2 ||
      String(x.rank || x.tier || "").toLowerCase().includes("grandmaster"),
    topBadges: Array.isArray(x.badges)
      ? x.badges.map((b: any) => ({ name: b.name || b.title || "Badge", rarity: b.rarity }))
      : [],
    verifiedXp:
      typeof x.totalXP === "number" ? x.totalXP :
      typeof x.verifiedXp === "number" ? x.verifiedXp :
      typeof x.xp === "number" ? x.xp : undefined,
  }));
}

function normalizeDistricts(d: any): DistrictRow[] {
  const arr = Array.isArray(d) ? d : d?.districts || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => ({
    name: x.name || x.district || "District",
    mastery: Number(x.mastery ?? x.percent ?? x.progress ?? 0),
  }));
}
function normalizeBadgeList(d: any): { name: string; rarity?: string }[] {
  const arr = Array.isArray(d) ? d : d?.badges || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => ({
    name: x.name || x.title || "Badge",
    rarity: x.rarity || x.tier,
  }));
}
