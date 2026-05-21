import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { setToken, getDashboardPath } from "@/lib/auth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/branepedia_white_logo_(1)_1777483519569.png";

type Phase = "processing" | "success" | "error";

export default function LoginSuccess() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status    = params.get("status");
    const token     = params.get("token");
    const userId    = params.get("userId");
    const email     = params.get("email");
    const profileId = params.get("profileId");
    const firstName = params.get("firstName");
    const lastName  = params.get("lastName");
    const role      = params.get("role");

    if (!token || status?.toLowerCase() !== "success") {
      setErrorMsg(
        status
          ? `Authentication failed (status: ${status}). Please try again.`
          : "No authentication token received. Please try again."
      );
      setPhase("error");
      window.history.replaceState({}, document.title, "/login-success");
      return;
    }

    const profile = {
      token,
      userId,
      profileId,
      email,
      ...(firstName ? { firstName } : {}),
      ...(lastName  ? { lastName  } : {}),
      ...(role      ? { role      } : {}),
    };

    setToken(token, profile);

    window.history.replaceState({}, document.title, "/login-success");

    setPhase("success");

    const timer = setTimeout(() => {
      setLocation(getDashboardPath());
    }, 1500);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 text-center max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <img
          src={logo}
          alt="Brainepedia"
          className="h-9 w-auto drop-shadow-[0_0_12px_rgba(0,210,255,0.4)]"
        />

        <AnimatePresence mode="wait">
          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(0,210,255,0.25)] animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Signing you in…</p>
                <p className="text-sm text-muted-foreground mt-1">Verifying your credentials</p>
              </div>
            </motion.div>
          )}

          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(0,210,255,0.3)]" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Welcome back to Brainepedia</p>
                <p className="text-sm text-muted-foreground mt-1">Redirecting you now…</p>
              </div>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full border border-destructive/40 bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Authentication failed</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
              <Button
                variant="outline"
                className="mt-2 border-primary/30 hover:border-primary hover:bg-primary/5"
                onClick={() => setLocation("/auth/login")}
              >
                Back to login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
