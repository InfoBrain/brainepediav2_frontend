import { Crown, Shield, Zap } from "lucide-react";

export type SubscriptionPlan = {
  key: "Initiate" | "Architect" | "Grandmaster";
  numericTier: 0 | 1 | 2;
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
      "Grandmaster elite status visuals",
    ],
  },
  {
    key: "Grandmaster",
    numericTier: 2,
    price: "$49.99",
    priceNote: "per month",
    shortPrice: "$49.99",
    period: "/mo",
    tagline: "Elite member status",
    description: "For users who want the strongest evaluation and growth signals.",
    icon: Crown,
    accent: "gold",
    features: [
      "Unlimited missions, districts, and challenges",
      "GPT-4o evaluations",
      "Unlimited Brainiac guidance",
      "Priority AI evaluation",
      "Elite leaderboard badge",
      "Elite member badge",
      "Legendary status visuals",
      "Experience elevator and premium certification tracks",
    ],
  },
];

export const EMPLOYER_GRANDMASTER_FEATURES = [
  "Candidate discovery by profession, XP, VX, rank, and portfolio evidence",
  "Unlimited job listings",
  "Job preview, editing, activation, and deactivation workflows",
  "Applicant pipeline and job application status management",
  "Candidate assessments linked to problem nodes",
  "Assessment result review for completed candidate missions",
  "Saved candidate shortlists with notes",
  "Team member provisioning and seat management",
  "Private corporate challenges for teams",
  "Corporate talent and team analytics",
  "Grandmaster employer subscription and Paystack upgrade flow",
];

export const PLAN_COMPARISON_FEATURES = [
  { label: "Missions / challenges", initiate: "3 / month", architect: "Unlimited", grandmaster: "Unlimited" },
  { label: "District access", initiate: "Entry-level", architect: "All professional districts", grandmaster: "All districts" },
  { label: "AI evaluations", initiate: "Basic pass/fail", architect: "Advanced technical breakdown", grandmaster: "GPT-4o" },
  { label: "Brainiac hints", initiate: "Limited", architect: "Increased", grandmaster: "Unlimited" },
  { label: "XP growth", initiate: "Basic", architect: "Faster", grandmaster: "Priority + elite" },
  { label: "Project uploads", initiate: "50MB", architect: "2GB", grandmaster: "Premium allocation" },
  { label: "Badges / status", initiate: "Community leaderboard", architect: "Verified badges", grandmaster: "Elite + legendary visuals" },
];
