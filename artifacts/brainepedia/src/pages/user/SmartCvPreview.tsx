import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, Loader2, Printer, Share2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function SmartCvPreview() {
  const { toast } = useToast();
  const userId = getUserId();
  const [instructions, setInstructions] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setLoading(true);
    const res = await api.professions.generateSmartCv({
      userId,
      instructions: instructions || "Generate a professional, employer-friendly CV from my Brainepedia profile, mission history, and portfolio.",
    });
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Unable to generate Smart CV", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    const data = res.data as any;
    setHtml(String(data?.cleanHtmlResult ?? data?.CleanHtmlResult ?? data?.html ?? data ?? ""));
  };

  const downloadPdf = () => window.print();
  const share = () => {
    if (navigator.share) {
      navigator.share({ title: "My Brainepedia Smart CV", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      toast({ title: "Link copied", description: "The CV preview link was copied." });
    }
  };

  return (
    <DashboardShell
      nav={USER_NAV}
      title="Smart CV Preview"
      subtitle="// portfolio.generated.cv"
      theme="user"
      headerRight={
        <div className="hidden md:flex gap-2">
          <Button variant="outline" onClick={share}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button className="bg-amber-400 text-black hover:bg-amber-300" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Link href="/user/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Portfolio
        </Link>
        <section className="print:hidden rounded-2xl border border-white/5 bg-[#0d1119] p-5">
          <p className="text-sm font-bold text-amber-400">Generate Smart CV</p>
          <p className="mt-1 text-sm text-muted-foreground">Add optional custom instructions, then regenerate.</p>
          <Textarea className="mt-3" rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Emphasize leadership, technical depth, or executive tone." />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading} className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
            </Button>
            <Button variant="outline" onClick={share}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white p-4 text-slate-950 shadow-2xl print:border-0 print:shadow-none">
          {loading && !html ? (
            <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Generating your Smart CV...
            </div>
          ) : html ? (
            <div className="cv-preview prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="py-24 text-center text-slate-500">No CV generated yet.</div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
