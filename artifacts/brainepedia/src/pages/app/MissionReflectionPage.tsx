import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveReflection } from "@/lib/missionExecutionService";
import { getDashboardPath } from "@/lib/auth";

export default function MissionReflectionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const dashPath = getDashboardPath();

  const [whatLearned, setWhatLearned] = useState("");
  const [whatToImprove, setWhatToImprove] = useState("");
  const [whatChallenged, setWhatChallenged] = useState("");
  const [saving, setSaving] = useState(false);

  const canFinish =
    whatLearned.trim().length >= 10 &&
    whatToImprove.trim().length >= 10 &&
    whatChallenged.trim().length >= 10;

  async function handleSave() {
    if (!canFinish) return;
    setSaving(true);
    const res = await saveReflection({
      experienceSessionId: sessionId,
      whatLearned: whatLearned.trim(),
      whatToImprove: whatToImprove.trim(),
      whatChallenged: whatChallenged.trim(),
    });
    setSaving(false);

    if (res.ok) {
      toast({ title: "Reflection saved", description: "Mission complete!" });
      navigate(dashPath);
    } else {
      toast({ title: "Could not save reflection", description: res.error, variant: "destructive" });
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#060a10] text-white flex items-center justify-center">
        <p className="text-sm font-mono text-white/40">Invalid session.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a10] text-white flex flex-col">
      <header className="px-4 py-4 border-b border-white/5 bg-black/20">
        <p className="text-[10px] font-mono text-[#9D4EDD] tracking-widest uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Reflection
        </p>
        <h1 className="text-xl font-bold font-mono mt-1">Close the loop</h1>
        <p className="text-sm text-white/45 mt-1 max-w-xl">
          Every professional mission ends with reflection. Capture what you learned before moving on.
        </p>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-[#0a0f16] p-6 space-y-5"
        >
          <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
            <BookOpen className="w-4 h-4" />
            Required before you finish (min. 10 characters each)
          </div>

          <div className="space-y-2">
            <Label htmlFor="what-learned" className="text-xs font-mono text-white/55">
              What did you learn?
            </Label>
            <Textarea
              id="what-learned"
              value={whatLearned}
              onChange={(e) => setWhatLearned(e.target.value)}
              className="min-h-[100px] bg-black/25 border-white/10 text-sm"
              placeholder="New skills, insights, or techniques from this mission…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="what-improve" className="text-xs font-mono text-white/55">
              What would you improve next time?
            </Label>
            <Textarea
              id="what-improve"
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              className="min-h-[100px] bg-black/25 border-white/10 text-sm"
              placeholder="Process, planning, or execution improvements…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="what-challenged" className="text-xs font-mono text-white/55">
              What challenged you?
            </Label>
            <Textarea
              id="what-challenged"
              value={whatChallenged}
              onChange={(e) => setWhatChallenged(e.target.value)}
              className="min-h-[100px] bg-black/25 border-white/10 text-sm"
              placeholder="Obstacles, trade-offs, or difficult decisions…"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="font-mono text-xs border-white/15 text-white/50"
              onClick={() => navigate(`/mission/results/${sessionId}`)}
            >
              Back to feedback
            </Button>
            <Button
              disabled={!canFinish || saving}
              onClick={handleSave}
              className="flex-1 font-mono text-xs bg-gradient-to-r from-[#00D2FF] to-[#9D4EDD]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Finish mission
            </Button>
          </div>
        </motion.div>

        <p className="text-[10px] font-mono text-white/25 text-center">
          Portfolio update coming soon — your reflection will feed your professional story.
        </p>
      </main>
    </div>
  );
}
