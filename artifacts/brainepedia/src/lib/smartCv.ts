import { API_BASE_URL } from "@/lib/api";

/**
 * Submit Smart CV generation via POST form to the backend-rendered page.
 * Opens in a new tab so the server can return full HTML directly.
 */
export function openSmartCvInNewTab(userId: string, instructions: string): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${API_BASE_URL.replace(/\/$/, "")}/Portfolios/SmartCV`;
  form.target = "_blank";
  form.style.display = "none";

  const userIdInput = document.createElement("input");
  userIdInput.type = "hidden";
  userIdInput.name = "userId";
  userIdInput.value = userId;
  form.appendChild(userIdInput);

  const instructionsInput = document.createElement("input");
  instructionsInput.type = "hidden";
  instructionsInput.name = "dynamicCustomRequest";
  instructionsInput.value = instructions;
  form.appendChild(instructionsInput);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
