import {
  Award,
  BriefcaseBusiness,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Map,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  User as UserIcon,
  Zap,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/DashboardShell";

export const USER_NAV: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profession/select", label: "Prove Yourself", icon: Map, section: "My Journey", tooltip: "Challenge districts where you prove competence through real-world missions." },
  { href: "/user/missions", label: "Missions", icon: Sparkles, tooltip: "Assigned and completed problem-solving missions, XP earned, and success rate." },
  { href: "/user/xp-progress", label: "XP Progress", icon: Zap, section: "Growth", tooltip: "XP is your experience points ledger from completed challenges and assessments." },
  { href: "/user/vx-progress", label: "VX Progress", icon: Award, tooltip: "Verified Experience (VX) converts proven mission performance into career-ready evidence." },
  { href: "/user/badges", label: "Badges", icon: Trophy, tooltip: "Milestones and proof badges earned across missions, ranks, and districts." },
  { href: "/forum", label: "Forum", icon: MessageSquare, section: "Community", tooltip: "Join platform-wide conversations with learners, employers, and mentors." },
  { href: "/forum/discussions", label: "Discussions", icon: FileText, tooltip: "Browse and continue community discussion threads." },
  { href: "/jobs", label: "Job Feed", icon: BriefcaseBusiness, section: "Career", tooltip: "Opportunities that can use your XP, VX, badges, and assessments as proof." },
  { href: "/user/applications", label: "Applications", icon: FileText, tooltip: "Track job applications submitted with your verified experience profile." },
  { href: "/user/assessments", label: "Assessments", icon: ClipboardCheck, tooltip: "Employer-linked problem nodes you may complete to strengthen applications." },
  { href: "/user/portfolio", label: "Public Portfolio", icon: UserIcon, section: "Profile", tooltip: "Your shareable proof dossier with XP, VX, badges, missions, and rank signals." },
  { href: "/user/subscription", label: "Subscription", icon: CreditCard, tooltip: "Manage Initiate and Architect access tiers and payment status." },
  { href: "/user/settings", label: "Settings", icon: Settings, tooltip: "Update account security and personal dashboard preferences." },
];
