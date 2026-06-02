import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  Database,
  Sparkles,
  Users,
  UserCircle,
  Globe,
  Building2,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/DashboardShell";

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/professions", label: "Professions", icon: BookOpen },
  { href: "/admin/districts", label: "Districts", icon: MapPin },
  { href: "/admin/problem-nodes", label: "Problem Nodes", icon: Database },
  { href: "/admin/seed", label: "AI Seed Tool", icon: Sparkles },
  { href: "/admin/users", label: "All Users", icon: Users, section: "User Management" },
  { href: "/admin/user-profiles", label: "User Profiles", icon: UserCircle },
  { href: "/admin/public-dossiers", label: "Public Dossiers", icon: Globe },
  { href: "/admin/employers", label: "Employers", icon: Building2, section: "Employer Management" },
];
