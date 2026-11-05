import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { setToken, getDashboardPath } from "@/lib/auth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";

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
    <AuthLayout>
      <motion.div
        className="flex flex-col items-center gap-6 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#f5f0fc]">
                  <Loader2 className="h-7 w-7 animate-spin text-[#7d4ccc]" />
                </div>
              <div>
                <p className="text-lg font-extrabold text-[#182137]">Signing you in…</p>
                <p className="mt-1 text-sm text-[#70798d]">Verifying your credentials</p>
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
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eefaf4]">
                  <CheckCircle2 className="h-8 w-8 text-[#168a68]" />
                </div>
              <div>
                <p className="text-lg font-extrabold text-[#182137]">Welcome back to Brainepedia</p>
                <p className="mt-1 text-sm text-[#70798d]">Redirecting you now…</p>
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
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fff3f5]">
                <XCircle className="h-8 w-8 text-[#d34d62]" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#182137]">Authentication failed</p>
                <p className="mt-1 text-sm text-[#70798d]">{errorMsg}</p>
              </div>
              <Button variant="outline" onClick={() => setLocation("/auth/login")}>
                Back to login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthLayout>
  );
}
