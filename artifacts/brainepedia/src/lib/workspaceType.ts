/**
 * Centralized workspace classification for profession-agnostic mission workspaces.
 * Uses mission/profession metadata available on the frontend — no backend changes.
 */

export enum WorkspaceType {
  Developer = "developer",
  Writing = "writing",
  Design = "design",
  Data = "data",
  Business = "business",
  Marketing = "marketing",
  Education = "education",
  ProjectManagement = "project_management",
  Generic = "generic",
}

export type WorkspaceContext = {
  professionName?: string;
  districtName?: string;
  missionTitle?: string;
  missionBrief?: string;
  context?: string;
  constraints?: string[];
  expectedOutcomes?: string[];
};

const DEV_KEYWORDS = [
  "developer", "engineer", "devops", "software", "backend", "frontend",
  "fullstack", "full-stack", "mobile", "cloud", "cyber", "security analyst",
  "network", "machine learning", "data scientist", "computer",
];

const WRITING_KEYWORDS = [
  "writer", "journalist", "editor", "copywriter", "content", "documentation",
  "lawyer", "legal", "accountant", "chartered", "analyst report",
];

const DESIGN_KEYWORDS = ["designer", "graphic", "ui", "ux", "creative", "architect"];

const DATA_KEYWORDS = ["data", "analytics", "biochemistry", "scientist", "research", "geologist"];

const MARKETING_KEYWORDS = ["marketing", "sales", "business development", "brand", "campaign"];

const EDUCATION_KEYWORDS = ["teacher", "education", "nurse", "medical", "doctor", "registered nurse"];

const BUSINESS_KEYWORDS = [
  "business", "hr", "human resources", "operations", "finance", "financial",
  "project manager", "product manager", "customer service", "consult",
];

function haystack(ctx: WorkspaceContext): string {
  return [
    ctx.professionName,
    ctx.districtName,
    ctx.missionTitle,
    ctx.missionBrief,
    ctx.context,
    ...(ctx.constraints ?? []),
    ...(ctx.expectedOutcomes ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matches(hay: string, keywords: string[]) {
  return keywords.some((k) => hay.includes(k));
}

function looksLikeCodeMission(hay: string): boolean {
  return /\b(api|code|implement|debug|refactor|sql|javascript|typescript|python|repository|github|endpoint|function|class|script|deploy|token|auth)\b/.test(
    hay,
  );
}

function looksLikeWritingMission(hay: string): boolean {
  return /\b(report|proposal|document|write|essay|brief|memo|lesson plan|policy|recommendation|analysis report|communication)\b/.test(
    hay,
  );
}

export function resolveWorkspaceType(ctx: WorkspaceContext): WorkspaceType {
  const hay = haystack(ctx);

  if (matches(hay, DEV_KEYWORDS) || looksLikeCodeMission(hay)) {
    return WorkspaceType.Developer;
  }
  if (matches(hay, DESIGN_KEYWORDS)) return WorkspaceType.Design;
  if (matches(hay, DATA_KEYWORDS)) return WorkspaceType.Data;
  if (matches(hay, MARKETING_KEYWORDS)) return WorkspaceType.Marketing;
  if (matches(hay, EDUCATION_KEYWORDS)) return WorkspaceType.Education;
  if (matches(hay, WRITING_KEYWORDS) || looksLikeWritingMission(hay)) return WorkspaceType.Writing;
  if (matches(hay, BUSINESS_KEYWORDS)) return WorkspaceType.Business;
  if (/\b(project|timeline|milestone|stakeholder|roadmap|wbs)\b/.test(hay)) {
    return WorkspaceType.ProjectManagement;
  }
  return WorkspaceType.Generic;
}

export const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "csharp", label: "C#" },
  { value: "java", label: "Java" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain Text" },
] as const;
