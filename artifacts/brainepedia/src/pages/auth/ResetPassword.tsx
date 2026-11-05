import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { AuthIntro, AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [otp, setOtp] = useState("");
  
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" }
  });

  const watchEmail = watch("email");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setInfo("Check your email for the code.");
      // we can't easily set default value after init with useForm without reset or setValue
      // let's do it via setValue
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data: ResetForm) => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    
    setError("");
    const res = await api.auth.resetPassword({ ...data, otp });
    if (!res.ok) {
      setError(res.error || "Failed to reset password");
      return;
    }
    
    setLocation("/auth/login?reset=1");
  };

  const handleResend = async () => {
    if (countdown > 0 || !watchEmail) return;
    
    setError("");
    setIsResending(true);
    const res = await api.auth.resendOtp(watchEmail);
    setIsResending(false);

    if (!res.ok) {
      setError(res.error || "Failed to resend code");
      return;
    }
    
    setInfo("Code resent. Check your email.");
    setCountdown(30);
  };

  // set default email
  const params = new URLSearchParams(window.location.search);
  const defaultEmail = params.get("email") || "";

  return (
    <AuthLayout>
      <AuthIntro eyebrow="Account recovery" title="Choose a new password.">
        Enter the code from your email and set the password you’ll use to sign in.
      </AuthIntro>

      <AuthBanner type="info" message={info} />
      <AuthBanner type="error" message={error} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#4e576b]">Email Address</Label>
          <Input id="email" type="email" defaultValue={defaultEmail} {...register("email")} />
          {errors.email && <p className="text-xs text-[#d34d62]">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Verification Code</Label>
            <button 
              type="button" 
              onClick={handleResend}
              disabled={countdown > 0 || isResending || !watchEmail}
              className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
          <OtpInput value={otp} onChange={setOtp} length={6} />
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

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting || otp.length !== 6}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Saving..." : "Reset Password"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
