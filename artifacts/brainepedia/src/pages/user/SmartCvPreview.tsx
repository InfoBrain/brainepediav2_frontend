import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { getUserId } from "@/lib/auth";
import { generateAndOpenSmartCv } from "@/lib/smartCv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function SmartCvPreview() {
  const { toast } = useToast();
  const userId = getUserId();
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!userId) return;
    setLoading(true);
    const result = await generateAndOpenSmartCv(userId, instructions);
    setLoading(false);
    if (!result.ok) {
      toast({
        title: "Unable to generate Smart CV",
        description: result.error || result.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Smart CV generated",
      description: "Your CV opened in a new tab and is being prepared for download.",
    });
  };

  return (
    <DashboardShell
      nav={USER_NAV}
      title="Smart CV Preview"
      subtitle="// portfolio.generated.cv"
      theme="user"
    >
      <div className="space-y-5">
        <Link href="/user/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Portfolio
        </Link>
        <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
          <p className="text-sm font-bold text-amber-400">Generate Smart CV</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add optional custom instructions, then generate your CV in a new tab with automatic PDF download.
          </p>
          <Textarea
            className="mt-3"
            rows={3}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Emphasize leadership, technical depth, or executive tone."
            disabled={loading}
          />
          <div className="mt-3">
            <Button onClick={generate} disabled={loading || !userId} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? "Generating..." : "Generate Smart CV"}
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
