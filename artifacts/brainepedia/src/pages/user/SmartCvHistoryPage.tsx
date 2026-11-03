import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SmartCvHistory } from "@/components/portfolio/SmartCvHistory";
import { usePageTitle } from "@/hooks/usePageTitle";
import { USER_NAV } from "@/lib/userNav";
import { getUserId } from "@/lib/auth";

export default function SmartCvHistoryPage() {
  usePageTitle("Previously generated CVs");
  const userId = getUserId();

  return (
    <DashboardShell
      nav={USER_NAV}
      title="Previously generated CVs"
      subtitle="// smart.cv.history"
      theme="user"
    >
      <div className="space-y-5">
        <Link href="/user/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Portfolio
        </Link>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Open any Smart CV you have already generated. New documents appear here after you generate one from your portfolio.
        </p>
        {userId ? (
          <SmartCvHistory userId={userId} />
        ) : (
          <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5 text-sm text-muted-foreground">
            Sign in to view your generated CVs.
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
