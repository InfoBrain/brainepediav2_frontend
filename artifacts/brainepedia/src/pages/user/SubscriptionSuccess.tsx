import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Crown, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

const SUB_NAMES: Record<number, string> = {
  0: "Initiate",
  1: "Architect",
  2: "Grandmaster",
};

type Status = "loading" | "success" | "failed";

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();

  const [status, setStatus] = useState<Status>("loading");
  const [subTier, setSubTier] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const scheduleRedirect = (delay: number) => {
      timerRef.current = setTimeout(() => {
        if (!cancelled) navigate("/user/dashboard");
      }, delay);
    };

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("status") || params.get("paymentStatus");

    if (
      paymentStatus &&
      paymentStatus.toLowerCase() !== "success" &&
      paymentStatus.toLowerCase() !== "approved"
    ) {
      setStatus("failed");
      toast({
        title: "Payment failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      scheduleRedirect(3500);
      return () => {
        cancelled = true;
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (!userId) {
      navigate("/auth/login");
      return () => {
        cancelled = true;
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    (async () => {
      const res = await api.profiles.stats(userId);
      if (cancelled) return;

      if (res.ok && res.data) {
        const tier = Number(res.data.currentSubscription ?? 0);
        if (!cancelled) setSubTier(tier);

        if (tier >= 1) {
          if (!cancelled) setStatus("success");
          await api.activityLogs.create({
            userId,
            activity: `Subscription upgraded to ${SUB_NAMES[tier] ?? "Architect"} tier`,
          });
        } else {
          if (!cancelled) {
            setStatus("failed");
            toast({
              title: "Subscription not activated yet",
              description: "Your payment may still be processing. Check back shortly.",
              variant: "destructive",
            });
            scheduleRedirect(4000);
          }
        }
      } else {
        if (!cancelled) {
          setStatus("failed");
          toast({
            title: "Could not verify subscription",
            description: res.error || "Please refresh your dashboard to see your updated tier.",
            variant: "destructive",
          });
          scheduleRedirect(4000);
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0d1119] border border-white/10 rounded-2xl p-10 text-center shadow-[0_0_40px_rgba(124,58,237,0.25)]"
      >
        {status === "loading" && (
          <>
            <Loader2 className="h-14 w-14 mx-auto text-[#A78BFA] animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Confirming your upgrade…</h1>
            <p className="text-sm text-muted-foreground">Fetching your updated subscription status.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
              <div className="relative flex items-center justify-center h-full">
                <Crown className="h-12 w-12 text-amber-400 drop-shadow-[0_0_18px_rgba(255,215,0,0.7)]" />
              </div>
            </div>
            <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto -mt-3 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">You've ascended!</h1>
            <p className="text-muted-foreground mb-1 text-sm">
              Welcome to the{" "}
              <span className="text-[#A78BFA] font-semibold">
                {SUB_NAMES[subTier ?? 1]}
              </span>{" "}
              tier.
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Advanced missions, premium badges, and priority Brainiac access are now unlocked.
            </p>
            <Button
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)]"
              onClick={() => navigate("/user/dashboard")}
            >
              Return to Command Center <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-14 w-14 mx-auto text-red-400 mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment unsuccessful</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Your subscription could not be activated. You'll be redirected back to your dashboard shortly.
            </p>
            <Button
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/5"
              onClick={() => navigate("/user/dashboard")}
            >
              Back to Dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
