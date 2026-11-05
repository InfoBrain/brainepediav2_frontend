import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ReCAPTCHA from "react-google-recaptcha";
import { api } from "@/lib/api";
import { AuthIntro, AuthLayout } from "@/components/auth/AuthLayout";
import { AuthBanner } from "@/pages/auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowRight, Building2, Check, CircleUserRound, Loader2, LockKeyhole } from "lucide-react";
import { SocialLoginSection } from "@/components/auth/SocialLoginSection";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

// ── User registration schema ────────────────────────────────────────────────
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms and Conditions and Privacy Policy" }),
  }),
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
  websiteUrl: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms and Conditions and Privacy Policy" }),
  }),
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

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false as unknown as true },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification before continuing.");
      return;
    }
    const { acceptTerms: _terms, ...registerData } = data;
    const res = await api.auth.register({ ...registerData, isEmployer: false }, recaptchaToken ?? undefined);
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
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="firstName" className="text-xs font-extrabold text-[#4e576b]">First Name</Label>
            <Input id="firstName" placeholder="Amara" autoComplete="given-name" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-[#d34d62]">{errors.firstName.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lastName" className="text-xs font-extrabold text-[#4e576b]">Last Name</Label>
            <Input id="lastName" placeholder="Okafor" autoComplete="family-name" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-[#d34d62]">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#4e576b]">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-[#d34d62]">{errors.email.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-xs font-extrabold text-[#4e576b]">Password</Label>
            <PasswordInput id="password" placeholder="At least 6 characters" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-xs text-[#d34d62]">{errors.password.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-extrabold text-[#4e576b]">Confirm Password</Label>
            <PasswordInput id="confirmPassword" placeholder="Repeat password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-[#d34d62]">{errors.confirmPassword.message}</p>}
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[#70798d]">
          <LockKeyhole className="h-3.5 w-3.5" /> Use at least 6 characters. A number and symbol make it stronger.
        </p>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms === true}
            onCheckedChange={(c) => setValue("acceptTerms", (c === true) as true, { shouldValidate: true })}
          />
          <Label htmlFor="acceptTerms" className="text-sm font-medium leading-snug text-[#70798d]">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline" target="_blank">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && <p className="text-xs text-[#d34d62]">{errors.acceptTerms.message}</p>}

        {RECAPTCHA_SITE_KEY && (
          <div className="flex justify-center pt-1">
            <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} theme="light"
              onChange={(t) => setRecaptchaToken(t)} onExpired={() => setRecaptchaToken(null)} />
          </div>
        )}

        <Button type="submit" className="h-11 w-full"
          disabled={isSubmitting || (!!RECAPTCHA_SITE_KEY && !recaptchaToken)}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Creating account..." : "Create Professional Account"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
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

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<EmployerForm>({
    resolver: zodResolver(employerSchema),
    defaultValues: { acceptTerms: false as unknown as true },
  });

  const acceptTerms = watch("acceptTerms");

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
      websiteUrl: data.websiteUrl || "",
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
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="companyName" className="text-xs font-extrabold text-[#4e576b]">Company Name</Label>
          <Input id="companyName" placeholder="TechNova Solutions" {...register("companyName")} />
          {errors.companyName && <p className="text-xs text-[#d34d62]">{errors.companyName.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="employer-email" className="text-xs font-extrabold text-[#4e576b]">Company Email Address</Label>
          <Input id="employer-email" type="email" placeholder="talent@company.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-[#d34d62]">{errors.email.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="employer-firstName" className="text-xs font-extrabold text-[#4e576b]">Contact First Name</Label>
            <Input id="employer-firstName" placeholder="Daniel" autoComplete="given-name" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-[#d34d62]">{errors.firstName.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="employer-lastName" className="text-xs font-extrabold text-[#4e576b]">Contact Last Name</Label>
            <Input id="employer-lastName" placeholder="Williams" autoComplete="family-name" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-[#d34d62]">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="employer-phoneNumber" className="text-xs font-extrabold text-[#4e576b]">Phone Number</Label>
            <Input id="employer-phoneNumber" type="tel" placeholder="+234..." autoComplete="tel" {...register("phoneNumber")} />
            {errors.phoneNumber && <p className="text-xs text-[#d34d62]">{errors.phoneNumber.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="websiteUrl" className="text-xs font-extrabold text-[#4e576b]">Company Website <span className="font-medium text-[#9298a8]">Optional</span></Label>
            <Input id="websiteUrl" type="url" placeholder="https://company.com" {...register("websiteUrl")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="employer-password" className="text-xs font-extrabold text-[#4e576b]">Password</Label>
            <PasswordInput id="employer-password" placeholder="At least 6 characters" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-xs text-[#d34d62]">{errors.password.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="employer-confirmPassword" className="text-xs font-extrabold text-[#4e576b]">Confirm Password</Label>
            <PasswordInput id="employer-confirmPassword" placeholder="Repeat password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-[#d34d62]">{errors.confirmPassword.message}</p>}
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[#70798d]">
          <LockKeyhole className="h-3.5 w-3.5" /> Use at least 6 characters. A number and symbol make it stronger.
        </p>
        <p className="text-xs text-[#70798d]">Logo and company description can be added after registration in Company Profile.</p>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="employer-acceptTerms"
            checked={acceptTerms === true}
            onCheckedChange={(c) => setValue("acceptTerms", (c === true) as true, { shouldValidate: true })}
          />
          <Label htmlFor="employer-acceptTerms" className="text-sm font-medium leading-snug text-[#70798d]">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline" target="_blank">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && <p className="text-xs text-[#d34d62]">{errors.acceptTerms.message}</p>}

        {RECAPTCHA_SITE_KEY && (
          <div className="flex justify-center pt-1">
            <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} theme="light"
              onChange={(t) => setRecaptchaToken(t)} onExpired={() => setRecaptchaToken(null)} />
          </div>
        )}

        <Button type="submit" className="h-11 w-full"
          disabled={isSubmitting || (!!RECAPTCHA_SITE_KEY && !recaptchaToken)}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Creating account..." : "Create Employer Account"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
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
    <AuthLayout wide>
      <AuthIntro eyebrow="Join Brainepedia" title="Choose how you want to use Brainepedia.">
        Your account type shapes the workspace and tools available to you.
      </AuthIntro>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setIsEmployer(false)}
          className={`flex items-center gap-3 rounded-[11px] border px-3 py-3 text-left ${
            !isEmployer ? "border-[#b89cdd] bg-[#faf7fe]" : "border-[#e6e8ef] bg-white"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#f5f0fc] text-[#7d4ccc]">
            <CircleUserRound className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[#182137]">I’m a Professional</span>
            <span className="block text-xs text-[#70798d]">Build proof and discover opportunities</span>
          </span>
          {!isEmployer && <Check className="h-4 w-4 text-[#7d4ccc]" />}
        </button>
        <button
          type="button"
          onClick={() => setIsEmployer(true)}
          className={`flex items-center gap-3 rounded-[11px] border px-3 py-3 text-left ${
            isEmployer ? "border-[#b89cdd] bg-[#faf7fe]" : "border-[#e6e8ef] bg-white"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#f5f0fc] text-[#7d4ccc]">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[#182137]">I’m an Employer</span>
            <span className="block text-xs text-[#70798d]">Discover talent and manage recruitment</span>
          </span>
          {isEmployer && <Check className="h-4 w-4 text-[#7d4ccc]" />}
        </button>
      </div>

      {isEmployer ? (
        <EmployerRegisterForm onSuccess={handleSuccess} />
      ) : (
        <UserRegisterForm onSuccess={handleSuccess} />
      )}

      {!isEmployer && <SocialLoginSection label="Or create account with" />}

      <p className="mt-6 text-center text-sm text-[#70798d]">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-extrabold text-[#7d4ccc]">Log In</Link>
      </p>
    </AuthLayout>
  );
}
