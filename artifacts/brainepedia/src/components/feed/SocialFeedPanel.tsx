import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, PenLine, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServerPagination } from "@/components/shared/ServerPagination";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getToken, getUserRole } from "@/lib/auth";
import { createFeedPost, listFeed } from "@/lib/feedService";
import { asList, text } from "@/lib/jobData";
import { isGuid } from "@/lib/safeUrl";
import type { FeedPostCreateDto, FeedPostDto, FeedPostType } from "@/lib/types/socialFeed";
import { FeedPostCard } from "./FeedPostCard";
import { PostComposer } from "./PostComposer";

const FILTERS: Array<{ label: string; postType: FeedPostType | "" }> = [
  { label: "All", postType: "" },
  { label: "Jobs", postType: "Job" },
  { label: "External jobs", postType: "ExternalJob" },
  { label: "Candidate progress", postType: "CandidateProgress" },
  { label: "Mission results", postType: "MissionResult" },
  { label: "Community posts", postType: "UserPost" },
  { label: "Discussions", postType: "ForumPost" },
  { label: "Replies", postType: "ForumComment" },
  { label: "Announcements", postType: "SystemAnnouncement" },
];

type Filters = {
  search: string;
  postType: FeedPostType | "";
  professionId: string;
  topic: string;
  organisation: string;
  fromDate: string;
  toDate: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  postType: "",
  professionId: "",
  topic: "",
  organisation: "",
  fromDate: "",
  toDate: "",
};

export function SocialFeedPanel({
  variant = "full",
}: {
  variant?: "full" | "preview";
}) {
  const { toast } = useToast();
  const preview = variant === "preview";
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<FeedPostDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);
  const signedIn = Boolean(getToken());

  useEffect(() => {
    if (preview) return;
    api.professions.list().then((res) => {
      if (!res.ok) return;
      setProfessions(
        asList(res.data)
          .map((item) => ({
            id: text(item?.professionId ?? item?.id, ""),
            name: text(item?.name ?? item?.professionName ?? item?.title, ""),
          }))
          .filter((item) => isGuid(item.id) && item.name),
      );
    });
  }, [preview]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      const res = await listFeed({
        pageNumber: preview ? 1 : page,
        pageSize: preview ? 4 : 20,
        search: filters.search,
        postType: filters.postType || undefined,
        professionId: filters.professionId || undefined,
        topic: filters.topic,
        organisation: filters.organisation,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.error || "Unable to load the feed.");
        setPosts([]);
        return;
      }
      setPosts(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
      setPage(res.data.pageNumber || page);
    };
    void run();
    return () => { cancelled = true; };
  }, [filters, page, preview]);

  const applyFilters = () => {
    setPage(1);
    setFilters({
      ...draft,
      search: draft.search.trim(),
      topic: draft.topic.trim(),
      organisation: draft.organisation.trim(),
    });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setFiltersOpen(false);
  };

  const publish = async (body: FeedPostCreateDto) => {
    setPublishing(true);
    const res = await createFeedPost(body);
    setPublishing(false);
    if (!res.ok || !res.data) {
      toast({ title: "Unable to publish", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setPosts((current) => [res.data!, ...current.filter((item) => item.feedPostId !== res.data!.feedPostId)]);
    setTotalCount((count) => count + 1);
    setComposerOpen(false);
    toast({ title: "Post published", description: "Your update is on the feed." });
  };

  const onFollowChange = (userId: string, following: boolean) => {
    setPosts((current) => current.map((post) => (
      post.author?.userId === userId ? { ...post, isFollowingAuthor: following } : post
    )));
  };

  const activeFilterCount = [
    filters.search,
    filters.postType,
    filters.professionId,
    filters.topic,
    filters.organisation,
    filters.fromDate,
    filters.toDate,
  ].filter(Boolean).length;
  const activeType = FILTERS.find((filter) => filter.postType === filters.postType)?.label;

  return (
    <div className="space-y-4">
      {!preview && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => { setDraft(filters); setFiltersOpen(true); }}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
            {activeType && activeType !== "All" && (
              <span className="rounded-full border border-[#00D2FF]/40 bg-[#00D2FF]/10 px-3 py-1 text-xs text-[#00D2FF]">{activeType}</span>
            )}
            {filters.search && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">{filters.search}</span>
            )}
          </div>
          {signedIn && (
            <Button type="button" className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]" onClick={() => setComposerOpen(true)}>
              <PenLine className="mr-2 h-4 w-4" />
              Post a feed
            </Button>
          )}
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post a feed</DialogTitle>
            <DialogDescription>Share an update. The cover is one file — images up to 2 MB, videos up to 25 MB.</DialogDescription>
          </DialogHeader>
          <PostComposer variant="plain" submitting={publishing} onSubmit={publish} onCancel={() => setComposerOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0d1119] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter the feed</DialogTitle>
            <DialogDescription>Search and narrow the posts. The feed itself stays in front once you apply these.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft.search}
                onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))}
                onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }}
                placeholder="Search jobs, candidates, organisations, professions, topics"
                className="pl-9"
                aria-label="Search the feed"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const active = draft.postType === filter.postType;
                return (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, postType: filter.postType }))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-[#00D2FF]/50 bg-[#00D2FF]/15 text-[#00D2FF]" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Profession</Label>
                <Select value={draft.professionId || "all"} onValueChange={(value) => setDraft((current) => ({ ...current, professionId: value === "all" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="All professions" /></SelectTrigger>
                  <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
                    <SelectItem value="all">All professions</SelectItem>
                    {professions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="feed-topic">Topic</Label>
                <Input id="feed-topic" value={draft.topic} onChange={(event) => setDraft((current) => ({ ...current, topic: event.target.value }))} placeholder="Topic or category" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feed-org">Organisation</Label>
                <Input id="feed-org" value={draft.organisation} onChange={(event) => setDraft((current) => ({ ...current, organisation: event.target.value }))} placeholder="Organisation" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="feed-from">From</Label>
                  <Input id="feed-from" type="date" value={draft.fromDate} onChange={(event) => setDraft((current) => ({ ...current, fromDate: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="feed-to">To</Label>
                  <Input id="feed-to" type="date" value={draft.toDate} onChange={(event) => setDraft((current) => ({ ...current, toDate: event.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="bg-[#00D2FF] text-black hover:bg-[#00B8DD]" onClick={applyFilters}>Apply filters</Button>
              <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-[#0d1119] p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#00D2FF]" /> Loading the feed…
        </div>
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setFilters((current) => ({ ...current }))}
          showDashboardLink={Boolean(getUserRole())}
        />
      ) : posts.length === 0 ? (
        <EmptyState icon={Search} title="No feed posts" description="Nothing matches these filters yet. Try another search or publish an update." />
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <FeedPostCard
              key={post.feedPostId || `${post.postType}-${post.createdAt}`}
              post={post}
              onPostChange={(next) => setPosts((current) => current.map((item) => item.feedPostId === next.feedPostId ? next : item))}
              onFollowChange={onFollowChange}
            />
          ))}
        </div>
      )}

      {!preview && <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      {!preview && totalCount > 0 && (
        <p className="text-xs text-muted-foreground">{totalCount} post{totalCount === 1 ? "" : "s"}</p>
      )}
      {preview && (
        <Button asChild variant="outline">
          <Link href="/feed">Open the full feed</Link>
        </Button>
      )}
    </div>
  );
}
