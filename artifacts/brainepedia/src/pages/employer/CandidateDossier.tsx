import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Award, Bookmark, BriefcaseBusiness, Crown, Loader2, RefreshCw, ShieldCheck, Trophy, Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, candidateAvatar, candidateName, formatNumber, idOf, initials, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CandidateDossier() {
  const [, params] = useRoute("/employer/candidates/:userId");
  const userId = params?.userId ? decodeURIComponent(params.userId) : "";
  const { toast } = useToast();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    const res = await api.jobs.candidateDossier(userId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load candidate dossier.");
      return;
    }
    setDossier(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const res = await api.jobs.saveCandidate({ candidateUserId: userId, notes: notes || null });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Unable to save candidate", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Candidate saved", description: "Notes were stored with this saved candidate." });
  };

  if (!userId) {
    return (
      <DashboardShell nav={EMPLOYER_NAV} title="Candidate Dossiers" subtitle="// recruitment.candidate-dossiers" theme="employer">
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[#00D2FF]" />
          <h2 className="text-2xl font-black">Select a candidate to view their dossier.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Dossiers are opened from Candidate Explorer or Saved Candidates and show XP, VX, badges, missions, rank, and leaderboard proof.
          </p>
          <Button asChild className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
            <Link href="/employer/candidates">Open Candidate Explorer</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const profile = dossier?.profile ?? dossier?.candidate ?? dossier?.user ?? dossier;
  const name = candidateName(profile);
  const avatarUrl = candidateAvatar(profile);
  const profession = text(profile?.professionName ?? profile?.ProfessionName ?? profile?.profession ?? profile?.Profession ?? profile?.currentTitle, "Verified professional");
  const badges = asList(dossier?.badges ?? dossier?.topBadges ?? profile?.badges);
  const missions = asList(dossier?.missions ?? dossier?.completedMissions ?? dossier?.missionHistory ?? profile?.missions);

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Candidate Dossier" subtitle="// recruitment.verified-dossier" theme="employer">
      <div className="space-y-6">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/employer/candidates"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidate Explorer</Link>
        </Button>

        {loading ? (
          <State label="Loading verified dossier..." />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="mb-4 text-sm text-destructive">{error}</p>
            <Button onClick={load} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-[#00D2FF]/15 bg-gradient-to-br from-[#00D2FF]/10 via-[#0d1119] to-[#7C3AED]/10 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#00D2FF]/35 to-[#7C3AED]/30 text-xl font-black">
                    {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials(name)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black">{name}</h2>
                    <p className="text-sm text-muted-foreground">{profession}</p>
                    <p className="mt-1 text-xs font-mono text-[#FFD700]">{text(profile?.rankTitle ?? profile?.RankTitle ?? profile?.rank ?? profile?.professionalRank ?? profile?.tier, "Rank pending")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[420px]">
                  <Metric icon={Zap} label="XP" value={formatNumber(profile?.xp ?? profile?.XP ?? profile?.totalXP ?? profile?.totalXp ?? dossier?.xp)} />
                  <Metric icon={Award} label="VX" value={formatNumber(profile?.vx ?? profile?.VX ?? profile?.verifiedExperienceYears ?? profile?.verifiedExperience ?? dossier?.vx)} />
                  <Metric icon={Crown} label="Leaderboard" value={formatNumber(dossier?.leaderboardPosition ?? dossier?.rankPosition)} />
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><Trophy className="h-5 w-5 text-[#FFD700]" /> Badges</h3>
                {badges.length === 0 ? (
                  <Empty label="No badges returned for this dossier." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge, index) => (
                      <span key={idOf(badge) || index} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                        {text(badge?.name ?? badge?.title, "Badge")}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <aside className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><Bookmark className="h-5 w-5 text-[#00D2FF]" /> Saved notes</h3>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add internal notes before saving this candidate."
                  className="min-h-32"
                />
                <Button onClick={save} disabled={saving} className="mt-4 w-full bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bookmark className="mr-2 h-4 w-4" />}
                  Save candidate
                </Button>
              </aside>
            </div>

            <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><BriefcaseBusiness className="h-5 w-5 text-[#00D2FF]" /> Missions</h3>
              {missions.length === 0 ? (
                <Empty label="No mission evidence returned for this dossier." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {missions.map((mission, index) => (
                    <div key={idOf(mission) || index} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                      <h4 className="font-semibold">{text(mission?.title ?? mission?.missionTitle ?? mission?.name, "Mission")}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{text(mission?.districtName ?? mission?.professionName ?? mission?.status, "Verified mission evidence")}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d1119]/80 p-3">
      <Icon className="mb-2 h-4 w-4 text-[#00D2FF]" />
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function State({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" />
      <span className="font-mono">{label}</span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">{label}</div>;
}
