import { Lock, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminSettings() {
  usePageTitle("Admin Settings");
  return (
    <DashboardShell nav={ADMIN_NAV} title="Settings" subtitle="// platform.controls.configuration" theme="admin">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={Settings} title="Platform Settings" detail="Central workspace for platform-level configuration visibility." />
        <Panel icon={ShieldCheck} title="Admin Controls" detail="Admin actions remain backed by dedicated user, profession, district, and problem node pages." />
        <Panel icon={SlidersHorizontal} title="Configuration Management" detail="No unsupported settings API is present in Swagger, so no mock controls are created." />
        <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6 lg:col-span-3">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-[#A5B4FC]" />
            <div>
              <h2 className="font-bold">API-safe settings area</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This dedicated page avoids routing Settings back to Dashboard while respecting the current Swagger surface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function Panel({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
      <Icon className="mb-3 h-6 w-6 text-[#A5B4FC]" />
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
