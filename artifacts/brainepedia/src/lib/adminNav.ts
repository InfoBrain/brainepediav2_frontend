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
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/employers", label: "Employers", icon: Building2 },
  { href: "/admin/professions", label: "Professions", icon: BookOpen },
  { href: "/admin/districts", label: "Districts", icon: MapPin },
  { href: "/admin/problem-nodes", label: "Problem Nodes", icon: Database },
  { href: "/forum", label: "Forum Management", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
