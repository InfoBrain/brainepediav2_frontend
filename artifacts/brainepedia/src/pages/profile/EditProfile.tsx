import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Eye,
  Loader2,
  Save,
  User as UserIcon,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { BrainiacSpinner } from "@/components/dashboard/BrainiacSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getUserRole, getUserId } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/profile/edit", label: "Edit Profile", icon: UserIcon },
];

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  surName: z.string().min(1, "Surname is required").max(80),
  middleName: z.string().max(80).optional().or(z.literal("")),
  aboutMe: z.string().max(1000).optional().or(z.literal("")),
  currentTitle: z.string().max(120).optional().or(z.literal("")),
  profession: z.string().max(120).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  linkedIn: z.string().max(200).optional().or(z.literal("")),
  github: z.string().max(200).optional().or(z.literal("")),
  twitter: z.string().max(200).optional().or(z.literal("")),
});
type FormVals = z.infer<typeof schema>;

export default function EditProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();
  const role = getUserRole();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      surName: "",
      middleName: "",
      aboutMe: "",
      currentTitle: "",
      profession: "",
      facebook: "",
      linkedIn: "",
      github: "",
      twitter: "",
    },
  });

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await api.profiles.get(userId);
      if (cancelled) return;
      if (res.ok && res.data && typeof res.data === "object") {
        const d = res.data as any;
        reset({
          firstName: d.firstName || "",
          surName: d.surName || d.surname || d.lastName || "",
          middleName: d.middleName || "",
          aboutMe: d.aboutMe || d.bio || "",
          currentTitle: d.currentTitle || d.title || "",
          profession: d.profession || "",
          facebook: d.facebook || "",
          linkedIn: d.linkedIn || d.linkedin || "",
          github: d.github || "",
          twitter: d.twitter || "",
        });
        setImagePreview(d.imageUrl || d.avatarUrl || d.profileImage || null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, navigate, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image.", variant: "destructive" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5 MB.", variant: "destructive" });
      return;
    }
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImagePreview(url);
  };

  const onSubmit = async (vals: FormVals) => {
    if (!userId) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("FirstName", vals.firstName);
    fd.append("SurName", vals.surName);
    if (vals.middleName) fd.append("MiddleName", vals.middleName);
    if (vals.aboutMe) fd.append("AboutMe", vals.aboutMe);
    if (vals.currentTitle) fd.append("CurrentTitle", vals.currentTitle);
    if (vals.profession) fd.append("Profession", vals.profession);
    if (vals.facebook) fd.append("Facebook", vals.facebook);
    if (vals.linkedIn) fd.append("LinkedIn", vals.linkedIn);
    if (vals.github) fd.append("Github", vals.github);
    if (vals.twitter) fd.append("Twitter", vals.twitter);
    if (imageFile) fd.append("ImageFile", imageFile);

    const res = await api.profiles.update(userId, fd);
    setSubmitting(false);
    if (res.ok) {
      toast({
        title: "Profile updated",
        description: "Your dossier has been refined.",
      });
    } else {
      toast({
        title: "Update failed",
        description: res.error || "Could not save your profile.",
        variant: "destructive",
      });
    }
  };

  const headerRight = (
    <Link
      href={userId ? `/profile/${encodeURIComponent(userId)}` : "/"}
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-400/40 bg-amber-400/10 text-xs font-mono uppercase tracking-wider text-amber-400 hover:bg-amber-400/20 transition"
    >
      <Eye className="h-3.5 w-3.5" /> View Public
    </Link>
  );

  // Theme based on user's role so the shell color stays consistent with their dashboard
  const theme: "user" | "admin" | "employer" =
    role === "GlobalAdmin" ? "admin" : role === "Employer" ? "employer" : "user";

  return (
    <DashboardShell
      nav={nav}
      title="Refine Your Dossier"
      subtitle="// profile.edit"
      headerRight={headerRight}
      theme={theme}
    >
      {loading ? (
        <BrainiacSpinner text="Brainiac retrieving dossier…" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
          <Link
            href={userId ? `/profile/${encodeURIComponent(userId)}` : "/"}
            className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400"
          >
            <ArrowLeft className="h-3 w-3" /> Back to public profile
          </Link>

          {/* Avatar uploader */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d1119] border border-white/5 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Avatar"
                  className="h-28 w-28 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_18px_rgba(255,215,0,0.4)]"
                />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center text-4xl font-bold text-white border-2 border-amber-400/60">
                  ?
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center shadow-lg"
                aria-label="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Operative portrait</h3>
              <p className="text-sm text-muted-foreground">
                Upload a square image (PNG/JPG, up to 5 MB). This appears on your public dossier and across the empire.
              </p>
            </div>
          </motion.section>

          {/* Identity */}
          <Section title="Identity" subtitle="// who.you.are">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="First Name" error={errors.firstName?.message}>
                <Input {...register("firstName")} />
              </Field>
              <Field label="Middle Name" error={errors.middleName?.message}>
                <Input {...register("middleName")} />
              </Field>
              <Field label="Surname" error={errors.surName?.message}>
                <Input {...register("surName")} />
              </Field>
              <Field label="Current Title" error={errors.currentTitle?.message}>
                <Input placeholder="Senior Engineer" {...register("currentTitle")} />
              </Field>
              <Field label="Profession" error={errors.profession?.message}>
                <Input placeholder="Software Engineering" {...register("profession")} />
              </Field>
            </div>
          </Section>

          {/* About */}
          <Section title="About" subtitle="// your.story">
            <Field label="About Me" error={errors.aboutMe?.message}>
              <Textarea
                rows={5}
                placeholder="A brief manifesto of your work, your craft, your conquests…"
                {...register("aboutMe")}
              />
            </Field>
          </Section>

          {/* Socials */}
          <Section title="External Channels" subtitle="// links.outbound">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="GitHub" error={errors.github?.message}>
                <Input placeholder="https://github.com/you" {...register("github")} />
              </Field>
              <Field label="LinkedIn" error={errors.linkedIn?.message}>
                <Input placeholder="https://linkedin.com/in/you" {...register("linkedIn")} />
              </Field>
              <Field label="Twitter / X" error={errors.twitter?.message}>
                <Input placeholder="https://x.com/you" {...register("twitter")} />
              </Field>
              <Field label="Facebook" error={errors.facebook?.message}>
                <Input placeholder="https://facebook.com/you" {...register("facebook")} />
              </Field>
            </div>
          </Section>

          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-gradient-to-t from-[#0A0E14] via-[#0A0E14]/95 to-transparent pt-4 pb-2">
            <Link href={userId ? `/profile/${encodeURIComponent(userId)}` : "/"}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-amber-400">{title}</h2>
        {subtitle && (
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1 font-mono">{error}</p>}
    </div>
  );
}
