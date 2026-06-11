import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "wouter";
import { Clock, Hash, Loader2, MessageCircle, Plus, Search, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getUserRole } from "@/lib/auth";
import { asList, text } from "@/lib/jobData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { USER_NAV } from "@/lib/userNav";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { ADMIN_NAV } from "@/lib/adminNav";
import { Nav } from "@/components/landing/Nav";

type Mode = "categories" | "discussions";
type Category = { id: string; name: string; description: string };
type Thread = { id: string; title: string; categoryName: string; authorName: string; authorId?: string; authorEmail?: string; createdAt?: string; replies?: number; views?: number };

export default function ForumDashboardPage({ mode = "categories" }: { mode?: Mode }) {
  usePageTitle(mode === "categories" ? "Forum Categories" : "Discussions");
  const role = getUserRole();
  const { toast } = useToast();
  const nav = role === "GlobalAdmin" ? ADMIN_NAV : role === "Employer" ? EMPLOYER_NAV : USER_NAV;
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const loadForum = async (cancelledRef?: { cancelled: boolean }) => {
    setLoading(true);
    const cats = await api.forum.getCategories();
    if (!cats.ok) {
      if (!cancelledRef?.cancelled) setLoading(false);
      return;
    }
    const categoryRows = asList(cats.data).map(normCategory);
    if (cancelledRef?.cancelled) return;
    setCategories(categoryRows);
    const batches = await Promise.all(categoryRows.map(async (category) => {
      const res = await api.forum.getThreads(category.id, 1, 15, "newest");
      return res.ok ? asList(res.data).map((thread) => normThread(thread, category.name)) : [];
    }));
    if (!cancelledRef?.cancelled) setThreads(batches.flat().sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()));
    if (!cancelledRef?.cancelled) setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    loadForum({ get cancelled() { return cancelled; } });
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (createOpen) window.setTimeout(() => nameRef.current?.focus(), 60);
  }, [createOpen]);

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      setCreateError("Name is required.");
      return;
    }
    if (!categoryDescription.trim()) {
      setCreateError("Description is required.");
      return;
    }
    setCreateError("");
    setCreating(true);
    const res = await api.forum.createCategory({ Name: categoryName.trim(), Description: categoryDescription.trim() });
    setCreating(false);
    if (!res.ok) {
      const message = res.error || "Failed to create category.";
      setCreateError(message);
      toast({ title: "Category creation failed", description: message, variant: "destructive" });
      return;
    }
    toast({ title: "Category created", description: res.message || categoryName.trim() });
    setCategoryName("");
    setCategoryDescription("");
    setCreateOpen(false);
    loadForum();
  };

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter((thread) => {
      return !query || thread.title.toLowerCase().includes(query) || thread.categoryName.toLowerCase().includes(query);
    });
  }, [search, threads]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => !query || category.name.toLowerCase().includes(query) || category.description.toLowerCase().includes(query));
  }, [categories, search]);

  const popularThreads = useMemo(
    () => [...threads].sort((a, b) => ((b.replies ?? 0) + (b.views ?? 0)) - ((a.replies ?? 0) + (a.views ?? 0))).slice(0, 6),
    [threads],
  );
  const latestReplies = useMemo(
    () => [...threads].filter((thread) => (thread.replies ?? 0) > 0).slice(0, 6),
    [threads],
  );

  const content = (
    <div className="space-y-6">
        <section className="rounded-2xl border border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/10 to-[#0d1119] p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Community hub</p>
          <h2 className="mt-1 text-2xl font-black">
            {mode === "categories" ? "Explore forum categories." : "Browse all discussions."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {role ? "Stay inside dashboard navigation while learning with the Brainepedia community." : "Read community conversations freely. Sign in when you are ready to start a discussion or reply."}
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={mode === "categories" ? "Search categories..." : "Search discussions..."} className="pl-9" />
          </div>
          {role === "GlobalAdmin" && mode === "categories" && (
            <Button onClick={() => { setCreateOpen(true); setCreateError(""); }} className="bg-[#6366F1] text-white hover:bg-[#4F46E5]">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading forum...
          </div>
        ) : mode === "categories" ? (
          <div className="space-y-8">
            <CommunitySection title="Categories" icon={Hash}>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCategories.map((category) => (
                  <Link key={category.id} href={`/forum/category/${category.id}`} className="rounded-xl border border-white/5 bg-[#0d1119] p-5 transition-colors hover:border-[#00D2FF]/35">
                    <Hash className="mb-3 h-5 w-5 text-[#00D2FF]" />
                    <h3 className="font-bold">{category.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{category.description || "Community category"}</p>
                  </Link>
                ))}
                {filteredCategories.length === 0 && <Empty label="No categories found." />}
              </div>
            </CommunitySection>
            <CommunitySection title="Recent Discussions" icon={Clock}>
              <ThreadList threads={filteredThreads.slice(0, 6)} />
            </CommunitySection>
            <CommunitySection title="Popular Discussions" icon={TrendingUp}>
              <ThreadList threads={popularThreads} />
            </CommunitySection>
            <CommunitySection title="Latest Replies" icon={MessageCircle}>
              <ThreadList threads={latestReplies.length ? latestReplies : filteredThreads.slice(0, 3)} />
            </CommunitySection>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#0d1119]">
            {filteredThreads.length === 0 ? (
              <Empty label="No discussions found." />
            ) : filteredThreads.map((thread) => (
              <Link key={thread.id} href={`/forum/thread/${thread.id}`} className="block border-b border-white/5 p-4 transition-colors last:border-0 hover:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{thread.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{thread.categoryName} · by {thread.authorName} · {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : "No date"}</p>
                  </div>
                  <span className="font-mono text-xs text-[#00D2FF]">{thread.replies ?? 0} replies · {thread.views ?? 0} views</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0d1119] border border-white/10">
          <DialogHeader>
            <DialogTitle>Create Forum Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={createCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forum-category-name">Name</Label>
              <Input
                id="forum-category-name"
                ref={nameRef}
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                maxLength={80}
                placeholder="e.g. DevOps & Infrastructure"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forum-category-description">Description</Label>
              <Textarea
                id="forum-category-description"
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                maxLength={300}
                placeholder="What topics belong in this category?"
              />
            </div>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-[#6366F1] text-white hover:bg-[#4F46E5]">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!role) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="container mx-auto px-4 pb-16 pt-24">
          <div className="mx-auto max-w-6xl">{content}</div>
        </main>
      </div>
    );
  }

  return (
    <DashboardShell nav={nav} title={mode === "categories" ? "Forum" : "Discussions"} subtitle="// community.professional-growth" theme={role === "GlobalAdmin" ? "admin" : role === "Employer" ? "employer" : "user"}>
      {content}
    </DashboardShell>
  );
}

function normCategory(item: any): Category {
  return {
    id: String(item?.forumCategoryId ?? item?.categoryId ?? item?.id ?? ""),
    name: text(item?.name ?? item?.title, "Category"),
    description: text(item?.description ?? item?.summary, ""),
  };
}

function normThread(item: any, categoryName: string): Thread {
  const author = item?.author ?? item?.createdBy ?? {};
  return {
    id: String(item?.forumThreadId ?? item?.threadId ?? item?.id ?? ""),
    title: text(item?.title ?? item?.subject, "Discussion"),
    categoryName,
    authorName: text(author?.nickName ?? author?.fullName ?? item?.authorName ?? item?.createdByName, "Community member"),
    authorId: author?.userId ?? item?.authorId ?? item?.createdByUserId,
    authorEmail: author?.email ?? item?.authorEmail,
    createdAt: item?.createdAt ?? item?.dateCreated,
    replies: Number(item?.replyCount ?? item?.repliesCount ?? 0),
    views: Number(item?.viewCount ?? item?.views ?? 0),
  };
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function CommunitySection({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
        <Icon className="h-4 w-4 text-[#00D2FF]" /> {title}
      </h3>
      {children}
    </section>
  );
}

function ThreadList({ threads }: { threads: Thread[] }) {
  if (threads.length === 0) return <Empty label="No discussions found." />;
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d1119]">
      {threads.map((thread) => (
        <Link key={`${thread.id}-${thread.categoryName}`} href={`/forum/thread/${thread.id}`} className="block border-b border-white/5 p-4 transition-colors last:border-0 hover:bg-white/[0.03]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold">{thread.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{thread.categoryName} · by {thread.authorName} · {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : "No date"}</p>
            </div>
            <span className="font-mono text-xs text-[#00D2FF]">{thread.replies ?? 0} replies · {thread.views ?? 0} views</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
