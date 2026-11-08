import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Heart,
  Loader2,
  Megaphone,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { likeFeedPost, unlikeFeedPost } from "@/lib/feedService";
import { HtmlContent } from "@/components/editor/HtmlContent";
import { isVideoMediaUrl } from "@/lib/feedMedia";
import { loadFullFeedText } from "@/lib/feedFullText";
import { formatFeedDate, publicFeedText, safeHttpUrl } from "@/lib/safeUrl";
import type { FeedPostDto } from "@/lib/types/socialFeed";
import { CommentThread } from "./CommentThread";
import { feedDestination } from "./feedLinks";
import { FollowButton } from "./FollowButton";

const TYPE_LABEL: Record<string, string> = {
  UserPost: "Community post",
  Job: "Organisation job",
  CandidateProgress: "Candidate progress",
  MissionResult: "Mission result",
  ForumPost: "Discussion",
  ForumComment: "Discussion reply",
  SystemAnnouncement: "Announcement",
  ExternalJob: "External job",
};

const FULL_TEXT_CLASS = "whitespace-pre-wrap break-words text-sm leading-7 !text-[#182137] [&_*]:!text-[#182137] [&_a]:!text-[#7d4ccc] [&_code]:!text-[#182137]";

export function FeedPostCard({
  post,
  onPostChange,
  onFollowChange,
  expanded = false,
}: {
  post: FeedPostDto;
  onPostChange: (post: FeedPostDto) => void;
  onFollowChange: (userId: string, following: boolean) => void;
  /** Detail view: show the complete post instead of a preview. */
  expanded?: boolean;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [likePending, setLikePending] = useState(false);
  const [applyPending, setApplyPending] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [fullText, setFullText] = useState(post.content || "");
  const [fullMeta, setFullMeta] = useState<string[]>([]);
  const [fullLoading, setFullLoading] = useState(false);
  const destination = feedDestination(post);
  const media = safeHttpUrl(post.mediaUrl) || safeHttpUrl(post.thumbnailUrl);
  const avatar = safeHttpUrl(post.author?.avatarUrl);
  const isExternal = post.postType === "ExternalJob";
  const isAnnouncement = post.postType === "SystemAnnouncement";
  const authorLabel = isExternal
    ? (post.organisationName || "Organisation")
    : isAnnouncement
      ? "Brainepedia"
      : (post.author?.fullName || "Brainepedia member");
  const showAuthorIdentity = !isAnnouncement && !isExternal;

  const toggleLike = async () => {
    if (!getToken()) {
      navigate("/auth/login");
      return;
    }
    if (likePending || !post.feedPostId) return;
    setLikePending(true);
    const res = post.isLikedByCurrentUser ? await unlikeFeedPost(post.feedPostId) : await likeFeedPost(post.feedPostId);
    setLikePending(false);
    if (res.ok && res.data && typeof res.data.likeCount === "number") {
      onPostChange({ ...post, isLikedByCurrentUser: res.data.liked, likeCount: res.data.likeCount });
      return;
    }
    if (res.status === 409) {
      onPostChange({ ...post, isLikedByCurrentUser: true });
      toast({ title: "Already liked", description: res.error || "You have already liked this post." });
      return;
    }
    toast({ title: "Unable to update like", description: res.error || "Please try again.", variant: "destructive" });
  };

  const applyInternal = async (jobId: string) => {
    if (!getToken()) {
      navigate("/auth/login");
      return;
    }
    if (applyPending) return;
    setApplyPending(true);
    const res = await api.jobs.apply(jobId);
    setApplyPending(false);
    if (!res.ok) {
      toast({ title: "Unable to apply", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Application sent", description: res.message || "Your application was submitted." });
  };

  useEffect(() => {
    if (!expanded && !readerOpen) return;
    let cancelled = false;
    setFullLoading(true);
    void loadFullFeedText(post).then((result) => {
      if (cancelled) return;
      setFullText(result.body || post.content || "");
      setFullMeta(result.meta);
      setFullLoading(false);
    });
    return () => { cancelled = true; };
  }, [expanded, readerOpen, post]);

  const openExternal = (href: string) => {
    const safe = safeHttpUrl(href);
    if (!safe) {
      toast({ title: "Invalid application link", description: "This job does not have a safe http or https application URL.", variant: "destructive" });
      return;
    }
    window.open(safe, "_blank", "noopener,noreferrer");
  };

  return (
    <article className={`min-w-0 max-w-full overflow-hidden rounded-2xl border bg-[#0d1119] p-4 [overflow-wrap:anywhere] sm:p-5 ${isAnnouncement ? "border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700]/10 to-[#0d1119]" : "border-white/8"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isAnnouncement ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD700]/15 text-[#FFD700]">
              <Megaphone className="h-5 w-5" />
            </div>
          ) : showAuthorIdentity && avatar ? (
            <img src={avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : media && (isExternal || post.postType === "Job") ? (
            <img src={media} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00D2FF]/10 text-[#00D2FF]">
              {post.postType === "MissionResult" ? <Trophy className="h-4 w-4" /> : post.postType === "CandidateProgress" ? <Sparkles className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{authorLabel}</p>
            <p className="break-words text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[post.postType] || post.postType}
              {post.visibility && post.postType === "UserPost" ? ` · ${post.visibility}` : ""}
              {formatFeedDate(post.publishedAt || post.createdAt) ? ` · ${formatFeedDate(post.publishedAt || post.createdAt)}` : ""}
            </p>
          </div>
        </div>
        {showAuthorIdentity && (
          <FollowButton
            userId={post.author?.userId ?? null}
            following={post.isFollowingAuthor}
            onChange={(userId, following) => onFollowChange(userId, following)}
          />
        )}
      </div>

      {post.title && <h3 className="break-words text-lg font-bold">{post.title}</h3>}
      {(post.organisationName && post.postType !== "ExternalJob") || (isExternal && post.organisationName) ? (
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" /> <span className="truncate">{post.organisationName}</span>
        </p>
      ) : null}
      {expanded && fullMeta.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {fullMeta.map((item) => <span key={item} className="break-words">{item}</span>)}
        </div>
      )}
      {(expanded ? (fullText || post.content) : post.content) && (
        <HtmlContent
          html={publicFeedText(expanded ? (fullText || post.content) : post.content)}
          className={expanded
            ? "mt-3 min-w-0 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/85"
            : "mt-3 min-w-0 line-clamp-6 break-words text-sm leading-6 text-foreground/85"}
        />
      )}
      {media && post.postType !== "SystemAnnouncement" && (
        isVideoMediaUrl(media) ? (
          <video src={media} controls className="mt-4 max-h-72 w-full max-w-full rounded-xl bg-black" />
        ) : (
          <img
            src={media}
            alt=""
            className="mt-4 max-h-72 w-full max-w-full rounded-xl object-cover"
            onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={likePending} onClick={() => void toggleLike()} aria-pressed={post.isLikedByCurrentUser}>
          {likePending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Heart className={`mr-1.5 h-4 w-4 ${post.isLikedByCurrentUser ? "fill-[#FF4D8D] text-[#FF4D8D]" : ""}`} />}
          {typeof post.likeCount === "number" ? post.likeCount : "—"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setCommentsOpen((open) => !open)}>
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {typeof post.commentCount === "number" ? post.commentCount : "—"}
        </Button>
        {!expanded && post.feedPostId && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setReaderOpen(true)}>
            View more
          </Button>
        )}
        {destination.kind === "apply-internal" && (
          <>
            <Button asChild size="sm" variant="outline">
              <Link href={destination.href}>View job</Link>
            </Button>
            <Button type="button" size="sm" className="bg-[#FFD700] text-black hover:bg-[#F3C800]" disabled={applyPending} onClick={() => void applyInternal(destination.jobId)}>
              {applyPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <BriefcaseBusiness className="mr-1.5 h-4 w-4" />}
              Apply
            </Button>
          </>
        )}
        {destination.kind === "external" && (post.postType === "ExternalJob" || post.postType === "Job") && (
          <Button type="button" size="sm" className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={() => openExternal(destination.href)}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Externally
          </Button>
        )}
        {destination.kind === "internal" && (post.postType === "ForumPost" || post.postType === "ForumComment") && (
          <Button asChild size="sm" variant="outline">
            <Link href={destination.href}>View discussion</Link>
          </Button>
        )}
        {destination.kind === "internal" && (post.postType === "CandidateProgress" || post.postType === "MissionResult") && (
          <Button asChild size="sm" variant="outline">
            <Link href={destination.href}>View profile</Link>
          </Button>
        )}
        {destination.kind === "external" && post.postType !== "ExternalJob" && post.postType !== "Job" && (
          <Button type="button" size="sm" variant="outline" onClick={() => openExternal(destination.href)}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Open link
          </Button>
        )}
      </div>
      {isExternal && (
        <p className="mt-3 break-words text-xs text-muted-foreground">External application. Brainepedia does not submit an internal job application for this role.</p>
      )}
      {commentsOpen && post.feedPostId && (
        <CommentThread
          postId={post.feedPostId}
          onCount={(count) => onPostChange({ ...post, commentCount: count })}
        />
      )}
      <Dialog open={readerOpen} onOpenChange={setReaderOpen}>
        <DialogContent className="top-3 flex max-h-[calc(100dvh-4rem)] w-[calc(100%-1.5rem)] max-w-2xl translate-y-0 flex-col gap-4 overflow-hidden border-[#e6e8ef] bg-white p-5 text-[#182137] sm:top-[50%] sm:max-h-[min(86dvh,820px)] sm:translate-y-[-50%] sm:p-6">
          <DialogHeader className="shrink-0 pr-8 text-left">
            <DialogTitle className="break-words text-lg leading-snug text-[#182137]">
              {post.title || authorLabel}
            </DialogTitle>
            <DialogDescription className="break-words text-[#5e6a7f]">
              {post.organisationName || TYPE_LABEL[post.postType] || "Feed post"}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {fullMeta.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5e6a7f]">
                {fullMeta.map((item) => <span key={item} className="break-words">{item}</span>)}
              </div>
            )}
            {fullLoading && (
              <div className="mb-3 flex items-center gap-2 text-sm text-[#5e6a7f]">
                <Loader2 className="h-4 w-4 animate-spin text-[#7d4ccc]" /> Loading the full post…
              </div>
            )}
            <HtmlContent
              html={publicFeedText(fullText || post.content)}
              fallback="This post has no additional text."
              className={FULL_TEXT_CLASS}
            />
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
