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
import { getUserRole, getUserId, getUser } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/profile/edit", label: "Edit Profile", icon: UserIcon },
];

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  surName: z.string().min(1, "Surname is required").max(80),
  middleName: z.string().max(80).optional().or(z.literal("")),
  nickName: z.string().max(80).optional().or(z.literal("")),
  aboutMe: z.string().max(1000).optional().or(z.literal("")),
  currentTitle: z.string().max(120).optional().or(z.literal("")),
  profession: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  phoneNumber: z.string().max(30).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  gender: z.string().max(20).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  linkedIn: z.string().max(200).optional().or(z.literal("")),
  github: z.string().max(200).optional().or(z.literal("")),
  twitter: z.string().max(200).optional().or(z.literal("")),
  instagram: z.string().max(200).optional().or(z.literal("")),
  youtube: z.string().max(200).optional().or(z.literal("")),
});
type FormVals = z.infer<typeof schema>;

export default function EditProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();
  const authUser = getUser();
  const role = getUserRole();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: authUser?.firstName || "",
      surName: authUser?.lastName || authUser?.surName || "",
      middleName: "",
      nickName: "",
      aboutMe: "",
      currentTitle: "",
      profession: "",
      address: "",
      phoneNumber: authUser?.phoneNumber || "",
      country: "",
      state: "",
      city: "",
      gender: "",
      dateOfBirth: "",
      facebook: "",
      linkedIn: "",
      github: "",
      twitter: "",
      instagram: "",
      youtube: "",
    },
  });

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    const userEmail = authUser?.email || "";
    let cancelled = false;
    (async () => {
      setLoading(true);
      let d: any = null;

      // Primary: try GET /api/Profiles/{userId} (may 404 if API uses profileId)
      const res = await api.profiles.get(userId);
      if (!cancelled && res.ok && res.data && typeof res.data === "object") {
        d = res.data;
      }

      // Fallback: fetch all profiles and match by email (userId field is null in API)
      if (!d) {
        const all = await api.profiles.search({});
        if (!cancelled && all.ok && Array.isArray(all.data)) {
          d = all.data.find((x: any) =>
            (userEmail && x.email?.toLowerCase() === userEmail.toLowerCase()) ||
            x.userId === userId
          ) || null;
        }
      }

      if (!cancelled) {
        if (d) {
          // Store profileId so onSubmit can use the correct PUT /api/Profiles/{profileId}
          setProfileId(d.profileId || d.id || null);
          reset({
            firstName: d.firstName || authUser?.firstName || "",
            surName: d.surName || d.surname || d.lastName || authUser?.lastName || authUser?.surName || "",
            middleName: d.middleName || "",
            nickName: d.nickName || d.nickname || "",
            aboutMe: d.aboutMe || d.bio || "",
            currentTitle: d.currentTitle || d.title || "",
            profession: d.profession || "",
            address: d.address || "",
            phoneNumber: d.phoneNumber || d.phone || authUser?.phoneNumber || "",
            country: d.country || "",
            state: d.state || "",
            city: d.city || "",
            gender: d.gender || "",
            dateOfBirth: d.dateOfBirth ? String(d.dateOfBirth).slice(0, 10) : "",
            facebook: d.facebook || "",
            linkedIn: d.linkedIn || d.linkedin || "",
            github: d.github || "",
            twitter: d.twitter || "",
            instagram: d.instagram || "",
            youtube: d.youtube || "",
          });
          setImagePreview(d.imageUrl || d.avatarUrl || d.profileImage || null);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, navigate, reset, authUser?.email]);

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
    // Use profileId (from the profile record) for PUT; fall back to userId if not yet loaded
    const targetId = profileId || userId;
    if (!targetId) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("FirstName", vals.firstName);
    fd.append("SurName", vals.surName);
    if (vals.middleName) fd.append("MiddleName", vals.middleName);
    if (vals.nickName) fd.append("NickName", vals.nickName);
    if (vals.aboutMe) fd.append("AboutMe", vals.aboutMe);
    if (vals.currentTitle) fd.append("CurrentTitle", vals.currentTitle);
    if (vals.profession) fd.append("Profession", vals.profession);
    if (vals.address) fd.append("Address", vals.address);
    if (vals.phoneNumber) fd.append("PhoneNumber", vals.phoneNumber);
    if (vals.country) fd.append("Country", vals.country);
    if (vals.state) fd.append("State", vals.state);
    if (vals.city) fd.append("City", vals.city);
    if (vals.gender) fd.append("Gender", vals.gender);
    if (vals.dateOfBirth) fd.append("DateOfBirth", vals.dateOfBirth);
    if (vals.facebook) fd.append("Facebook", vals.facebook);
    if (vals.linkedIn) fd.append("LinkedIn", vals.linkedIn);
    if (vals.github) fd.append("Github", vals.github);
    if (vals.twitter) fd.append("Twitter", vals.twitter);
    if (vals.instagram) fd.append("Instagram", vals.instagram);
    if (vals.youtube) fd.append("Youtube", vals.youtube);
    if (imageFile) fd.append("ImageFile", imageFile);

    const res = await api.profiles.update(targetId, fd);
    setSubmitting(false);
    if (res.ok) {
      toast({
        title: "Profile updated",
        description: "Your dossier has been refined.",
      });
      if (userId) {
        api.activityLogs.create({
          userId,
          activity: "Updated operative dossier",
          performedBy: vals.firstName ? `${vals.firstName} ${vals.surName}`.trim() : undefined,
        });
      }
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
              <Field label="Nickname" error={errors.nickName?.message}>
                <Input placeholder="How you want to be known" {...register("nickName")} />
              </Field>
              <Field label="Current Title" error={errors.currentTitle?.message}>
                <Input placeholder="Senior Engineer" {...register("currentTitle")} />
              </Field>
              <Field label="Profession" error={errors.profession?.message}>
                <Input placeholder="Software Engineering" {...register("profession")} />
              </Field>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact" subtitle="// reach.me">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone Number" error={errors.phoneNumber?.message}>
                <Input type="tel" placeholder="+1 234 567 8900" {...register("phoneNumber")} />
              </Field>
              <Field label="Address" error={errors.address?.message}>
                <Input placeholder="Street address" {...register("address")} />
              </Field>
              <Field label="Country" error={errors.country?.message}>
                <Input placeholder="e.g. Nigeria" {...register("country")} />
              </Field>
              <Field label="State / Province" error={errors.state?.message}>
                <Input placeholder="e.g. Lagos" {...register("state")} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input placeholder="e.g. Ikeja" {...register("city")} />
              </Field>
            </div>
          </Section>

          {/* Personal Details */}
          <Section title="Personal Details" subtitle="// identity.markers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Gender" error={errors.gender?.message}>
                <select
                  {...register("gender")}
                  className="w-full bg-[#0A0E14] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                <Input type="date" {...register("dateOfBirth")} />
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
              <Field label="Instagram" error={errors.instagram?.message}>
                <Input placeholder="https://instagram.com/you" {...register("instagram")} />
              </Field>
              <Field label="Facebook" error={errors.facebook?.message}>
                <Input placeholder="https://facebook.com/you" {...register("facebook")} />
              </Field>
              <Field label="YouTube" error={errors.youtube?.message}>
                <Input placeholder="https://youtube.com/@you" {...register("youtube")} />
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
