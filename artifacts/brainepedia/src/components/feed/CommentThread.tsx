import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getToken, getUserId, getUserRole } from "@/lib/auth";
import { createFeedComment, deleteFeedComment, listFeedComments, updateFeedComment } from "@/lib/feedService";
import { formatFeedDate, publicFeedText, safeHttpUrl } from "@/lib/safeUrl";
import type { FeedCommentDto } from "@/lib/types/socialFeed";
import { ServerPagination } from "@/components/shared/ServerPagination";

export function CommentThread({
  postId,
  onCount,
}: {
  postId: string;
  onCount?: (count: number) => void;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [comments, setComments] = useState<FeedCommentDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const signedIn = Boolean(getToken());
  const currentUserId = getUserId();
  const isAdmin = getUserRole() === "GlobalAdmin";

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    const res = await listFeedComments(postId, nextPage, 20);
    setLoading(false);
    if (!res.ok || !res.data) {
      setError(res.status === 404 ? "Comments are not available for this post." : (res.error || "Unable to load comments."));
      setComments([]);
      return;
    }
    setComments(res.data.items);
    setPage(res.data.pageNumber);
    setTotalPages(res.data.totalPages);
    setTotalCount(res.data.totalCount);
    onCount?.(res.data.totalCount);
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!signedIn) {
      navigate("/auth/login");
      return;
    }
    const content = draft.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    const res = await createFeedComment(postId, content);
    setSubmitting(false);
    if (res.status === 409) {
      toast({ title: "Comment already sent", description: res.error || "Please wait a moment before repeating the same comment." });
      return;
    }
    if (!res.ok || !res.data) {
      toast({ title: "Unable to comment", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setDraft("");
    setComments((current) => [res.data!, ...current.filter((item) => item.commentId !== res.data!.commentId)]);
    setTotalCount((count) => {
      const next = count + 1;
      onCount?.(next);
      return next;
    });
    toast({ title: "Comment posted" });
  };

  const saveEdit = async (commentId: string) => {
    const content = editingText.trim();
    if (!content || busyId) return;
    setBusyId(commentId);
    const res = await updateFeedComment(commentId, content);
    setBusyId(null);
    if (!res.ok || !res.data) {
      toast({ title: "Unable to edit comment", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setComments((current) => current.map((item) => (item.commentId === commentId ? res.data! : item)));
    setEditingId(null);
    toast({ title: "Comment updated" });
  };

  const remove = async (commentId: string) => {
    if (busyId) return;
    setBusyId(commentId);
    const res = await deleteFeedComment(commentId);
    setBusyId(null);
    if (!res.ok) {
      toast({ title: "Unable to delete comment", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setComments((current) => current.filter((item) => item.commentId !== commentId));
    setTotalCount((count) => {
      const next = Math.max(0, count - 1);
      onCount?.(next);
      return next;
    });
    toast({ title: "Comment deleted" });
  };

  return (
    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
      {signedIn ? (
        <form onSubmit={publish} className="space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a comment"
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !draft.trim()} className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/auth/login")}>
          Log in to comment
        </Button>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#00D2FF]" /> Loading comments…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const isAuthor = Boolean(currentUserId && comment.author?.userId === currentUserId);
            const avatar = safeHttpUrl(comment.author?.avatarUrl);
            return (
              <li key={comment.commentId} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-start gap-3">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED]/20 text-xs font-bold text-[#A78BFA]">
                      {(comment.author?.fullName || "M").charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{comment.author?.fullName || "Member"}</span>
                      <span className="text-xs text-muted-foreground">{formatFeedDate(comment.createdAt)}</span>
                    </div>
                    {editingId === comment.commentId ? (
                      <div className="mt-2 space-y-2">
                        <Textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} rows={3} />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" disabled={busyId === comment.commentId} onClick={() => void saveEdit(comment.commentId)}>
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{publicFeedText(comment.content)}</p>
                    )}
                    {editingId !== comment.commentId && (
                      <div className="mt-2 flex gap-2">
                        {isAuthor && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(comment.commentId);
                              setEditingText(comment.content || "");
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                        )}
                        {(isAuthor || isAdmin) && (
                          <Button type="button" size="sm" variant="ghost" disabled={busyId === comment.commentId} onClick={() => void remove(comment.commentId)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ServerPagination page={page} totalPages={totalPages} onPageChange={(next) => void load(next)} />
      {totalCount > 0 && <p className="text-xs text-muted-foreground">{totalCount} comment{totalCount === 1 ? "" : "s"}</p>}
    </div>
  );
}
