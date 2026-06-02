import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Building2, Loader2, ArrowLeft, Globe, Phone, Mail, Users, Calendar, ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/adminNav";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type EmployerDetails = {
  id: string;
  companyName: string;
  companyLogoUrl?: string;
  websiteUrl?: string;
  email: string;
  phoneNumber?: string;
  aboutCompany?: string;
  dateRegistered?: string;
  planType?: string;
  teamMembers?: number;
  activeJobs?: number;
  ownerName?: string;
  ownerEmail?: string;
  jobs?: { title: string; postedAt: string; status: string }[];
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export default function AdminEmployerDetails() {
  const params = useParams<{ employerId: string }>();
  const [, setLocation] = useLocation();
  const [details, setDetails] = useState<EmployerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.employerId) return;
    api.employers.admin.employerDetails(params.employerId).then((res) => {
      if (res.ok) setDetails(normDetails(res.data));
      else setError(res.error || "Failed to load employer details.");
      setLoading(false);
    });
  }, [params.employerId]);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Employer Details" subtitle="// admin.employer.profile" theme="admin">
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/employers")} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employers
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm">Loading employer…</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-destructive font-mono border border-destructive/20 rounded-lg">
            {error}
          </div>
        ) : details ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Company Profile */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6 flex items-center gap-5">
                {details.companyLogoUrl ? (
                  <img src={details.companyLogoUrl} alt={details.companyName}
                    className="h-20 w-20 rounded-xl object-cover border border-white/10 shrink-0" />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-[#00D2FF]/10 flex items-center justify-center border border-[#00D2FF]/20 shrink-0">
                    <Building2 className="h-8 w-8 text-[#00D2FF]" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{details.companyName}</h2>
                  {details.planType && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#9D4EDD]/10 text-[#9D4EDD] border border-[#9D4EDD]/20">
                      {details.planType}
                    </span>
                  )}
                  {details.websiteUrl && (
                    <a href={details.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 text-xs text-[#00D2FF] hover:underline flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {details.websiteUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-muted-foreground font-mono uppercase tracking-wider mb-3">Contact Information</h3>
                <DetailRow icon={Mail} label="Email" value={details.email} />
                <DetailRow icon={Phone} label="Phone" value={details.phoneNumber} />
                <DetailRow icon={Globe} label="Website" value={details.websiteUrl} />
                <DetailRow icon={Calendar} label="Date Registered"
                  value={details.dateRegistered ? new Date(details.dateRegistered).toLocaleDateString("en-US", { dateStyle: "long" }) : undefined} />
              </div>

              {/* About */}
              {details.aboutCompany && (
                <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-muted-foreground font-mono uppercase tracking-wider mb-3">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{details.aboutCompany}</p>
                </div>
              )}

              {/* Job History */}
              {details.jobs && details.jobs.length > 0 && (
                <div className="bg-[#0d1119] border border-white/5 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-muted-foreground font-mono uppercase tracking-wider mb-3">Job History</h3>
                  <div className="space-y-2">
                    {details.jobs.map((job, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <p className="text-sm">{job.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full font-mono uppercase tracking-wider border ${
                            job.status.toLowerCase().includes("active")
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-white/5 text-muted-foreground border-white/10"
                          }`}>{job.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Stats */}
            <div className="space-y-4">
              <div className="bg-[#0d1119] border border-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground font-mono uppercase tracking-wider">Stats</h3>
                {[
                  { label: "Team Members", value: details.teamMembers ?? "—", color: "#00D2FF", icon: Users },
                  { label: "Active Jobs", value: details.activeJobs ?? "—", color: "#9D4EDD", icon: Building2 },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">{label}</p>
                      <p className="font-bold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Owner */}
              {(details.ownerName || details.ownerEmail) && (
                <div className="bg-[#0d1119] border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-muted-foreground font-mono uppercase tracking-wider mb-3">Account Owner</h3>
                  {details.ownerName && <p className="font-medium text-sm">{details.ownerName}</p>}
                  {details.ownerEmail && <p className="text-xs text-muted-foreground font-mono mt-0.5">{details.ownerEmail}</p>}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function normDetails(d: any): EmployerDetails {
  return {
    id: String(d?.id ?? d?.employerId ?? ""),
    companyName: d?.companyName ?? d?.name ?? "Unknown",
    companyLogoUrl: d?.companyLogoUrl ?? d?.logoUrl,
    websiteUrl: d?.websiteUrl ?? d?.website,
    email: d?.email ?? d?.companyEmail ?? d?.ownerEmail ?? "",
    phoneNumber: d?.phoneNumber ?? d?.companyPhoneNumber,
    aboutCompany: d?.aboutCompany ?? d?.about ?? d?.description,
    dateRegistered: d?.dateRegistered ?? d?.createdAt ?? d?.registrationDate,
    planType: d?.planType ?? d?.plan ?? d?.subscriptionTier,
    teamMembers: d?.teamMembers ?? d?.memberCount,
    activeJobs: d?.activeJobs ?? d?.jobCount,
    ownerName: d?.ownerName ?? d?.accountOwner ?? (d?.firstName && d?.lastName ? `${d.firstName} ${d.lastName}` : undefined),
    ownerEmail: d?.ownerEmail ?? d?.accountOwnerEmail,
    jobs: Array.isArray(d?.jobs) ? d.jobs.map((j: any) => ({
      title: j.title ?? j.name ?? "Job",
      postedAt: j.postedAt ?? j.createdAt ?? new Date().toISOString(),
      status: j.status ?? "Unknown",
    })) : [],
  };
}
