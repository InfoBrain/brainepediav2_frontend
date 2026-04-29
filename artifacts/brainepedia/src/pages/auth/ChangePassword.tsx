import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
    <AuthLayout quote="Rotate your credentials.">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rotate Your Credentials.</h1>
        <p className="text-muted-foreground">Update your password while signed in.</p>
      </div>

      <AuthBanner type="error" message={error} />
      <AuthBanner type="success" message={success} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs font-mono">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="oldPassword">Current Password</Label>
          <Input id="oldPassword" type="password" {...register("oldPassword")} />
          {errors.oldPassword && <p className="text-destructive text-xs font-mono">{errors.oldPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-destructive text-xs font-mono">{errors.password.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-destructive text-xs font-mono">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)]" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
