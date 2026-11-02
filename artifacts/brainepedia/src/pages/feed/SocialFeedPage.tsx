import { RoleChrome } from "@/components/layout/RoleChrome";
import { SocialFeedPanel } from "@/components/feed/SocialFeedPanel";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SocialFeedPage() {
  usePageTitle("Feed");
  return (
    <RoleChrome title="Feed" subtitle="// public discovery">
      <div className="mb-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D2FF]">Brainepedia</p>
        <h2 className="mt-1 text-2xl font-black">Public feed</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Jobs, mission progress, discussions, and community posts that are eligible to be public. Anonymous visitors can read the feed. Sign in to like, comment, follow, and see posts shared with followers.
        </p>
      </div>
      <SocialFeedPanel />
    </RoleChrome>
  );
}
