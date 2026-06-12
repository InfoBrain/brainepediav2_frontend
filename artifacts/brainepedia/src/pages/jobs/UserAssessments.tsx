import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ClipboardCheck, Loader2, RefreshCw, Sparkles } from "lucide-react";
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
            return (
              <article key={id} className="rounded-xl border border-white/5 bg-[#0d1119] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{text(item?.challengeName ?? item?.title ?? item?.name, "Assigned assessment")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {text(item?.employerName ?? item?.companyName ?? item?.profession, "Private employer challenge")}
                    </p>
                  </div>
                  {missionId ? (
                    <Button asChild>
                      <Link
                        href={buildMissionHref(missionContext)}
                        onClick={() => storeMissionAssignmentContext(missionContext)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" /> Start
                      </Link>
                    </Button>
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
