import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Eye, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";

type Participant = {
  id: string;
  userId: string;
  fullName: string;
  profession: string;
  attemptedAt?: string;
  completed: boolean;
  score: string;
  passed: boolean;
  problemNodeId: string;
};

type ChallengeParticipants = {
  challengeName: string;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  participants: Participant[];
};

export default function ChallengeParticipants() {
  const [, params] = useRoute("/employer/challenges/:assignmentId/participants");
  const assignmentId = params?.assignmentId ? decodeURIComponent(params.assignmentId) : "";
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const fallbackChallengeName = search.get("challengeName") || "Team Challenge";
  const fallbackProblemNodeId = search.get("problemNodeId") || "";
  const [data, setData] = useState<ChallengeParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError("");
    const res = await api.employers.challengeParticipants(assignmentId);
    setLoading(false);
    if (res.ok) {
      setData(normParticipants(res.data, fallbackChallengeName, fallbackProblemNodeId));
    } else {
      setData(null);
      setError(res.error || "Unable to load participants.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Team Challenge Participants" subtitle="// employer.team.challenge.participants" theme="employer">
      <div className="space-y-5">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/employer/challenges">
            <ArrowLeft className="mr-2 h-4 w-4" /> Team Challenge
          </Link>
        </Button>

        {loading ? (
          <LoadingState label="Loading participants..." variant="table" rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} dashboardHref="/employer/overview" />
        ) : data ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Team Challenge</p>
              <h2 className="mt-1 text-2xl font-black">{data.challengeName}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <SummaryCard label="Total Assigned" value={data.totalAssigned.toLocaleString()} />
                <SummaryCard label="Total Completed" value={data.totalCompleted.toLocaleString()} />
                <SummaryCard label="Completion Rate" value={`${data.completionRate}%`} />
                <SummaryCard label="Assignment ID" value={assignmentId} />
              </div>
            </div>

            {data.participants.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No participants yet"
                description="Team members assigned to this challenge will appear here once they attempt the mission."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0d1119]">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Profession</th>
                      <th className="px-4 py-3">Attempted At</th>
                      <th className="px-4 py-3">Completed</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Passed</th>
                      <th className="px-4 py-3">Participant Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.map((participant) => {
                      const problemNodeId = participant.problemNodeId || fallbackProblemNodeId;
                      const resultHref = `/employer/challenges/${encodeURIComponent(assignmentId)}/participants/${encodeURIComponent(participant.userId)}/result?problemNodeId=${encodeURIComponent(problemNodeId)}&name=${encodeURIComponent(participant.fullName)}`;
                      return (
                        <tr key={participant.id} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-3 font-medium">{participant.fullName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{participant.profession}</td>
                          <td className="px-4 py-3">{participant.attemptedAt ? new Date(participant.attemptedAt).toLocaleString() : "-"}</td>
                          <td className="px-4 py-3">{participant.completed ? "Completed" : "Not Completed"}</td>
                          <td className="px-4 py-3">{participant.score}</td>
                          <td className="px-4 py-3">{participant.passed ? "Passed" : "Not Passed"}</td>
                          <td className="px-4 py-3">
                            {participant.completed && problemNodeId ? (
                              <Button asChild variant="outline" size="sm">
                                <Link href={resultHref}>
                                  <Eye className="mr-2 h-3.5 w-3.5" /> View Result
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Result unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function normParticipants(data: any, fallbackChallengeName: string, fallbackProblemNodeId: string): ChallengeParticipants {
  const root = data?.data ?? data?.summary ?? data;
  const participants = asList(root?.participants ?? root?.Participants ?? root).map((item: any) => normParticipant(item, fallbackProblemNodeId));
  const totalAssigned = Number(root?.totalAssigned ?? root?.TotalAssigned ?? root?.totalAssignedEmployees ?? root?.TotalAssignedEmployees ?? participants.length);
  const totalCompleted = Number(root?.totalCompleted ?? root?.TotalCompleted ?? root?.completedCount ?? root?.CompletedCount ?? participants.filter((p: Participant) => p.completed).length);
  const completionRate = Number(root?.completionRate ?? root?.CompletionRate ?? (totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0));
  return {
    challengeName: text(root?.challengeName ?? root?.ChallengeName, fallbackChallengeName),
    totalAssigned,
    totalCompleted,
    completionRate,
    participants,
  };
}

function normParticipant(item: any, fallbackProblemNodeId: string): Participant {
  const completed = Boolean(item?.completed ?? item?.Completed ?? item?.hasCompleted ?? item?.HasCompleted ?? item?.completedAt ?? item?.CompletedAt);
  const passValue = item?.passed ?? item?.Passed ?? item?.isPassed ?? item?.IsPassed ?? item?.passStatus ?? item?.PassStatus;
  const userId = text(item?.userId ?? item?.UserId ?? item?.participantUserId ?? item?.ParticipantUserId ?? item?.employeeUserId ?? item?.EmployeeUserId, "");
  return {
    id: text(item?.id ?? item?.participantId ?? item?.ParticipantId ?? userId, userId),
    userId,
    fullName: text(item?.fullName ?? item?.FullName ?? item?.name ?? item?.Name ?? `${item?.firstName ?? item?.FirstName ?? ""} ${item?.lastName ?? item?.LastName ?? ""}`.trim(), "Participant"),
    profession: text(item?.profession ?? item?.Profession ?? item?.professionName ?? item?.ProfessionName, "-"),
    attemptedAt: item?.attemptedAt ?? item?.AttemptedAt ?? item?.submittedAt ?? item?.SubmittedAt ?? item?.completedAt ?? item?.CompletedAt,
    completed,
    score: text(item?.score ?? item?.Score ?? item?.evaluationScore ?? item?.EvaluationScore, "-"),
    passed: typeof passValue === "string" ? /pass|success/i.test(passValue) : Boolean(passValue),
    problemNodeId: text(item?.problemNodeId ?? item?.ProblemNodeId ?? fallbackProblemNodeId, ""),
  };
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold">{value}</p>
    </div>
  );
}
