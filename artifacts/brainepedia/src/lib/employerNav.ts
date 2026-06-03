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
  { href: "/employer/candidates", label: "Candidate Explorer", icon: Search, section: "Recruitment" },
  { href: "/employer/saved-candidates", label: "Saved Candidates", icon: Bookmark },
  { href: "/employer/jobs/create", label: "Create Job", icon: FilePlus2, section: "Jobs" },
  { href: "/employer/jobs", label: "My Job Postings", icon: BriefcaseBusiness },
  { href: "/employer/challenges", label: "Team Challenges", icon: GraduationCap, section: "Assessments" },
  { href: "/employer/assessments", label: "Candidate Assessments", icon: UserCheck },
  { href: "/employer/team", label: "Team Members", icon: Users, section: "Teams" },
  { href: "/employer/analytics", label: "Team Analytics", icon: BarChart3 },
  { href: "/employer/company-profile", label: "Company Profile", icon: Building2, section: "Organization" },
  { href: "/employer/subscription", label: "Subscription", icon: Gem },
  { href: "/employer/billing", label: "Billing", icon: CreditCard },
  { href: "/employer/settings", label: "Settings", icon: Settings, section: "Account" },
];
