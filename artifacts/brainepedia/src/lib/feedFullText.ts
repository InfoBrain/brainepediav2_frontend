import { api } from "@/lib/api";
import { listActiveExternalJobs } from "@/lib/externalJobsService";
import { getFeedPost } from "@/lib/feedService";
import type { ExternalJobDto, FeedPostDto } from "@/lib/types/socialFeed";

const TEXT_KEYS = new Set([
  "content",
  "fullContent",
  "body",
  "description",
  "details",
  "jobDescription",
  "responsibilities",
  "keyResponsibilities",
  "requirements",
  "qualifications",
  "summary",
  "text",
  "html",
]);

export type FeedReaderContent = {
  body: string;
  meta: string[];
};

function plainLength(value: string): number {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length;
}

function longer(current: string, next: string): string {
  const candidate = next.trim();
  if (!candidate) return current;
  return plainLength(candidate) > plainLength(current) ? candidate : current;
}

function textOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function camelKey(key: string): string {
  return key.charAt(0).toLowerCase() + key.slice(1);
}

/** Walk a feed or job payload and keep every text field that could be the post body. */
function collectText(value: unknown, depth: number, found: string[]) {
  if (depth > 5 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, depth + 1, found));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === "string" && TEXT_KEYS.has(camelKey(key))) found.push(child);
    else if (child && typeof child === "object") collectText(child, depth + 1, found);
  }
}

function longestIn(value: unknown): string {
  const found: string[] = [];
  collectText(value, 0, found);
  return found.reduce((best, next) => longer(best, next), "");
}

function composeJobBody(job: Record<string, unknown>): string {
  const description = textOf(job.description ?? job.Description ?? job.details ?? job.Details ?? job.jobDescription ?? job.JobDescription ?? job.content ?? job.Content);
  const extras = [
    ["Key Responsibilities", textOf(job.responsibilities ?? job.Responsibilities) || textOf(job.keyResponsibilities ?? job.KeyResponsibilities)],
    ["Qualifications", textOf(job.requirements ?? job.Requirements) || textOf(job.qualifications ?? job.Qualifications)],
  ] as const;
  const missing = extras
    .filter(([, body]) => body && !description.includes(body))
    .map(([label, body]) => `${label}\n${body}`);
  return longer(longestIn(job), [description, ...missing].filter(Boolean).join("\n\n"));
}

function metaLine(label: string, value: unknown): string {
  const text = textOf(value);
  return text ? `${label}: ${text}` : "";
}

/** The public job list carries the full description. Lookup by id returns 401 and would clear the session. */
async function findPublicExternalJob(id: string, title: string | null): Promise<ExternalJobDto | null> {
  const search = title?.trim();
  if (!search) return null;
  for (let page = 1; page <= 3; page += 1) {
    const res = await listActiveExternalJobs({ search, pageNumber: page, pageSize: 20 });
    if (!res.ok || !res.data) return null;
    const match = res.data.items.find((job) => job.externalJobId === id);
    if (match) return match;
    if (page >= res.data.totalPages) return null;
  }
  return null;
}

/** Complete text for a feed post. List payloads are often a short preview. */
export async function loadFullFeedText(post: FeedPostDto): Promise<FeedReaderContent> {
  let body = post.content?.trim() || "";
  const meta: string[] = [];

  if (post.feedPostId) {
    const detail = await getFeedPost(post.feedPostId);
    if (detail.ok && detail.data?.content) body = longer(body, detail.data.content);
  }

  if (post.postType === "ExternalJob") {
    const externalId = post.externalJobId || post.relatedEntity?.id || "";
    if (externalId) {
      const job = await findPublicExternalJob(externalId, post.title || post.organisationName);
      if (job?.jobDescription) body = longer(body, job.jobDescription);
      if (job) {
        meta.push(
          ...[
            job.location,
            job.country,
            job.employmentType,
            job.experienceLevel,
            job.professionName,
            job.salaryInformation,
            job.closingDate ? `Closes ${job.closingDate}` : "",
          ].map((value) => textOf(value)).filter(Boolean),
        );
      }
    }
  }

  if (post.postType === "Job") {
    const jobId = post.jobPostingId || post.relatedEntity?.id || "";
    if (jobId) {
      const res = await api.jobs.details(jobId, { public: true });
      if (res.ok && res.data && typeof res.data === "object") {
        const job = res.data as Record<string, unknown>;
        body = longer(body, composeJobBody(job));
        meta.push(
          ...[
            metaLine("Company", job.companyName ?? job.company ?? job.employerName),
            metaLine("Location", job.location),
            metaLine("Profession", job.professionName ?? job.profession),
            metaLine("Salary", job.salaryRange ?? job.salary),
            metaLine("Job type", job.employmentType),
            metaLine("Experience", job.experienceLevel),
          ].filter(Boolean),
        );
      }
    }
  }

  return { body, meta };
}
