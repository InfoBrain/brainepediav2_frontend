import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BriefcaseBusiness, ClipboardCheck, FileText, Loader2, MapPin, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { asList, formatDisplayDate, idOf, text } from "@/lib/jobData";
import {
  buildMissionHref,
  employerChallengeAssignmentIdOf,
  storeMissionAssignmentContext,
} from "@/lib/missionAssignmentContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ApplicationRow = {
  id: string;
  companyLogo: string;
  companyName: string;
  jobTitle: string;
  location: string;
  appliedDate: string;
  status: string;
  recruiterNotes: string;
  assessmentId: string;
  assessmentTitle: string;
  employerChallengeAssignmentId: string;
  assessmentRequiresAssignment: boolean;
};

export default function UserApplications() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.jobs.myApplications();
    setLoading(false);
    if (!res.ok) {
      const message = res.error || "Unable to load applications.";
      setError(message);
      setApplications([]);
      toast({ title: "Applications unavailable", description: message, variant: "destructive" });
      return;
    }
    setApplications(asList(res.data).map(normApplication));
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardShell nav={USER_NAV} title="Applications" subtitle="// career.application-tracker" theme="user">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/10 to-[#0d1119] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#FFD700]">Application tracker</p>
              <h2 className="mt-1 text-2xl font-black">Track roles connected to your verified experience.</h2>
            </div>
            <Button onClick={load} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </section>

        {loading ? (
          <State label="Loading applications..." />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="mb-4 text-sm text-destructive">{error}</p>
            <Button onClick={load} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#FFD700]" />
            <h2 className="text-2xl font-black">No applications yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Browse jobs, review assessment requirements, then apply when the role matches your proof-of-skill history.
            </p>
            <Button asChild className="mt-6 bg-[#FFD700] text-black hover:bg-[#F3C800]">
              <Link href="/jobs"><BriefcaseBusiness className="mr-2 h-4 w-4" /> Open Job Feed</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      {application.companyLogo ? (
                        <img src={application.companyLogo} alt={`${application.companyName} logo`} className="h-full w-full object-cover" />
                      ) : (
                        <BriefcaseBusiness className="h-6 w-6 text-[#FFD700]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">{application.jobTitle}</h3>
                      <p className="text-sm text-muted-foreground">{application.companyName}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {application.location}</span>
                        <span>Applied {application.appliedDate}</span>
                        <span className="rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-2 py-0.5 font-mono uppercase tracking-wider text-[#00D2FF]">{application.status}</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-white/80">Recruiter Notes:</span> {application.recruiterNotes}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    {application.assessmentId ? (
                      <>
                        <span className="inline-flex items-center gap-2 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/10 px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#FFD700]">
                          <ClipboardCheck className="h-4 w-4" /> Assessment Required
                        </span>
                        <Button asChild variant="outline">
                          <Link
                            href={buildMissionHref({
                              problemNodeId: application.assessmentId,
                              employerChallengeAssignmentId: application.employerChallengeAssignmentId || null,
                              assignmentRequired: application.assessmentRequiresAssignment,
                            })}
                            onClick={() =>
                              storeMissionAssignmentContext({
                                problemNodeId: application.assessmentId,
                                employerChallengeAssignmentId: application.employerChallengeAssignmentId || null,
                                assignmentRequired: application.assessmentRequiresAssignment,
                              })
                            }
                          >
                            {application.assessmentTitle || "Open assessment"}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">No linked assessment</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function normApplication(item: any): ApplicationRow {
  const job = item?.job ?? item?.Job ?? item?.jobPosting ?? item?.JobPosting ?? item;
  const company = item?.company ?? item?.Company ?? job?.company ?? job?.Company ?? {};
  const employerChallengeAssignmentId = employerChallengeAssignmentIdOf(item) || employerChallengeAssignmentIdOf(job);
  const assessmentId = text(
    item?.assessmentId ??
      item?.AssessmentId ??
      item?.problemNodeId ??
      item?.ProblemNodeId ??
      job?.linkedAssessmentNodeId ??
      job?.LinkAssessmentNodeId ??
      job?.linkAssessmentNodeId ??
      job?.assessmentNodeId,
    "",
  );
  return {
    id: idOf(item) || `${text(job?.title ?? job?.jobTitle, "job")}-${text(item?.appliedAt ?? item?.dateApplied, "")}`,
    companyLogo: text(company?.logoUrl ?? company?.companyLogoUrl ?? job?.companyLogoUrl ?? job?.CompanyLogoUrl, ""),
    companyName: text(company?.name ?? company?.companyName ?? job?.companyName ?? job?.employerName, "Company unavailable"),
    jobTitle: text(job?.title ?? job?.jobTitle, "Untitled role"),
    location: text(job?.location ?? item?.location, "Location unavailable"),
    appliedDate: formatDisplayDate(item?.appliedAt ?? item?.AppliedAt ?? item?.dateApplied ?? item?.DateApplied, "Date unavailable"),
    status: text(item?.status ?? item?.Status ?? item?.applicationStatus ?? item?.ApplicationStatus, "Applied"),
    recruiterNotes: text(item?.recruiterNotes ?? item?.RecruiterNotes ?? item?.notes ?? item?.Notes, "No recruiter notes returned."),
    assessmentId,
    assessmentTitle: text(item?.assessmentTitle ?? item?.AssessmentTitle ?? job?.assessmentTitle ?? job?.problemNodeTitle, "Open assessment"),
    employerChallengeAssignmentId,
    assessmentRequiresAssignment: Boolean(assessmentId),
  };
}

function State({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
      <span className="font-mono">{label}</span>
    </div>
  );
}
