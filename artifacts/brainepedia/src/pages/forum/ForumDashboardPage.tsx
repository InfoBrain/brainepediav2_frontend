import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Hash, LayoutDashboard, Loader2, MessageSquare, Search, User as UserIcon } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getDashboardPath, getUser, getUserRole } from "@/lib/auth";
import { asList, text } from "@/lib/jobData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

type Mode = "categories" | "discussions" | "mine";
type Category = { id: string; name: string; description: string };
type Thread = { id: string; title: string; categoryName: string; authorName: string; authorId?: string; authorEmail?: string; createdAt?: string; replies?: number; views?: number };

export default function ForumDashboardPage({ mode = "categories" }: { mode?: Mode }) {
  usePageTitle(mode === "categories" ? "Forum Categories" : mode === "mine" ? "My Discussions" : "Discussions");
  const role = getUserRole();
  const user = getUser();
  const nav = forumNav(getDashboardPath(role));
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const cats = await api.forum.getCategories();
      if (!cats.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const categoryRows = asList(cats.data).map(normCategory);
      if (cancelled) return;
      setCategories(categoryRows);
      if (mode !== "categories") {
        const batches = await Promise.all(categoryRows.map(async (category) => {
          const res = await api.forum.getThreads(category.id, 1, 15, "newest");
          return res.ok ? asList(res.data).map((thread) => normThread(thread, category.name)) : [];
        }));
        if (!cancelled) setThreads(batches.flat().sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [mode]);

  const filteredThreads = useMemo(() => {
    const mine = mode === "mine";
    const query = search.trim().toLowerCase();
    return threads.filter((thread) => {
      if (mine) {
        const identity = [thread.authorId, thread.authorEmail, thread.authorName].filter(Boolean).map((value) => String(value).toLowerCase());
        const current = [user?.id, user?.userId, user?.email, user?.firstName].filter(Boolean).map((value) => String(value).toLowerCase());
        if (!identity.some((value) => current.includes(value))) return false;
      }
      return !query || thread.title.toLowerCase().includes(query) || thread.categoryName.toLowerCase().includes(query);
    });
  }, [mode, search, threads, user]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => !query || category.name.toLowerCase().includes(query) || category.description.toLowerCase().includes(query));
  }, [categories, search]);

  return (
    <DashboardShell nav={nav} title={mode === "categories" ? "Forum" : mode === "mine" ? "My Discussions" : "Discussions"} subtitle="// community.professional-growth" theme={role === "GlobalAdmin" ? "admin" : role === "Employer" ? "employer" : "user"}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#00D2FF]/20 bg-gradient-to-br from-[#00D2FF]/10 to-[#0d1119] p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Community hub</p>
          <h2 className="mt-1 text-2xl font-black">
            {mode === "categories" ? "Explore forum categories." : mode === "mine" ? "Review discussions you created." : "Browse all discussions."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Stay inside dashboard navigation while learning with the Brainepedia community.</p>
        </section>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={mode === "categories" ? "Search categories..." : "Search discussions..."} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0d1119] py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" /> Loading forum...
          </div>
        ) : mode === "categories" ? (
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
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#0d1119]">
            {filteredThreads.length === 0 ? (
              <Empty label={mode === "mine" ? "No discussions created by your account were found." : "No discussions found."} />
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
      </div>
    </DashboardShell>
  );
}

function forumNav(dashboardHref: string): NavItem[] {
  return [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: "/forum", label: "Categories", icon: Hash, section: "Forum" },
    { href: "/forum/discussions", label: "Discussions", icon: MessageSquare },
    { href: "/forum/my-discussions", label: "My Discussions", icon: UserIcon },
  ];
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
