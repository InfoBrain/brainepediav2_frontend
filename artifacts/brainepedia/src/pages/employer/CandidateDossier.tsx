import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Award, Bookmark, BriefcaseBusiness, Crown, Eye, Github, Linkedin, Loader2, Mail, Phone, RefreshCw, ShieldCheck, Trophy, Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, candidateAvatar, candidateName, formatNumber, idOf, initials, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CandidateDossier() {
  const [, params] = useRoute("/employer/candidates/:userId");
  const userId = params?.userId ? decodeURIComponent(params.userId) : "";
  const { toast } = useToast();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [performance, setPerformance] = useState<any | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    const [dossierRes, portfolioRes] = await Promise.all([
      api.jobs.candidateDossier(userId),
      api.profiles.publicPortfolio(userId),
    ]);
    setLoading(false);
    if (!dossierRes.ok) {
      setError(dossierRes.error || "Unable to load candidate dossier.");
      return;
    }
    setDossier({
      ...(dossierRes.data as any),
      portfolio: portfolioRes.ok ? portfolioRes.data : undefined,
    });
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

  const viewPerformance = async (problemNodeId: string) => {
    if (!problemNodeId) return;
    setPerformanceLoading(true);
    setPerformance(null);
    const res = await api.evaluations.getNodeResult(problemNodeId, userId);
    setPerformanceLoading(false);
    if (!res.ok) {
      toast({ title: "Unable to load mission performance", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setPerformance(res.data);
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
  const portfolio = dossier?.portfolio ?? dossier?.Portfolio ?? dossier;
  const name = candidateName(profile);
  const avatarUrl = candidateAvatar(profile);
  const profession = text(profile?.professionName ?? profile?.ProfessionName ?? profile?.profession ?? profile?.Profession ?? profile?.activeProfession ?? profile?.professionalTitle ?? profile?.currentTitle, "Verified professional");
  const badges = asList(dossier?.badges ?? dossier?.topBadges ?? dossier?.earnedBadges ?? profile?.badges);
  const missions = asList(dossier?.missions ?? dossier?.completedMissions ?? dossier?.missionHistory ?? profile?.missions);
  const education = asList(portfolio?.education ?? portfolio?.Education);
  const experience = asList(portfolio?.workExperience ?? portfolio?.WorkExperience ?? portfolio?.experience);
  const projects = asList(portfolio?.projects ?? portfolio?.Projects);
  const services = asList(portfolio?.services ?? portfolio?.Services);
  const skills = asList(portfolio?.skills ?? portfolio?.Skills);
  const interests = asList(portfolio?.interests ?? portfolio?.Interests);
  const statement = text(portfolio?.personalStatement ?? portfolio?.PersonalStatement ?? portfolio?.aboutMe ?? portfolio?.AboutMe, "");

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
                  <Metric icon={Crown} label="Leaderboard" value={formatNumber(dossier?.leaderboardPosition ?? dossier?.rankPosition ?? dossier?.globalLeaderboardRank)} />
                </div>
              </div>
            </section>

            <ContactInfo profile={profile} />

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

            <RecruiterSection title="Personal Statement" empty="No personal statement returned.">
              {statement && <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{statement}</p>}
            </RecruiterSection>

            <div className="grid gap-6 lg:grid-cols-2">
              <RecruiterSection title="Experience" empty="No work experience returned.">
                <MiniCards items={experience} fields={["company", "role", "location", "description"]} />
              </RecruiterSection>
              <RecruiterSection title="Education" empty="No education returned.">
                <MiniCards items={education} fields={["institution", "degree", "courseOfStudy"]} />
              </RecruiterSection>
              <RecruiterSection title="Projects" empty="No projects returned.">
                <MiniCards items={projects} fields={["projectName", "description", "projectUrl"]} />
              </RecruiterSection>
              <RecruiterSection title="Services" empty="No services returned.">
                <MiniCards items={services} fields={["service", "description"]} />
              </RecruiterSection>
            </div>

            <RecruiterSection title="Skills & Interests" empty="No skills or interests returned.">
              <div className="flex flex-wrap gap-2">
                {[...skills.map((item: any) => item?.skill ?? item?.Skill ?? item?.name), ...interests.map((item: any) => item?.interest ?? item?.Interest ?? item?.name ?? item)]
                  .filter(Boolean)
                  .map((label: any, index) => (
                    <span key={index} className="rounded-full border border-[#00D2FF]/20 bg-[#00D2FF]/8 px-3 py-1.5 text-sm text-[#00D2FF]">{text(label, "Skill")}</span>
                  ))}
              </div>
            </RecruiterSection>

            <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><BriefcaseBusiness className="h-5 w-5 text-[#00D2FF]" /> Missions</h3>
              {missions.length === 0 ? (
                <Empty label="No mission evidence returned for this dossier." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {missions.map((mission, index) => {
                    const problemNodeId = text(mission?.problemNodeId ?? mission?.ProblemNodeId, "");
                    return (
                      <div key={idOf(mission) || problemNodeId || index} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold">{text(mission?.title ?? mission?.missionTitle ?? mission?.MissionTitle ?? mission?.name, "Mission")}</h4>
                            <p className="mt-1 text-xs text-muted-foreground">{text(mission?.districtName ?? mission?.DistrictName ?? mission?.professionName ?? mission?.status, "Verified mission evidence")}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {mission?.score !== undefined || mission?.Score !== undefined ? (
                                <span className="rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2 py-0.5 text-[#00D2FF]">
                                  Score {text(mission?.score ?? mission?.Score, "—")}%
                                </span>
                              ) : null}
                              {mission?.completedAt || mission?.CompletedAt ? (
                                <span>{new Date(String(mission?.completedAt ?? mission?.CompletedAt)).toLocaleDateString()}</span>
                              ) : null}
                            </div>
                          </div>
                          {problemNodeId && (
                            <Button variant="outline" size="sm" onClick={() => viewPerformance(problemNodeId)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View Performance
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
        <Dialog open={Boolean(performance) || performanceLoading} onOpenChange={(open) => !open && setPerformance(null)}>
          <DialogContent className="max-w-2xl bg-[#0d1119] border border-white/10">
            <DialogHeader>
              <DialogTitle>Mission Performance</DialogTitle>
              <DialogDescription>Evaluation result for this completed mission.</DialogDescription>
            </DialogHeader>
            {performanceLoading ? (
              <State label="Loading mission performance..." />
            ) : performance ? (
              <PerformanceResult result={performance} />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}

function ContactInfo({ profile }: { profile: any }) {
  const email = profile?.email ?? profile?.Email ?? profile?.emailAddress ?? profile?.EmailAddress ?? "";
  const phone = profile?.phoneNumber ?? profile?.phone ?? profile?.PhoneNumber ?? profile?.Phone ?? profile?.mobileNumber ?? "";
  const linkedin = profile?.linkedInUrl ?? profile?.linkedIn ?? profile?.linkedin ?? profile?.linkedinUrl ?? profile?.LinkedInUrl ?? "";
  const github = profile?.githubUrl ?? profile?.github ?? profile?.GitHub ?? profile?.githubProfile ?? profile?.GitHubUrl ?? "";

  const items = [
    email && { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    phone && { icon: Phone, label: "Phone", value: phone, href: `tel:${phone}` },
    linkedin && { icon: Linkedin, label: "LinkedIn", value: linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/\/$/, ""), href: linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}` },
    github && { icon: Github, label: "GitHub", value: github.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/$/, ""), href: github.startsWith("http") ? github : `https://github.com/${github}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string }[];

  if (!items.length) return null;
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
      <h3 className="mb-4 text-lg font-bold">Contact Information</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:border-[#00D2FF]/30 transition-colors group">
            <div className="h-9 w-9 rounded-lg bg-[#00D2FF]/10 flex items-center justify-center shrink-0 border border-[#00D2FF]/20">
              <Icon className="h-4 w-4 text-[#00D2FF]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="text-sm truncate group-hover:text-[#00D2FF] transition-colors">{value}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
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

function RecruiterSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      {children || <Empty label={empty} />}
    </section>
  );
}

function MiniCards({ items, fields }: { items: any[]; fields: string[] }) {
  if (!items.length) return <Empty label="No portfolio records returned." />;
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <article key={idOf(item) || index} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <div className="grid gap-2">
            {fields.map((field) => {
              const value = item?.[field] ?? item?.[field.charAt(0).toUpperCase() + field.slice(1)];
              if (!value) return null;
              return (
                <div key={field}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{field.replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-sm">{text(value, "—")}</p>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}

function PerformanceResult({ result }: { result: any }) {
  const root = result?.data ?? result?.result ?? result?.evaluation ?? result;
  const passValue = root?.passed ?? root?.isPassed ?? root?.IsPassed ?? root?.Passed ?? root?.passFail ?? root?.PassFail ?? root?.status ?? root?.Status;
  const passed = typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue);
  const rows: [string, string][] = [
    ["Mission Title", text(root?.missionTitle ?? root?.MissionTitle ?? root?.title ?? root?.Title, "Mission")],
    ["Score", text(root?.score ?? root?.Score ?? root?.percentageScore ?? root?.PercentageScore, "—")],
    ["Strengths", resultText(root?.strengths ?? root?.Strengths ?? root?.Feedback?.Strengths, "No strengths returned.")],
    ["Weaknesses", resultText(root?.weaknesses ?? root?.Weaknesses ?? root?.Feedback?.Weaknesses, "No weaknesses returned.")],
    ["Improvement Areas", resultText(root?.improvementAreas ?? root?.ImprovementAreas ?? root?.areasForImprovement ?? root?.Feedback?.ImprovementAreas, "No improvement areas returned.")],
    ["AI Evaluation Summary", resultText(root?.aiEvaluationSummary ?? root?.AiEvaluationSummary ?? root?.summary ?? root?.Summary ?? root?.rawAiReasoning ?? root?.RawAiReasoning ?? root?.aiReasoning ?? root?.AiReasoning, "No AI evaluation summary returned.")],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pass Status</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${passed ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
          {passed ? "Passed" : "Not Passed"}
        </span>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

function resultText(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => text(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  if (value && typeof value === "object") {
    const items = Object.values(value).map((item) => text(item, "")).filter(Boolean);
    return items.length ? items.join("\n") : fallback;
  }
  return text(value, fallback);
}
