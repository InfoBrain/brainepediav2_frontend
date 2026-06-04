import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  Database,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/DashboardShell";

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Global platform metrics, user growth, XP, and system activity." },
  { href: "/admin/users", label: "Users", icon: Users, tooltip: "User accounts, profiles, activity logs, and public dossiers." },
  { href: "/admin/employers", label: "Employers", icon: Building2, tooltip: "Employer organizations using recruitment, jobs, and team workflows." },
  { href: "/admin/professions", label: "Professions", icon: BookOpen, tooltip: "Career tracks that group districts, missions, and proof pathways." },
  { href: "/admin/districts", label: "Districts", icon: MapPin, tooltip: "Skill areas inside a profession where users complete mission progress." },
  { href: "/admin/problem-nodes", label: "Problem Nodes", icon: Database, tooltip: "Real-world assessment missions users solve to earn XP and VX." },
  { href: "/admin/forum", label: "Forum Management", icon: MessageSquare, tooltip: "Community categories and discussions across the platform." },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, tooltip: "Platform usage, growth, and talent signal reporting." },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, tooltip: "Initiate, Architect, Grandmaster, and employer subscription oversight." },
  { href: "/admin/settings", label: "Settings", icon: Settings, tooltip: "Administrative configuration and operational controls." },
];
