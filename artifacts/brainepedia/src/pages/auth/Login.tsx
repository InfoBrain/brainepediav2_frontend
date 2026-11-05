import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { setToken, getDashboardPath } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { ArrowRight, Loader2, X } from "lucide-react";
import { SocialLoginSection } from "@/components/auth/SocialLoginSection";
import { AuthIntro } from "@/components/auth/AuthLayout";

export function AuthBanner({ type, message }: { type: "error" | "success" | "info", message: string }) {
  if (!message) return null;
  const isError = type === "error";
  const isSuccess = type === "success";

  return (
    <div className={`mt-4 flex items-start gap-2 rounded-[9px] border px-3 py-2.5 text-sm leading-relaxed ${
      isError ? "border-[#f0cbd2] bg-[#fff3f5] text-[#a23f52]" :
      isSuccess ? "border-[#c9eadc] bg-[#eefaf4] text-[#168a68]" :
      "border-[#d5e2fb] bg-[#edf4ff] text-[#276ef1]"
    }`}>
      {isError ? <X className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <span>{message}</span>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false }
  });

  const rememberMe = watch("rememberMe");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "expired") {
      setError("Your session has expired. Please log in again.");
    } else if (params.get("verified") === "1") {
      setSuccess("Email verified. You can now sign in.");
    } else if (params.get("reset") === "1") {
      setSuccess("Password reset. Log in to continue.");
    }
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setSuccess("");
    const res = await api.auth.login(data);

    if (!res.ok) {
      const errLower = (res.error || "").toLowerCase();
      // API sends a non-2xx when the email hasn't been confirmed yet — redirect to OTP page
      if (
        errLower.includes("email not confirmed") ||
        errLower.includes("confirm your email") ||
        errLower.includes("otp has been sent")
      ) {
        setLocation(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
        return;
      }
      setError(res.error || "Invalid credentials");
      return;
    }

    // Unwrap the nested userProfile the API returns
    const profile = res.data?.userProfile || res.data;
    const token = profile?.token || profile?.accessToken || profile?.jwt;

    // Redirect to OTP if email not yet verified (field-level check as fallback)
    if (profile?.emailConfirmed === false) {
      await api.auth.resendOtp(data.email);
      setLocation(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
      return;
    }

    setToken(token, profile);
    setLocation(getDashboardPath());
  };

  return (
    <AuthLayout>
      <AuthIntro eyebrow="Welcome back" title="Continue your Brainepedia journey.">
        Sign in and we’ll take you to the workspace linked to your account.
      </AuthIntro>

      <AuthBanner type="error" message={error} />
      <AuthBanner type="success" message={success} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#4e576b]">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-[#d34d62]">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="password" className="text-xs font-extrabold text-[#4e576b]">Password</Label>
          <PasswordInput id="password" placeholder="Enter your password" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-xs text-[#d34d62]">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(c) => setValue("rememberMe", c as boolean)}
            />
            <Label htmlFor="rememberMe" className="text-sm font-medium text-[#70798d]">Remember me</Label>
          </div>
          <Link href="/auth/forgot-password" className="text-sm font-bold text-[#7d4ccc]">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Signing in..." : "Log In"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <SocialLoginSection />

      <p className="mt-6 text-center text-sm text-[#70798d]">
        Don’t have an account?{" "}
        <Link href="/auth/register" className="font-extrabold text-[#7d4ccc]">Create Account</Link>
      </p>
    </AuthLayout>
  );
}
