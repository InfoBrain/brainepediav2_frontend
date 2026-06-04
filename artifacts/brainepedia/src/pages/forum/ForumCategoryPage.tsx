import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Search, Plus, Eye, ChevronLeft, Clock, TrendingUp,
  MessageCircle, X, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { asList } from "@/lib/jobData";

interface ThreadAuthor {
  nickName: string;
  avatarUrl?: string;
}

interface ForumThread {
  forumThreadId: string;
  title: string;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  author: ThreadAuthor;
}

type SortOption = "newest" | "mostViewed" | "mostReplied";

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function Avatar({ author, size = "sm" }: { author: ThreadAuthor; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
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

interface CreateThreadModalProps {
  categoryId: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateThreadModal({ categoryId, onClose, onCreated }: CreateThreadModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const user = getUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const res = await api.forum.createThread({
      categoryId,
      title: title.trim(),
      content: content.trim(),
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Discussion started!", description: "Your thread has been posted." });
      onCreated();
      onClose();
    } else {
      toast({ title: "Failed to post", description: res.error, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <h2 className="font-semibold text-lg">Start a Discussion</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your discussion about?"
              maxLength={200}
              required
              className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or insights..."
              rows={6}
              required
              className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,210,255,0.3)]"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Discussion"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ForumCategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = params.categoryId;
  const [, navigate] = useLocation();
  const user = getUser();

  const [category, setCategory] = useState<{ name: string; description: string } | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [joinPromptOpen, setJoinPromptOpen] = useState(false);
  const pageSize = 20;

  usePageTitle(category?.name ?? "Forum");

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const res = await api.forum.getThreads(categoryId, page, pageSize, sort);
    if (res.ok && res.data) {
      setThreads(asList(res.data));
      setTotalCount(res.data.totalCount ?? 0);
    }
    setLoading(false);
  }, [categoryId, page, sort]);

  useEffect(() => {
    api.forum.getCategories().then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        const cat = res.data.find((c: any) => c.forumCategoryId === categoryId);
        if (cat) setCategory({ name: cat.name, description: cat.description });
      }
    });
  }, [categoryId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  const SORTS: { key: SortOption; label: string; icon: any }[] = [
    { key: "newest", label: "Newest", icon: Clock },
    { key: "mostViewed", label: "Most Viewed", icon: Eye },
    { key: "mostReplied", label: "Most Replied", icon: MessageCircle },
  ];

  const handleCreateClick = () => {
    if (!user) {
      setJoinPromptOpen(true);
      return;
    }
    setShowCreate(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/forum" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Community
          </Link>
          <Button
            onClick={handleCreateClick}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_rgba(0,210,255,0.3)] gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Discussion
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Category header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {category?.name ?? "Discussions"}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground text-sm">{category.description}</p>
          )}
          {totalCount > 0 && (
            <p className="text-xs text-primary/70 mt-1">{totalCount} discussion{totalCount !== 1 ? "s" : ""}</p>
          )}
        </motion.div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {SORTS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setSort(key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sort === key
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-card text-muted-foreground border border-border/40 hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-card/50 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {search ? `No results for "${search}"` : "No discussions yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {search ? "Try a different search term." : "Start the first conversation."}
            </p>
            {!search && (
              <Button
                onClick={handleCreateClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_rgba(0,210,255,0.3)]"
              >
                Start a Discussion
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.map((thread, i) => (
              <motion.div
                key={thread.forumThreadId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/forum/thread/${thread.forumThreadId}`}>
                  <div className="p-5 bg-card border border-border/40 rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_12px_rgba(0,210,255,0.07)] transition-all cursor-pointer group">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-snug">
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Avatar author={thread.author} />
                        <span>{thread.author.nickName}</span>
                      </div>
                      <span>·</span>
                      <span>{timeAgo(thread.createdAt)}</span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Eye className="h-3.5 w-3.5" />
                        {thread.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {thread.replyCount}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-card border border-border/40 rounded-lg disabled:opacity-40 hover:border-primary/40 hover:text-primary transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm bg-card border border-border/40 rounded-lg disabled:opacity-40 hover:border-primary/40 hover:text-primary transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateThreadModal
            categoryId={categoryId}
            onClose={() => setShowCreate(false)}
            onCreated={fetchThreads}
          />
        )}
      </AnimatePresence>

      <JoinConversationModal
        open={joinPromptOpen}
        onCancel={() => setJoinPromptOpen(false)}
        onLogin={() => navigate("/auth/login")}
        onRegister={() => navigate("/auth/register")}
      />

      <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border/20 mt-8">
        © 2026 Brainepedia. A product of Infobrainltd.com. All rights reserved.
      </footer>
    </div>
  );
}

function JoinConversationModal({
  open,
  onCancel,
  onLogin,
  onRegister,
}: {
  open: boolean;
  onCancel: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold">Join the Conversation</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You need an account to create discussions and participate in community conversations.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={onLogin} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
          <Button onClick={onRegister} variant="outline" className="flex-1">Register</Button>
          <Button onClick={onCancel} variant="ghost" className="flex-1">Cancel</Button>
        </div>
      </motion.div>
    </div>
  );
}
