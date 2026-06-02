import {
  LayoutDashboard,
  Building2,
  Users,
  Lock,
  UserCheck,
  BarChart3,
  CreditCard,
  Gem,
  Settings,
  Search,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/DashboardShell";

export const EMPLOYER_NAV: NavItem[] = [
  { href: "/employer/overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/company-profile", label: "Company Profile", icon: Building2 },
  { href: "/employer/portal", label: "Talent Search", icon: Search, section: "Talent" },
  { href: "/employer/team", label: "Team Members", icon: Users },
  { href: "/employer/challenges", label: "Private Challenges", icon: Lock },
  { href: "/employer/assessments", label: "Candidate Assessments", icon: UserCheck },
  { href: "/employer/analytics", label: "Team Analytics", icon: BarChart3, section: "Insights" },
  { href: "/employer/billing", label: "Billing & Seats", icon: CreditCard },
  { href: "/employer/subscription", label: "Subscription", icon: Gem },
  { href: "/employer/settings", label: "Settings", icon: Settings, section: "Account" },
];
