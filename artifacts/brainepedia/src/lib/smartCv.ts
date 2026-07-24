import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type SmartCvRequest = {
  userId?: string | null;
  instructions?: string | null;
  [key: string]: unknown;
};

/**
 * Submit Smart CV generation via POST form to the backend-rendered page.
 * Opens in a new tab so the server can return full HTML directly.
 */
export function openSmartCvInNewTab(dynamicCustomRequest: SmartCvRequest): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${API_BASE_URL.replace(/\/$/, "")}/Portfolios/SmartCV`;
  form.target = "_blank";
  form.style.display = "none";

  const payload = document.createElement("input");
  payload.type = "hidden";
  payload.name = "dynamicCustomRequest";
  payload.value = JSON.stringify(dynamicCustomRequest);
  form.appendChild(payload);

  const token = getToken();
  if (token) {
    const tokenInput = document.createElement("input");
    tokenInput.type = "hidden";
    tokenInput.name = "access_token";
    tokenInput.value = token;
    form.appendChild(tokenInput);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
