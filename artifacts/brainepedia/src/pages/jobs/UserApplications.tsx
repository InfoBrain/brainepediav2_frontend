import { Link } from "wouter";
import { BriefcaseBusiness, FileText } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { Button } from "@/components/ui/button";

export default function UserApplications() {
  return (
    <DashboardShell nav={USER_NAV} title="Applications" subtitle="// career.application-tracker" theme="user">
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-[#FFD700]" />
        <h2 className="text-2xl font-black">Your job applications start from the Job Feed.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Brainepedia submits applications directly from job details using your verified experience profile. Browse jobs, review
          assessment requirements, then apply when the role matches your mission proof.
        </p>
        <Button asChild className="mt-6 bg-[#FFD700] text-black hover:bg-[#F3C800]">
          <Link href="/jobs"><BriefcaseBusiness className="mr-2 h-4 w-4" /> Open Job Feed</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
