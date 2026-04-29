import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export function AuthBanner({ type, message }: { type: "error" | "success" | "info", message: string }) {
  if (!message) return null;
  const isError = type === "error";
  const isSuccess = type === "success";
  
  return (
    <div className={`p-3 mb-6 border-l-4 rounded-r-md text-sm font-mono ${
      isError ? "bg-destructive/10 border-destructive text-destructive-foreground" : 
      isSuccess ? "bg-primary/10 border-primary text-primary" : 
      "bg-accent/10 border-accent text-accent"
    }`}>
      <span className="font-bold mr-2">
        //{isError ? " ERROR" : isSuccess ? " CONFIRMED" : " INFO"}
      </span>
      {message}
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
    if (params.get("verified") === "1") {
      setSuccess("Verified. You're cleared for entry.");
    } else if (params.get("reset") === "1") {
      setSuccess("Password reset. Log in to continue.");
    }
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setSuccess("");
    const res = await api.auth.login(data);
    if (!res.ok) {
      setError(res.error || "Invalid credentials");
      return;
    }
    
    // Attempt to extract token
    const token = res.data?.token || res.data?.accessToken || res.data?.jwt;
    setToken(token, res.data);
    setLocation("/");
  };

  return (
    <AuthLayout quote="Welcome back, operator.">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Re-enter the City.</h1>
        <p className="text-muted-foreground">Authenticate to resume your operator session.</p>
      </div>

      <AuthBanner type="error" message={error} />
      <AuthBanner type="success" message={success} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="operator@domain.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs font-mono">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-destructive text-xs font-mono">{errors.password.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="rememberMe" 
            checked={rememberMe}
            onCheckedChange={(c) => setValue("rememberMe", c as boolean)}
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal">Remember me</Label>
        </div>

        <Button type="submit" className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)]" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Authenticating..." : "Login"}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <div>
          <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">
            Forgot your password?
          </Link>
        </div>
        <div>
          <Link href="/auth/register" className="text-muted-foreground hover:text-primary transition-colors">
            New here? <span className="font-bold text-primary">Become an operator →</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
