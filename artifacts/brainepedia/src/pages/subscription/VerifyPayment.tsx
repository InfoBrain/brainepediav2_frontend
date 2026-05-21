import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Crown, CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

type Status = "loading" | "success" | "failed";

const SUB_NAMES: Record<number, string> = { 0: "Initiate", 1: "Architect", 2: "Grandmaster" };

export default function VerifyPayment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();

  const [status, setStatus] = useState<Status>("loading");
  const [tierName, setTierName] = useState<string>("Architect");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) { navigate("/auth/login"); return; }
    let cancelled = false;

    const scheduleRedirect = (ms: number) => {
      timerRef.current = setTimeout(() => { if (!cancelled) navigate("/user/subscription"); }, ms);
    };

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("reference") || params.get("ref") || params.get("trxref");

      if (!reference) {
        setStatus("failed");
        setErrorMsg("No payment reference found in URL.");
        scheduleRedirect(4000);
        return;
      }

      const res = await api.subscriptions.verifyPayment(reference);
      if (cancelled) return;

      if (res.ok) {
        // Fetch updated tier
        const statsRes = await api.profiles.stats(userId);
        if (!cancelled && statsRes.ok && statsRes.data) {
          const tier = Number(statsRes.data.currentSubscription ?? 1);
          setTierName(SUB_NAMES[tier] ?? "Architect");
        }
        if (!cancelled) {
          setStatus("success");
          await api.activityLogs.create({ userId, activity: `Subscription verified and activated: ${tierName}` });
        }
      } else {
        if (!cancelled) {
          setStatus("failed");
          setErrorMsg(res.error || "Payment verification failed. Please contact support if charged.");
          toast({
            title: "Verification failed",
            description: res.error || "Could not verify your payment.",
            variant: "destructive",
          });
          scheduleRedirect(6000);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, navigate, toast]);

  return (
    <div className="min-h-screen bg-[#080C12] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/8 via-transparent to-[#00D2FF]/5 pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-md w-full bg-[#0d1119] border border-white/10 rounded-2xl p-10 text-center shadow-[0_0_50px_rgba(124,58,237,0.2)]">

        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative mx-auto w-20 h-20 mb-2">
              <div className="absolute inset-0 rounded-full bg-[#7C3AED]/20 animate-ping" />
              <div className="relative flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 text-[#A78BFA] animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Verifying Payment…</h1>
            <p className="text-sm text-white/40">Confirming your transaction with Paystack. Please wait.</p>
            <div className="flex gap-1 mt-4 justify-center">
              {[0, 0.2, 0.4].map((d, i) => (
                <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                  className="h-1.5 w-6 rounded-full bg-[#A78BFA]" />
              ))}
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            {/* Animated crown */}
            <div className="relative mx-auto w-24 h-24 mb-2">
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-[#FFD700]/20" />
              <div className="relative flex items-center justify-center h-full">
                <Crown className="h-14 w-14 text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
              </div>
            </div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
              className="flex justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-white">Welcome to {tierName}!</h1>
              <p className="text-[#A78BFA] font-semibold mt-1">{tierName} Tier Activated</p>
            </div>
            {tierName === "Grandmaster" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30">
                <Crown className="h-4 w-4 text-[#FFD700]" />
                <span className="text-sm font-bold text-[#FFD700]">Elite Member Badge Unlocked</span>
              </motion.div>
            )}
            <p className="text-sm text-white/40">
              {tierName === "Grandmaster"
                ? "GPT-4o evaluations, unlimited Brainiac guidance, and elite status are now active."
                : "Unlimited challenges, enhanced Brainiac hints, and premium district access are now unlocked."}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => navigate("/user/dashboard")}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/profession/select")}
                className="w-full border-white/15 text-white/60 hover:bg-white/5 hover:text-white">
                Start New Mission
              </Button>
            </div>
          </motion.div>
        )}

        {status === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="mx-auto w-20 h-20 flex items-center justify-center">
              <XCircle className="h-16 w-16 text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.5)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Payment Verification Failed</h1>
              {errorMsg && <p className="text-sm text-red-400/80 mt-2 font-mono">{errorMsg}</p>}
            </div>
            <p className="text-sm text-white/40">
              Your subscription could not be activated. If you were charged, please contact support and we'll resolve it immediately.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => { setStatus("loading"); window.location.reload(); }}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                <RefreshCw className="mr-2 h-4 w-4" /> Retry Verification
              </Button>
              <Button variant="outline" onClick={() => navigate("/user/subscription")}
                className="w-full border-white/15 text-white/60 hover:bg-white/5 hover:text-white">
                Back to Plans
              </Button>
              <a href="mailto:support@brainepedia.com"
                className="flex items-center justify-center gap-2 text-xs font-mono text-white/30 hover:text-white transition-colors mt-1">
                <MessageCircle className="h-3.5 w-3.5" /> Contact Support
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
