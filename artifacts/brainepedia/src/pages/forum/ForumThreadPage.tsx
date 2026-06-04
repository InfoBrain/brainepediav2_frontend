import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Eye, Clock, MessageCircle, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ThreadAuthor {
  nickName: string;
  avatarUrl?: string;
}

interface ThreadDetails {
  forumThreadId: string;
  title: string;
  content: string;
  viewCount: number;
  createdAt: string;
  author: ThreadAuthor;
  categoryId?: string;
}

interface Reply {
  forumReplyId: string;
  content: string;
  createdAt: string;
  author: ThreadAuthor;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ author, size = "md" }: { author: ThreadAuthor; size?: "sm" | "md" | "lg" }) {
  const sz =
    size === "sm" ? "w-7 h-7 text-xs" :
    size === "lg" ? "w-12 h-12 text-base" :
    "w-9 h-9 text-sm";
  const name = author?.nickName || "Community member";

  if (author?.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={name}
        className={`${sz} rounded-full object-cover border border-border/40 flex-shrink-0`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

type Segment = { type: "bold" | "italic" | "text"; text: string };

function parseInline(line: string): Segment[] {
  const segments: Segment[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) segments.push({ type: "text", text: line.slice(last, m.index) });
    if (m[0].startsWith("**")) segments.push({ type: "bold", text: m[2] });
    else segments.push({ type: "italic", text: m[3] });
    last = m.index + m[0].length;
  }
  if (last < line.length) segments.push({ type: "text", text: line.slice(last) });
  return segments;
}

function ContentBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
      {paragraphs.map((para, i) => (
        <p key={i}>
          {para.split("\n").map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {parseInline(line).map((seg, si) =>
                seg.type === "bold" ? (
                  <strong key={si}>{seg.text}</strong>
                ) : seg.type === "italic" ? (
                  <em key={si}>{seg.text}</em>
                ) : (
                  <span key={si}>{seg.text}</span>
                )
              )}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

export default function ForumThreadPage() {
  const params = useParams<{ threadId: string }>();
  const threadId = params.threadId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = getUser();

  const [thread, setThread] = useState<ThreadDetails | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  usePageTitle(thread?.title ?? "Discussion");

  const fetchThread = useCallback(async () => {
    const res = await api.forum.getThread(threadId);
    if (res.ok && res.data) {
      setThread(res.data.threadDetails ?? null);
      setReplies(res.data.replies ?? []);
      if (res.data.threadDetails?.categoryId) {
        setCategoryId(res.data.threadDetails.categoryId);
      }
    }
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (!user) {
      toast({ title: "Login required", description: "Please log in to reply.", variant: "destructive" });
      navigate("/auth/login");
      return;
    }
    setSubmitting(true);
    const res = await api.forum.createReply(threadId, { content: replyText.trim() });
    setSubmitting(false);
    if (res.ok) {
      setReplyText("");
      toast({ title: "Reply posted!" });
      fetchThread();
    } else {
      toast({ title: "Failed to post reply", description: res.error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Thread not found</h2>
        <Link href="/forum" className="text-primary hover:underline text-sm">← Back to Forum</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/forum"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Community
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Thread */}
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/40 rounded-2xl p-6 mb-6"
        >
          <h1 className="text-xl font-bold leading-snug mb-5">{thread.title}</h1>

          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border/30">
            <Avatar author={thread.author} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{thread.author?.nickName || "Community member"}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(thread.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {thread.viewCount} view{thread.viewCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {replies.length} repl{replies.length !== 1 ? "ies" : "y"}
                </span>
              </div>
            </div>
          </div>

          <ContentBody text={thread.content} />
        </motion.article>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
              {replies.length} Repl{replies.length !== 1 ? "ies" : "y"}
            </h2>
            <div className="space-y-3">
              {replies.map((reply, i) => (
                <motion.div
                  key={reply.forumReplyId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border/40 rounded-xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar author={reply.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold">{reply.author?.nickName || "Community member"}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Reply form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/40 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold mb-3">
            {user ? "Post a Reply" : "Join the conversation"}
          </h3>

          {user ? (
            <form onSubmit={handleReply} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar author={{ nickName: user.firstName || "U" }} size="sm" />
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="flex-1 px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_rgba(0,210,255,0.3)] gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Post Reply
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground flex-1">
                Log in to join the conversation and post a reply.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/auth/register")}
                className="shrink-0"
              >
                Register
              </Button>
              <Button
                onClick={() => navigate("/auth/login")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_rgba(0,210,255,0.3)] shrink-0"
              >
                Log In
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border/20 mt-8">
        © 2026 Brainepedia. A product of Infobrainltd.com. All rights reserved.
      </footer>
    </div>
  );
}
