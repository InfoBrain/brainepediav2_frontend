const API_BASE = "https://api.brainepedia.com";

export type SocialProvider = "Google" | "Facebook" | "LinkedIn" | "GitHub";

/**
 * Initiate a social OAuth login by redirecting to the backend's OAuth entry point.
 * The redirect URL is derived from the current window origin so this works in any
 * environment (development, staging, production) without hardcoding a domain.
 */
export function socialLogin(provider: SocialProvider): void {
  const redirectUrl = encodeURIComponent(`${window.location.origin}/login-success`);
  window.location.href = `${API_BASE}/api/Account/social-login/${provider}?redirectUrl=${redirectUrl}`;
}
