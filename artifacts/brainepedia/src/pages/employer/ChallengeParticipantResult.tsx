import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ux/LoadingState";
import { ErrorState } from "@/components/ux/ErrorState";
import { AssessmentResultCard } from "@/components/employer/AssessmentResultCard";

export default function ChallengeParticipantResult() {
  const [, params] = useRoute("/employer/challenges/:assignmentId/participants/:userId/result");
  const assignmentId = params?.assignmentId ? decodeURIComponent(params.assignmentId) : "";
  const userId = params?.userId ? decodeURIComponent(params.userId) : "";
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const problemNodeId = search.get("problemNodeId") || "";
  const participantName = search.get("name") || "Participant";
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!problemNodeId || !userId) return;
    setLoading(true);
    setError("");
    const res = await api.evaluations.getNodeResult(problemNodeId, userId);
    setLoading(false);
    if (res.ok) setResult(res.data);
    else {
      setResult(null);
      setError(res.error || "Unable to load assessment result.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemNodeId, userId]);

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Participant Details" subtitle="// employer.team.challenge.result" theme="employer">
      <div className="space-y-5">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href={`/employer/challenges/${encodeURIComponent(assignmentId)}/participants`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Participants
          </Link>
        </Button>
        <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Participant Details</p>
          <h2 className="mt-1 text-2xl font-black">{participantName}</h2>
          <p className="mt-2 break-all text-xs font-mono text-muted-foreground">ProblemNodeId: {problemNodeId || "-"}</p>
          <p className="mt-1 break-all text-xs font-mono text-muted-foreground">UserId: {userId || "-"}</p>
        </div>
        {loading ? (
          <LoadingState label="Loading assessment result..." variant="spinner" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} dashboardHref="/employer/overview" />
        ) : result ? (
          <AssessmentResultCard result={result} />
        ) : null}
      </div>
    </DashboardShell>
  );
}
