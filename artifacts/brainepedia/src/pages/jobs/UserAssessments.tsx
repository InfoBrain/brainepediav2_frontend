import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Building2, Calendar, ClipboardCheck, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { asList, idOf, text } from "@/lib/jobData";
import {
  buildMissionHref,
  employerChallengeAssignmentIdOf,
  problemNodeIdOf,
  storeMissionAssignmentContext,
} from "@/lib/missionAssignmentContext";
import { Button } from "@/components/ui/button";

export default function UserAssessments() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.dashboard.assignedChallenges();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load assigned assessments.");
      setItems([]);
      return;
    }
    setItems(asList(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardShell nav={USER_NAV} title="Assessments" subtitle="// career.assessment-center" theme="user">
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
          <span className="font-mono">Loading assigned assessments...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="mb-4 text-sm text-destructive">{error}</p>
          <Button onClick={load} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-[#FFD700]" />
          <h2 className="text-2xl font-black">No assessments assigned yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Employer assessments will appear here when a company links a private challenge to your career process.
          </p>
          <Button asChild className="mt-6"><Link href="/jobs">Explore jobs</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => {
            const id = idOf(item) || String(index);
            const missionId = problemNodeIdOf(item);
            const employerChallengeAssignmentId = employerChallengeAssignmentIdOf(item);
            const missionContext = {
              problemNodeId: missionId,
              employerChallengeAssignmentId: employerChallengeAssignmentId || null,
              assignmentRequired: true,
            };
            const assessment = normAssessment(item);
            const expired = assessment.endDate ? new Date(assessment.endDate).getTime() < Date.now() : false;
            const completed = assessment.hasCompleted;
            const canStart = Boolean(missionId && !completed && !expired);
            return (
              <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{assessment.challengeName}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                        completed
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : expired
                          ? "border-red-400/30 bg-red-400/10 text-red-300"
                          : "border-[#00D2FF]/30 bg-[#00D2FF]/10 text-[#00D2FF]"
                      }`}>
                        {completed ? "Completed" : expired ? "Expired" : "Active"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <AssessmentField icon={Building2} label="Company Name" value={assessment.companyName} />
                      <AssessmentField icon={ClipboardCheck} label="Challenge Type" value={assessment.challengeType} />
                      <AssessmentField icon={Calendar} label="Due Date" value={assessment.endDate ? new Date(assessment.endDate).toLocaleDateString() : "—"} />
                      <AssessmentField icon={ClipboardCheck} label="Completion Status" value={completed ? "Completed" : expired ? "Expired" : "Incomplete"} />
                    </div>
                  </div>
                  {canStart ? (
                    <Button asChild>
                      <Link
                        href={buildMissionHref(missionContext)}
                        onClick={() => storeMissionAssignmentContext(missionContext)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" /> Start Challenge
                      </Link>
                    </Button>
                  ) : completed ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-mono text-emerald-300">Completed</span>
                  ) : expired ? (
                    <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-mono text-red-300">Expired</span>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground">Awaiting mission link</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function normAssessment(item: any) {
  return {
    challengeName: text(item?.challengeName ?? item?.ChallengeName ?? item?.title ?? item?.name, "Assigned assessment"),
    companyName: text(item?.companyName ?? item?.CompanyName ?? item?.employerName ?? item?.EmployerName, "Company unavailable"),
    challengeType: text(item?.challengeType ?? item?.ChallengeType ?? item?.type ?? item?.Type ?? item?.profession, "Assessment"),
    endDate: text(item?.endDate ?? item?.EndDate ?? item?.dueDate ?? item?.DueDate ?? item?.expiryDate ?? item?.ExpiryDate, ""),
    hasCompleted: Boolean(item?.hasCompleted ?? item?.HasCompleted ?? item?.completed ?? item?.Completed ?? item?.completedAt ?? item?.CompletedAt),
  };
}

function AssessmentField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/85">{value || "—"}</p>
    </div>
  );
}
