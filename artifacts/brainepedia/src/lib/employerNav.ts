import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  BarChart3,
  CreditCard,
  Gem,
  Settings,
  Search,
  Bookmark,
  BriefcaseBusiness,
  FilePlus2,
  GraduationCap,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/DashboardShell";

export const EMPLOYER_NAV: NavItem[] = [
  { href: "/employer/overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/candidates", label: "Candidate Explorer", icon: Search, section: "Recruitment", tooltip: "Discover proven talent by profession, XP, VX, rank, and portfolio evidence." },
  { href: "/employer/saved-candidates", label: "Saved Candidates", icon: Bookmark, tooltip: "Your shortlist of candidates saved for follow-up and dossier review." },
  { href: "/employer/jobs/create", label: "Create Job", icon: FilePlus2, section: "Jobs", tooltip: "Publish roles and optionally link a problem-node assessment." },
  { href: "/employer/jobs", label: "My Job Postings", icon: BriefcaseBusiness, tooltip: "Preview, edit, activate, deactivate, and review applicants for your jobs." },
  { href: "/employer/challenges", label: "Team Challenges", icon: GraduationCap, section: "Assessments", tooltip: "Private corporate challenges for team training and workforce development." },
  { href: "/employer/assessments", label: "Candidate Assessments", icon: UserCheck, tooltip: "Assessments assigned to candidates or team members to validate practical skills." },
  { href: "/employer/team", label: "Team Members", icon: Users, section: "Teams", tooltip: "Provision employees and manage Grandmaster team access." },
  { href: "/employer/analytics", label: "Team Analytics", icon: BarChart3, tooltip: "Corporate talent analytics across team participation and performance." },
  { href: "/employer/company-profile", label: "Company Profile", icon: Building2, section: "Organization" },
  { href: "/employer/subscription", label: "Subscription", icon: Gem, tooltip: "Grandmaster Corporate Plan for candidate discovery, jobs, assessments, and analytics." },
  { href: "/employer/billing", label: "Billing", icon: CreditCard },
  { href: "/employer/settings", label: "Settings", icon: Settings, section: "Account" },
];
