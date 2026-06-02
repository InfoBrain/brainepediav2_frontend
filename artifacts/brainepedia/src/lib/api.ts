import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type ApiResult<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
};

type FetchApiOptions = RequestInit & {
  suppressUnauthorized?: boolean;
};

async function fetchApi<T = any>(endpoint: string, options: FetchApiOptions = {}): Promise<ApiResult<T>> {
  const { suppressUnauthorized, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...((fetchOptions.headers as any) || {}),
  };

  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  if (fetchOptions.body && !headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (isFormData) delete headers["Content-Type"];

  const token = getToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
    // IIS on Windows shared hosting (iisnode) sometimes strips the Authorization
    // header before passing the request to Node.js. We send the token in a
    // custom header too so the proxy can restore it if needed.
    headers["X-Token"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    let data: any = undefined;
    if (response.status !== 204) {
      data = isJson ? await response.json() : await response.text();
    }

    if (!response.ok) {
      let errorMsg = "Something went wrong. Please try again.";
      if (response.status === 401) {
        // Session expired or token rejected — clear credentials and signal the app
        // to redirect to login. Callers that pass suppressUnauthorized (e.g. optional
        // authenticated features on public pages) skip the redirect so the page
        // can degrade gracefully rather than booting the user to /login.
        const { clearToken } = await import("./auth");
        clearToken();
        if (!suppressUnauthorized) {
          window.dispatchEvent(new CustomEvent("api-unauthorized"));
        }
        errorMsg = "Your session has expired. Please log in again.";
      } else if (response.status === 403) {
        errorMsg = "Access restricted. Upgrade your subscription to unlock this District.";
      } else if (response.status === 404) {
        errorMsg = "The requested resource was not found. Please try again.";
      } else if (response.status >= 500) {
        errorMsg = "Server error. Please try again later.";
      } else if (typeof data === "string" && data) {
        const isHtml = data.trimStart().startsWith("<") || /<!doctype/i.test(data);
        errorMsg = isHtml ? `Request failed (${response.status}). Please try again.` : data;
      } else if (data && typeof data === "object") {
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
    register: (data: any, recaptchaToken?: string) =>
      fetchApi("/api/Account/register", {
        method: "POST",
        body: JSON.stringify(data),
        ...(recaptchaToken ? { headers: { "X-Recaptcha-Token": recaptchaToken } } : {}),
      }),
    login: (data: any) => fetchApi("/api/Account/auth_login", { method: "POST", body: JSON.stringify(data) }),
    forgotPassword: (email: string) => fetchApi(`/api/Account/forgot_password?email=${encodeURIComponent(email)}`, { method: "GET" }),
    resetPassword: (data: any) => fetchApi("/api/Account/reset_password", { method: "POST", body: JSON.stringify(data) }),
    verifyOtp: (data: any) => fetchApi("/api/Account/post_otp", { method: "POST", body: JSON.stringify(data) }),
    resendOtp: (email: string) => fetchApi(`/api/Account/resend_otp?email=${encodeURIComponent(email)}`, { method: "GET" }),
    changePassword: (data: any) => fetchApi("/api/Account/change_password", { method: "POST", body: JSON.stringify(data) }),
  },
  account: {
    /**
     * GET /api/Account/reset_user_password?email={email}&userId={adminUserId}
     * Generates a temporary password and emails it to the user.
     */
    resetUserPassword: (email: string, adminUserId: string) =>
      fetchApi(
        `/api/Account/reset_user_password?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(adminUserId)}`,
        { method: "GET" }
      ),
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
    update: (profileId: string, userId: string, formData: FormData) =>
      fetchApi(`/api/Profiles/edit/${encodeURIComponent(profileId)}?userId=${encodeURIComponent(userId)}`, { method: "POST", body: formData }),
  },
  userProgresses: {
    /** Legacy alias kept for any remaining callers */
    map: (userId: string, opts?: { suppressUnauthorized?: boolean }) =>
      fetchApi(`/api/Profiles/map/${encodeURIComponent(userId)}`, { suppressUnauthorized: opts?.suppressUnauthorized }),
  },
  userBadges: {
    /**
     * Real route: GET /api/UserBadges/{userId}  (NOT /user/{userId})
     * rarity field is an int: 0=Common, 1=Rare, 2=Epic, 3=Legendary
     */
    forUser: (userId: string, opts?: { suppressUnauthorized?: boolean }) =>
      fetchApi(`/api/UserBadges/${encodeURIComponent(userId)}`, { suppressUnauthorized: opts?.suppressUnauthorized }),
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
    initializeUpgrade: (data: { userId: string; newTier: string | number; currency: string; source: string }) =>
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
    /** GET /api/Submissions/session/{sessionId} — submissions for a session */
    getBySession: (sessionId: string) =>
      fetchApi(`/api/Submissions/session/${encodeURIComponent(sessionId)}`),
    /** GET /api/Submissions/user/{userId} — all submissions for a user (ActivityFeed) */
    forUser: (userId: string) =>
      fetchApi(`/api/Submissions/user/${encodeURIComponent(userId)}`),
  },
  dashboard: {
    /** GET /api/Dashboard/stats/{userId} */
    stats: (userId: string) => fetchApi(`/api/Dashboard/stats/${encodeURIComponent(userId)}`),
    /** GET /api/Dashboard/leaderboard?userId=&count=N */
    leaderboard: (userId: string, count = 20) => fetchApi(`/api/Dashboard/leaderboard?userId=${encodeURIComponent(userId)}&count=${count}`),
  },
  evaluations: {
    askBrainiac: (data: { sessionId: string; userId: string; currentApproach: string; currentCode: string }) =>
      fetchApi("/api/Evaluations/ask-brainiac", { method: "POST", body: JSON.stringify(data) }),
    chatBrainiac: (data: { prompt: string; context?: string }, userId?: string | null) =>
      fetchApi(`/api/Evaluations/chat-brainaic${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`, { method: "POST", body: JSON.stringify(data) }),
    process: (submissionId: string) =>
      fetchApi(`/api/Evaluations/process/${encodeURIComponent(submissionId)}`, { method: "POST" }),
    /** GET /api/Evaluations/results/{sessionId} — full evaluated result by session ID */
    getResult: (sessionId: string) =>
      fetchApi(`/api/Evaluations/results/${encodeURIComponent(sessionId)}`),
    /** GET /api/Evaluations/node-results/{problemNodeId}?userId= — result by problem node (for completed missions) */
    getNodeResult: (problemNodeId: string, userId?: string | null) =>
      fetchApi(`/api/Evaluations/node-results/${encodeURIComponent(problemNodeId)}${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
  },
  identity: {
    /** GET /api/Profiles/professional-identity?userId= */
    professionalIdentity: (userId: string) =>
      fetchApi(`/api/Profiles/professional-identity?userId=${encodeURIComponent(userId)}`),
    /** GET /api/Profiles/user-public-profile?userId= */
    publicProfile: (userId: string) =>
      fetchApi(`/api/Profiles/user-public-profile?userId=${encodeURIComponent(userId)}`),
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
  forum: {
    /** GET /api/Forum/categories */
    getCategories: () => fetchApi("/api/Forum/categories"),
    /** GET /api/Forum/categories/{categoryId}/threads?page=&pageSize=&sortBy= */
    getThreads: (categoryId: string, page = 1, pageSize = 20, sortBy = "newest") =>
      fetchApi(
        `/api/Forum/categories/${encodeURIComponent(categoryId)}/threads?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`,
        { suppressUnauthorized: true }
      ),
    /** GET /api/Forum/threads/{threadId} — returns { threadDetails, replies } */
    getThread: (threadId: string) =>
      fetchApi(`/api/Forum/threads/${encodeURIComponent(threadId)}`, { suppressUnauthorized: true }),
    /** POST /api/Forum/threads/create */
    createThread: (data: { categoryId: string; title: string; content: string }) =>
      fetchApi("/api/Forum/threads/create", { method: "POST", body: JSON.stringify(data) }),
    /** POST /api/Forum/threads/{threadId}/replies/create */
    createReply: (threadId: string, data: { content: string }) =>
      fetchApi(`/api/Forum/threads/${encodeURIComponent(threadId)}/replies/create`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    /** POST /api/Forum/categories/create */
    createCategory: (data: { Name: string; Description: string }) =>
      fetchApi("/api/Forum/categories/create", { method: "POST", body: JSON.stringify(data) }),
  },
};
