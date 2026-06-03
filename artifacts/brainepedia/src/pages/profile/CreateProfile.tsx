import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Camera, Loader2, Save, User as UserIcon, Sparkles } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getUserRole, getUserId } from "@/lib/auth";
import { USER_NAV } from "@/lib/userNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { ADMIN_NAV } from "@/lib/adminNav";

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

export default function CreateProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();
  const role = getUserRole();
  const nav = role === "Employer" ? EMPLOYER_NAV : role === "GlobalAdmin" ? ADMIN_NAV : USER_NAV;
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      surName: "",
      middleName: "",
      nickName: "",
      aboutMe: "",
      currentTitle: "",
      profession: "",
      address: "",
      phoneNumber: "",
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
  };

  const onSubmit = async (vals: FormVals) => {
    if (!userId) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("UserId", userId);
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

    const res = await api.profiles.create(fd);
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Profile created!", description: "Welcome to Brainepedia." });
      const dest =
        role === "GlobalAdmin" ? "/admin/dashboard"
        : role === "Employer" ? "/employer/dashboard"
        : "/user/dashboard";
      navigate(dest);
    } else {
      toast({
        title: "Creation failed",
        description: res.error || "Could not create your profile.",
        variant: "destructive",
      });
    }
  };

  const theme: "user" | "admin" | "employer" =
    role === "GlobalAdmin" ? "admin" : role === "Employer" ? "employer" : "user";

  return (
    <DashboardShell
      nav={nav}
      title="Create Your Profile"
      subtitle="// operative.initialize"
      theme={theme}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-gradient-to-r from-[#7C3AED]/20 to-[#0d1119] border border-[#7C3AED]/30 rounded-xl p-5"
        >
          <Sparkles className="h-8 w-8 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-base font-bold text-white">Initialize your operative profile</p>
            <p className="text-sm text-gray-400">
              Complete your profile to appear on the Imperial Grid and start earning XP.
            </p>
          </div>
        </motion.div>

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
              aria-label="Upload avatar"
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
              Upload a square image (PNG/JPG, up to 5 MB). This appears on your public dossier.
            </p>
          </div>
        </motion.section>

        {/* Identity */}
        <Section title="Identity" subtitle="// who.you.are">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="First Name *" error={errors.firstName?.message}>
              <Input {...register("firstName")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Middle Name" error={errors.middleName?.message}>
              <Input {...register("middleName")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Surname *" error={errors.surName?.message}>
              <Input {...register("surName")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Nickname" error={errors.nickName?.message}>
              <Input placeholder="How you want to be known" {...register("nickName")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Current Title" error={errors.currentTitle?.message}>
              <Input placeholder="Senior Engineer" {...register("currentTitle")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Profession" error={errors.profession?.message}>
              <Input placeholder="Software Engineering" {...register("profession")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact" subtitle="// reach.me">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone Number" error={errors.phoneNumber?.message}>
              <Input type="tel" placeholder="+1 234 567 8900" {...register("phoneNumber")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Address" error={errors.address?.message}>
              <Input placeholder="Street address" {...register("address")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Country" error={errors.country?.message}>
              <Input placeholder="e.g. Nigeria" {...register("country")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="State / Province" error={errors.state?.message}>
              <Input placeholder="e.g. Lagos" {...register("state")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <Input placeholder="e.g. Ikeja" {...register("city")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
          </div>
        </Section>

        {/* Personal */}
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
              <Input type="date" {...register("dateOfBirth")} className="bg-[#0A0E14] border-white/10 text-white" />
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
              className="bg-[#0A0E14] border-white/10 text-white resize-none"
            />
          </Field>
        </Section>

        {/* Socials */}
        <Section title="External Channels" subtitle="// links.outbound">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="GitHub" error={errors.github?.message}>
              <Input placeholder="https://github.com/you" {...register("github")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="LinkedIn" error={errors.linkedIn?.message}>
              <Input placeholder="https://linkedin.com/in/you" {...register("linkedIn")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Twitter / X" error={errors.twitter?.message}>
              <Input placeholder="https://x.com/you" {...register("twitter")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Instagram" error={errors.instagram?.message}>
              <Input placeholder="https://instagram.com/you" {...register("instagram")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="Facebook" error={errors.facebook?.message}>
              <Input placeholder="https://facebook.com/you" {...register("facebook")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
            <Field label="YouTube" error={errors.youtube?.message}>
              <Input placeholder="https://youtube.com/@you" {...register("youtube")} className="bg-[#0A0E14] border-white/10 text-white" />
            </Field>
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-gradient-to-t from-[#0A0E14] via-[#0A0E14]/95 to-transparent pt-4 pb-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)] px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Create Profile
              </>
            )}
          </Button>
        </div>
      </form>
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
