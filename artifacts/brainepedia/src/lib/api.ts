import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...((options.headers as any) || {}),
  };

  // Only add Content-Type if we're sending a body
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Only add Authorization if token exists and it's not explicitly omitted
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
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let errorMsg = "Something went wrong. Please try again.";
      if (typeof data === "string" && data) errorMsg = data;
      else if (data && typeof data === "object") {
        if (data.message) errorMsg = data.message;
        else if (data.error) errorMsg = data.error;
        else if (data.title) errorMsg = data.title;
      }
      return { ok: false, error: errorMsg };
    }

    return { ok: true, data };
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
  }
};
