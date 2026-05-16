export type Status = "Draft" | "In Review" | "Approved" | "Scheduled" | "Published" | "Cancelled";
export type Platform = "Instagram" | "TikTok" | "LinkedIn" | "X (Twitter)" | "YouTube" | "Facebook" | "WhatsApp Channel";
export type ContentType = "Reel" | "Carousel" | "Static Post" | "Story" | "Tweet" | "Thread" | "Video" | "Blog" | "Poll" | "Announcement" | "Testimonial";
export type ContentPillar =
  | "Career Transformation" | "AI Learning" | "Experience Elevator"
  | "Student Success Stories" | "Productivity" | "Portfolio Building"
  | "Tech Skills" | "Gamification" | "Motivation" | "Tutorials"
  | "Community Engagement" | "Beta Launch" | "Testimonials";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface ContentEntry {
  id: string;
  date: string;
  day: string;
  campaignName: string;
  contentPillar: ContentPillar | string;
  platform: Platform | string;
  contentType: ContentType | string;
  topicHook: string;
  caption: string;
  cta: string;
  hashtags: string;
  mediaType: string;
  designerAssigned: string;
  status: Status;
  publishingTime: string;
  link: string;
  notes: string;
  priority: Priority;
}

export type ViewType = "dashboard" | "calendar" | "monthly" | "ai";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export const PLATFORMS: Platform[] = [
  "Instagram", "TikTok", "LinkedIn", "X (Twitter)", "YouTube", "Facebook", "WhatsApp Channel",
];

export const CONTENT_TYPES: ContentType[] = [
  "Reel", "Carousel", "Static Post", "Story", "Tweet", "Thread", "Video", "Blog", "Poll", "Announcement", "Testimonial",
];

export const CONTENT_PILLARS: ContentPillar[] = [
  "Career Transformation", "AI Learning", "Experience Elevator",
  "Student Success Stories", "Productivity", "Portfolio Building",
  "Tech Skills", "Gamification", "Motivation", "Tutorials",
  "Community Engagement", "Beta Launch", "Testimonials",
];

export const STATUSES: Status[] = [
  "Draft", "In Review", "Approved", "Scheduled", "Published", "Cancelled",
];

export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

export const MEDIA_TYPES = ["Graphic", "Video", "Animation", "Photo", "Illustration", "Screenshot", "UGC"];

export const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string }> = {
  Draft:      { bg: "rgba(100,116,139,0.2)",  text: "#94A3B8", border: "rgba(100,116,139,0.4)" },
  "In Review":{ bg: "rgba(245,158,11,0.15)",  text: "#FCD34D", border: "rgba(245,158,11,0.4)" },
  Approved:   { bg: "rgba(59,130,246,0.15)",  text: "#60A5FA", border: "rgba(59,130,246,0.4)" },
  Scheduled:  { bg: "rgba(139,92,246,0.15)",  text: "#A78BFA", border: "rgba(139,92,246,0.4)" },
  Published:  { bg: "rgba(16,185,129,0.15)",  text: "#34D399", border: "rgba(16,185,129,0.4)" },
  Cancelled:  { bg: "rgba(239,68,68,0.15)",   text: "#F87171", border: "rgba(239,68,68,0.4)" },
};

export const PLATFORM_COLORS: Record<string, string> = {
  Instagram:        "#E1306C",
  TikTok:           "#EE1D52",
  LinkedIn:         "#0A66C2",
  "X (Twitter)":    "#1DA1F2",
  YouTube:          "#FF0000",
  Facebook:         "#1877F2",
  "WhatsApp Channel":"#25D366",
};

export const PILLAR_COLORS: Record<string, string> = {
  "Career Transformation": "#3B82F6",
  "AI Learning":           "#8B5CF6",
  "Experience Elevator":   "#F59E0B",
  "Student Success Stories":"#10B981",
  "Productivity":           "#06B6D4",
  "Portfolio Building":     "#EC4899",
  "Tech Skills":            "#6366F1",
  "Gamification":           "#F97316",
  "Motivation":             "#EF4444",
  "Tutorials":              "#14B8A6",
  "Community Engagement":   "#84CC16",
  "Beta Launch":            "#A855F7",
  "Testimonials":           "#22D3EE",
};
