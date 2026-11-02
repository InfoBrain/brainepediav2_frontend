import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Loader2, Users } from "lucide-react";
import { RoleChrome } from "@/components/layout/RoleChrome";
import { ServerPagination } from "@/components/shared/ServerPagination";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getUserRole } from "@/lib/auth";
import { listFollowers, listFollowing } from "@/lib/followService";
import { safeHttpUrl } from "@/lib/safeUrl";
import type { PublicFollowUserDto } from "@/lib/types/socialFeed";

export default function FollowNetworkPage() {
  const [followersMatch, followersParams] = useRoute("/users/:userId/followers");
  const [followingMatch, followingParams] = useRoute("/users/:userId/following");
  const mode = followingMatch ? "following" : "followers";
  const userId = decodeURIComponent((followersMatch ? followersParams?.userId : followingParams?.userId) || "");
  usePageTitle(mode === "following" ? "Following" : "Followers");
  const [people, setPeople] = useState<PublicFollowUserDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = mode === "following" ? await listFollowing(userId, page, 20) : await listFollowers(userId, page, 20);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.error || "Unable to load this list.");
        setPeople([]);
        return;
      }
      setPeople(res.data.items);
      setTotalPages(res.data.totalPages);
    })();
    return () => { cancelled = true; };
  }, [userId, mode, page]);

  return (
    <RoleChrome title={mode === "following" ? "Following" : "Followers"} subtitle="// public profiles">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={`/users/${encodeURIComponent(userId)}/followers`} className={mode === "followers" ? "text-[#00D2FF]" : "text-muted-foreground"}>Followers</Link>
        <Link href={`/users/${encodeURIComponent(userId)}/following`} className={mode === "following" ? "text-[#00D2FF]" : "text-muted-foreground"}>Following</Link>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#00D2FF]" /> Loading people…
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setPage(page)} showDashboardLink={Boolean(getUserRole())} />
      ) : people.length === 0 ? (
        <EmptyState icon={Users} title="No profiles yet" description="This public list is empty." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {people.map((person) => {
            const avatar = safeHttpUrl(person.avatarUrl);
            return (
              <li key={person.userId} className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#0d1119] p-4">
                {avatar ? <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" /> : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7C3AED]/20 font-bold text-[#A78BFA]">
                    {(person.fullName || "M").charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <Link href={person.userId ? `/public-profile/${encodeURIComponent(person.userId)}` : "/feed"} className="block truncate font-semibold hover:text-[#00D2FF]">
                    {person.fullName || "Member"}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{[person.currentTitle, person.profession].filter(Boolean).join(" · ") || "Public profile"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4">
        <ServerPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </RoleChrome>
  );
}
