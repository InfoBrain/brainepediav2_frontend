import { useState, useEffect } from "react";

const TOKEN_KEY = "brainepedia.auth.token";
const USER_KEY = "brainepedia.auth.user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/** Decode a JWT without verification — used only for non-security-critical display info. */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setToken(token: string | null | undefined, user: any) {
  // Always unwrap nested userProfile wrapper the API may return
  const profile = user?.userProfile ?? user;
  const resolvedToken = token
    || profile?.token
    || profile?.accessToken
    || profile?.jwt;

  if (resolvedToken) {
    localStorage.setItem(TOKEN_KEY, resolvedToken);
  }
  if (profile) {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }
  window.dispatchEvent(new Event("auth-change"));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export function isAuthenticated() {
  return !!getToken();
}

export function getUserRole(): "GlobalAdmin" | "Employer" | "User" | null {
  if (!isAuthenticated()) return null;

  // 1. Try profile stored in localStorage (direct fields)
  const u = getUser()?.userProfile ?? getUser();
  const profileRaw = u?.role || u?.Role || u?.userRole || u?.roles;
  if (profileRaw) {
    return parseRole(profileRaw);
  }

  // 2. Fall back to JWT claims (roles are encoded in the token payload)
  const token = getToken();
  if (!token) return "User";
  const claims = decodeJwt(token);
  const jwtRaw = claims?.roles || claims?.role
    || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  if (jwtRaw) {
    return parseRole(jwtRaw);
  }

  return "User";
}

function parseRole(raw: unknown): "GlobalAdmin" | "Employer" | "User" {
  const s = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  if (s.includes("admin")) return "GlobalAdmin";
  if (s.includes("employer")) return "Employer";
  return "User";
}

export function getUserId(): string | null {
  // 1. Try profile stored in localStorage
  const u = getUser()?.userProfile ?? getUser();
  const profileId = u?.userId || u?.id || u?.Id;
  if (profileId) return profileId;

  // 2. Fall back to JWT uid / sub claim
  const token = getToken();
  if (!token) return null;
  const claims = decodeJwt(token);
  return claims?.uid || claims?.sub || null;
}

export function getDashboardPath(role?: ReturnType<typeof getUserRole>): string {
  const r = role ?? getUserRole();
  if (r === "GlobalAdmin") return "/admin/dashboard";
  if (r === "Employer") return "/employer/portal";
  return "/user/map";
}

export function useAuth() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());

  useEffect(() => {
    const handleAuthChange = () => setIsAuth(isAuthenticated());
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  return { isAuthenticated: isAuth, user: getUser() };
}
