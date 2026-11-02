import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getToken, getUserId } from "@/lib/auth";
import { followUser, unfollowUser } from "@/lib/followService";

export function FollowButton({
  userId,
  following,
  onChange,
  size = "sm",
}: {
  userId: string | null;
  following: boolean;
  onChange: (userId: string, following: boolean, followerCount: number | null) => void;
  size?: "sm" | "default";
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const shown = localFollowing ?? following;

  useEffect(() => {
    setLocalFollowing(null);
  }, [following, userId]);
  const currentUserId = getUserId();

  if (!userId || (currentUserId && currentUserId === userId)) return null;

  const submit = async () => {
    if (!getToken()) {
      navigate("/auth/login");
      return;
    }
    if (pending) return;
    setPending(true);
    const res = shown ? await unfollowUser(userId) : await followUser(userId);
    setPending(false);
    if (res.ok && res.data) {
      setLocalFollowing(res.data.following);
      setCount(res.data.followerCount);
      onChange(res.data.userId || userId, res.data.following, res.data.followerCount);
      return;
    }
    if (res.status === 409) {
      setLocalFollowing(true);
      onChange(userId, true, null);
      toast({ title: "Already following", description: res.error || "You already follow this person." });
      return;
    }
    if (res.status === 400) {
      toast({ title: "Unable to follow", description: res.error || "You cannot follow this account.", variant: "destructive" });
      return;
    }
    toast({ title: following ? "Unable to unfollow" : "Unable to follow", description: res.error || "Please try again.", variant: "destructive" });
  };

  const label = shown ? "Following" : "Follow";
  const countLabel = typeof count === "number" ? ` · ${count}` : "";

  return (
    <Button
      type="button"
      size={size}
      variant={shown ? "outline" : "default"}
      disabled={pending}
      onClick={() => void submit()}
      className={shown ? "" : "bg-[#00D2FF] text-black hover:bg-[#00B8DD]"}
    >
      {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
      {label}{countLabel}
    </Button>
  );
}
