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
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
  phoneNumber: z.string().regex(/^[+0-9]*$/, "Invalid phone number format").optional().or(z.literal("")),
  referralCode: z.string().optional(),
  isInstructor: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { isInstructor: false }
  });

  const isInstructor = watch("isInstructor");

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    const res = await api.auth.register(data);
    if (!res.ok) {
      setError(res.error || "Failed to register");
      return;
    }
    setLocation(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <AuthLayout quote="Step into the gates.">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Become an Operator.</h1>
        <p className="text-muted-foreground">Create an account and earn your first VX.</p>
      </div>

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
          <Input id="email" type="email" placeholder="operator@domain.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs font-mono">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
          <Input id="phoneNumber" type="tel" placeholder="+1234567890" {...register("phoneNumber")} />
          {errors.phoneNumber && <p className="text-destructive text-xs font-mono">{errors.phoneNumber.message}</p>}
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

        <Collapsible open={isReferralOpen} onOpenChange={setIsReferralOpen} className="border border-border/50 rounded-md p-3 bg-background/50">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Have a referral code?
            {isReferralOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Input id="referralCode" placeholder="Enter code" {...register("referralCode")} />
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
          <Switch 
            id="isInstructor" 
            checked={isInstructor}
            onCheckedChange={(c) => setValue("isInstructor", c)}
          />
          <Label htmlFor="isInstructor" className="text-sm">Apply as a Mission Author / Instructor</Label>
        </div>

        <Button type="submit" className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] mt-4" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Initializing..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors">
          Already an operator? <span className="font-bold text-primary">Log in →</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
