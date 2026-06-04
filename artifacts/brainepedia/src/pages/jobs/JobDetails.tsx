import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, BriefcaseBusiness, Building2, ClipboardCheck, Loader2, MapPin, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { text } from "@/lib/jobData";
import { getUserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:jobId");
  const [, navigate] = useLocation();
  const jobId = params?.jobId ? decodeURIComponent(params.jobId) : "";
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const role = getUserRole();

  const load = async () => {
    if (!jobId) return;
    setLoading(true);
    setError("");
    const res = await api.jobs.details(jobId, { public: true });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to load job details.");
      return;
    }
    setJob(res.data);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const apply = async () => {
    if (!jobId) return;
    setApplying(true);
    const res = await api.jobs.apply(jobId);
    setApplying(false);
    if (!res.ok) {
      toast({ title: "Application failed", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setApplied(true);
    toast({ title: "Application submitted", description: "Your verified experience profile was attached to this opportunity." });
    if (assessmentId) setAssessmentOpen(true);
  };

  const title = text(job?.title ?? job?.jobTitle, "Job details");
  const company = text(job?.companyName ?? job?.company ?? job?.employerName, "Brainepedia employer");
  const profession = text(job?.professionName ?? job?.profession, "Open profession");
  const location = text(job?.location, "Remote / flexible");
  const salary = text(job?.salaryRange ?? job?.salary, "Salary undisclosed");
  const description = text(job?.description ?? job?.details, "No description was provided for this posting.");
  const assessmentTitle = text(job?.assessmentTitle ?? job?.assessmentName ?? job?.problemNodeTitle, "");
  const assessmentId = String(job?.linkedAssessmentNodeId ?? job?.linkAssessmentNodeId ?? job?.assessmentNodeId ?? job?.problemNodeId ?? "");
  const assessmentRequired = Boolean((job?.assessmentRequired ?? job?.requiresAssessment ?? assessmentId) || assessmentTitle);
  const nav = role === "Employer" ? EMPLOYER_NAV : role === "GlobalAdmin" ? ADMIN_NAV : USER_NAV;
  const theme = role === "Employer" ? "employer" : role === "GlobalAdmin" ? "admin" : "user";

  const content = (
      <div className="space-y-6">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/jobs"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Feed</Link>
        </Button>

        {loading ? (
          <StateCard icon={Loader2} title="Loading job details..." spin />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="mb-4 text-sm text-destructive">{error}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={load} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <article className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFD700]">
                  {profession}
                </span>
                {assessmentRequired && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#00D2FF]">
                    <ShieldCheck className="h-3 w-3" /> Assessment linked
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black">{title}</h2>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-[#FFD700]" /> {company}</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#FFD700]" /> {location}</span>
                <span className="inline-flex items-center gap-2"><WalletCards className="h-4 w-4 text-[#FFD700]" /> {salary}</span>
              </div>
              <div className="prose prose-invert prose-sm mt-8 max-w-none whitespace-pre-wrap text-muted-foreground">
                {description}
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10 p-5">
                <BriefcaseBusiness className="mb-3 h-8 w-8 text-[#FFD700]" />
                <h3 className="text-lg font-bold">Apply with verified proof</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your application carries your XP, VX, badges, rank, and mission history as career evidence.
                </p>
                {role === "User" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="mt-5 w-full bg-[#FFD700] text-black hover:bg-[#F3C800]" disabled={applying || applied}>
                        {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {applied ? "Application submitted" : "Apply now"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0d1119] border border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Apply for this Job?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to apply for this position? If the employer has linked an assessment, you may be required to complete it before your application can be fully evaluated.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={apply} className="bg-[#FFD700] text-black hover:bg-[#F3C800]">
                          {applying ? "Submitting..." : "Continue"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : !role ? (
                  <Button className="mt-5 w-full bg-[#FFD700] text-black hover:bg-[#F3C800]" onClick={() => navigate(`/auth/login?redirect=/jobs/${encodeURIComponent(jobId)}`)}>
                    Log in to apply
                  </Button>
                ) : (
                  <Button asChild className="mt-5 w-full bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
                    <Link href={role === "Employer" ? "/employer/jobs" : "/admin/dashboard"}>Back to console</Link>
                  </Button>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-[#00D2FF]" />
                  <h3 className="font-bold">Assessment</h3>
                </div>
                {assessmentRequired ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {assessmentTitle || "This employer may require a linked Brainepedia mission assessment."}
                    </p>
                    {assessmentId && (
                      <Button asChild variant="outline" size="sm" className="mt-4">
                        <Link href={`/app/mission/${encodeURIComponent(assessmentId)}`}>View assessment</Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assessment is listed for this role.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
        <Dialog open={assessmentOpen} onOpenChange={setAssessmentOpen}>
          <DialogContent className="bg-[#0d1119] border border-white/10">
            <DialogHeader>
              <DialogTitle>Assessment Required</DialogTitle>
              <DialogDescription>
                This employer has linked an assessment to this position. Complete the assessment to improve your chances of being selected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssessmentOpen(false)}>Later</Button>
              <Button className="bg-[#FFD700] text-black hover:bg-[#F3C800]" onClick={() => assessmentId && navigate(`/app/mission/${encodeURIComponent(assessmentId)}`)}>
                Go to Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );

  if (!role) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="container mx-auto px-4 pb-16 pt-24">{content}</main>
        <Footer />
      </div>
    );
  }

  return (
    <DashboardShell nav={nav} title={title} subtitle="// career.job-details" theme={theme}>
      {content}
    </DashboardShell>
  );
}

function StateCard({ icon: Icon, title, spin = false }: { icon: typeof Loader2; title: string; spin?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
      <Icon className={`h-5 w-5 text-[#FFD700] ${spin ? "animate-spin" : ""}`} />
      <span className="font-mono">{title}</span>
    </div>
  );
}
