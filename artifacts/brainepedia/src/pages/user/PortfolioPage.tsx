import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Download,
  GraduationCap,
  Heart,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { USER_NAV } from "@/lib/userNav";
import { api } from "@/lib/api";
import { getProfileId, getUser, getUserId } from "@/lib/auth";
import { buildProfileFormData } from "@/lib/profileService";
import { openSmartCvInNewTab } from "@/lib/smartCv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type SectionKey = "personal-statement" | "education" | "work-experience" | "skills" | "interests" | "services" | "projects";
type Field = { key: string; label: string; type?: "text" | "textarea" | "date" | "number" | "url" | "checkbox" | "file"; ai?: boolean };

const SECTIONS: { key: SectionKey; label: string; icon: typeof UserRound; target?: string }[] = [
  { key: "personal-statement", label: "Personal Statement", icon: UserRound, target: "PersonalStatement" },
  { key: "education", label: "Education & Certifications", icon: GraduationCap },
  { key: "work-experience", label: "Work Experience", icon: BriefcaseBusiness, target: "WorkExperience" },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "interests", label: "Interests", icon: Heart },
  { key: "services", label: "Services", icon: Sparkles, target: "UserService" },
  { key: "projects", label: "Projects", icon: Code2, target: "Project" },
];

const FIELDS: Record<Exclude<SectionKey, "personal-statement">, Field[]> = {
  education: [
    { key: "institution", label: "Institution" },
    { key: "degree", label: "Degree" },
    { key: "courseOfStudy", label: "Course of Study" },
    { key: "fromDate", label: "From Date", type: "date" },
    { key: "endDate", label: "End Date", type: "date" },
  ],
  "work-experience": [
    { key: "companyName", label: "Company" },
    { key: "jobRole", label: "Job Role", ai: true },
    { key: "location", label: "Location" },
    { key: "fromDate", label: "From Date", type: "date" },
    { key: "endDate", label: "End Date", type: "date" },
    { key: "tillDate", label: "Till Date", type: "checkbox" },
    { key: "jobDescription", label: "Job Description", type: "textarea", ai: true },
  ],
  skills: [
    { key: "mySkill", label: "Skill" },
    { key: "rating", label: "Rating (1-100)", type: "number" },
  ],
  interests: [{ key: "interest", label: "Interest" }],
  services: [
    { key: "myServices", label: "Service" },
    { key: "description", label: "Description", type: "textarea", ai: true },
  ],
  projects: [
    { key: "projectName", label: "Project Name" },
    { key: "description", label: "Description", type: "textarea", ai: true },
    { key: "projectUrl", label: "Project URL", type: "url" },
    { key: "projectFile", label: "Upload Image or Video", type: "file" },
  ],
};

function emptyFor(section: Exclude<SectionKey, "personal-statement">) {
  return Object.fromEntries(FIELDS[section].map((field) => [field.key, field.type === "checkbox" ? false : ""]));
}

export default function PortfolioPage() {
  const [, params] = useRoute("/user/portfolio/:section");
  const [, navigate] = useLocation();
  const section = (params?.section as SectionKey) || "personal-statement";
  const active = SECTIONS.some((item) => item.key === section) ? section : "personal-statement";
  const userId = getUserId();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvInstructions, setCvInstructions] = useState("");

  const refreshCounts = async () => {
    if (!userId) return;
    const profileId = getProfileId() || userId;
    const [profileRes, edu, work, skills, interests, services, projects] = await Promise.all([
      api.profiles.get(profileId),
      api.portfolio.education.list({ page: 1, pageSize: 1 }),
      api.portfolio.workExperience.list({ page: 1, pageSize: 1 }),
      api.portfolio.skills.list({ page: 1, pageSize: 1 }),
      api.portfolio.interests.list({ page: 1, pageSize: 1 }),
      api.portfolio.services.list({ page: 1, pageSize: 1 }),
      api.portfolio.projects.list({ page: 1, pageSize: 1 }),
    ]);
    if (profileRes.ok) setProfile(profileRes.data);
    setCounts({
      "personal-statement": textOf(profileRes.data?.aboutMe ?? profileRes.data?.bio).trim() ? 1 : 0,
      education: totalOf(edu.data),
      "work-experience": totalOf(work.data),
      skills: totalOf(skills.data),
      interests: totalOf(interests.data),
      services: totalOf(services.data),
      projects: totalOf(projects.data),
    });
  };

  useEffect(() => {
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const completed = SECTIONS.filter((item) => (counts[item.key] ?? 0) > 0);
  const pct = Math.round((completed.length / SECTIONS.length) * 100);

  return (
    <DashboardShell nav={USER_NAV} title="Portfolio" subtitle="// professional.cv.builder" theme="user" showBrainiac>
      <div className="space-y-6">
        <section className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-[#0d1119] to-[#7C3AED]/10 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/70">Portfolio Completion</p>
              <h2 className="mt-1 text-3xl font-black text-amber-400">{pct}%</h2>
              <Progress value={pct} className="mt-3 h-2 max-w-sm" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <StatusList title="Completed" items={completed.map((item) => item.label)} done />
              <StatusList title="Incomplete" items={SECTIONS.filter((item) => !completed.includes(item)).map((item) => item.label)} />
            </div>
          </div>
          <Button className="mt-5 bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={() => setCvModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Generate Smart CV
          </Button>
        </section>

        <Dialog open={cvModalOpen} onOpenChange={setCvModalOpen}>
          <DialogContent className="border border-white/10 bg-[#0d1119] text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Customize your AI CV</DialogTitle>
              <DialogDescription>Add optional instructions to tailor your generated CV before opening it in a new tab.</DialogDescription>
            </DialogHeader>
            <Textarea
              rows={4}
              value={cvInstructions}
              onChange={(event) => setCvInstructions(event.target.value)}
              placeholder='Example: "Tailor my CV for a Senior Backend Developer role."'
              className="border-white/10 bg-black/20"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setCvModalOpen(false)}>Cancel</Button>
              <Button
                className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]"
                onClick={() => {
                  openSmartCvInNewTab({
                    userId,
                    instructions: cvInstructions.trim() || "Generate a professional, employer-friendly CV from my Brainepedia profile, mission history, and portfolio.",
                  });
                  setCvModalOpen(false);
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" /> Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <nav className="rounded-2xl border border-white/5 bg-[#0d1119] p-3 lg:sticky lg:top-24 lg:self-start">
            {SECTIONS.map((item, index) => {
              const Icon = item.icon;
              const current = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={`/user/portfolio/${item.key}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                    current ? "border-amber-400/40 bg-amber-400/10 text-amber-400" : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {(counts[item.key] ?? 0) > 0 && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </Link>
              );
            })}
          </nav>
          {active === "personal-statement" ? (
            <PersonalStatement profile={profile} onSaved={(next) => setCounts((prev) => ({ ...prev, "personal-statement": next.trim() ? 1 : 0 }))} />
          ) : (
            <CrudSection
              key={active}
              section={active as Exclude<SectionKey, "personal-statement">}
              onPortfolioChange={refreshCounts}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function PersonalStatement({ profile, onSaved }: { profile: any; onSaved: (value: string) => void }) {
  const { toast } = useToast();
  const userId = getUserId();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    setValue(textOf(profile?.aboutMe ?? profile?.bio));
  }, [profile]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const auth = getUser();
    const payload = {
      firstName: profile?.firstName || auth?.firstName || "",
      surName: profile?.surName || profile?.surname || profile?.lastName || auth?.lastName || "",
      middleName: profile?.middleName || "",
      nickName: profile?.nickName || "",
      aboutMe: value,
      currentTitle: profile?.currentTitle || "",
      profession: profile?.profession || "",
      address: profile?.address || "",
      phoneNumber: profile?.phoneNumber || "",
      country: profile?.country || "",
      state: profile?.state || "",
      city: profile?.city || "",
      gender: profile?.gender || "",
      dateOfBirth: profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
      facebook: profile?.facebook || "",
      linkedIn: profile?.linkedIn || profile?.linkedin || "",
      github: profile?.github || "",
      twitter: profile?.twitter || "",
      instagram: profile?.instagram || "",
      youtube: profile?.youtube || "",
    };
    const fd = buildProfileFormData(userId, payload);
    const res = await api.profiles.update(profile?.profileId || profile?.id || getProfileId() || userId, userId, fd);
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Unable to save personal statement", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    onSaved(value);
    toast({ title: "Personal statement saved", description: res.message || "Your portfolio statement was updated." });
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-400">Personal Statement</h2>
          <p className="text-sm text-muted-foreground">This replaces the old About Me editing experience.</p>
        </div>
        <Button variant="outline" onClick={() => setAiOpen(true)}><Sparkles className="mr-2 h-4 w-4" /> Improve with Brainiac</Button>
      </div>
      <Textarea rows={10} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Tell employers who you are, what you do, and what outcomes you create." />
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-amber-400 text-black hover:bg-amber-300">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Personal Statement
        </Button>
      </div>
      <BrainiacModal open={aiOpen} onOpenChange={setAiOpen} targetModule="PersonalStatement" original={value} onAccept={setValue} />
    </section>
  );
}

function CrudSection({
  section,
  onPortfolioChange,
}: {
  section: Exclude<SectionKey, "personal-statement">;
  onPortfolioChange: () => void;
}) {
  const { toast } = useToast();
  const config = SECTIONS.find((item) => item.key === section)!;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyFor(section));
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState<{ field: string; value: string } | null>(null);
  const pageSize = 8;
  const fields = FIELDS[section];

  const service = serviceFor(section);
  const load = async () => {
    setLoading(true);
    const res = await service.list({ page, pageSize });
    setLoading(false);
    if (!res.ok) {
      toast({ title: `Unable to load ${config.label}`, description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setItems(listOf(res.data));
    setTotal(totalOf(res.data));
  };
  useEffect(() => {
    setEditing(null);
    setForm(emptyFor(section));
    setPage(1);
    setAi(null);
  }, [section]);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, page]);

  const startAdd = () => {
    setEditing(null);
    setForm(emptyFor(section));
    setAi(null);
  };
  const startEdit = (item: any) => {
    setEditing(item);
    setForm(itemToForm(section, item));
    setAi(null);
  };
  const save = async () => {
    setSaving(true);
    const payload = section === "projects" ? projectFormData(form, editing) : buildPayload(section, form, editing);
    const res = editing ? await service.edit(payload) : await service.add(payload);
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Save failed", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Portfolio item updated" : "Portfolio item added", description: res.message || "Your portfolio was saved." });
    setEditing(null);
    setForm(emptyFor(section));
    setAi(null);
    await load();
    onPortfolioChange();
  };
  const remove = async (item: any) => {
    const id = idOf(item);
    if (!id || !window.confirm("Delete this portfolio item?")) return;
    const res = await service.delete(id);
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Portfolio item deleted", description: res.message || "The item was removed." });
    await load();
    onPortfolioChange();
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-400">{config.label}</h2>
            <p className="text-sm text-muted-foreground">Add, edit, and maintain this part of your professional CV.</p>
          </div>
          <Button onClick={startAdd} variant="outline"><Plus className="mr-2 h-4 w-4" /> New</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FormField
              key={field.key}
              section={section}
              field={field}
              value={form[field.key]}
              onChange={(value) => setForm((prev: any) => ({ ...prev, [field.key]: value }))}
              onAi={field.ai && config.target ? () => setAi({ field: field.key, value: textOf(form[field.key]) }) : undefined}
            />
          ))}
        </div>
        {section === "projects" && <MediaPreview form={form} />}
        <div className="mt-4 flex justify-end gap-2">
          {editing && <Button variant="ghost" onClick={startAdd}>Cancel edit</Button>}
          <Button onClick={save} disabled={saving} className="bg-amber-400 text-black hover:bg-amber-300">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editing ? "Save Changes" : "Add Item"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0d1119] p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">No {config.label.toLowerCase()} entries yet.</div>
        ) : (
          <div className={section === "skills" || section === "interests" ? "flex flex-wrap gap-3" : "grid gap-3"}>
            {items.map((item, index) => (
              <PortfolioCard key={idOf(item) || index} section={section} item={item} fields={fields} onEdit={() => startEdit(item)} onDelete={() => remove(item)} />
            ))}
          </div>
        )}
        {total > pageSize && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <span className="text-xs font-mono text-muted-foreground">Page {page}</span>
            <Button variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        )}
      </div>
      <BrainiacModal
        open={Boolean(ai)}
        onOpenChange={(open) => !open && setAi(null)}
        targetModule={config.target || "Project"}
        original={ai?.value || ""}
        onAccept={(value) => ai && setForm((prev: any) => ({ ...prev, [ai.field]: value }))}
      />
    </section>
  );
}

function FormField({
  section,
  field,
  value,
  onChange,
  onAi,
}: {
  section: Exclude<SectionKey, "personal-statement">;
  field: Field;
  value: any;
  onChange: (value: any) => void;
  onAi?: () => void;
}) {
  const id = `field-${section}-${field.key}`;
  return (
    <label className={field.type === "textarea" ? "md:col-span-2" : ""}>
      <span className="mb-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {field.label}
        {onAi && <button type="button" onClick={onAi} className="text-amber-400 hover:text-amber-300">✨ Improve with Brainiac</button>}
      </span>
      {field.type === "textarea" ? (
        <Textarea id={id} rows={5} value={value || ""} onChange={(event) => onChange(event.target.value)} />
      ) : field.type === "checkbox" ? (
        <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3"><input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> <span className="text-sm">Currently active</span></div>
      ) : field.type === "file" ? (
        <Input id={id} type="file" accept="image/*,video/*" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      ) : (
        <Input id={id} type={field.type || "text"} value={value || ""} min={field.key === "rating" ? 1 : undefined} max={field.key === "rating" ? 100 : undefined} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function PortfolioCard({ section, item, fields, onEdit, onDelete }: { section: SectionKey; item: any; fields: Field[]; onEdit: () => void; onDelete: () => void }) {
  if (section === "skills") {
    const rating = Math.max(0, Math.min(100, Number(item.rating ?? item.Rating ?? 0)));
    return (
      <div className="w-full rounded-xl border border-white/5 bg-white/[0.03] p-4 sm:w-72">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold">{textOf(item.mySkill ?? item.skill ?? item.name ?? item.Skill ?? item.MySkill)}</h3>
          <CardActions onEdit={onEdit} onDelete={onDelete} />
        </div>
        <Progress value={rating} className="mt-3 h-2" />
        <p className="mt-1 text-xs font-mono text-muted-foreground">{rating}/100</p>
      </div>
    );
  }
  if (section === "interests") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-300">
        {textOf(item.interest ?? item.name ?? item.Interest)}
        <CardActions onEdit={onEdit} onDelete={onDelete} small />
      </span>
    );
  }
  return (
    <article className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-bold">{primaryTitle(section, item)}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {fields.filter((field) => field.type !== "file").map((field) => (
              <div key={field.key}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{field.label}</p>
                <p className="text-sm text-white/80">{formatValue(item[field.key] ?? item[pascal(field.key)], field)}</p>
              </div>
            ))}
          </div>
          {section === "projects" && <ProjectLinks item={item} />}
        </div>
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </article>
  );
}

function CardActions({ onEdit, onDelete, small }: { onEdit: () => void; onDelete: () => void; small?: boolean }) {
  return (
    <span className="inline-flex shrink-0 gap-1">
      <button onClick={onEdit} className={`rounded-md text-muted-foreground hover:text-foreground ${small ? "p-0.5" : "p-2"}`} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} className={`rounded-md text-red-300 hover:text-red-200 ${small ? "p-0.5" : "p-2"}`} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
    </span>
  );
}

function BrainiacModal({ open, onOpenChange, targetModule, original, onAccept }: { open: boolean; onOpenChange: (open: boolean) => void; targetModule: string; original: string; onAccept: (value: string) => void }) {
  const { toast } = useToast();
  const [tone, setTone] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setTone("");
      setResult("");
    }
  }, [open]);
  const generate = async () => {
    setLoading(true);
    const res = await api.professions.restructure({ TargetModule: targetModule, OriginalText: original, ToneInstruction: tone || null });
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Brainiac could not improve this text", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setResult(textOf((res.data as any)?.result ?? (res.data as any)?.text ?? (res.data as any)?.cleanTextResult ?? (res.data as any)?.message ?? res.data));
  };
  const accept = () => {
    onAccept(result);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0d1119] border border-white/10">
        <DialogHeader>
          <DialogTitle>Improve with Brainiac</DialogTitle>
          <DialogDescription>Preview the AI response before replacing your original content.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label>
            <span className="mb-1 block text-xs font-mono text-muted-foreground">Original Text</span>
            <Textarea rows={5} value={original} readOnly />
          </label>
          <label>
            <span className="mb-1 block text-xs font-mono text-muted-foreground">Optional Tone Instruction</span>
            <Input value={tone} onChange={(event) => setTone(event.target.value)} placeholder="Make it more executive. Focus on technical expertise." />
          </label>
          <Button onClick={generate} disabled={loading || !original.trim()} variant="outline">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
          </Button>
          {result && (
            <label>
              <span className="mb-1 block text-xs font-mono text-muted-foreground">Preview Result</span>
              <Textarea rows={7} value={result} onChange={(event) => setResult(event.target.value)} />
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={accept} disabled={!result} className="bg-amber-400 text-black hover:bg-amber-300">Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusList({ title, items, done }: { title: string; items: string[]; done?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <p className="text-xs font-bold">{title}</p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.length ? items.map((item) => <p key={item}>{done ? "✓ " : ""}{item}</p>) : <p>None</p>}
      </div>
    </div>
  );
}

function MediaPreview({ form }: { form: any }) {
  const file = form.projectFile instanceof File ? form.projectFile : null;
  const previewUrl = file ? URL.createObjectURL(file) : form.projectFileUrl || form.imageUrl || form.videoUrl || form.ImageUrl || form.VideoUrl || "";
  const isVideo = file ? file.type.startsWith("video/") : Boolean(form.isVideo ?? form.IsVideo);
  if (!previewUrl) return null;
  return (
    <div className="mt-4">
      {isVideo ? (
        <video src={previewUrl} controls className="max-h-56 rounded-xl border border-white/10" />
      ) : (
        <img src={previewUrl} alt="Project preview" className="max-h-56 rounded-xl border border-white/10 object-cover" />
      )}
    </div>
  );
}

function ProjectLinks({ item }: { item: any }) {
  const mediaUrl = item.projectFileUrl ?? item.ProjectFileUrl ?? item.imageUrl ?? item.ImageUrl ?? item.videoUrl ?? item.VideoUrl;
  const isVideo = Boolean(item.isVideo ?? item.IsVideo);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noreferrer" className="text-xs text-[#00D2FF] hover:underline">Open project</a>}
      {mediaUrl && (
        isVideo ? (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-[#00D2FF] hover:underline">Video</a>
        ) : (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-[#00D2FF] hover:underline">Image</a>
        )
      )}
    </div>
  );
}

function serviceFor(section: Exclude<SectionKey, "personal-statement">): any {
  const map = {
    education: api.portfolio.education,
    "work-experience": api.portfolio.workExperience,
    skills: api.portfolio.skills,
    interests: api.portfolio.interests,
    services: api.portfolio.services,
    projects: api.portfolio.projects,
  };
  return map[section];
}

function projectFormData(form: any, editing: any) {
  const fd = new FormData();
  if (editing) fd.append("ProjectId", idOf(editing));
  fd.append("ProjectName", form.projectName || "");
  fd.append("Description", form.description || "");
  fd.append("ProjectUrl", form.projectUrl || "");
  if (form.projectFile instanceof File) {
    const isVideo = form.projectFile.type.startsWith("video/");
    fd.append("ProjectFile", form.projectFile);
    fd.append("IsVideo", String(isVideo));
    fd.append("IsImage", String(!isVideo));
  }
  return fd;
}

function buildPayload(section: Exclude<SectionKey, "personal-statement">, form: any, editing: any | null) {
  const toDate = (value: any) => (value ? String(value) : null);
  switch (section) {
    case "education": {
      const payload = {
        institution: form.institution || "",
        degree: form.degree || "",
        courseOfStudy: form.courseOfStudy || "",
        fromDate: toDate(form.fromDate),
        endDate: toDate(form.endDate),
      };
      return editing ? { ...payload, educationId: idOf(editing) } : payload;
    }
    case "work-experience": {
      const payload = {
        companyName: form.companyName || "",
        jobRole: form.jobRole || "",
        location: form.location || "",
        fromDate: toDate(form.fromDate),
        endDate: toDate(form.endDate),
        tillDate: Boolean(form.tillDate),
        jobDescription: form.jobDescription || "",
      };
      return editing ? { ...payload, workExperienceId: idOf(editing) } : payload;
    }
    case "skills": {
      const payload = {
        mySkill: form.mySkill || "",
        rating: Number(form.rating) || 0,
      };
      return editing ? { ...payload, skillsId: idOf(editing) } : payload;
    }
    case "interests": {
      const payload = { interest: form.interest || "" };
      return editing ? { ...payload, interestsId: idOf(editing) } : payload;
    }
    case "services": {
      const payload = {
        myServices: form.myServices || "",
        description: form.description || "",
      };
      return editing ? { ...payload, userServicesId: idOf(editing) } : payload;
    }
    default:
      return form;
  }
}

function itemToForm(section: Exclude<SectionKey, "personal-statement">, item: any) {
  const base = emptyFor(section);
  const dateValue = (value: any) => (value ? String(value).slice(0, 10) : "");
  switch (section) {
    case "education":
      return {
        ...base,
        institution: textOf(item.institution ?? item.Institution),
        degree: textOf(item.degree ?? item.Degree),
        courseOfStudy: textOf(item.courseOfStudy ?? item.CourseOfStudy),
        fromDate: dateValue(item.fromDate ?? item.FromDate),
        endDate: dateValue(item.endDate ?? item.EndDate),
      };
    case "work-experience":
      return {
        ...base,
        companyName: textOf(item.companyName ?? item.CompanyName ?? item.company ?? item.Company),
        jobRole: textOf(item.jobRole ?? item.JobRole ?? item.role ?? item.Role),
        location: textOf(item.location ?? item.Location),
        fromDate: dateValue(item.fromDate ?? item.FromDate ?? item.start ?? item.Start),
        endDate: dateValue(item.endDate ?? item.EndDate ?? item.end ?? item.End),
        tillDate: Boolean(item.tillDate ?? item.TillDate),
        jobDescription: textOf(item.jobDescription ?? item.JobDescription ?? item.description ?? item.Description),
      };
    case "skills":
      return {
        ...base,
        mySkill: textOf(item.mySkill ?? item.MySkill ?? item.skill ?? item.Skill),
        rating: textOf(item.rating ?? item.Rating),
      };
    case "interests":
      return {
        ...base,
        interest: textOf(item.interest ?? item.Interest),
      };
    case "services":
      return {
        ...base,
        myServices: textOf(item.myServices ?? item.MyServices ?? item.service ?? item.Service),
        description: textOf(item.description ?? item.Description),
      };
    case "projects":
      return {
        ...base,
        projectName: textOf(item.projectName ?? item.ProjectName),
        description: textOf(item.description ?? item.Description),
        projectUrl: textOf(item.projectUrl ?? item.ProjectUrl),
        projectFileUrl: item.projectFileUrl ?? item.ProjectFileUrl ?? item.imageUrl ?? item.ImageUrl ?? item.videoUrl ?? item.VideoUrl ?? "",
        isVideo: Boolean(item.isVideo ?? item.IsVideo),
      };
    default:
      return base;
  }
}

function listOf(data: any): any[] {
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data?.records) ? data.records : [];
}
function totalOf(data: any): number {
  return Number(data?.totalCount ?? data?.total ?? data?.count ?? listOf(data).length ?? 0);
}
function idOf(item: any): string {
  return String(
    item?.id ??
      item?.Id ??
      item?.portfolioId ??
      item?.PortfolioId ??
      item?.educationId ??
      item?.EducationId ??
      item?.workExperienceId ??
      item?.WorkExperienceId ??
      item?.skillsId ??
      item?.SkillsId ??
      item?.interestsId ??
      item?.InterestsId ??
      item?.userServicesId ??
      item?.UserServicesId ??
      item?.projectId ??
      item?.ProjectId ??
      "",
  );
}
function textOf(value: any): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}
function pascal(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
function formatValue(value: any, field: Field): string {
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "date" && value) return new Date(value).toLocaleDateString();
  return textOf(value) || "—";
}
function primaryTitle(section: SectionKey, item: any): string {
  if (section === "education") return textOf(item.institution ?? item.Institution ?? "Education");
  if (section === "work-experience") return textOf(item.jobRole ?? item.JobRole ?? item.role ?? item.Role ?? item.companyName ?? item.CompanyName ?? item.company ?? item.Company ?? "Experience");
  if (section === "services") return textOf(item.myServices ?? item.MyServices ?? item.service ?? item.Service ?? "Service");
  if (section === "projects") return textOf(item.projectName ?? item.ProjectName ?? "Project");
  return "Portfolio item";
}
