import { useState } from "react";
import { Link } from "wouter";
import { Edit3, KeyRound, Loader2, Save, Shield } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type FormValues = z.infer<typeof schema>;

export default function UserSettings() {
  usePageTitle("Settings");
  const { toast } = useToast();
  const user = getUser();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const res = await api.auth.changePassword({
      email: user?.email ?? "",
      oldPassword: values.currentPassword,
      password: values.newPassword,
      confirmPassword: values.confirmPassword,
    });
    setSubmitting(false);
    if (res.ok) {
      reset();
      toast({ title: "Password changed", description: "Your security settings have been updated." });
    } else {
      toast({ title: "Unable to change password", description: res.error || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <DashboardShell nav={USER_NAV} title="Settings" subtitle="// security.profile.preferences">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-6 w-6 text-[#FFD700]" />
            <div>
              <h2 className="text-xl font-bold">Security</h2>
              <p className="text-sm text-muted-foreground">Change password using your current credentials.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" {...register("newPassword")} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="bg-[#FFD700] font-bold text-black hover:bg-[#F6C800]">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update Password
            </Button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
            <KeyRound className="mb-3 h-6 w-6 text-[#00D2FF]" />
            <h3 className="font-bold">Account</h3>
            <p className="mt-2 text-sm text-muted-foreground">{user?.email ?? "Signed-in user"}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
            <Edit3 className="mb-3 h-6 w-6 text-[#9D4EDD]" />
            <h3 className="font-bold">Profile Details</h3>
            <p className="mt-2 text-sm text-muted-foreground">Edit your dossier, professional title, and profession selector from profile settings.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/profile/edit">Edit Profile</Link>
            </Button>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
