import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Loader2, Trash2 } from "lucide-react";
import { RoleChrome } from "@/components/layout/RoleChrome";
import { CommentThread } from "@/components/feed/CommentThread";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { HtmlContent } from "@/components/editor/HtmlContent";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ux/ErrorState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { getUserId, getUserRole } from "@/lib/auth";
import { api } from "@/lib/api";
import { getExternalJob } from "@/lib/externalJobsService";
import { deleteFeedPost, getFeedPost, updateFeedPost } from "@/lib/feedService";
import type { FeedPostCreateDto, FeedPostDto } from "@/lib/types/socialFeed";

export default function FeedPostPage() {
  usePageTitle("Post");
  const [, params] = useRoute("/feed/posts/:postId");
  const postId = params?.postId ? decodeURIComponent(params.postId) : "";
  const { toast } = useToast();
  const [post, setPost] = useState<FeedPostDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<number | undefined>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [fullDetailsContent, setFullDetailsContent] = useState<string>("");
  const [fullDetailsLoading, setFullDetailsLoading] = useState(false);

  const load = async () => {
    if (!postId) return;
    setLoading(true);
    setError("");
    const res = await getFeedPost(postId);
    setLoading(false);
    setStatus(res.status);
    if (!res.ok || !res.data) {
      setPost(null);
      setError(res.status === 404
        ? "This post is private, unpublished, or no longer available."
        : (res.error || "Unable to load this post."));
      return;
    }
    setPost(res.data);
  };

  useEffect(() => { void load(); }, [postId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFullDetails() {
      if (!post || (post.postType !== "ExternalJob" && post.postType !== "Job")) {
        setFullDetailsContent("");
        return;
      }

      setFullDetailsLoading(true);
      setFullDetailsContent("");

      if (post.postType === "ExternalJob") {
        const externalId = post.externalJobId || post.relatedEntity?.id || "";
        if (!externalId) {
          setFullDetailsLoading(false);
          return;
        }
        const res = await getExternalJob(externalId);
        if (!cancelled && res.ok && res.data) {
          const d = res.data;
          const details = [
            d.jobDescription || "",
            d.organisationName ? `Organisation: ${d.organisationName}` : "",
            d.location ? `Location: ${d.location}` : "",
            d.country ? `Country: ${d.country}` : "",
            d.employmentType ? `Job Type: ${d.employmentType}` : "",
            d.experienceLevel ? `Experience Level: ${d.experienceLevel}` : "",
            d.salaryInformation ? `Salary: ${d.salaryInformation}` : "",
            d.closingDate ? `Closing Date: ${d.closingDate}` : "",
            d.applicationUrl ? `Application URL: ${d.applicationUrl}` : "",
          ].filter(Boolean).join("\n\n");
          setFullDetailsContent(details);
        }
        if (!cancelled) setFullDetailsLoading(false);
        return;
      }

      const jobId = post.jobPostingId || post.relatedEntity?.id || "";
      if (!jobId) {
        setFullDetailsLoading(false);
        return;
      }
      const res = await api.jobs.details(jobId, { public: true });
      if (!cancelled && res.ok && res.data) {
        const job = res.data as Record<string, unknown>;
        const description = String(job?.description ?? job?.details ?? "").trim();
        const requirements = String(job?.requirements ?? "").trim();
        const responsibilities = String(job?.responsibilities ?? "").trim();
        const metadata = [
          job?.companyName || job?.company || job?.employerName ? `Company: ${String(job?.companyName ?? job?.company ?? job?.employerName)}` : "",
          job?.professionName || job?.profession ? `Profession: ${String(job?.professionName ?? job?.profession)}` : "",
          job?.location ? `Location: ${String(job.location)}` : "",
          job?.salaryRange || job?.salary ? `Salary: ${String(job?.salaryRange ?? job?.salary)}` : "",
          job?.employmentType ? `Job Type: ${String(job.employmentType)}` : "",
          job?.experienceLevel ? `Experience Level: ${String(job.experienceLevel)}` : "",
        ].filter(Boolean).join("\n");

        const details = [description, requirements && `Requirements:\n${requirements}`, responsibilities && `Responsibilities:\n${responsibilities}`, metadata]
          .filter(Boolean)
          .join("\n\n");
        setFullDetailsContent(details);
      }
      if (!cancelled) setFullDetailsLoading(false);
    }

    void loadFullDetails();
    return () => { cancelled = true; };
  }, [post]);

  const isOwner = Boolean(post?.author?.userId && post.author.userId === getUserId());
  const isAdmin = getUserRole() === "GlobalAdmin";
  const canManage = post?.postType === "UserPost" && (isOwner || isAdmin);

  const save = async (body: FeedPostCreateDto) => {
    if (!post) return;
    setSaving(true);
    const res = await updateFeedPost(post.feedPostId, body);
    setSaving(false);
    if (!res.ok || !res.data) {
      toast({ title: "Unable to update post", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setPost(res.data);
    setEditing(false);
    toast({ title: "Post updated" });
  };

  const remove = async () => {
    if (!post) return;
    setSaving(true);
    const res = await deleteFeedPost(post.feedPostId);
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Unable to delete post", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setDeleted(true);
    toast({ title: "Post deleted", description: res.message || "Feed post deleted." });
  };

  return (
    <RoleChrome title="Post" subtitle="// feed.post">
      <Button asChild variant="ghost" className="mb-4 pl-0">
        <Link href="/feed">← Back to feed</Link>
      </Button>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#00D2FF]" /> Loading post…
        </div>
      ) : deleted ? (
        <p className="rounded-xl border border-white/10 bg-[#0d1119] p-6 text-sm">This post has been deleted.</p>
      ) : error || !post ? (
        <ErrorState
          message={error || "Post unavailable."}
          onRetry={status === 404 ? undefined : load}
          showDashboardLink={Boolean(getUserRole())}
        />
      ) : (
        <div className="space-y-4">
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing((value) => !value)}>
                {editing ? "Close editor" : "Edit post"}
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => void remove()}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete post
              </Button>
            </div>
          )}
          {editing && canManage && <PostComposer mode="edit" initial={post} submitting={saving} onSubmit={save} onCancel={() => setEditing(false)} />}
          <FeedPostCard
            post={post}
            onPostChange={setPost}
            onFollowChange={(_userId, following) => setPost((current) => current ? { ...current, isFollowingAuthor: following } : current)}
          />
          {(post.postType === "ExternalJob" || post.postType === "Job") && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Full post details</h2>
              {fullDetailsLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading full details…
                </div>
              ) : fullDetailsContent ? (
                /<\/?[a-z][\s\S]*>/i.test(fullDetailsContent) ? (
                  <HtmlContent html={fullDetailsContent} className="mt-3 text-sm leading-6 text-foreground/85" />
                ) : (
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85 font-sans">{fullDetailsContent}</pre>
                )
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No additional details were returned for this post.</p>
              )}
            </section>
          )}
          {post.author?.userId && (
            <div className="flex flex-wrap gap-3 text-sm">
              <Link className="text-[#00D2FF] hover:underline" href={`/users/${encodeURIComponent(post.author.userId)}/followers`}>Followers</Link>
              <Link className="text-[#00D2FF] hover:underline" href={`/users/${encodeURIComponent(post.author.userId)}/following`}>Following</Link>
            </div>
          )}
          <section className="rounded-2xl border border-white/8 bg-[#0d1119] p-5">
            <h2 className="text-lg font-bold">Comments</h2>
            <CommentThread postId={post.feedPostId} onCount={(count) => setPost({ ...post, commentCount: count })} />
          </section>
        </div>
      )}
    </RoleChrome>
  );
}
