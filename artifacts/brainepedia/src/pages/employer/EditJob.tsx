import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api, type UpdateJobRequest } from "@/lib/api";
import { defaultExpiryDate, expiryDateOf, text, todayString } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor, htmlToPlainText } from "@/components/editor/RichTextEditor";
import { useToast } from "@/hooks/use-toast";

export default function EditJob() {
  const [, params] = useRoute("/employer/jobs/:jobId/edit");
  const [, navigate] = useLocation();
  const jobId = params?.jobId ? decodeURIComponent(params.jobId) : "";
  const { toast } = useToast();
  const [form, setForm] = useState<UpdateJobRequest>({ title: "", description: "", location: "", salaryRange: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!jobId) return;
      setLoading(true);
      setError("");
      const res = await api.jobs.myJob(jobId);
      if (cancelled) return;
      setLoading(false);
      let job = res.data as any;
      if (!res.ok && res.status === 404) {
        const postings = await api.jobs.myPostings();
        if (cancelled) return;
        job = postings.ok ? (Array.isArray(postings.data) ? postings.data : (postings.data as any)?.jobs ?? (postings.data as any)?.postings ?? (postings.data as any)?.data ?? []).find((item: any) => String(item?.jobId ?? item?.jobPostingId ?? item?.postingId ?? item?.id ?? "") === jobId) : null;
      } else if (!res.ok) {
        setError(res.error || "Unable to load job.");
        return;
      }
      if (!job) {
        setError(res.error || "Unable to load job.");
        return;
      }
      setForm({
        title: text(job?.title ?? job?.jobTitle, ""),
        description: text(job?.description ?? job?.details, ""),
        location: text(job?.location, ""),
        salaryRange: text(job?.salaryRange ?? job?.salary, ""),
        expiryDate: text(expiryDateOf(job), defaultExpiryDate()).slice(0, 10),
      });
    }
    load();
    return () => { cancelled = true; };
  }, [jobId]);

  const update = (key: keyof UpdateJobRequest, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobId) return;
    if (!form.title?.trim() || !htmlToPlainText(form.description || "")) {
      toast({ title: "Missing job details", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    if (form.expiryDate && form.expiryDate < todayString()) {
      toast({ title: "Invalid expiry date", description: "Expiry Date cannot be earlier than today.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await api.jobs.updateJob(jobId, {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      location: form.location?.trim() || null,
      salaryRange: form.salaryRange?.trim() || null,
      expiryDate: form.expiryDate || defaultExpiryDate(),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Unable to update job", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Job updated", description: "Your posting changes were saved." });
    navigate("/employer/jobs");
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Edit Job" subtitle="// jobs.edit-posting" theme="employer">
      <div className="space-y-6">
        <Button asChild variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href="/employer/jobs"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Job Postings</Link>
        </Button>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading job...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
        ) : (
          <form onSubmit={submit} className="max-w-3xl rounded-2xl border border-white/5 bg-[#0d1119] p-6">
            <div className="mb-6">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Editable posting fields</p>
              <h2 className="mt-1 text-2xl font-black">Update job details</h2>
              <p className="mt-2 text-sm text-muted-foreground">Title, rich description, expiry date, location, and salary range are sent to the backend update endpoint.</p>
            </div>
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-job-title">Job Title</Label>
                <Input id="edit-job-title" value={form.title || ""} onChange={(event) => update("title", event.target.value)} required className="border-white/15 bg-white/[0.04]" />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-job-location">Location</Label>
                  <Input id="edit-job-location" value={form.location || ""} onChange={(event) => update("location", event.target.value)} className="border-white/15 bg-white/[0.04]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-job-salary">Salary Range</Label>
                  <Input id="edit-job-salary" value={form.salaryRange || ""} onChange={(event) => update("salaryRange", event.target.value)} className="border-white/15 bg-white/[0.04]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job-expiry">Expiry Date</Label>
                <Input
                  id="edit-job-expiry"
                  type="date"
                  min={todayString()}
                  value={form.expiryDate || ""}
                  onChange={(event) => update("expiryDate", event.target.value)}
                  required
                  className="border-white/15 bg-white/[0.04]"
                />
                <p className="text-xs text-muted-foreground">Expiry Date cannot be earlier than today.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job-description">Description</Label>
                <RichTextEditor
                  id="edit-job-description"
                  value={form.description || ""}
                  onChange={(html) => update("description", html)}
                  placeholder="Update the role, responsibilities, requirements, benefits, and assessment instructions."
                  className="border-white/15 bg-white/[0.04]"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="mt-6 bg-[#00D2FF] text-black hover:bg-[#00B8DD]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
