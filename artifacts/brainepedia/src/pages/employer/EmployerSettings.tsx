import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Settings, Lock, Loader2, Save, LogOut } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { getUser, clearToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "Minimum 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function EmployerSettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const user = getUser();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordForm) => {
    const res = await api.auth.changePassword({
      email: user?.email ?? "",
      oldPassword: data.currentPassword,
      password: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
    if (res.ok) {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      reset();
    } else {
      toast({ title: "Failed to update password", description: res.error, variant: "destructive" });
    }
  };

  const doLogout = () => {
    clearToken();
    setLocation("/auth/login");
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Settings" subtitle="// employer.account.settings" theme="employer">
      <div className="max-w-lg space-y-6">
        {/* Account Info */}
        <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#00D2FF]" />
            Account Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono text-xs">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#00D2FF]/10 text-[#00D2FF] border border-[#00D2FF]/20">
                Employer
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-[#9D4EDD]" />
            Change Password
          </h3>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input {...register("currentPassword")} type="password" />
              {errors.currentPassword && <p className="text-destructive text-xs">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input {...register("newPassword")} type="password" />
              {errors.newPassword && <p className="text-destructive text-xs">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input {...register("confirmPassword")} type="password" />
              {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#0d1119] border border-red-500/20 rounded-xl p-6">
          <h3 className="text-base font-bold text-red-400 mb-3">Session</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your employer account on this device.
          </p>
          <Button
            variant="outline"
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doLogout} className="bg-red-600 hover:bg-red-700 font-bold">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
