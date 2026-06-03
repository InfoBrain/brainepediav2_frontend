import { useEffect } from "react";
import { useLocation } from "wouter";
import { getUserId } from "@/lib/auth";

export default function PublicPortfolioRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const userId = getUserId();
    setLocation(userId ? `/public-profile/${encodeURIComponent(userId)}` : "/profile/edit", { replace: true });
  }, [setLocation]);

  return null;
}
