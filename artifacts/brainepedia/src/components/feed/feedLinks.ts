import type { FeedPostDto } from "@/lib/types/socialFeed";
import { safeHttpUrl } from "@/lib/safeUrl";

export type FeedDestination =
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string }
  | { kind: "apply-internal"; jobId: string; href: string }
  | { kind: "none" };

export function internalJobIdFromApplyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/Jobs\/([^/?#]+)\/apply\/?$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function forumThreadHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/Forum\/threads\/([^/?#]+)/i);
  return match ? `/forum/thread/${decodeURIComponent(match[1])}` : null;
}

export function feedDestination(post: FeedPostDto): FeedDestination {
  if (post.postType === "ExternalJob") {
    const href = safeHttpUrl(post.linkUrl);
    return href ? { kind: "external", href } : { kind: "none" };
  }

  if (post.postType === "Job") {
    const jobId = post.jobPostingId || internalJobIdFromApplyUrl(post.linkUrl);
    if (jobId) return { kind: "apply-internal", jobId, href: `/jobs/${encodeURIComponent(jobId)}` };
  }

  if (post.postType === "ForumPost" || post.postType === "ForumComment") {
    const href = forumThreadHref(post.linkUrl);
    if (href) return { kind: "internal", href };
  }

  if (post.postType === "CandidateProgress" || post.postType === "MissionResult") {
    if (post.author?.userId) return { kind: "internal", href: `/public-profile/${encodeURIComponent(post.author.userId)}` };
  }

  const absolute = safeHttpUrl(post.linkUrl);
  if (absolute) return { kind: "external", href: absolute };

  if (post.linkUrl && post.linkUrl.startsWith("/") && !post.linkUrl.startsWith("/api/")) {
    return { kind: "internal", href: post.linkUrl };
  }

  if (post.feedPostId && post.postType === "UserPost") {
    return { kind: "internal", href: `/feed/posts/${encodeURIComponent(post.feedPostId)}` };
  }

  return { kind: "none" };
}
