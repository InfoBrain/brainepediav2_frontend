import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ReCAPTCHA from "react-google-recaptcha";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, Briefcase, Building2, User } from "lucide-react";
import { SocialLoginSection } from "@/components/auth/SocialLoginSection";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

// ── User registration schema ────────────────────────────────────────────────
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ── Employer registration schema ─────────────────────────────────────────────
const employerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
  phoneNumber: z.string().regex(/^[+0-9]*$/, "Invalid phone number format").min(1, "Phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;
type EmployerForm = z.infer<typeof employerSchema>;

// ── User Registration Form ───────────────────────────────────────────────────
function UserRegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [error, setError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification before continuing.");
      return;
    }
    const res = await api.auth.register({ ...data, isEmployer: false }, recaptchaToken ?? undefined);
    if (!res.ok) {
      setError(res.error || "Failed to register");
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      return;
    }
    onSuccess(data.email);
  };

  return (
    <>
      <AuthBanner type="error" message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && <p className="text-destructive text-xs font-mono">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && <p className="text-destructive text-xs font-mono">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs font-mono">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs font-mono">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-destructive text-xs font-mono">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {RECAPTCHA_SITE_KEY && (
          <div className="flex justify-center pt-1">
            <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} theme="dark"
              onChange={(t) => setRecaptchaToken(t)} onExpired={() => setRecaptchaToken(null)} />
          </div>
        )}

        <Button type="submit" className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] mt-4"
          disabled={isSubmitting || (!!RECAPTCHA_SITE_KEY && !recaptchaToken)}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </>
  );
}

// ── Employer Registration Form ───────────────────────────────────────────────
function EmployerRegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [error, setError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmployerForm>({
    resolver: zodResolver(employerSchema),
  });

  const onSubmit = async (data: EmployerForm) => {
    setError("");
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification before continuing.");
      return;
    }
    const res = await api.employers.onboard({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      phoneNumber: data.phoneNumber,
      companyName: data.companyName,
      companyLogoUrl: "",
      websiteUrl: "",
      aboutCompany: "",
      isEmployer: true,
    });
    if (!res.ok) {
      setError(res.error || "Employer registration failed. Please try again.");
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      return;
    }
    onSuccess(data.email);
  };

  return (
    <>
      <AuthBanner type="error" message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employer-firstName">First Name</Label>
            <Input id="employer-firstName" {...register("firstName")} />
            {errors.firstName && <p className="text-destructive text-xs font-mono">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer-lastName">Last Name</Label>
            <Input id="employer-lastName" {...register("lastName")} />
            {errors.lastName && <p className="text-destructive text-xs font-mono">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employer-email">Email</Label>
          <Input id="employer-email" type="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs font-mono">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="employer-phoneNumber">Phone Number</Label>
          <Input id="employer-phoneNumber" type="tel" placeholder="+1234567890" {...register("phoneNumber")} />
          {errors.phoneNumber && <p className="text-destructive text-xs font-mono">{errors.phoneNumber.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employer-password">Password</Label>
            <Input id="employer-password" type="password" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs font-mono">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer-confirmPassword">Confirm Password</Label>
            <Input id="employer-confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-destructive text-xs font-mono">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {/* Company info */}
        <div className="border-t border-border/50 pt-4 space-y-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Company Information
          </p>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" placeholder="Acme Corp" {...register("companyName")} />
            {errors.companyName && <p className="text-destructive text-xs font-mono">{errors.companyName.message}</p>}
          </div>

          <p className="rounded-lg border border-[#00D2FF]/20 bg-[#00D2FF]/10 px-3 py-2 text-xs text-muted-foreground">
            Logo, website, and company description are managed after registration in Company Profile settings.
          </p>
        </div>

        {RECAPTCHA_SITE_KEY && (
          <div className="flex justify-center pt-1">
            <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} theme="dark"
              onChange={(t) => setRecaptchaToken(t)} onExpired={() => setRecaptchaToken(null)} />
          </div>
        )}

        <Button type="submit"
          className="w-full font-bold mt-4"
          style={{ background: "#00D2FF", color: "#000", boxShadow: "0 0 15px rgba(0,210,255,0.35)" }}
          disabled={isSubmitting || (!!RECAPTCHA_SITE_KEY && !recaptchaToken)}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
          {isSubmitting ? "Registering employer…" : "Create Employer Account"}
        </Button>
      </form>
    </>
  );
}

// ── Main Register Page ───────────────────────────────────────────────────────
export default function Register() {
  const [, setLocation] = useLocation();
  const [isEmployer, setIsEmployer] = useState(false);

  const handleSuccess = (email: string) => {
    setLocation(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthLayout quote={isEmployer ? "Build your team." : "Start your journey."}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {isEmployer ? "Create your employer account." : "Create your account."}
        </h1>
        <p className="text-muted-foreground">
          {isEmployer
            ? "Apply as Employer and hire through verified experience."
            : "Join Brainepedia and turn real-world problem solving into verified experience."}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border/50 p-1 bg-background/50 mb-6 gap-1">
        <button
          type="button"
          onClick={() => setIsEmployer(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            !isEmployer
              ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(0,210,255,0.3)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className={`h-4 w-4 shrink-0 ${!isEmployer ? "text-black" : "text-slate-300"}`} />
          Individual
        </button>
        <button
          type="button"
          onClick={() => setIsEmployer(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            isEmployer
              ? "bg-[#00D2FF] text-black shadow-[0_0_12px_rgba(0,210,255,0.35)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className={`h-5 w-5 shrink-0 ${isEmployer ? "text-black" : "text-slate-300"}`} strokeWidth={2.5} />
          Apply as Employer
        </button>
      </div>

      {isEmployer ? (
        <EmployerRegisterForm onSuccess={handleSuccess} />
      ) : (
        <UserRegisterForm onSuccess={handleSuccess} />
      )}

      {!isEmployer && <SocialLoginSection label="Or create account with" />}

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors">
          Already have an account? <span className="font-bold text-primary">Log in →</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
