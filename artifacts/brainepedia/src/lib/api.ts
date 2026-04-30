import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type ApiResult<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
};

async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    ...((options.headers as any) || {}),
  };

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (isFormData) delete headers["Content-Type"];

  const token = getToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    let data: any = undefined;
    if (response.status !== 204) {
      data = isJson ? await response.json() : await response.text();
    }

    if (!response.ok) {
      let errorMsg = "Something went wrong. Please try again.";
      if (response.status === 403) {
        errorMsg = "Access restricted. Upgrade your subscription to unlock this District.";
      } else if (typeof data === "string" && data) errorMsg = data;
      else if (data && typeof data === "object") {
        if (data.message) errorMsg = data.message;
        else if (data.error) errorMsg = data.error;
        else if (data.title) errorMsg = data.title;
      }
      if (response.status === 403) {
        window.dispatchEvent(new CustomEvent("api-forbidden", { detail: { message: errorMsg } }));
      }
      return { ok: false, error: errorMsg, status: response.status };
    }

    return { ok: true, data, status: response.status };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error. Please try again." };
  }
}

export const api = {
  auth: {
    register: (data: any) => fetchApi("/api/Account/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: any) => fetchApi("/api/Account/auth_login", { method: "POST", body: JSON.stringify(data) }),
    forgotPassword: (email: string) => fetchApi(`/api/Account/forgot_password?email=${encodeURIComponent(email)}`, { method: "GET" }),
    resetPassword: (data: any) => fetchApi("/api/Account/reset_password", { method: "POST", body: JSON.stringify(data) }),
    verifyOtp: (data: any) => fetchApi("/api/Account/post_otp", { method: "POST", body: JSON.stringify(data) }),
    resendOtp: (email: string) => fetchApi(`/api/Account/resend_otp?email=${encodeURIComponent(email)}`, { method: "GET" }),
    changePassword: (data: any) => fetchApi("/api/Account/change_password", { method: "POST", body: JSON.stringify(data) }),
  },
  profiles: {
    /**
     * GET /api/Profiles/{userId} — may 404 if no profile; use search() + client filter as fallback.
     */
    get: (userId: string) => fetchApi(`/api/Profiles/${encodeURIComponent(userId)}`),
    stats: (userId: string) => fetchApi(`/api/Profiles/stats/${encodeURIComponent(userId)}`),
    /** GET /api/Profiles/map/{userId} — returns array of district progress objects */
    map: (userId: string) => fetchApi(`/api/Profiles/map/${encodeURIComponent(userId)}`),
    /**
     * Search / list all profiles.
     * Real route: GET /api/Profiles  (no /search suffix)
     */
    search: (params: { profession?: string; minXP?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.profession) q.set("profession", params.profession);
      if (typeof params.minXP === "number") q.set("minXP", String(params.minXP));
      const qs = q.toString();
      return fetchApi(`/api/Profiles${qs ? `?${qs}` : ""}`);
    },
    create: (formData: FormData) =>
      fetchApi("/api/Profiles", { method: "POST", body: formData }),
    update: (userId: string, formData: FormData) =>
      fetchApi(`/api/Profiles/${encodeURIComponent(userId)}`, { method: "PUT", body: formData }),
  },
  userProgresses: {
    /** Legacy alias kept for any remaining callers */
    map: (userId: string) => fetchApi(`/api/Profiles/map/${encodeURIComponent(userId)}`),
  },
  userBadges: {
    /**
     * Real route: GET /api/UserBadges/{userId}  (NOT /user/{userId})
     * rarity field is an int: 0=Common, 1=Rare, 2=Epic, 3=Legendary
     */
    forUser: (userId: string) => fetchApi(`/api/UserBadges/${encodeURIComponent(userId)}`),
    award: (data: { userId: string; name: string; description?: string; rarity?: number; iconUrl?: string }) =>
      fetchApi("/api/UserBadges/award", { method: "POST", body: JSON.stringify(data) }),
  },
  activityLogs: {
    forUser: (userId: string) => fetchApi(`/api/ActivityLogs/${encodeURIComponent(userId)}`),
    create: (data: { userId: string; activity: string; performedBy?: string }) =>
      fetchApi("/api/ActivityLogs", { method: "POST", body: JSON.stringify(data) }),
  },
  subscriptions: {
    initialize: (data: any) => fetchApi("/api/Subscriptions/initialize", { method: "POST", body: JSON.stringify(data) }),
  },
  admin: {
    /** Spec: GET /api/Admin/Stats — endpoint may not yet be live; returns graceful empty on 404 */
    stats: () => fetchApi("/api/Admin/Stats"),
    /** Spec: GET /api/Admin/Users?role=User|Employer — endpoint may not yet be live */
    users: (params: { search?: string; role?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.role) q.set("role", params.role);
      const qs = q.toString();
      return fetchApi(`/api/Admin/Users${qs ? `?${qs}` : ""}`);
    },
  },
  professions: {
    list: () => fetchApi("/api/Professions"),
    get: (id: string) => fetchApi(`/api/Professions/${encodeURIComponent(id)}`),
    city: (id: string, userId?: string | null) =>
      fetchApi(`/api/Professions/${encodeURIComponent(id)}/city${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
    /**
     * POST /api/Professions?userId=...
     * userId MUST be a query param. FormData fields: Name, IconFile, IconUrl.
     */
    create: (userId: string, formData: FormData) =>
      fetchApi(`/api/Professions?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
    /**
     * PUT /api/Professions/{id}?ProfessionId=...&Name=...&IconUrl=...
     * Name, ProfessionId, IconUrl are query params. Only IconFile goes in FormData.
     */
    update: (id: string, params: { name: string; iconUrl?: string | null }, iconFile?: File | null) => {
      const qs = new URLSearchParams({ ProfessionId: id, Name: params.name });
      if (params.iconUrl) qs.set("IconUrl", params.iconUrl);
      const fd = new FormData();
      if (iconFile) fd.append("IconFile", iconFile);
      return fetchApi(`/api/Professions/${encodeURIComponent(id)}?${qs.toString()}`, {
        method: "PUT",
        body: fd,
      });
    },
    /** DELETE /api/Professions/{id}?userId=... */
    delete: (id: string, userId: string) =>
      fetchApi(`/api/Professions/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
    generateSeed: (data: { professionName: string; districtCount: number }) =>
      fetchApi("/api/Professions/generate-seed", { method: "POST", body: JSON.stringify(data) }),
  },
  districts: {
    byProfession: (professionId: string) =>
      fetchApi(`/api/Districts/by-profession/${encodeURIComponent(professionId)}`),
    get: (id: string) => fetchApi(`/api/Districts/${encodeURIComponent(id)}`),
    /**
     * POST /api/Districts?userId=...
     * userId MUST be a query param. All other fields (Name, Description, ProfessionId, etc.) in FormData.
     */
    create: (userId: string, formData: FormData) =>
      fetchApi(`/api/Districts?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
    /**
     * PUT /api/Districts/{id}?userId=...
     * userId MUST be a query param. All other fields in FormData.
     */
    update: (id: string, userId: string, formData: FormData) =>
      fetchApi(`/api/Districts/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "PUT", body: formData }),
    /** DELETE /api/Districts/{id}?userId=... */
    delete: (id: string, userId: string) =>
      fetchApi(`/api/Districts/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
  },
  difficulties: {
    list: () => fetchApi("/api/Difficulties"),
  },
  problemNodes: {
    byDistrict: (districtId: string, userId?: string | null) =>
      fetchApi(`/api/ProblemNodes/by-district/${encodeURIComponent(districtId)}${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
    get: (id: string) => fetchApi(`/api/ProblemNodes/${encodeURIComponent(id)}`),
    /** POST /api/ProblemNodes?userId=... — userId as query param, rest in FormData */
    create: (userId: string, formData: FormData) =>
      fetchApi(`/api/ProblemNodes?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
    /** PUT /api/ProblemNodes/{id}?userId=... — userId as query param, rest in FormData */
    update: (id: string, userId: string, formData: FormData) =>
      fetchApi(`/api/ProblemNodes/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "PUT", body: formData }),
    /** DELETE /api/ProblemNodes/{id}?userId=... */
    delete: (id: string, userId: string) =>
      fetchApi(`/api/ProblemNodes/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
    /** POST /api/ProblemNodes/ai-generate?userId=... */
    aiGenerate: (userId: string, data: { topic: string; districtId: string; difficultyId: string }) =>
      fetchApi(`/api/ProblemNodes/ai-generate?userId=${encodeURIComponent(userId)}`, { method: "POST", body: JSON.stringify(data) }),
  },
};
