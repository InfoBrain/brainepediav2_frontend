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

export function setToken(token: string | null | undefined, user: any) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.token) localStorage.setItem(TOKEN_KEY, user.token);
    else if (user.accessToken) localStorage.setItem(TOKEN_KEY, user.accessToken);
    else if (user.jwt) localStorage.setItem(TOKEN_KEY, user.jwt);
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
  const u = getUser();
  if (!u) return null;
  const raw = u.role || u.Role || u.userRole || (Array.isArray(u.roles) ? u.roles[0] : u.roles);
  if (!raw) return "User";
  const s = String(raw).toLowerCase();
  if (s.includes("admin")) return "GlobalAdmin";
  if (s.includes("employer")) return "Employer";
  return "User";
}

export function getUserId(): string | null {
  const u = getUser();
  if (!u) return null;
  return u.userId || u.id || u.Id || u.user?.id || u.user?.userId || null;
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
