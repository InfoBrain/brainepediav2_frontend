import { RoleChrome } from "@/components/layout/RoleChrome";
import { SocialFeedPanel } from "@/components/feed/SocialFeedPanel";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SocialFeedPage() {
  usePageTitle("Feed");
  return (
    <RoleChrome title="Feed" subtitle="// public discovery">
      <SocialFeedPanel />
    </RoleChrome>
  );
}
