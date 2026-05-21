const API_BASE = "https://api.brainepedia.com";
const REDIRECT_URL = encodeURIComponent("https://demo.brainepedia.com/login-success");

export type SocialProvider = "Google" | "Facebook" | "LinkedIn" | "GitHub";

export function socialLogin(provider: SocialProvider): void {
  window.location.href = `${API_BASE}/api/Account/social-login/${provider}?redirectUrl=${REDIRECT_URL}`;
}
