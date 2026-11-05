import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { AuthIntro, AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

const changeSchema = z.object({
  email: z.string().email("Invalid email address"),
  oldPassword: z.string().min(1, "Current password is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangeForm = z.infer<typeof changeSchema>;

export default function ChangePassword() {
  const [location, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = getUser();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ChangeForm>({
    resolver: zodResolver(changeSchema),
    defaultValues: { email: user?.email || "" }
  });

  useEffect(() => {
    if (!getToken()) {
      setLocation("/auth/login");
    }
  }, [location, setLocation]);

  const onSubmit = async (data: ChangeForm) => {
    setError("");
    setSuccess("");
    const res = await api.auth.changePassword(data);
    if (!res.ok) {
      setError(res.error || "Failed to update password");
      return;
    }
    
    setSuccess("Password updated. Stay sharp.");
    reset({ ...data, oldPassword: "", password: "", confirmPassword: "" });
  };

  if (!getToken()) return null;

  return (
    <AuthLayout>
      <AuthIntro eyebrow="Account security" title="Update your password.">
        Choose a new password for the account you’re signed in with.
      </AuthIntro>

      <AuthBanner type="error" message={error} />
      <AuthBanner type="success" message={success} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#4e576b]">Email Address</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-[#d34d62]">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="oldPassword" className="text-xs font-extrabold text-[#4e576b]">Current Password</Label>
          <PasswordInput id="oldPassword" {...register("oldPassword")} />
          {errors.oldPassword && <p className="text-xs text-[#d34d62]">{errors.oldPassword.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="password" className="text-xs font-extrabold text-[#4e576b]">New Password</Label>
          <PasswordInput id="password" {...register("password")} />
          {errors.password && <p className="text-xs text-[#d34d62]">{errors.password.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-extrabold text-[#4e576b]">Confirm New Password</Label>
          <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-[#d34d62]">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Updating..." : "Update Password"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
