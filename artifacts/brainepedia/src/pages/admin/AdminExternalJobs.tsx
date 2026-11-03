import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlContent } from "@/components/editor/HtmlContent";
import { RichTextEditor, htmlToPlainText } from "@/components/editor/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServerPagination } from "@/components/shared/ServerPagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import {
  createExternalJob, deleteExternalJob, getExternalJob, listAdminExternalJobs, updateExternalJob,
} from "@/lib/externalJobsService";
import { asList, text } from "@/lib/jobData";
import { employmentLabel, experienceLabel, formatFeedDate, isAbsoluteHttpUrl, isGuid } from "@/lib/safeUrl";
import type { EmploymentType, ExperienceLevel, ExternalJobCreateDto, ExternalJobDto } from "@/lib/types/socialFeed";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";

const EMPLOYMENT: EmploymentType[] = ["FullTime", "PartTime", "Contract", "Internship", "Freelance"];
const EXPERIENCE: ExperienceLevel[] = ["Entry", "Junior", "Mid", "Senior", "Lead"];

const EMPTY_FORM: ExternalJobCreateDto = {
  jobTitle: "",
  jobDescription: "",
  organisationName: "",
  organisationLogoUrl: "",
  organisationWebsite: "",
  location: "",
  country: "",
  employmentType: "FullTime",
  experienceLevel: "Mid",
  salaryInformation: "",
  applicationUrl: "",
  professionId: null,
  isActive: true,
  shareToFeed: false,
  closingDate: null,
};

export default function AdminExternalJobs() {
  usePageTitle("External Jobs");
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ExternalJobDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<number | undefined>();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExternalJobCreateDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ExternalJobDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExternalJobDto | null>(null);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    const res = await listAdminExternalJobs(nextPage, 20);
    setLoading(false);
    setStatus(res.status);
    if (!res.ok || !res.data) {
      setJobs([]);
      if (res.status === 401) setError("Your session has expired. Please log in again.");
      else if (res.status === 403) setError("Only a Global Admin can manage external jobs.");
      else setError(res.error || "Unable to load external jobs.");
      return;
    }
    setJobs(res.data.items);
    setTotalPages(res.data.totalPages);
    setPage(res.data.pageNumber || nextPage);
  };

  useEffect(() => { void load(page); }, [page]);

  useEffect(() => {
    api.professions.list().then((res) => {
      if (!res.ok) return;
      setProfessions(asList(res.data).map((item) => ({
        id: text(item?.professionId ?? item?.id, ""),
        name: text(item?.name ?? item?.professionName ?? item?.title, ""),
      })).filter((item) => isGuid(item.id) && item.name));
    });
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((job) => [job.jobTitle, job.organisationName, job.location, job.professionName]
      .some((value) => (value || "").toLowerCase().includes(needle)));
  }, [jobs, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = async (job: ExternalJobDto) => {
    const res = await getExternalJob(job.externalJobId);
    const source = res.ok && res.data ? res.data : job;
    if (res.status === 404) {
      toast({ title: "Job not found", description: "This external job is no longer available.", variant: "destructive" });
      return;
    }
    setEditingId(source.externalJobId);
    setForm({
      jobTitle: source.jobTitle || "",
      jobDescription: source.jobDescription || "",
      organisationName: source.organisationName || "",
      organisationLogoUrl: source.organisationLogoUrl || "",
      organisationWebsite: source.organisationWebsite || "",
      location: source.location || "",
      country: source.country || "",
      employmentType: (source.employmentType as EmploymentType) || "FullTime",
      experienceLevel: (source.experienceLevel as ExperienceLevel) || "Mid",
      salaryInformation: source.salaryInformation || "",
      applicationUrl: source.applicationUrl || "",
      professionId: source.professionId,
      isActive: source.isActive !== false,
      shareToFeed: source.shareToFeed === true,
      closingDate: source.closingDate ? source.closingDate.slice(0, 10) : null,
    });
    setFormOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.jobTitle.trim() || !htmlToPlainText(form.jobDescription) || !form.organisationName.trim()) {
      toast({ title: "Missing details", description: "Title, description, and organisation are required.", variant: "destructive" });
      return;
    }
    if (!isAbsoluteHttpUrl(form.applicationUrl)) {
      toast({ title: "Invalid application URL", description: "Use an absolute http or https URL.", variant: "destructive" });
      return;
    }
    if (form.organisationLogoUrl && !isAbsoluteHttpUrl(form.organisationLogoUrl)) {
      toast({ title: "Invalid logo URL", description: "Logo URL must be an absolute http or https URL.", variant: "destructive" });
      return;
    }
    if (form.organisationWebsite && !isAbsoluteHttpUrl(form.organisationWebsite)) {
      toast({ title: "Invalid website", description: "Website must be an absolute http or https URL.", variant: "destructive" });
      return;
    }
    const payload: ExternalJobCreateDto = {
      ...form,
      jobTitle: form.jobTitle.trim(),
      jobDescription: form.jobDescription.trim(),
      organisationName: form.organisationName.trim(),
      organisationLogoUrl: form.organisationLogoUrl?.trim() || null,
      organisationWebsite: form.organisationWebsite?.trim() || null,
      location: form.location?.trim() || null,
      country: form.country?.trim() || null,
      salaryInformation: form.salaryInformation?.trim() || null,
      applicationUrl: form.applicationUrl.trim(),
      professionId: form.professionId || null,
      isActive: form.isActive !== false,
      shareToFeed: form.shareToFeed === true,
      closingDate: form.closingDate ? new Date(`${form.closingDate}T00:00:00.000Z`).toISOString() : null,
    };
    setSaving(true);
    const res = editingId ? await updateExternalJob(editingId, payload) : await createExternalJob(payload);
    setSaving(false);
    if (!res.ok) {
      const title = res.status === 403 ? "Not allowed" : res.status === 404 ? "Job not found" : "Unable to save external job";
      toast({ title, description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "External job updated" : "External job created" });
    setFormOpen(false);
    void load(page);
  };

  const toggleActive = async (job: ExternalJobDto) => {
    const res = await getExternalJob(job.externalJobId);
    if (!res.ok || !res.data) {
      toast({ title: "Unable to update status", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    const source = res.data;
    const saved = await updateExternalJob(job.externalJobId, {
      jobTitle: source.jobTitle || "",
      jobDescription: source.jobDescription || "",
      organisationName: source.organisationName || "",
      organisationLogoUrl: source.organisationLogoUrl,
      organisationWebsite: source.organisationWebsite,
      location: source.location,
      country: source.country,
      employmentType: (source.employmentType as EmploymentType) || null,
      experienceLevel: (source.experienceLevel as ExperienceLevel) || null,
      salaryInformation: source.salaryInformation,
      applicationUrl: source.applicationUrl || "",
      professionId: source.professionId,
      isActive: source.isActive === false,
      shareToFeed: source.shareToFeed === true,
      closingDate: source.closingDate,
    });
    if (!saved.ok) {
      toast({ title: "Unable to update status", description: saved.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: saved.data?.isActive ? "Job activated" : "Job deactivated" });
    void load(page);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const res = await deleteExternalJob(pendingDelete.externalJobId);
    setPendingDelete(null);
    if (!res.ok) {
      toast({ title: res.status === 404 ? "Job not found" : "Unable to delete", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "External job deleted" });
    void load(page);
  };

  return (
    <DashboardShell nav={ADMIN_NAV} title="External Jobs" subtitle="// global admin" theme="admin">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">External job management</h2>
          <p className="text-sm text-muted-foreground">Create roles for organisations that do not have a Brainepedia employer account.</p>
        </div>
        <Button type="button" onClick={openCreate} className="bg-[#6366F1] text-white hover:bg-[#4F46E5]">
          <Plus className="mr-2 h-4 w-4" /> Create external job
        </Button>
      </div>
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter this page by title, organisation, or location" className="mb-4 max-w-md" />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading external jobs…</div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p>{error}</p>
          {status !== 401 && status !== 403 && <Button className="mt-3" variant="outline" onClick={() => void load(page)}>Retry</Button>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Job title", "Organisation", "Location", "Employment", "Experience", "Profession", "Active", "Feed", "Closing", "Created", ""].map((heading) => (
                  <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">No external jobs on this page.</td></tr>
              ) : visible.map((job) => (
                <tr key={job.externalJobId} className="border-t border-white/5">
                  <td className="px-3 py-3 font-semibold">{job.jobTitle || "Untitled"}</td>
                  <td className="px-3 py-3">{job.organisationName || "—"}</td>
                  <td className="px-3 py-3">{job.location || "—"}</td>
                  <td className="px-3 py-3">{employmentLabel(job.employmentType) || "—"}</td>
                  <td className="px-3 py-3">{experienceLabel(job.experienceLevel) || "—"}</td>
                  <td className="px-3 py-3">{job.professionName || "—"}</td>
                  <td className="px-3 py-3">{job.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-3">{job.shareToFeed ? "Shared" : "Hidden"}</td>
                  <td className="px-3 py-3">{job.closingDate ? formatFeedDate(job.closingDate) : "—"}</td>
                  <td className="px-3 py-3">{job.createdAt ? formatFeedDate(job.createdAt) : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(job)}>View</Button>
                      <Button size="sm" variant="ghost" onClick={() => void openEdit(job)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => void toggleActive(job)}>{job.isActive ? "Deactivate" : "Activate"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingDelete(job)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>

      {formOpen && (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/8 bg-[#0d1119] p-5">
          <h3 className="text-lg font-bold">{editingId ? "Edit external job" : "Create external job"}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title" value={form.jobTitle} onChange={(value) => setForm({ ...form, jobTitle: value })} />
            <Field label="Organisation" value={form.organisationName} onChange={(value) => setForm({ ...form, organisationName: value })} />
            <Field label="Location" value={form.location || ""} onChange={(value) => setForm({ ...form, location: value })} />
            <Field label="Country" value={form.country || ""} onChange={(value) => setForm({ ...form, country: value })} />
            <Field label="Application URL" value={form.applicationUrl} onChange={(value) => setForm({ ...form, applicationUrl: value })} />
            <Field label="Salary information" value={form.salaryInformation || ""} onChange={(value) => setForm({ ...form, salaryInformation: value })} />
            <Field label="Logo URL" value={form.organisationLogoUrl || ""} onChange={(value) => setForm({ ...form, organisationLogoUrl: value })} />
            <Field label="Website" value={form.organisationWebsite || ""} onChange={(value) => setForm({ ...form, organisationWebsite: value })} />
            <div className="space-y-2">
              <Label>Employment type</Label>
              <Select value={form.employmentType || "FullTime"} onValueChange={(value) => setForm({ ...form, employmentType: value as EmploymentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/15 bg-[#0d1119] text-white">
                  {EMPLOYMENT.map((item) => <SelectItem key={item} value={item}>{employmentLabel(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience level</Label>
              <Select value={form.experienceLevel || "Mid"} onValueChange={(value) => setForm({ ...form, experienceLevel: value as ExperienceLevel })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/15 bg-[#0d1119] text-white">
                  {EXPERIENCE.map((item) => <SelectItem key={item} value={item}>{experienceLabel(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profession</Label>
              <Select value={form.professionId || "none"} onValueChange={(value) => setForm({ ...form, professionId: value === "none" ? null : value })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
                  <SelectItem value="none">No profession</SelectItem>
                  {professions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-date">Closing date</Label>
              <Input id="closing-date" type="date" value={form.closingDate ? String(form.closingDate).slice(0, 10) : ""} onChange={(event) => setForm({ ...form, closingDate: event.target.value || null })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-description">Job description</Label>
            <RichTextEditor
              id="job-description"
              value={form.jobDescription}
              onChange={(html) => setForm({ ...form, jobDescription: html })}
              placeholder="Describe the role, responsibilities, and what a strong applicant brings."
              minHeightClassName="min-h-[180px]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.isActive !== false} onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.shareToFeed === true} onCheckedChange={(checked) => setForm({ ...form, shareToFeed: checked === true })} />
            Share this job on the Brainepedia public feed while it is active and before the closing date
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {detail && (
        <section className="mt-6 rounded-2xl border border-white/8 bg-[#0d1119] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{detail.jobTitle}</h3>
              <p className="text-sm text-muted-foreground">{detail.organisationName}</p>
            </div>
            <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
          </div>
          <HtmlContent html={detail.jobDescription} className="mt-3 text-sm" />
          <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <Info label="Location" value={[detail.location, detail.country].filter(Boolean).join(", ")} />
            <Info label="Employment" value={employmentLabel(detail.employmentType)} />
            <Info label="Experience" value={experienceLabel(detail.experienceLevel)} />
            <Info label="Salary" value={detail.salaryInformation || ""} />
            <Info label="Application URL" value={detail.applicationUrl || ""} />
            <Info label="Active" value={detail.isActive ? "Yes" : "No"} />
            <Info label="Share to feed" value={detail.shareToFeed ? "Yes" : "No"} />
            <Info label="Updated" value={formatFeedDate(detail.updatedAt)} />
          </dl>
        </section>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this external job?</AlertDialogTitle>
            <AlertDialogDescription>This removes {pendingDelete?.jobTitle || "the job"} from Brainepedia. The action cannot be undone from this screen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}
