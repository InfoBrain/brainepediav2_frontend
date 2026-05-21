const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://api.brainepedia.com";

export function loginWithGoogle(): void {
  const redirectUrl = encodeURIComponent(`${window.location.origin}/login-success`);
  window.location.href = `${API_BASE}/api/Account/social-login/Google?redirectUrl=${redirectUrl}`;
}
