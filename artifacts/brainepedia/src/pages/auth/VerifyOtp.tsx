import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function VerifyOtp() {
  const [location, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";

  useEffect(() => {
    if (!email) {
      setLocation("/auth/register");
    }
  }, [email, setLocation]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    const res = await api.auth.verifyOtp({ email, otp });
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.error || "Invalid code");
      return;
    }
    
    setLocation("/auth/login?verified=1");
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setError("");
    setSuccess("");
    setIsResending(true);
    const res = await api.auth.resendOtp(email);
    setIsResending(false);

    if (!res.ok) {
      setError(res.error || "Failed to resend code");
      return;
    }
    
    setSuccess("Code resent. Check your email.");
    setCountdown(30);
  };

  return (
    <AuthLayout quote="Check your inbox.">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify Your Email.</h1>
        <p className="text-muted-foreground">
          We sent a 6-digit code to <span className="font-mono text-primary">{email}</span>.
        </p>
      </div>

      <AuthBanner type="error" message={error} />
      <AuthBanner type="success" message={success} />

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="flex justify-center">
          <OtpInput value={otp} onChange={setOtp} length={6} />
        </div>

        <Button type="submit" className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)]" disabled={isSubmitting || otp.length !== 6}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Verifying..." : "Verify Code"}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <button 
          type="button" 
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-muted-foreground"
        >
          {countdown > 0 
            ? `Resend available in ${countdown}s` 
            : isResending ? "Resending..." : "Didn't receive a code? Resend"}
        </button>
      </div>
    </AuthLayout>
  );
}
