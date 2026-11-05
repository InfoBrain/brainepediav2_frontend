import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { AuthIntro, AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowRight, Loader2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setError("");
    // We send NO extra headers, make sure apiClient respects GET without auth
    const res = await api.auth.forgotPassword(data.email);
    if (!res.ok) {
      setError(res.error || "Failed to request reset link");
      return;
    }
    setLocation(`/auth/reset-password?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <AuthLayout>
      <AuthIntro eyebrow="Account recovery" title="Forgot your password?">
        Enter your email. We’ll send you a code to reset your password.
      </AuthIntro>

      <AuthBanner type="error" message={error} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#4e576b]">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-[#d34d62]">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Sending..." : "Send Reset Code"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#70798d]">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-extrabold text-[#7d4ccc]">Log In</Link>
      </p>
    </AuthLayout>
  );
}
