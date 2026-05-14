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
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { api } from "@/lib/api";
import { getUserRole, getUserId, getProfileId, getUser } from "@/lib/auth";

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
  const authProfileId = getProfileId();
  const authUser = getUser();
  const role = getUserRole();

  const [loading, setLoading] = useState(true);
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

  const { mutate: updateProfile, isSubmitting } = useUpdateProfile({
    onSuccess: (_data, imageUrl) => {
      toast({
        title: "Profile updated successfully",
        description: "Your dossier has been saved and reflected across the empire.",
      });
      if (imageUrl) {
        console.log("[EditProfile] Avatar URL from API response:", imageUrl);
        setImagePreview(imageUrl);
      }
      if (userId) {
        const currentVals = (document.querySelector("form") as HTMLFormElement | null)?.elements;
        const firstName = (currentVals?.namedItem("firstName") as HTMLInputElement | null)?.value || "";
        const surName = (currentVals?.namedItem("surName") as HTMLInputElement | null)?.value || "";
        api.activityLogs.create({
          userId,
          activity: "Updated operative dossier",
          performedBy: firstName ? `${firstName} ${surName}`.trim() : undefined,
        });
      }
    },
    onError: (err) => {
      toast({
        title: "Update failed",
        description: err || "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!userId) {
      navigate("/auth/login");
      return;
    }
    const userEmail = authUser?.email || "";
    let cancelled = false;

    (async () => {
      setLoading(true);
      let d: any = null;

      const fetchId = authProfileId || userId;
      console.log("[EditProfile] Fetching profile for id:", fetchId);

      const res = await api.profiles.get(fetchId);
      console.log("[EditProfile] GET /api/Profiles response:", { ok: res.ok, data: res.data });

      if (!cancelled && res.ok && res.data && typeof res.data === "object") {
        d = res.data;
      }

      if (!d) {
        console.log("[EditProfile] Direct fetch failed — falling back to search");
        const all = await api.profiles.search({});
        if (!cancelled && all.ok && Array.isArray(all.data)) {
          d = all.data.find((x: any) =>
            (userEmail && x.email?.toLowerCase() === userEmail.toLowerCase()) ||
            x.userId === userId ||
            x.profileId === fetchId
          ) || null;
          console.log("[EditProfile] Search fallback result:", d);
        }
      }

      if (!cancelled) {
        if (d) {
          const resolvedProfileId = d.profileId || d.id || null;
          console.log("[EditProfile] Resolved profileId:", resolvedProfileId);
          setProfileId(resolvedProfileId);

          const dob = d.dateOfBirth ? String(d.dateOfBirth).slice(0, 10) : "";
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
            dateOfBirth: dob,
            facebook: d.facebook || "",
            linkedIn: d.linkedIn || d.linkedin || "",
            github: d.github || "",
            twitter: d.twitter || "",
            instagram: d.instagram || "",
            youtube: d.youtube || "",
          });

          const avatarSrc = d.imageUrl || d.avatarUrl || d.profileImage || null;
          console.log("[EditProfile] Avatar URL from profile:", avatarSrc);
          setImagePreview(avatarSrc);
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
    setImagePreview(URL.createObjectURL(f));
    console.log("[EditProfile] Image selected:", f.name, `(${(f.size / 1024).toFixed(1)} KB)`);
  };

  const onSubmit = async (vals: FormVals) => {
    if (!userId) return;

    const resolvedProfileId = profileId || authProfileId || userId || "";
    console.log("[EditProfile] Submitting with profileId:", resolvedProfileId, "userId:", userId);

    await updateProfile(resolvedProfileId, userId, {
      firstName: vals.firstName,
      surName: vals.surName,
      middleName: vals.middleName || "",
      nickName: vals.nickName || "",
      aboutMe: vals.aboutMe || "",
      currentTitle: vals.currentTitle || "",
      profession: vals.profession || "",
      address: vals.address || "",
      phoneNumber: vals.phoneNumber || "",
      country: vals.country || "",
      state: vals.state || "",
      city: vals.city || "",
      gender: vals.gender || "",
      dateOfBirth: vals.dateOfBirth || "",
      facebook: vals.facebook || "",
      linkedIn: vals.linkedIn || "",
      github: vals.github || "",
      twitter: vals.twitter || "",
      instagram: vals.instagram || "",
      youtube: vals.youtube || "",
      imageFile: imageFile ?? null,
    });
  };

  const viewProfileHref = (authProfileId || profileId || userId)
    ? `/profile/${encodeURIComponent(authProfileId || profileId || userId || "")}`
    : "/";

  const headerRight = (
    <Link
      href={viewProfileHref}
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-400/40 bg-amber-400/10 text-xs font-mono uppercase tracking-wider text-amber-400 hover:bg-amber-400/20 transition"
    >
      <Eye className="h-3.5 w-3.5" /> View Public
    </Link>
  );

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-4xl pb-24 md:pb-0">
          <Link
            href={viewProfileHref}
            className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-amber-400"
          >
            <ArrowLeft className="h-3 w-3" /> Back to public profile
          </Link>

          {/* Avatar uploader */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d1119] border border-white/5 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5"
          >
            <div className="relative shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Avatar"
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_18px_rgba(255,215,0,0.4)]"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center text-4xl font-bold text-white border-2 border-amber-400/60">
                  {(authUser?.firstName || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center shadow-lg transition-colors"
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
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold mb-1">Operative Portrait</h3>
              <p className="text-sm text-muted-foreground">
                Upload a square image (PNG/JPG, up to 5 MB). Appears on your public dossier and across the empire.
              </p>
              {imageFile && (
                <p className="text-xs font-mono text-amber-400 mt-2">
                  ✓ {imageFile.name} selected
                </p>
              )}
            </div>
          </motion.section>

          {/* Identity */}
          <Section title="Identity" subtitle="// who.you.are">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="First Name *" error={errors.firstName?.message}>
                <Input {...register("firstName")} placeholder="Jane" />
              </Field>
              <Field label="Middle Name" error={errors.middleName?.message}>
                <Input {...register("middleName")} placeholder="(optional)" />
              </Field>
              <Field label="Surname *" error={errors.surName?.message}>
                <Input {...register("surName")} placeholder="Doe" />
              </Field>
              <Field label="Nickname" error={errors.nickName?.message}>
                <Input {...register("nickName")} placeholder="How you want to be known" />
              </Field>
              <Field label="Current Title" error={errors.currentTitle?.message}>
                <Input {...register("currentTitle")} placeholder="Senior Engineer" />
              </Field>
              <Field label="Profession" error={errors.profession?.message}>
                <Input {...register("profession")} placeholder="Software Engineering" />
              </Field>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact" subtitle="// reach.me">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone Number" error={errors.phoneNumber?.message}>
                <Input type="tel" {...register("phoneNumber")} placeholder="+1 234 567 8900" />
              </Field>
              <Field label="Address" error={errors.address?.message}>
                <Input {...register("address")} placeholder="Street address" />
              </Field>
              <Field label="Country" error={errors.country?.message}>
                <Input {...register("country")} placeholder="e.g. Nigeria" />
              </Field>
              <Field label="State / Province" error={errors.state?.message}>
                <Input {...register("state")} placeholder="e.g. Lagos" />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input {...register("city")} placeholder="e.g. Ikeja" />
              </Field>
            </div>
          </Section>

          {/* Personal Details */}
          <Section title="Personal Details" subtitle="// identity.markers">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Gender" error={errors.gender?.message}>
                <select
                  {...register("gender")}
                  className="w-full bg-[#0A0E14] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-400/40 transition-colors"
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
                {...register("aboutMe")}
                placeholder="A brief manifesto of your work, your craft, your conquests…"
              />
            </Field>
          </Section>

          {/* Socials */}
          <Section title="External Channels" subtitle="// links.outbound">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="GitHub" error={errors.github?.message}>
                <Input {...register("github")} placeholder="https://github.com/you" />
              </Field>
              <Field label="LinkedIn" error={errors.linkedIn?.message}>
                <Input {...register("linkedIn")} placeholder="https://linkedin.com/in/you" />
              </Field>
              <Field label="Twitter / X" error={errors.twitter?.message}>
                <Input {...register("twitter")} placeholder="https://x.com/you" />
              </Field>
              <Field label="Instagram" error={errors.instagram?.message}>
                <Input {...register("instagram")} placeholder="https://instagram.com/you" />
              </Field>
              <Field label="Facebook" error={errors.facebook?.message}>
                <Input {...register("facebook")} placeholder="https://facebook.com/you" />
              </Field>
              <Field label="YouTube" error={errors.youtube?.message}>
                <Input {...register("youtube")} placeholder="https://youtube.com/@you" />
              </Field>
            </div>
          </Section>

          {/* Sticky save bar */}
          <div className="fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto z-30 flex items-center justify-end gap-3 bg-[#0A0E14]/95 backdrop-blur md:bg-transparent md:backdrop-blur-none border-t border-white/5 md:border-0 px-4 py-3 md:px-0 md:py-0 md:pt-2">
            <Link href={viewProfileHref} className="md:hidden">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Link href={viewProfileHref} className="hidden md:inline-flex">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Changes…
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
    <section className="bg-[#0d1119] border border-white/5 rounded-xl p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-bold text-amber-400">{title}</h2>
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
