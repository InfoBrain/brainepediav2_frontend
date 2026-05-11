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
    update: (profileId: string, formData: FormData) =>
      fetchApi(`/api/Profiles/edit/${encodeURIComponent(profileId)}`, { method: "POST", body: formData }),
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
  experienceCredits: {
    forUser: (userId: string) => fetchApi(`/api/ExperienceCredits/user/${encodeURIComponent(userId)}`),
  },
  subscriptions: {
    initialize: (data: any) => fetchApi("/api/Subscriptions/initialize", { method: "POST", body: JSON.stringify(data) }),
    /** POST /api/Subscriptions/initialize-upgrade — body: { userId, newTier, currency, source } */
    initializeUpgrade: (data: { userId: string; newTier: number; currency: string; source: string }) =>
      fetchApi("/api/Subscriptions/initialize-upgrade", { method: "POST", body: JSON.stringify(data) }),
    /** GET /api/Subscriptions/verify-payment?reference=xxx */
    verifyPayment: (reference: string) =>
      fetchApi(`/api/Subscriptions/verify-payment?reference=${encodeURIComponent(reference)}`),
  },
  admin: {
    /** GET /api/Dashboard/stats — global system stats (totalUsers, activeSubscriptions, totalXpAwarded) */
    stats: () => fetchApi("/api/Dashboard/stats"),
    /** GET /api/Dashboard/users — all platform users */
    users: (params: { search?: string; role?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.role) q.set("role", params.role);
      const qs = q.toString();
      return fetchApi(`/api/Dashboard/users${qs ? `?${qs}` : ""}`);
    },
    /** GET /api/ExperienceCredits/system-summary — total XP awarded platform-wide */
    xpSummary: () => fetchApi("/api/ExperienceCredits/system-summary"),
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
     * POST /api/Professions/edit/{id}?ProfessionId=...&Name=...&IconUrl=...
     * Name, ProfessionId, IconUrl are query params. Only IconFile goes in FormData.
     */
    update: (id: string, params: { name: string; iconUrl?: string | null }, iconFile?: File | null) => {
      const qs = new URLSearchParams({ ProfessionId: id, Name: params.name });
      if (params.iconUrl) qs.set("IconUrl", params.iconUrl);
      const fd = new FormData();
      if (iconFile) fd.append("IconFile", iconFile);
      return fetchApi(`/api/Professions/edit/${encodeURIComponent(id)}?${qs.toString()}`, {
        method: "POST",
        body: fd,
      });
    },
    /** DELETE /api/Professions/{id}?userId=... */
    delete: (id: string, userId: string) =>
      fetchApi(`/api/Professions/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
    /** POST /api/Professions/generate-seed?count=N — AI-generates N professions */
    generateSeed: (count: number) =>
      fetchApi(`/api/Professions/generate-seed?count=${count}`, { method: "POST" }),
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
     * POST /api/Districts/edit/{id}?userId=...
     * userId MUST be a query param. All other fields in FormData.
     */
    update: (id: string, userId: string, formData: FormData) =>
      fetchApi(`/api/Districts/edit/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
    /** DELETE /api/Districts/{id}?userId=... */
    delete: (id: string, userId: string) =>
      fetchApi(`/api/Districts/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
    /** POST /api/Districts/seed-districts/{professionId} — AI-generates districts for a profession */
    seedDistricts: (professionId: string) =>
      fetchApi(`/api/Districts/seed-districts/${encodeURIComponent(professionId)}`, { method: "POST" }),
  },
  difficulties: {
    list: () => fetchApi("/api/Difficulties"),
  },
  experienceSessions: {
    get: (sessionId: string) =>
      fetchApi(`/api/ExperienceSessions/${encodeURIComponent(sessionId)}`),
    getActive: (userId: string, problemNodeId: string) =>
      fetchApi(`/api/ExperienceSessions/active/${encodeURIComponent(userId)}/${encodeURIComponent(problemNodeId)}`),
    start: (data: { userId: string; problemNodeId: string }) =>
      fetchApi("/api/ExperienceSessions/start", { method: "POST", body: JSON.stringify(data) }),
    abandon: (sessionId: string, userId: string) =>
      fetchApi(`/api/ExperienceSessions/${encodeURIComponent(sessionId)}/abandon?userId=${encodeURIComponent(userId)}`, { method: "PATCH" }),
  },
  submissions: {
    submit: (formData: FormData) =>
      fetchApi("/api/Submissions/submit", { method: "POST", body: formData }),
    get: (submissionId: string) =>
      fetchApi(`/api/Submissions/${encodeURIComponent(submissionId)}`),
    forUser: (userId: string) =>
      fetchApi(`/api/Submissions/user/${encodeURIComponent(userId)}`),
  },
  dashboard: {
    /** GET /api/Dashboard/stats/{userId} */
    stats: (userId: string) => fetchApi(`/api/Dashboard/stats/${encodeURIComponent(userId)}`),
    /** GET /api/Dashboard/leaderboard?count=N */
    leaderboard: (count = 20) => fetchApi(`/api/Dashboard/leaderboard?count=${count}`),
  },
  evaluations: {
    askBrainiac: (data: { sessionId: string; userId: string; currentApproach: string; currentCode: string; question?: string }) =>
      fetchApi("/api/Evaluations/ask-brainiac", { method: "POST", body: JSON.stringify(data) }),
    chatBrainiac: (data: { prompt: string; context?: string }) =>
      fetchApi("/api/Evaluations/chat-brainiac", { method: "POST", body: JSON.stringify(data) }),
    process: (submissionId: string) =>
      fetchApi(`/api/Evaluations/process/${encodeURIComponent(submissionId)}`, { method: "POST" }),
  },
  problemNodes: {
    byDistrict: (districtId: string, userId?: string | null) =>
      fetchApi(`/api/ProblemNodes/by-district/${encodeURIComponent(districtId)}${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
    get: (id: string) => fetchApi(`/api/ProblemNodes/${encodeURIComponent(id)}`),
    /** POST /api/ProblemNodes?userId=... — userId as query param, rest in FormData */
    create: (userId: string, formData: FormData) =>
      fetchApi(`/api/ProblemNodes?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
    /** POST /api/ProblemNodes/edit/{id}?userId=... — userId as query param, rest in FormData */
    update: (id: string, userId: string, formData: FormData) =>
      fetchApi(`/api/ProblemNodes/edit/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
    /** DELETE /api/ProblemNodes/{id}?userId=... */
    delete: (id: string, userId: string) =>
      fetchApi(`/api/ProblemNodes/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
    /** POST /api/ProblemNodes/ai-generate?userId=... */
    aiGenerate: (userId: string, data: { topic: string; districtId: string; difficultyId: string }) =>
      fetchApi(`/api/ProblemNodes/ai-generate?userId=${encodeURIComponent(userId)}`, { method: "POST", body: JSON.stringify(data) }),
  },
};
