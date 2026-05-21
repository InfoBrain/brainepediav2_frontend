import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

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
    <AuthLayout quote="It happens to everyone.">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Forgot your password?</h1>
        <p className="text-muted-foreground">Enter your email. We'll send you a code to reset your password.</p>
      </div>

      <AuthBanner type="error" message={error} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs font-mono">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)]" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Sending..." : "Send Reset Code"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors">
          Remembered it? <span className="font-bold text-primary">Log in →</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
