import { Link } from "wouter";
import { Star, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { Button } from "@/components/ui/button";

export default function AchievementsPage() {
  return (
    <DashboardShell nav={USER_NAV} title="Achievements" subtitle="// growth.achievement-ledger" theme="user">
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1119] p-10 text-center">
        <Star className="mx-auto mb-3 h-10 w-10 text-[#FFD700]" />
        <h2 className="text-2xl font-black">Achievements are powered by your badges and mission milestones.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Review earned badges, XP thresholds, and rank milestones to understand how your real-world problem solving compounds into
          verified professional credibility.
        </p>
        <Button asChild className="mt-6 bg-[#FFD700] text-black hover:bg-[#F3C800]">
          <Link href="/user/badges"><Trophy className="mr-2 h-4 w-4" /> View Badges</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
