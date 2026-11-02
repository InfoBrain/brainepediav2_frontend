import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [searchInput, setSearchInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [organisationInput, setOrganisationInput] = useState("");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<FeedPostDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
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

  const applySearch = () => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      search: searchInput.trim(),
      topic: topicInput.trim(),
      organisation: organisationInput.trim(),
    }));
  };

  const updateFilter = (patch: Partial<Filters>) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
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
    toast({ title: "Post published", description: "Your update is on the feed." });
  };

  const onFollowChange = (userId: string, following: boolean) => {
    setPosts((current) => current.map((post) => (
      post.author?.userId === userId ? { ...post, isFollowingAuthor: following } : post
    )));
  };

  return (
    <div className="space-y-5">
      {!preview && signedIn && <PostComposer submitting={publishing} onSubmit={publish} />}
      {!preview && (
        <section className="space-y-4 rounded-2xl border border-white/8 bg-[#0d1119] p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }}
                placeholder="Search jobs, candidates, organisations, professions, topics"
                className="pl-9"
                aria-label="Search the feed"
              />
            </div>
            <Button type="button" variant="outline" onClick={applySearch}>Search</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = filters.postType === filter.postType;
              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => updateFilter({ postType: filter.postType })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-[#00D2FF]/50 bg-[#00D2FF]/15 text-[#00D2FF]" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <Label>Profession</Label>
              <Select value={filters.professionId || "all"} onValueChange={(value) => updateFilter({ professionId: value === "all" ? "" : value })}>
                <SelectTrigger><SelectValue placeholder="All professions" /></SelectTrigger>
                <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
                  <SelectItem value="all">All professions</SelectItem>
                  {professions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="feed-topic">Topic</Label>
              <Input id="feed-topic" value={topicInput} onChange={(event) => setTopicInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }} placeholder="Topic or category" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="feed-org">Organisation</Label>
              <Input id="feed-org" value={organisationInput} onChange={(event) => setOrganisationInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }} placeholder="Organisation" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="feed-from">From</Label>
                <Input id="feed-from" type="date" value={filters.fromDate} onChange={(event) => updateFilter({ fromDate: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feed-to">To</Label>
                <Input id="feed-to" type="date" value={filters.toDate} onChange={(event) => updateFilter({ toDate: event.target.value })} />
              </div>
            </div>
          </div>
        </section>
      )}

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
