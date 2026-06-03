import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Loader2, Save, Globe, Phone, Mail, Image, AlignLeft, MapPin } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Invalid email").or(z.literal("")),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  aboutCompany: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CompanyProfile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [profileMeta, setProfileMeta] = useState<any>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.employers.myCompanyProfile().then((res) => {
      if (res.ok && res.data) {
        const d = res.data as any;
        setProfileMeta(d);
        reset({
          companyName: d.companyName ?? d.CompanyName ?? d.name ?? "",
          companyEmail: d.companyEmail ?? d.email ?? "",
          companyPhone: d.companyPhone ?? d.companyPhoneNumber ?? d.phoneNumber ?? "",
          companyAddress: d.companyAddress ?? d.address ?? "",
          websiteUrl: d.companyWebsite ?? d.websiteUrl ?? d.website ?? "",
          aboutCompany: d.aboutCompany ?? d.about ?? "",
        });
        if (d.companyLogoUrl) setLogoPreview(d.companyLogoUrl);
      }
      setLoading(false);
    });
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    const fd = new FormData();
    fd.append("CompanyName", data.companyName);
    fd.append("CompanyEmail", data.companyEmail || "");
    fd.append("CompanyPhone", data.companyPhone || "");
    fd.append("CompanyAddress", data.companyAddress || "");
    fd.append("WebsiteUrl", data.websiteUrl || "");
    fd.append("AboutCompany", data.aboutCompany || "");
    if (logoFile) fd.append("LogoFile", logoFile);
    const res = await api.employers.updateCompanyProfile(fd);
    if (res.ok) {
      toast({ title: "Profile updated", description: "Corporate details saved successfully." });
    } else {
      toast({ title: "Update failed", description: res.error, variant: "destructive" });
    }
  };

  return (
    <DashboardShell nav={EMPLOYER_NAV} title="Company Profile" subtitle="// employer.profile.settings" theme="employer">
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-mono text-sm">Loading profile…</span>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Logo preview */}
          <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6 flex items-center gap-5">
            {logoPreview ? (
              <img src={logoPreview} alt="Company logo" className="h-20 w-20 rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#00D2FF]/20 to-[#7C3AED]/10 flex items-center justify-center border border-white/10">
                <Building2 className="h-8 w-8 text-[#00D2FF]/60" />
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{watch("companyName") || "Company Name"}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{watch("websiteUrl") || "—"}</p>
              {profileMeta?.subscriptionLevel && (
                <p className="mt-1 text-xs text-[#00D2FF]">Plan: {profileMeta.subscriptionLevel}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0d1119] border border-white/5 rounded-xl p-6 space-y-5">
            <h3 className="text-base font-bold mb-1">Corporate Details</h3>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Company Name</Label>
              <Input {...register("companyName")} placeholder="Acme Corp" />
              {errors.companyName && <p className="text-destructive text-xs font-mono">{errors.companyName.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Company Email</Label>
                <Input {...register("companyEmail")} type="email" placeholder="info@company.com" />
                {errors.companyEmail && <p className="text-destructive text-xs font-mono">{errors.companyEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone Number</Label>
                <Input {...register("companyPhone")} type="tel" placeholder="+1234567890" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Company Address</Label>
              <Input {...register("companyAddress")} placeholder="Company address" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" />Company Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setLogoFile(file);
                  if (file) setLogoPreview(URL.createObjectURL(file));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Website URL</Label>
              <Input {...register("websiteUrl")} placeholder="https://yourcompany.com" />
              {errors.websiteUrl && <p className="text-destructive text-xs font-mono">{errors.websiteUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><AlignLeft className="h-3.5 w-3.5" />About Company</Label>
              <Textarea {...register("aboutCompany")} rows={4} placeholder="Describe your company, culture, and what you look for in candidates…" />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)]"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
