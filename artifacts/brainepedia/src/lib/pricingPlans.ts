import { Crown, Shield, Zap } from "lucide-react";

export type SubscriptionPlan = {
  key: "Initiate" | "Architect";
  numericTier: 0 | 1;
  price: string;
  priceNote: string;
  shortPrice: string;
  period: string;
  tagline: string;
  description: string;
  features: string[];
  unavailableFeatures?: string[];
  icon: typeof Shield;
  accent: "slate" | "purple" | "gold";
  popular?: boolean;
};

export const USER_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: "Initiate",
    numericTier: 0,
    price: "Free",
    priceNote: "forever",
    shortPrice: "Free",
    period: "",
    tagline: "Begin your journey",
    description: "Explore the platform and start building proof.",
    icon: Shield,
    accent: "slate",
    features: [
      "Entry-level district access",
      "3 missions/challenges per month",
      "Basic pass/fail AI evaluation",
      "Limited Brainiac hints",
      "Basic XP progression",
      "Community leaderboard access",
      "50MB project upload allocation",
    ],
    unavailableFeatures: [
      "Unlimited missions",
      "Premium district access",
      "Advanced or GPT-4o evaluations",
    ],
  },
  {
    key: "Architect",
    numericTier: 1,
    price: "$19.99",
    priceNote: "per month",
    shortPrice: "$19.99",
    period: "/mo",
    tagline: "Unlock the city's full power",
    description: "For active builders who want deeper feedback and broader access.",
    icon: Zap,
    accent: "purple",
    popular: true,
    features: [
      "Full access to all professional districts",
      "Unlimited active missions/challenges",
      "Detailed technical breakdowns and optimization suggestions",
      "Increased Brainiac hints",
      "Faster XP growth",
      "Priority submission processing",
      "Leaderboard ranking",
      "2GB project asset upload allocation",
      "Verified badges for LinkedIn and public dossier",
    ],
    unavailableFeatures: [
      "GPT-4o evaluations",
      "Corporate-only Grandmaster team features",
    ],
  },
];

export const EMPLOYER_GRANDMASTER_FEATURES = [
  "Unlimited Job Listings",
  "Candidate Discovery",
  "Candidate Assessments",
  "Team Provisioning",
  "Team Challenge Assignments",
  "Private Corporate Challenges",
  "Team Performance Tracking",
  "Workforce Development",
  "Recruitment Pipeline Management",
  "Corporate Talent Analytics",
  "Seat-Based Workforce Growth",
  "Grandmaster Team Activation",
];

export const EMPLOYER_GRANDMASTER_PLAN = {
  key: "Grandmaster Corporate Plan",
  price: "Corporate",
  shortPrice: "Corporate",
  period: "",
  tagline: "Built for organizations",
  description: "Designed for organizations building and developing high-performing teams.",
  icon: Crown,
  accent: "gold" as const,
  features: EMPLOYER_GRANDMASTER_FEATURES,
};

export const PLAN_COMPARISON_FEATURES = [
  { label: "Missions / challenges", initiate: "3 / month", architect: "Unlimited" },
  { label: "District access", initiate: "Entry-level", architect: "All professional districts" },
  { label: "AI evaluations", initiate: "Basic pass/fail", architect: "Advanced technical breakdown" },
  { label: "Brainiac hints", initiate: "Limited", architect: "Increased" },
  { label: "XP growth", initiate: "Basic", architect: "Faster" },
  { label: "Project uploads", initiate: "50MB", architect: "2GB" },
  { label: "Badges / status", initiate: "Community leaderboard", architect: "Verified badges" },
];
